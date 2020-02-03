import { types } from "mobx-state-tree";

export const RootStore = types
    .model({
        beginBin: 1,
        endBin: 200,
        binsPerPixel:6,
        paddingSize:5,
        leftOffset:10,
        topOffset: 400,
        pathsPerPixel: 1,
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

