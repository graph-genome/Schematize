import React from "react";
import { types } from "mobx-state-tree";
import { observer } from "mobx-react";
import { values, configure } from "mobx";

export const RootStore = types
    .model({
        beginBin: 2500,
        endBin: 2700,
        binsPerPixel:6,
        paddingSize:2,
        leftOffset:10
    })
    .views(self => ({
    }));

export const store = RootStore.create({

});

