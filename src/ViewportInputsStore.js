import {types} from "mobx-state-tree";
import {urlExists} from "./URL";

const BeginEndBin = types.optional(types.array(types.integer), [1, 140]);

const ChunkURLs = types.optional(types.array(types.string), []);
const ChunkFastaURLs = types.optional(types.array(types.string), []);

const PathNucPos = types.model("PathNucPos", {
  path: types.string,
  nucPos: types.integer,
});

let RootStore;
RootStore = types
  .model({
    useVerticalCompression: false,
    useWidthCompression: false,
    binScalingFactor: 3,
    useConnector: true,
    beginEndBin: BeginEndBin,
    pixelsPerColumn: 10,
    pixelsPerRow: 7,
    leftOffset: 0,
    topOffset: 400,
    highlightedLink: 0, // we will compare linkColumns
    maximumHeightThisFrame: 150,
    cellToolTipContent: "",

    // TODO: to change 'jsonName' in 'jsonNameDir'?
    jsonName: "run1.B1phi1.i1.seqwish",

    // Added attributes for the zoom level management
    availableZoomLevels: types.optional(types.array(types.string), ["1"]),
    indexSelectedZoomLevel: 0,
    chunkURLs: ChunkURLs,
    chunkFastaURLs: ChunkFastaURLs,
    chunkBeginBin: -1,

    pathNucPos: types.optional(PathNucPos, { path: "path", nucPos: 0 }), // OR: types.maybe(PathNucPos)
    pathIndexServerAddress: "http://193.196.29.24:3010/",
    binWidth: 1,
    nucleotideHeight: 10,
    pangenomelast_bin: -1,//TODO: don't add values unless they're needed
    // TODO: Set when bin2file is read
    beginColumnX: 0, //TODO: copied and stored from bin2file.json in calculateEndBinFromScreen()
  })
  .actions((self) => {
    function updateBeginEndBin(newBegin, newEnd) {
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
      if(newBegin !== beginBin){
        setBeginEndBin(newBegin, newEnd);
        console.log("updateBeginEnd: " + newBegin + " " + newEnd);
      }else{
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
        self.jsonName = event.target.value;
      }
    }

    function switchChunkURLs(arrayOfFile) {
      let arraysEqual =
        arrayOfFile.length === self.chunkURLs.length &&
        arrayOfFile.every((e) => self.chunkURLs.indexOf(e) > -1);
      if (!arraysEqual) {
        self.chunkURLs = arrayOfFile;
        console.log("arrayOfFile: " + arrayOfFile);
      }
    }
    function switchChunkFastaURLs(arrayOfFile) {
        let arraysEqual =
            arrayOfFile.length === self.chunkFastaURLs.length &&
            arrayOfFile.every((e) => self.chunkFastaURLs.indexOf(e) > -1);
        if (!arraysEqual) {
            self.chunkFastaURLs = arrayOfFile;
            console.log("arrayOfFastaFile: " + arrayOfFile);
        }
    }
    function getBeginBin() {
      return self.beginEndBin[0];
    }
    function getEndBin() {
      return self.beginEndBin[1];
    }
    function setChunkBeginEndBin(newChunkBeginBin) {
      self.chunkBeginBin = newChunkBeginBin;
    }
    // Added getter and setter for zoom info management
    function getSelectedZoomLevel() {
      //This is a genuinely useful getter
      return self.availableZoomLevels[self.indexSelectedZoomLevel];
    }
    function setIndexSelectedZoomLevel(index) {
      self.indexSelectedZoomLevel = index;
    }
    function decIndexSelectedZoomLevel() {
      if (self.indexSelectedZoomLevel > 0) {
        self.indexSelectedZoomLevel -= 1;
      }
    }
    function incIndexSelectedZoomLevel() {
      if (self.indexSelectedZoomLevel < self.availableZoomLevels.length - 1) {
        self.indexSelectedZoomLevel += 1;
      }
    }
    function setAvailableZoomLevels(availableZoomLevels) {
      self.availableZoomLevels = availableZoomLevels;
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
    function setBinWidth(binWidth) {
      self.binWidth = binWidth;
    }
    function setBeginColumnX(x){
      self.beginColumnX = x;
    }
    return {
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
      setChunkBeginEndBin,
      getBeginBin,
      getEndBin,
      updatePathNucPos,
      setBinWidth,
      setBeginColumnX,
      //NOTE: DO NOT ADD GETTERS here.  They are not necessary in mobx.
      // You can reference store.val directly without store.getVal()
      //Only write getters to encapsulate useful logic for derived values

      // Added zoom actions
      getSelectedZoomLevel,
      setIndexSelectedZoomLevel,
      //TODO: these actions are too specific. Increase and decrease should go in the widget code
      decIndexSelectedZoomLevel,
      incIndexSelectedZoomLevel,
      setAvailableZoomLevels,
    };
  })
  .views((self) => ({}));

export const store = RootStore.create({});
