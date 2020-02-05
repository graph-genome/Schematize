import { types } from "mobx-state-tree";

export const RootStore = types
    .model({
        useVerticalCompression: false,
        beginBin: 1,
        endBin: 60,
        pixelsPerColumn:6,
        pixelsPerRow: 1,
        pixelsBetween:5,
        leftOffset:25,
        topOffset: 400,
        highlightedLink: 0, // we will compare linkColumns
        maximumHeightThisFrame: 150
    })
    .actions(self => {
        function updateTopOffset(newTopOffset) {
            self.topOffset = newTopOffset;
        }
        function updateHighlightedLink(linkRect) {
            self.highlightedLink = linkRect
        }
        function updateMaxHeight(latestHeight){
            self.maximumHeightThisFrame = Math.max(self.maximumHeightThisFrame, latestHeight);
        }
        function resetRenderStats(){
            self.maximumHeightThisFrame = 1;
        }

        return {
            updateTopOffset,
            updateHighlightedLink,
            updateMaxHeight,
            resetRenderStats
        }
    })
    .views(self => ({
    }));

export const store = RootStore.create({

});

