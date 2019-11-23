/// <reference types="react" />
export interface IObserverOptions {
    readonly forwardRef?: boolean;
}
export declare function observer<P extends object, TRef = {}>(baseComponent: React.RefForwardingComponent<TRef, P>, options: IObserverOptions & {
    forwardRef: true;
}): React.MemoExoticComponent<React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<TRef>>>;
export declare function observer<P extends object>(baseComponent: React.FunctionComponent<P>, options?: IObserverOptions): React.FunctionComponent<P>;
