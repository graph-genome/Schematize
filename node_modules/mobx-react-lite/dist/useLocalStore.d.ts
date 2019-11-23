export declare function useLocalStore<TStore extends Record<string, any>, TSource extends object = any>(initializer: (source: TSource) => TStore, current?: TSource): TStore;
