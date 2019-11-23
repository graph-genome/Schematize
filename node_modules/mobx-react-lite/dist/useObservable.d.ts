declare type SupportedValues = object | Map<any, any> | any[];
export declare function useObservable<T extends SupportedValues>(initialValue: T): T;
export {};
