import { types } from "mobx-state-tree";

export let RootStore;
RootStore = types
    .model({
        useVerticalCompression: false,
        beginBin: 800,
        endBin: 900,
        pixelsPerColumn: 2,
        pixelsPerRow: 10,
        pixelsBetween: 5,
        leftOffset: 25,
        topOffset: 400,
        highlightedLink: 0, // we will compare linkColumns
        maximumHeightThisFrame: 150,
        cellToolTipContent: "",
        isCellToolTipVisible: true,
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

        return {
            updateStart,
            updateEnd,
            updateTopOffset,
            updateHighlightedLink,
            updateMaxHeight,
            resetRenderStats,
            updateCellTooltipContent,
            toggleUseVerticalCompression
        }
    })
    .views(self => ({}));

export const store = RootStore.create({

});

