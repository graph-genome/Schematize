import React from "react";
import { types, applySnapshot } from "mobx-state-tree";
import { observer } from "mobx-react";
import { values } from "mobx";

const randomId = () => Math.floor(Math.random() * 1000).toString(36);

const Todo = types
    .model({
        name: types.optional(types.string, ""),
        done: types.optional(types.boolean, false)
    })
    .actions(self => {
        function setName(newName) {
            self.name = newName;
        }

        function toggle() {
            self.done = !self.done;
        }

        return { setName, toggle };
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
        get pendingCount() {
            return values(self.todos).filter(todo => !todo.done).length;
        },
        get completedCount() {
            return values(self.todos).filter(todo => todo.done).length;
        }
    }))
    .actions(self => {
        function addTodo(id, name) {
            self.todos.set(id, Todo.create({ name }));
        }

        return { addTodo };
    });

export const store = RootStore.create({
    users: {},
    todos: {
        "1": {
            name: "Eat a cake",
            done: true
        }
    }
});

const TodoView = observer(props => (
    <div>
        <input
            type="checkbox"
            checked={props.todo.done}
            onChange={e => props.todo.toggle()}
        />
        <input
            type="text"
            value={props.todo.name}
            onChange={e => props.todo.setName(e.target.value)}
        />
    </div>
));

const TodoCounterView = observer(props => (
    <div>
        {props.store.pendingCount} pending, {props.store.completedCount} completed
    </div>
));

export const AppView = observer(props => (
    <div>
        <button onClick={e => props.store.addTodo(randomId(), "New Task")}>
            Add Task
        </button>
        {values(props.store.todos).map(todo => (
            <TodoView todo={todo} />
        ))}
        <TodoCounterView store={props.store} />
    </div>
));

// render(
//     return <AppView store={store} />, document.getElementById("root")
//
// );