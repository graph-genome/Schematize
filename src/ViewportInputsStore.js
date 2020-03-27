import { types } from "mobx-state-tree";
import { urlExists } from "./URL"

const BeginEndBin = types.optional(types.array(types.integer), [1,40]);
const PathNucPos = types.model("PathNucPos", {
    path: types.string,
    nucPos: types.integer
});

export let RootStore;
RootStore = types
    .model({
        useVerticalCompression: false,
        beginEndBin: BeginEndBin,
        pixelsPerColumn: 7,
        pixelsPerRow: 7,
        leftOffset: 25,
        topOffset: 400,
        highlightedLink: 0, // we will compare linkColumns
        maximumHeightThisFrame: 150,
        cellToolTipContent: "",
        jsonName: 'run1.B1phi1.i1.seqwish.w100',
        startChunkURL: 'test_data/run1.B1phi1.i1.seqwish.w100/chunk0_bin100.schematic.json',
        endChunkURL: 'test_data/run1.B1phi1.i1.seqwish.w100/chunk1_bin100.schematic.json',
        pathNucPos: types.optional(PathNucPos, {path: "path", nucPos: 0}), // OR: types.maybe(PathNucPos)
        pathIndexServerAddress: 'http://193.196.29.24:3010/',
        binWidth: 100
    })
    .actions(self => {
        function updateBeginEndBin(newBegin, newEnd) {
            /*This method needs to be atomic to avoid spurious updates and out of date validation.*/
            newBegin = Math.max(1, Number(newBegin));
            newEnd = Math.max(1, Number(newEnd));
            const beginBin = getBeginBin();
            const endBin = getEndBin();
            if(newEnd === endBin){ //end has not changed
                let diff = endBin - beginBin;
                newEnd = newBegin + diff; //Allows start to push End to new chunks
            }
            if(newEnd < newBegin){ //crush newStart
                newBegin = newEnd - 1;
            }
            setBeginEndBin(newBegin, newEnd);
            console.log("updateBeginEnd: " + newBegin + " " + newEnd);
            console.log("updatedBeginEnd: " + self.beginEndBin[0] + " " + self.beginEndBin[1]);
        }
        function updateTopOffset(newTopOffset) {
            if(Number.isFinite(newTopOffset) && Number.isSafeInteger(newTopOffset)){
                self.topOffset = newTopOffset;
            }
        }
        function updateHighlightedLink(linkRect) {
            self.highlightedLink = linkRect;
        }
        function updateMaxHeight(latestHeight) {
            self.maximumHeightThisFrame = Math.max(self.maximumHeightThisFrame, latestHeight);
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
        function updateHeight(event){
            self.pixelsPerRow = Math.max(1, Number(event.target.value));
        }
        function updateWidth(event){
            self.pixelsPerColumn = Number(event.target.value);
        }
        function tryJSONpath(event){
            const url = process.env.PUBLIC_URL + 'test_data/' + event.target.value + '/bin2file.json';
            if(urlExists(url)){
                self.jsonName = event.target.value;
            }
        }
        function switchChunkFiles(startFile, endFile){
            self.endChunkURL = endFile; // CRITICAL ORDER!: doesn't cause an update
            self.startChunkURL = startFile; // not user visible
        }
        function getBeginEndBin() {
            return self.beginEndBin;
        }
        function getBeginBin() {
            return getBeginEndBin()[0];
        }
        function getEndBin() {
            return getBeginEndBin()[1];
        }
        function setBeginEndBin(newBeginBin, newEndBin) {
            self.beginEndBin = [newBeginBin, newEndBin];
        }
        function getPath() {
            return self.pathNucPos.path;
        }
        function getNucPos() {
            return self.pathNucPos.nucPos;
        }
        function getPathNucPos() {
            return self.pathNucPos;
        }
        function updatePathNucPos(path, nucPos) {
            if (nucPos) {
                nucPos = parseInt(nucPos);
            } else {
                nucPos = 0;
            }
            self.pathNucPos = {path: path, nucPos: nucPos};
        }
        function setBinWidth(binWidth) {
            self.binWidth = binWidth;
        }
        return {
            updateBeginEndBin,
            updateTopOffset,
            updateHighlightedLink,
            updateMaxHeight,
            resetRenderStats,
            updateCellTooltipContent,
            toggleUseVerticalCompression,
            updateHeight,updateWidth,
            tryJSONpath,
            switchChunkFiles,
            getBeginEndBin,
            getBeginBin,
            getEndBin,
            getPath,
            getNucPos,
            getPathNucPos,
            updatePathNucPos,
            setBinWidth
        }
    })
    .views(self => ({}));

export const store = RootStore.create({

});

