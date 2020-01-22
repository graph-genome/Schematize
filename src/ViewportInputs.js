import React from "react";
import { render } from "react-dom";
import { types, applySnapshot } from "mobx-state-tree";
import { observer } from "mobx-react";
import { values } from "mobx";

const randomId = () => Math.floor(Math.random() * 1000).toString(36);

const Todo = types
    .model({
        name: types.optional(types.string, ""),
        label: types.optional(types.string, ""),
    })
    .actions(self => {
        function setName(newName) {
            self.name = newName;
        }

        return { setName };
    });

const User = types.model({
    name: types.optional(types.string, "")
});

const RootStore = types
    .model({
        users: types.map(User),
        todos: types.map(Todo)
    })
    .views(self => ({
    }));

export const store = RootStore.create({
    users: {},
    todos: {
        "1": {
            name: "2500",
            label: "Begin Bin: "
        },
        "2": {
            name: "2700",
            label: "End Bin: "
        }
    }
});

const TodoView = observer(props => (
    <div>
        {props.todo.label}
        <input
            type="text"
            value={props.todo.name}
            onChange={e => props.todo.setName(e.target.value)}
            aria-label={"Begin: "}
            label={"Begin: "}
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