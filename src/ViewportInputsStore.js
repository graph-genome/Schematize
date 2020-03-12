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

const BeginEndBin = types.optional(types.array(types.integer), [1,40]);

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
        jsonName: 'Athaliana_12_individuals_w100000',
        startChunkURL: 'test_data/Athaliana_12_individuals_w100000/chunk00_bin100000.schematic.json',
        endChunkURL: 'test_data/Athaliana_12_individuals_w100000/chunk01_bin100000.schematic.json'
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
        function updateStartAndEnd(newStart, newEnd){
            /*This method needs to be atomic to avoid spurious updates and out of date validation.*/
            newStart = Math.max(1,Number(newStart));
            newEnd = Math.max(1, Number(newEnd));
            if(newEnd === self.endBin){ //end has not changed
                let diff = self.endBin - self.beginBin;
                newEnd = newStart + diff; //Allows start to push End to new chunks
            }
            if(newEnd < newStart){ //crush newStart
                newStart = newEnd - 1;
            }
            self.endBin = newEnd; //doesn't cause an update?
            self.beginBin = Number(newStart); // triggers updates
            console.log("Viewport set", self.beginBin, "-", self.endBin);
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
            if(urlExists(event.target.value)){
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
        function setBeginBin(newBeginBin) {
            self.beginEndBin[0] = newBeginBin;
        }
        function setEndBin(newEndBin) {
            self.beginEndBin[1] = newEndBin;
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
            setBeginEndBin,
            getBeginBin,
            setBeginBin,
            getEndBin,
            setEndBin,
        }
    })
    .views(self => ({}));

export const store = RootStore.create({

});

