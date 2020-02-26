import { types } from "mobx-state-tree";
import {action} from "mobx";

function urlExists(dataName) {
    if (dataName === "") {
        return false
    } else {
        //source: https://stackoverflow.com/a/22011478/3067894
        var http=new XMLHttpRequest();
        http.open('HEAD', process.env.PUBLIC_URL + 'test_data/' + dataName + '/bin2file.json', false);
        http.send();
        return http.status !== 404;
    }
}

export let RootStore;
RootStore = types
    .model({
        useVerticalCompression: false,
        beginBin: 1,
        endBin: 40,
        pixelsPerColumn: 7,
        pixelsPerRow: 7,
        leftOffset: 25,
        topOffset: 400,
        highlightedLink: 0, // we will compare linkColumns
        maximumHeightThisFrame: 150,
        cellToolTipContent: "",
        jsonName: 'run1.B1phi1.i1.seqwish.w100',
        startChunkURL: 'test_data/run1.B1phi1.i1.seqwish.w100/chunk0_bin100.schematic.json',
        endChunkURL: 'test_data/run1.B1phi1.i1.seqwish.w100/chunk1_bin100.schematic.json'
    })
    .actions(self => {
        function updateStartAndEnd(newStart, newEnd){
            /*This method needs to be atomic to avoid spurious updates and out of date validation.*/
            newStart = Math.max(1,Number(newStart));
            newEnd = Math.max(1, Number(newEnd));
            if(newEnd < newStart){ //crush newStart
                newStart = newEnd - 1;
            }
            self.endBin = newEnd; //doesn't cause an update?
            self.beginBin = Number(newStart); // triggers updates
            console.log("Viewport set", self.beginBin, "-", self.endBin);
        }
        function updateTopOffset(newTopOffset) {
            self.topOffset = newTopOffset;
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
            if(urlExists(event.target.value)){
                self.jsonName = event.target.value;
            }
        }
        function switchChunkFiles(startFile, endFile){
            self.endChunkURL = endFile; // CRITICAL ORDER!: doesn't cause an update
            self.startChunkURL = startFile; // not user visible
        }
        return {
            updateStartAndEnd,
            updateTopOffset,
            updateHighlightedLink,
            updateMaxHeight,
            resetRenderStats,
            updateCellTooltipContent,
            toggleUseVerticalCompression,
            updateHeight,updateWidth,
            tryJSONpath,
            switchChunkFiles
        }
    })
    .views(self => ({}));

export const store = RootStore.create({

});

