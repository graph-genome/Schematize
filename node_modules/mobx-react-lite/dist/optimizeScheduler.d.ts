export interface IBatchedUpdates {
    batchedUpdates<A, B>(callback: (a: A, b: B) => any, a: A, b: B): void;
    batchedUpdates<A>(callback: (a: A) => any, a: A): void;
    batchedUpdates(callback: () => any): void;
}
export declare const optimizeScheduler: (reactionScheduler: IBatchedUpdates) => void;
export declare const deoptimizeScheduler: () => void;
