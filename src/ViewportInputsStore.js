import React from "react";
import { types } from "mobx-state-tree";

export const RootStore = types
    .model({
        beginBin: 2500,
        endBin: 2700,
        binsPerPixel:6,
        paddingSize:2,
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

