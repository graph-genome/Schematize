import { types } from "mobx-state-tree";

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
        currentChunkURL: 'test_data/run1.B1phi1.i1.seqwish.w100/chunk0_bin100.schematic.json'
    })
    .actions(self => {
        function updateStart(value){
            self.beginBin = Number(value);
        }
        function updateEnd(value){
            if(value.hasOwnProperty("target")){ //event object
                value = Number(value.target.value);
            }
            let val = //Math.min(self.last_bin, //TODO: cap at graph genome size
                Math.max(1, value);
            if(val < self.beginBin){ //crush beginBin
                self.beginBin = val - 1;
            }
            self.endBin = val;
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
        function switchChunkFile(newFile){
            self.currentChunkURL = newFile; // not user visible
        }
        return {
            updateStart, updateEnd,
            updateTopOffset,
            updateHighlightedLink,
            updateMaxHeight,
            resetRenderStats,
            updateCellTooltipContent,
            toggleUseVerticalCompression,
            updateHeight,updateWidth,
            tryJSONpath,
            switchChunkFile
        }
    })
    .views(self => ({}));

export const store = RootStore.create({

});

