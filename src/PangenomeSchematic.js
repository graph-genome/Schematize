import React from "react";
import {observe} from "mobx";

function range(start, end) {
  return [...Array(1 + end - start).keys()].map((v) => start + v);
}

class PangenomeSchematic extends React.Component {
  constructor(props) {
    /*Only plain objects will be made observable. For non-plain objects it is considered the
		 responsibility of the constructor to initialize the observable properties. Either use
		 the @observable annotation or the extendObservable function.*/

    super(props);
    this.pathNames = [];
    this.components = [];
    this.jsonCache = {}; // URL keys, values are entire JSON file datas
    this.chunksProcessed = []; //list of URLs now in this.components

    this.loadIndexFile(this.props.store.jsonName) //initializes this.chunk_index
    //whenever jsonName changes,
    observe(this.props.store, "jsonName", () => {
      this.loadIndexFile(this.props.store.jsonName);
    });
    // console.log("public ", process.env.PUBLIC_URL ) //PUBLIC_URL is empty
  }
  componentDidUpdate() {
    // console.log("#components: " + this.components);
  }

  /** Compares bin2file @param indexContents with the beginBin and EndBin.
   * It finds the appropriate chunk URLS from the index and updates
   * switchChunkURLs which trigger json fetches for the new chunks.
   * @param indexContents bin2file.json contents */
  openRelevantChunksFromIndex(indexContents) {
    if(indexContents === undefined){
      indexContents = this.chunk_index;// stored version (after first use)
    } else {
      this.chunk_index = indexContents;
    }
    const beginBin = this.props.store.getBeginBin();
    const endBin = this.props.store.getEndBin();
    const lastIndex = indexContents["files"].length - 1;

    const findBegin = (entry) => entry["last_bin"] >= beginBin;
    const findEnd = (entry) => entry["last_bin"] >= endBin;
    let beginIndex = indexContents["files"].findIndex(findBegin);
    let endIndex = indexContents["files"].findIndex(findEnd);
    if(-1 === endIndex){//#22 end of file limits so it doesn't crash
      endIndex = lastIndex;
    }
    if (-1 === beginIndex ) {
        console.error("beginIndex", beginIndex, "endIndex", endIndex);
        return;
      // conserving beginIndex if -1 < beginIndex < lastIndex
      // const indexToCompare = [beginIndex, lastIndex];
      // const findMinBegin = (index) => index >= 0;
      // beginIndex = indexToCompare[indexToCompare.findIndex(findMinBegin)]; //trueBeginIndex
      // endIndex = lastIndex;
    }

    //will trigger chunk update in App.fetchAllChunks() which calls this.loadJsonCache
    let URLprefix =
      process.env.PUBLIC_URL + "test_data/" + this.props.store.jsonName + "/";
    let fileArray = range(beginIndex, endIndex).map((index) => {
      return URLprefix + indexContents["files"][index]["file"];
    });

    this.props.store.switchChunkURLs(fileArray);
  }

    loadIndexFile(jsonFilename) {
        let indexPath =
            process.env.PUBLIC_URL + "test_data/" + jsonFilename + "/bin2file.json";
        console.log("Reading", indexPath);
        return fetch(indexPath)
            .then((res) => res.json())
            .then((json) => {
                // This following part is important to scroll right and left on browser
                this.openRelevantChunksFromIndex(json);
            });
    }

  jsonFetch(filepath) {
    if (!filepath)
      throw new Error(
        "No filepath given. Ensure chunknames in bin2file.json are correct."
      );
    console.log("Fetching", filepath);
    return fetch(process.env.PUBLIC_URL + filepath).then((res) => res.json());
  }

    loadJsonCache(url, data) {
        console.log("loadJsonCache", url, data);
        if (data.json_version !== 12) {
            throw MediaError(
                "Wrong Data JSON version: was expecting version 12, got " +
                data.json_version + ".  " +
                "This version added nucleotide ranges to bins.  " + // KEEP THIS UP TO DATE!
                "Using a mismatched data file and renderer will cause unpredictable behavior," +
                " instead generate a new data file using github.com/graph-genome/component_segmentation."
            );
        }
        this.jsonCache[url] = data;
        this.pathNames = data.path_names; //TODO: in later JSON versions path_names gets moved to bin2file.json
        this.props.store.setBinWidth(parseInt(data.bin_width));
    }

    /**Parses beginBin to endBin range, returns false if new file needed.
     * This calculates the pre-render for all contiguous JSON data.
     * State information is stored in this.chunksProcessed.
     * Checks if there's new available data to pre-render in processArray()
     * run through list of urls in order and see if we have data to load.**/
    processArray() {
        let [beginBin, endBin] = [
            this.props.store.getBeginBin(),
            this.props.store.getEndBin(),
        ];
        let urls = this.props.store.getChunkURLs();
        if(this.chunksProcessed.length === 0 || this.chunksProcessed[0] !== urls[0]){
            this.components = [];  // clear all pre-render data
            this.chunksProcessed = [];
        }
        // may have additional chunks to pre-render
        console.log("Parsing components ", beginBin, " - ", endBin);

        for(let urlIndex = 0; urlIndex < urls.length; urlIndex++){
            //if end of pre-render is earlier than end of contiguous available chunks, process new data
            if(urlIndex >= this.chunksProcessed.length){
                if(urls[urlIndex] in this.jsonCache){ //only process if data is available
                    let url = urls[urlIndex];
                    let jsonChunk = this.jsonCache[url];
                    const xOffset = this.components.length ?
                        this.components.slice(-1)[0].nextXOffset() : 0;
                    for (let [index, component] of jsonChunk.components.entries()) {
                        let componentItem = new Component(component, xOffset, index);
                        this.components.push(componentItem); //TODO: concurrent modification?
                        //if (component.last_bin >= beginBin) { NOTE: we are now reading in whole chunk, this may place
                        //xOffset further right than it was intended when beginBin > chunk.first_bin
                    }
                    this.chunksProcessed.push(url);
                }else{//we've run into a contiguous chunk that is not available yet
                    return false;
                }
            }
        }
        console.log("processArray", this.chunksProcessed[0], this.chunksProcessed.slice(-1)[0]);
      return true;
    }
}

class Component {
    constructor(component, offsetLength, index) {
        this.offset = offsetLength;
        this.index = index;
        this.firstBin = component.first_bin;
        this.lastBin = component.last_bin;
        this.arrivals = [];
        for (let arrival of component.arrivals) {
            this.arrivals.push(new LinkColumn(arrival));
        }
        this.departures = [];
        for (let departure of component.departures) {
            //don't slice off adjacent here
            this.departures.push(new LinkColumn(departure));
        }
        // we do not know the x val for this component, yet
        this.x = 0;
        // deep copy of occupants
        this.occupants = Array.from(component.occupants);
        this.matrix = Array.from(component.matrix);
        this.num_bin = this.lastBin - this.firstBin + 1;
    }
    nextXOffset(){
        return this.offset + this.arrivals.length + this.departures.length - 1;
    }
}

class LinkColumn {
  constructor(linkColumn) {
    this.upstream = linkColumn.upstream;
    this.downstream = linkColumn.downstream;
    this.participants = linkColumn.participants; //new Set
    this.key = this.edgeToKey();
  }
  edgeToKey() {
    /**downstream and upstream are always in the same orientation regardless of if it is a
     * departing LinkColumn or an arriving LinkColumn.**/
    return (
      String(this.downstream).padStart(13, "0") +
      String(this.upstream).padStart(13, "0")
    );
  }
}

export default PangenomeSchematic;
