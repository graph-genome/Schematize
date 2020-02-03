import { types } from "mobx-state-tree";

export const RootStore = types
    .model({
        beginBin: 1,
        endBin: 200,
        pixelsPerColumn:6,
        pixelsPerRow: 2,
        pixelsBetween:5,
        leftOffset:25,
        topOffset: 400,
        highlightedLink: 0 // we will compare linkColumns
    })
    .actions(self => {
        function updateTopOffset(newTopOffset) {
            self.topOffset = newTopOffset;
        }
        function updateHighlightedLink(linkRect) {
            self.highlightedLink = linkRect
        }

        return {
            updateTopOffset,
            updateHighlightedLink
        }
    })
    .views(self => ({
    }));

export const store = RootStore.create({

});

