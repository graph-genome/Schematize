import React from "react";
import { observe } from "mobx";
import { urlExists } from "./URL";

class PangenomeSchematic extends React.Component {
  constructor(props) {
    /*Only plain objects will be made observable. For non-plain objects it is considered the
		 responsibility of the constructor to initialize the observable properties. Either use
		 the @observable annotation or the extendObservable function.*/

    super(props);
    this.pathNames = [];
    this.components = [];
    this.jsonCache = {}; // URL keys, values are entire JSON file datas
    // TODO: make jsonCache store React components and save them in mobx
    // TODO: make FILO queue to remove old jsonCache once we hit max memory usage
    this.nucleotides = []; // nucleotides attribute and its edges

    this.loadIndexFile(this.props.store.jsonName); //initializes this.chunkIndex

    //STEP #1: whenever jsonName changes, loadIndexFile
    observe(this.props.store, "jsonName", () => {
      this.loadIndexFile(this.props.store.jsonName);
    });

    // The FASTA files are read only when there are new chunks to read
    observe(this.props.store.chunkFastaURLs, () => {
      this.loadFasta();
    });

    //STEP #7: JsonCache causes processArray to update chunksProcessed
    // observe(this.props.store.jsonCache,
    //     this.processArray.bind(this));

    // console.log("public ", process.env.PUBLIC_URL ) //PUBLIC_URL is empty
  }
  componentDidUpdate() {
    // console.log("#components: " + this.components);
  }

  loadIndexFile(jsonFilename) {
    console.log("STEP #1: whenever jsonName changes, loadIndexFile");

    let indexPath =
      process.env.PUBLIC_URL + "/test_data/" + jsonFilename + "/bin2file.json";
    //console.log("loadIndexFile - START reading", indexPath);

    return fetch(indexPath)
      .then((res) => res.json())
      .then((json) => {
        console.log("loadIndexFile - END reading", indexPath);

        //STEP #2: chunkIndex contents loaded
        this.props.store.setChunkIndex(json);
      });
  }

  jsonFetch(filepath) {
    if (!filepath)
      throw new Error(
        "No filepath given. Ensure chunknames in bin2file.json are correct."
      );
    console.log("Fetching", filepath);
    return fetch(filepath).then((res) => res.json());
  }

  loadJsonCache(url, data) {
    console.log("STEP #6: fetched chunks go into loadJsonCache");

    if (data.json_version !== 17) {
      throw MediaError(
        "Wrong Data JSON version: was expecting version 17, got " +
        data.json_version +
        ".  " +
        "This version added x and compressedX fields for the chunks too.  " + // KEEP THIS UP TO DATE!
          "Using a mismatched data file and renderer will cause unpredictable behavior," +
          " instead generate a new data file using github.com/graph-genome/component_segmentation."
      );
    }
    this.jsonCache[url] = data;
    this.pathNames = data.path_names; //TODO: in later JSON versions path_names gets moved to bin2file.json
    console.log(this.pathNames.length, " path names loaded");
    this.processArray();
  }

  loadFasta() {
    console.log("loadFasta");

    // Clear the nucleotides information
    this.nucleotides = [];

    // This loop will automatically cap out at the fasta file corrisponding to the last loaded chunk
    for (let path_fasta of this.props.store.chunkFastaURLs) {
      if (urlExists(path_fasta)) {
        //console.log("loadFasta - START: ", path_fasta);

        fetch(path_fasta)
          .then((response) => {
            return response.text();
          })
          .then((text) => {
            const sequence = text
              .replace(/.*/, "")
              .substr(1)
              .replace(/[\r\n]+/gm, "");

            //split into array of nucleotides
            this.nucleotides.push(...sequence);

            //console.log("loadFasta - END: ", path_fasta);
            this.props.store.addChunkProcessedFasta(path_fasta);
          });
      }
    }
  }

  /**Parses beginBin to endBin range, returns false if new file needed.
   * This calculates the pre-render for all contiguous JSON data.
   * State information is stored in store.chunksProcessed.
   * Checks if there's new available data to pre-render in processArray()
   * run through list of urls in order and see if we have data to load.**/
  processArray() {
    //TODO: make processArray parallelized by placing outputs in a Key Map and rendering out of order
    console.log(
      "STEP #7: JsonCache causes processArray to update chunksProcessed"
    );
    const store = this.props.store;
    const [beginBin, endBin] = [store.getBeginBin(), store.getEndBin()];

    if (
      store.chunksProcessed.length === 0 ||
      store.chunksProcessed[0] !== this.props.store.chunkURLs[0]
    ) {
      this.components = []; // clear all pre-render data
    }
    // may have additional chunks to pre-render
    console.log("processArray - parsing components ", beginBin, " - ", endBin);

    for (let urlIndex = 0; urlIndex < store.chunkURLs.length; urlIndex++) {
      //if end of pre-render is earlier than end of contiguous available chunks, process new data
      if (urlIndex >= store.chunksProcessed.length) {
        //only process if data is available
        if (store.chunkURLs[urlIndex] in this.jsonCache) {
          let url = store.chunkURLs[urlIndex];
          let jsonChunk = this.jsonCache[url];

          // At the moment, the index is used as a rank of the component, then it has to be progressive between chunks
          const num_components_already_loaded =
            this.components.length > 0
              ? this.components[this.components.length - 1].index + 1
              : 0;
          for (const [index, component] of jsonChunk.components.entries()) {
            if (component.first_bin > 0) {
              let componentItem = new Component(
                component,
                num_components_already_loaded + index
              );
              this.components.push(componentItem); //TODO: concurrent modification?
              //if (component.last_bin >= beginBin) { NOTE: we are now reading in whole chunk, this may place
              //xOffset further right than it was intended when beginBin > chunk.first_bin
            }
          }
          store.addChunkProcessed(url);
        } else {
          //we've run into a contiguous chunk that is not available yet
          return false;
        }
      }
    }

    console.log(
      "processArray",
      store.chunksProcessed[0],
      store.chunksProcessed.slice(-1)[0],
      "out of",
      this.props.store.chunkURLs.length,
      "chunks"
    );
    //console.log(this.props)

    return true; //store.chunksProcessed.length > 0;
  }
}

class Component {
  //extends React.Component{
  constructor(component, index) {
    this.columnX = component.x;
    this.compressedColumnX = component.compressedX;

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

    this.relativePixelX = -1;

    // deep copy of occupants
    this.occupants = component.occupants; //Array.from(
    this.matrix = component.matrix; // Array.from(
    this.num_bin = this.lastBin - this.firstBin + 1;
  }

  getColumnX(useWidthCompression) {
    return useWidthCompression ? this.compressedColumnX : this.columnX;
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
