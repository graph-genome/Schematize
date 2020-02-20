import { types } from "mobx-state-tree";

export let RootStore;
RootStore = types
    .model({
        useVerticalCompression: false,
        beginBin: 400,
        endBin: 800,
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

