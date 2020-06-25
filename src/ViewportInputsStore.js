import { types } from "mobx-state-tree";
import { urlExists } from "./URL";
import { arraysEqual, checkAndForceMinOrMaxValue, isInt } from "./utilities";

const Chunk = types.model({
  file: types.string,
  fasta: types.maybeNull(types.string),
  first_bin: types.integer,
  last_bin: types.integer,
  x: types.integer,
  compressedX: types.integer,
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

const metaDataModelEntry = types.model({
  Accession: types.identifier,
  Info: types.string,
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
    pixelsPerRow: 4,
    heightNavigationBar: 25,
    leftOffset: 1,
    topOffset: 400,
    highlightedLink: 0, // we will compare linkColumns
    maximumHeightThisFrame: 150,
    cellToolTipContent: "",
    jsonName: "SARS-CoV-2.genbank.small",
    // Added attributes for the zoom level management
    availableZoomLevels: types.optional(types.array(types.string), ["1"]),

    precIndexSelectedZoomLevel: 0,
    indexSelectedZoomLevel: 0,

    chunkURLs: types.optional(types.array(types.string), []),
    chunkFastaURLs: types.optional(types.array(types.string), []),
    //to be compared against chunkURLs
    chunksProcessed: types.optional(types.array(types.string), []),
    chunksProcessedFasta: types.optional(types.array(types.string), []),

    pathNucPos: types.optional(PathNucPos, { path: "path", nucPos: 0 }), // OR: types.maybe(PathNucPos)
    pathIndexServerAddress: "http://193.196.29.24:3010/",

    loading: true,
    copyNumberColorArray: types.optional(types.array(types.string), [
      "#6a6a6a",
      "#5f5f5f",
      "#545454",
      "#4a4a4a",
      "#3f3f3f",
      "#353535",
      "#2a2a2a",
      "#1f1f1f",
      "#151515",
      "#0a0a0a",
      "#000000",
    ]),
    invertedColorArray: types.optional(types.array(types.string), [
      "#de4b39",
      "#c74333",
      "#b13c2d",
      "#9b3427",
      "#852d22",
      "#6f251c",
      "#581e16",
      "#421611",
      "#2c0f0b",
      "#160705",
      "#000000",
    ]),

    last_bin_pangenome: 0,

    colorByGeneAnnotation: true,
    metaDataKey: "Accession",
    metaData: types.map(metaDataModelEntry),
    //metaDataChoices: types.array(types.string)
  })
  .actions((self) => {
    function setChunkIndex(json) {
      console.log("STEP #2: chunkIndex contents loaded");
      //console.log("Index updated with content:", json);

      self.chunkIndex = null; // TODO: TEMPORARY HACK before understanding more in depth mobx-state or change approach

      self.chunkIndex = json;
    }
    function updateBeginEndBin(newBegin, newEnd) {
      /*This method needs to be atomic to avoid spurious updates and out of date validation.*/

      console.log("updateBeginEndBin - " + newBegin + " - " + newEnd);

      // Sometimes, typing new bin, it arrives something that is not a valid integer
      if (!isInt(newBegin) || !isInt(newEnd)) {
        newBegin = 1;
        newEnd = 100;
      }

      // TODO: manage a maxBeginBin based on the width of the last components in the pangenome
      newBegin = Math.min(
        self.last_bin_pangenome - 1,
        Math.max(1, Math.round(newBegin))
      );

      setBeginEndBin(newBegin, newEnd);
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
      self.pixelsPerRow = checkAndForceMinOrMaxValue(
        Number(event.target.value),
        1,
        30
      );
    }
    function updateWidth(event) {
      self.pixelsPerColumn = checkAndForceMinOrMaxValue(
        Number(event.target.value),
        3,
        30
      );
    }

    function tryJSONpath(event) {
      const url =
        process.env.PUBLIC_URL +
        "/test_data/" +
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

        self.chunksProcessed = []; // Clear

        return true;
      }
      return false;
    }
    function switchChunkFastaURLs(arrayOfFile) {
      if (!arraysEqual(arrayOfFile, self.chunkFastaURLs)) {
        console.log("STEP #4.fasta: Set switchChunkFastaURLs: " + arrayOfFile);
        self.chunkFastaURLs = arrayOfFile;

        self.chunksProcessedFasta = []; // Clear
      }
    }
    function addChunkProcessed(singleChunk) {
      console.log("STEP #7: processed " + singleChunk);
      self.chunksProcessed.push(singleChunk);
    }
    function addChunkProcessedFasta(singleChunkFasta) {
      console.log("STEP #7.FASTA: processed " + singleChunkFasta);
      self.chunksProcessedFasta.push(singleChunkFasta);
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
    function getSelectedZoomLevel(get_prec_zoom_level = false) {
      //This is a genuinely useful getter
      let a =
        self.availableZoomLevels[
          get_prec_zoom_level
            ? self.precIndexSelectedZoomLevel
            : self.indexSelectedZoomLevel
        ];

      // Clear precIndexSelectedZoomLevel (it is usable only one time)
      if (get_prec_zoom_level) {
        self.precIndexSelectedZoomLevel = self.indexSelectedZoomLevel;
      }

      return a ? a : "1";
    }
    function setIndexSelectedZoomLevel(index) {
      self.precIndexSelectedZoomLevel = self.indexSelectedZoomLevel;
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
      //console.log('updatePathNucPos: ' + path + ' --- ' + nucPos)

      if (path !== undefined) {
        if (nucPos) {
          nucPos = Math.abs(parseInt(nucPos));
        } else {
          nucPos = 0;
        }
        self.pathNucPos = { path: path, nucPos: nucPos };
      }
    }

    function setLoading(val) {
      self.loading = val;
    }
    function setLastBinPangenome(val) {
      self.last_bin_pangenome = val;
    }

    /*function toggleColorByGeo() {
      self.colorByGeo = !self.colorByGeo;
    }*/
    function setMetaData(metadata) {
      for (let [key, value] of Object.entries(metadata)) {
        self.metaData.set(key, value);
      }
    }
    function getMetaData(key) {
      self.metaData.get(key);
    }
    function setMetaDataChoices(ar) {
      self.metaDataChoices = ar;
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
      addChunkProcessedFasta,

      getBeginBin,
      getEndBin,
      updatePathNucPos,

      //NOTE: DO NOT ADD GETTERS here.  They are not necessary in mobx.
      // You can reference store.val directly without store.getVal()
      //Only write getters to encapsulate useful logic for derived values

      // Added zoom actions
      getBinWidth,
      getSelectedZoomLevel,
      setIndexSelectedZoomLevel,
      setAvailableZoomLevels,

      setLoading,

      setLastBinPangenome,

      //toggleColorByGeo,
      setMetaData,
      getMetaData,
      setMetaDataChoices,
    };
  })
  .views((self) => ({}));

export const store = RootStore.create({});
