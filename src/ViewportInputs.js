import React from "react";
import { types } from "mobx-state-tree";
import { observer } from "mobx-react";
import { values, configure } from "mobx";

configure({enforceActions: "observed"});

const Todo = types
    .model({
        value: 1,
        label: types.optional(types.string, ""),
    })
    .actions(self => {
        function setValue(newVal) {
            self.value = newVal /1;
        }

        return { setValue };
    });

const RootStore = types
    .model({
        todos: types.map(Todo)
    })
    .views(self => ({
    }));

export const store = RootStore.create({
    users: {},
    todos: {
        "1": {
            value: 2500,
            label: "Begin Bin: "
        },
        "2": {
            value: 2700,
            label: "End Bin: "
        }
    }
});

const TodoView = observer(props => (
    <div>
        {props.todo.label}
        <input
            type="number"
            value={props.todo.value}
            onChange={e => props.todo.setValue(e.target.value)}
            aria-label={"Bin Index: "}
        />
    </div>
));

export const AppView = observer(props => (
    <div>
        {values(props.store.todos).map(todo => (
            <TodoView todo={todo} />
        ))}
    </div>
));

// render(
//     return <AppView store={store} />, document.getElementById("root")
//
// );