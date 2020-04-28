import React from "react";
import { observe } from "mobx";
import { urlExists } from "./URL";
import {calculateEndBinFromScreen} from "./utilities";

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
    this.chunkIndex = null;
    //TODO: replace jsonCache with browser indexdb
    this.jsonCache = {}; // URL keys, values are entire JSON file datas
    this.chunksProcessed = []; //list of URLs now in this.components

    // Added nucleotides attribute and its edges
    this.nucleotides = [];

    this.loadIndexFile(this.props.store.jsonName); //initializes this.chunkIndex
    //whenever jsonName changes,
    observe(this.props.store, "jsonName", () => {
      this.loadIndexFile(this.props.store.jsonName);
    });

    // Whenever the selected zoom level changes
    observe(this.props.store, "indexSelectedZoomLevel", () => {
      this.loadIndexFile(this.props.store.jsonName);
    });

    observe(
      this.props.store.beginEndBin,
      this.openRelevantChunksFromIndex.bind(this)
    );

    // The FASTA files are read only when there are new chuncks to read
    observe(this.props.store.chunkFastaURLs, () => {
      this.loadFasta();
    });

    // console.log("public ", process.env.PUBLIC_URL ) //PUBLIC_URL is empty
  }
  componentDidUpdate() {
    // console.log("#components: " + this.components);
  }

  /** Compares bin2file @param indexContents with the beginBin and EndBin.
   * It finds the appropriate chunk URLS from the index and updates
   * switchChunkURLs which trigger json fetches for the new chunks. **/
  openRelevantChunksFromIndex() {
      if (this.chunkIndex === null) {
          return; //before the class is fully initialized
      }
      let indexContents = this.chunkIndex;
      const beginBin = this.props.store.getBeginBin();

      this.props.store.setAvailableZoomLevels(Object.keys(indexContents["zoom_levels"]));
      const selZoomLev = this.props.store.getSelectedZoomLevel();
      let [endBin, fileArray, fileArrayFasta] = calculateEndBinFromScreen(beginBin, this.chunkIndex,
          selZoomLev, this.props.store);
      this.props.store.updateBeginEndBin(beginBin, endBin);

      let URLprefix =
          process.env.PUBLIC_URL +
          "test_data/" +
          this.props.store.jsonName +
          "/" +
          selZoomLev +
          "/";
      fileArray = fileArray.map((filename) => {
          return URLprefix + filename
      });
      fileArrayFasta = fileArrayFasta.map((filename) => {
          return URLprefix + filename
      });

      this.props.store.switchChunkURLs(fileArray);

      if (fileArrayFasta.length) {
          this.props.store.switchChunkFastaURLs(fileArrayFasta);
      }
  }

  loadIndexFile(jsonFilename) {
    let indexPath =
      process.env.PUBLIC_URL + "test_data/" + jsonFilename + "/bin2file.json";
    console.log("Reading", indexPath);
    return fetch(indexPath)
      .then((res) => res.json())
      .then((json) => {
        // This following part is important to scroll right and left on browser
        this.chunkIndex = json;
        this.openRelevantChunksFromIndex();
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
    if (data.json_version !== 14) {
      throw MediaError(
          "Wrong Data JSON version: was expecting version 14, got " +
          data.json_version +
          ".  " +
          "This version precalculated X values for Components.  " + // KEEP THIS UP TO DATE!
          "Using a mismatched data file and renderer will cause unpredictable behavior," +
          " instead generate a new data file using github.com/graph-genome/component_segmentation."
      );
    }
    this.jsonCache[url] = data;
    this.pathNames = data.path_names; //TODO: in later JSON versions path_names gets moved to bin2file.json
    this.props.store.setBinWidth(parseInt(data.bin_width));
  }

  loadFasta() {
    console.log("loadFasta");

    // Clear the nucleotides information
    this.nucleotides = [];

    // This loop will automatically cap out at the fasta file corrisponding to the last loaded chunk
    for (let path_fasta of this.props.store.chunkFastaURLs) {
      if (urlExists(path_fasta)) {
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
            this.nucleotides.push(...sequence.split(""));//TODO: could ... work alone?

            console.log("fetching_fasta: ", path_fasta);

              return;
            });
      }
    }
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
    let urls = this.props.store.chunkURLs;
    if (
        this.chunksProcessed.length === 0 ||
        this.chunksProcessed[0] !== urls[0]
    ) {
      this.components = []; // clear all pre-render data
      this.chunksProcessed = [];
    }
    // may have additional chunks to pre-render
    console.log("Parsing components ", beginBin, " - ", endBin);

    for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
      //if end of pre-render is earlier than end of contiguous available chunks, process new data
      if (urlIndex >= this.chunksProcessed.length) {
        if (urls[urlIndex] in this.jsonCache) {
          //only process if data is available
          let url = urls[urlIndex];
          let jsonChunk = this.jsonCache[url];
          for (let [index, component] of jsonChunk.components.entries()) {
            let componentItem = new Component(component, index);
            this.components.push(componentItem); //TODO: concurrent modification?
            //if (component.last_bin >= beginBin) { NOTE: we are now reading in whole chunk, this may place
            //xOffset further right than it was intended when beginBin > chunk.first_bin
          }
          this.chunksProcessed.push(url);
        } else {
          //we've run into a contiguous chunk that is not available yet
          return false;
        }
      }
    }

    console.log(
        "processArray",
        this.chunksProcessed[0],
        this.chunksProcessed.slice(-1)[0]
    );
    //console.log(this.props)

    return true;
  }
}

class Component {//extends React.Component{
  constructor(component,  index) {
    this.columnX = component.x;
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
