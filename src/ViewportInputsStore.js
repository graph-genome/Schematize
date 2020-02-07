import { types } from "mobx-state-tree";

export let RootStore;
RootStore = types
    .model({
        useVerticalCompression: false,
        beginBin: 20,
        endBin: 40,
        pixelsPerColumn: 6,
        pixelsPerRow: 4,
        pixelsBetween: 5,
        leftOffset: 25,
        topOffset: 400,
        highlightedLink: 0, // we will compare linkColumns
        maximumHeightThisFrame: 150,
        cellToolTipContent: "",
        isCellToolTipVisible: false,
    })
    .actions(self => {
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

        function updateCellTooltipVisibility(isVisible) {
            self.isCellToolTipVisible = isVisible;
        }

        function toggleUseVerticalCompression() {
            self.useVerticalCompression = !self.useVerticalCompression;
        }

        return {
            updateTopOffset,
            updateHighlightedLink,
            updateMaxHeight,
            resetRenderStats,
            updateCellTooltipContent,
            updateCellTooltipVisibility,
            toggleUseVerticalCompression
        }
    })
    .views(self => ({}));

export const store = RootStore.create({

});

