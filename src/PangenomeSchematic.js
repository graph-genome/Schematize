import React from "react";
import { observe } from "mobx";

import { urlExists } from "./URL";

function range(start, end) {
  return [...Array(1 + end - start).keys()].map((v) => start + v);
}

// AG
function getFileName(path) {
  return path.substring(path.lastIndexOf("/") + 1);
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

    // AG: added bin attributes
    this.nucleotides = [];
    this.first_bin = -1;
    this.last_bin = -1;

    this.loadIndexFile(this.props.store.jsonName); //initializes this.chunkIndex
    //whenever jsonName changes,
    observe(this.props.store, "jsonName", () => {
      this.loadIndexFile(this.props.store.jsonName);
    });

    // AG: added indexSelectedZoomLevel observation
    observe(this.props.store, "indexSelectedZoomLevel", () => {
      this.loadIndexFile(this.props.store.jsonName);
    });

    observe(
      this.props.store.beginEndBin,
      this.openRelevantChunksFromIndex.bind(this)
    );
    // console.log("public ", process.env.PUBLIC_URL ) //PUBLIC_URL is empty
  }
  componentDidUpdate() {
    // console.log("#components: " + this.components);
  }

  /** Compares bin2file @param indexContents with the beginBin and EndBin.
   * It finds the appropriate chunk URLS from the index and updates
   * switchChunkURLs which trigger json fetches for the new chunks. */
  openRelevantChunksFromIndex() {
    if (this.chunkIndex === null) {
      return; //before the class is fully initialized
    }
    let indexContents = this.chunkIndex;
    const beginBin = this.props.store.getBeginBin();
    const endBin = this.props.store.getEndBin();

    this.props.store.setAvailableZoomLevels(
      Object.keys(indexContents["zoom_levels"])
    );
    const selZoomLev = this.props.store.getSelectedZoomLevel();

    const lastIndex =
      indexContents["zoom_levels"][selZoomLev]["files"].length - 1;

    const findBegin = (entry) => entry["last_bin"] >= beginBin;
    const findEnd = (entry) => entry["last_bin"] >= endBin;
    let beginIndex = indexContents["zoom_levels"][selZoomLev][
      "files"
    ].findIndex(findBegin);
    let endIndex = indexContents["zoom_levels"][selZoomLev]["files"].findIndex(
      findEnd
    );
    if (-1 === endIndex) {
      //#22 end of file limits so it doesn't crash
      endIndex = lastIndex;
    }
    if (-1 === beginIndex) {
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
      process.env.PUBLIC_URL +
      "test_data/" +
      this.props.store.jsonName +
      "/" +
      selZoomLev +
      "/";
    let fileArray = range(beginIndex, endIndex).map((index) => {
      return (
        URLprefix +
        indexContents["zoom_levels"][selZoomLev]["files"][index]["file"]
      );
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
    if (data.json_version !== 13) {
      throw MediaError(
        "Wrong Data JSON version: was expecting version 13, got " +
        data.json_version +
        ".  " +
        "This version added nucleotide ranges to bins.  " + // KEEP THIS UP TO DATE!
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
    const beginBin = this.props.store.getBeginBin();
    const endBin = this.props.store.getEndBin();

    if (
      !(
        endBin < this.first_bin ||
        endBin > this.last_bin ||
        beginBin < this.first_bin ||
        beginBin > this.last_bin
      )
    ) {
      // AG: it is not necessary to read new sequences
      return;
    }

    this.nucleotides = [];
    this.first_bin = -1;
    this.last_bin = -1;

    if (this.chunkIndex === undefined) {
      return;
    }
    if (this.props.store.getChunkURLs().length < 1) {
      return;
    }
    const selZoomLev = this.props.store.getSelectedZoomLevel();

    for (var i = 0; i < this.chunksProcessed.length; i++) {
      var index_file = parseInt(
        getFileName(this.chunksProcessed[i]).split("chunk")[1].split("_")[0]
      );

      let chunkNo = this.chunkIndex["zoom_levels"][selZoomLev].files[
        index_file
      ];

      const fastaFilePath = `${process.env.PUBLIC_URL}/test_data/${this.props.store.jsonName}/${selZoomLev}/${chunkNo.fasta}`;
      if (urlExists(fastaFilePath)) {
        fetch(fastaFilePath)
          .then((response) => {
            return response.text();
          })
          .then((text) => {
            //remove first line
            const splitText = text.replace(/.*/, "").substr(1);
            const noLinebreaks = splitText.replace(/[\r\n]+/gm, "");
            const nucleotides = noLinebreaks.split("");

            if (this.first_bin < 0) {
              this.first_bin = chunkNo["first_bin"];
            }
            if (chunkNo["last_bin"] > this.last_bin) {
              this.last_bin = chunkNo["last_bin"];
            }

            //split into array of nucleotides
            this.nucleotides.push(...nucleotides);

            console.log("fetching_fasta: ", fastaFilePath);
            //console.log("this.nucleotides: ", this.nucleotides.length);
            //console.log("this.first/last_bin: ", this.first_bin + ' / ' + this.last_bin);

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
    let urls = this.props.store.getChunkURLs();
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
          let xOffset = this.components.length
            ? this.components.slice(-1)[0].nextXOffset()
            : 0;
          for (let [index, component] of jsonChunk.components.entries()) {
            let componentItem = new Component(component, xOffset, index);
            xOffset = componentItem.nextXOffset();
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

    // AG: at the end, after reading chunck information
    this.loadFasta();

    console.log(
      "processArray",
      this.chunksProcessed[0],
      this.chunksProcessed.slice(-1)[0]
    );
    //console.log(this.props)

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
  nextXOffset() {
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
