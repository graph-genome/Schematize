import { types } from "mobx-state-tree";

export let RootStore;
RootStore = types
    .model({
        useVerticalCompression: false,
        beginBin: 1,
        endBin: 100,
        pixelsPerColumn: 7,
        pixelsPerRow: 7,
        leftOffset: 25,
        topOffset: 400,
        highlightedLink: 0, // we will compare linkColumns
        maximumHeightThisFrame: 150,
        cellToolTipContent: "",
    })
    .actions(self => {
        function updateStart(event){
            self.beginBin = Number(event.target.value);
        }
        function updateEnd(event){
            self.endBin = Math.max(self.beginBin +1 , Number(event.target.value));
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
            self.pixelsPerRow = Number(event.target.value);
        }
        function updateWidth(event){
            self.pixelsPerColumn = Number(event.target.value);
        }
        return {
            updateStart, updateEnd,
            updateTopOffset,
            updateHighlightedLink,
            updateMaxHeight,
            resetRenderStats,
            updateCellTooltipContent,
            toggleUseVerticalCompression,
            updateHeight,updateWidth
        }
    })
    .views(self => ({}));

export const store = RootStore.create({

});

