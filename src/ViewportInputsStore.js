import { types } from "mobx-state-tree";
import { urlExists } from "./URL";
import { arraysEqual } from "./utilities";

const Chunk = types.model({
  file: types.string,
  fasta: types.maybeNull(types.string),
  first_bin: types.integer,
  last_bin: types.integer,
  component_count: types.integer,
  link_count: types.integer,
});
const ZoomLevel = types.model({
  bin_width: types.integer,
  last_bin: types.integer,
  files: types.array(Chunk),
});
const ChunkIndex = types.maybeNull(
  types.model({
    json_version: 14,
    pangenome_length: types.integer,
    zoom_levels: types.map(ZoomLevel),
  })
);
const PathNucPos = types.model("PathNucPos", {
  path: types.string,
  nucPos: types.integer,
});

let RootStore;
RootStore = types
  .model({
    chunkIndex: ChunkIndex,
    beginEndBin: types.optional(types.array(types.integer), [1, 100]),
    useVerticalCompression: false,
    useWidthCompression: false,
    binScalingFactor: 3,
    useConnector: true,
    pixelsPerColumn: 10,
    pixelsPerRow: 10,
    leftOffset: 0,
    topOffset: 400,
    highlightedLink: 0, // we will compare linkColumns
    maximumHeightThisFrame: 150,
    cellToolTipContent: "",
    // TODO: to change 'jsonName' in 'jsonNameDir'?
    jsonName: "small_test",
    // Added attributes for the zoom level management
    availableZoomLevels: types.optional(types.array(types.string), ["1"]),
    indexSelectedZoomLevel: 0,
    chunkURLs: types.optional(types.array(types.string), []),
    chunkFastaURLs: types.optional(types.array(types.string), []),
    //to be compared against chunkURLs
    chunksProcessed: types.optional(types.array(types.string), []),
    chunkBeginBin: -1,

    pathNucPos: types.optional(PathNucPos, { path: "path", nucPos: 0 }), // OR: types.maybe(PathNucPos)
    pathIndexServerAddress: "http://193.196.29.24:3010/",
    nucleotideHeight: 10,
    pangenomelast_bin: -1, //TODO: don't add values unless they're needed
    // TODO: Set when bin2file is read
    beginColumnX: 0, //TODO: copied and stored from bin2file.json in calculateEndBinFromScreen()
    loading: true,
  })
  .actions((self) => {
    function setChunkIndex(json) {
      console.log("STEP #2: chunkIndex contents loaded");
      console.log("Index updated with content:", json);
      self.chunkIndex = json;
    }
    function updateBeginEndBin(newBegin, newEnd) {
      console.log("updateBeginEndBin - " + newBegin + " - " + newEnd);

      /*This method needs to be atomic to avoid spurious updates and out of date validation.*/
      newBegin = Math.max(1, Math.round(newBegin));
      newEnd = Math.max(1, Math.round(newEnd));
      const beginBin = getBeginBin();
      const endBin = getEndBin();
      if (newEnd === endBin) {
        //end has not changed
        let diff = endBin - beginBin;
        newEnd = newBegin + diff; //Allows start to push End to new chunks
      }
      if (newEnd < newBegin) {
        //crush newStart
        newBegin = newEnd - 1;
      }
      if (newBegin !== beginBin) {
        setBeginEndBin(newBegin, newEnd);
        console.log("updateed begin and end: " + newBegin + " " + newEnd);
      } else {
        self.beginEndBin[1] = newEnd; // quietly update without refresh
      }
    }
    function updateTopOffset(newTopOffset) {
      if (Number.isFinite(newTopOffset) && Number.isSafeInteger(newTopOffset)) {
        self.topOffset = newTopOffset + 10;
      }
    }
    function updateBinScalingFactor(event) {
      let newFactor = event.target.value;
      self.binScalingFactor = Math.max(1, Number(newFactor));
    }
    function updateHighlightedLink(linkRect) {
      self.highlightedLink = linkRect;
    }
    function updateMaxHeight(latestHeight) {
      self.maximumHeightThisFrame = Math.max(
        self.maximumHeightThisFrame,
        latestHeight
      );
    }
    function resetRenderStats() {
      self.maximumHeightThisFrame = 1;
    }
    function updateCellTooltipContent(newContents) {
      self.cellToolTipContent = String(newContents);
    }
    function toggleUseVerticalCompression() {
      self.useVerticalCompression = !self.useVerticalCompression;
    }
    function toggleUseWidthCompression() {
      self.useWidthCompression = !self.useWidthCompression;
    }
    function toggleUseConnector() {
      self.useConnector = !self.useConnector;
    }
    function updateHeight(event) {
      self.pixelsPerRow = Math.max(1, Number(event.target.value));
    }
    function updateWidth(event) {
      self.pixelsPerColumn = Number(event.target.value);
    }

    function tryJSONpath(event) {
      const url =
        process.env.PUBLIC_URL +
        "test_data/" +
        event.target.value +
        "/bin2file.json";
      if (urlExists(url)) {
        console.log("STEP#1: New Data Source: " + event.target.value);
        self.jsonName = event.target.value;
      }
    }

    // Lifted down the control of the emptyness of the arrays
    function switchChunkURLs(arrayOfFile) {
      if (!arraysEqual(arrayOfFile, self.chunkURLs)) {
        console.log("STEP #4: Set switchChunkURLs: " + arrayOfFile);
        self.chunkURLs = arrayOfFile;
        self.chunksProcessed = []; //clear
      }
    }
    function switchChunkFastaURLs(arrayOfFile) {
      if (!arraysEqual(arrayOfFile, self.chunkFastaURLs)) {
        console.log("STEP #4.fasta: Set switchChunkFastaURLs: " + arrayOfFile);
        self.chunkFastaURLs = arrayOfFile;
      }
    }
    function addChunkProcessed(singleChunk) {
      console.log("STEP #7: processed " + singleChunk);
      self.chunksProcessed.push(singleChunk);
    }
    function getBeginBin() {
      return self.beginEndBin[0];
    }
    function getEndBin() {
      return self.beginEndBin[1];
    }

    // Getter and setter for zoom info management
    function getBinWidth() {
      //Zoom level and BinWidth are actually the same thing
      return Number(self.getSelectedZoomLevel());
    }
    function getSelectedZoomLevel() {
      //This is a genuinely useful getter
      let a = self.availableZoomLevels[self.indexSelectedZoomLevel];
      return a ? a : "1";
    }
    function setIndexSelectedZoomLevel(index) {
      self.indexSelectedZoomLevel = index;
    }

    function setAvailableZoomLevels(availableZoomLevels) {
      let arr = [...availableZoomLevels];

      self.availableZoomLevels = arr;
    }

    function setBeginEndBin(newBeginBin, newEndBin) {
      self.beginEndBin = [newBeginBin, newEndBin];
    }
    function updatePathNucPos(path, nucPos) {
      if (nucPos) {
        nucPos = parseInt(nucPos);
      } else {
        nucPos = 0;
      }
      self.pathNucPos = { path: path, nucPos: nucPos };
    }
    function setBeginColumnX(x) {
      self.beginColumnX = x;
    }
    function setChunkBeginBin(x) {
      self.chunkBeginBin = x;
    }

    function setLoading(val) {
      self.loading = val;
    }
    return {
      setChunkIndex,
      updateBeginEndBin,
      updateTopOffset,
      updateHighlightedLink,
      updateMaxHeight,
      resetRenderStats,
      updateCellTooltipContent,
      updateBinScalingFactor,
      toggleUseVerticalCompression,
      toggleUseWidthCompression,
      toggleUseConnector,
      updateHeight,
      updateWidth,
      tryJSONpath,

      switchChunkURLs,
      switchChunkFastaURLs,
      addChunkProcessed,

      getBeginBin,
      getEndBin,
      updatePathNucPos,
      setBeginColumnX,
      setChunkBeginBin,
      //NOTE: DO NOT ADD GETTERS here.  They are not necessary in mobx.
      // You can reference store.val directly without store.getVal()
      //Only write getters to encapsulate useful logic for derived values

      // Added zoom actions
      getBinWidth,
      getSelectedZoomLevel,
      setIndexSelectedZoomLevel,
      setAvailableZoomLevels,

      setLoading,
    };
  })
  .views((self) => ({}));

export const store = RootStore.create({});
