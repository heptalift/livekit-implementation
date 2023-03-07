function findAndSplice<T>(
  array: Array<T>,
  verify: (value: T, index?: number, array?: Array<T>) => boolean,
) {
  const index = array.findIndex(verify);
  return index !== -1 ? array.splice(index, 1)[0] : undefined;
}

export type ArgumentTypes<F extends Function> = F extends (
  ...args: infer A
) => any
  ? A
  : never;
export type SuperReturnType<F extends Function> = F extends (
  ...args: any
) => any
  ? ReturnType<F>
  : never;
export declare function assumeType<T>(x: unknown): asserts x is T;

interface EventListenerOptions {
  capture?: boolean;
}

interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
}

export type EventListenerListeners = Record<string, Function>;

type ListenerObject<T> = {
  callback: T;
  options?: boolean | AddEventListenerOptions;
};

export default class EventListenerBase<
  Listeners extends EventListenerListeners,
> {
  protected listeners: Partial<{
    [k in keyof Listeners]: Array<ListenerObject<Listeners[k]>>;
  }>;
  protected listenerResults: Partial<{
    [k in keyof Listeners]: ArgumentTypes<Listeners[k]>;
  }>;

  private reuseResults: boolean;

  constructor(reuseResults: boolean = false) {
    this.reuseResults = reuseResults;
    this.listeners = {};
    this.listenerResults = {};
  }

  public addEventListener<T extends keyof Listeners>(
    name: T,
    callback: Listeners[T],
    options?: boolean | AddEventListenerOptions,
  ) {
    (this.listeners[name] ?? (this.listeners[name] = [])).push({
      callback,
      options,
    });

    if (this.listenerResults.hasOwnProperty(name)) {
      callback(this.listenerResults[name]);

      if ((options as AddEventListenerOptions)?.once) {
        this.listeners[name]?.pop();
        return;
      }
    }
  }

  public addMultipleEventsListeners(obj: {
    [name in keyof Listeners]: Listeners[name];
  }) {
    for (const i in obj) {
      this.addEventListener(i, obj[i]);
    }
  }

  public removeEventListener<T extends keyof Listeners>(
    name: T,
    callback: Listeners[T],
    options?: boolean | AddEventListenerOptions,
  ) {
    if (this.listeners[name]) {
      findAndSplice(this.listeners[name] ?? [], l => l.callback === callback);
    }
  }

  protected invokeListenerCallback<
    T extends keyof Listeners,
    L extends ListenerObject<any>,
  >(name: T, listener: L, ...args: ArgumentTypes<L['callback']>) {
    let result: any;
    try {
      result = listener.callback(...args);
    } catch (err) {
      console.error(err);
    }

    if ((listener.options as AddEventListenerOptions)?.once) {
      this.removeEventListener(name, listener.callback);
    }

    return result;
  }

  private _dispatchEvent<T extends keyof Listeners>(
    name: T,
    collectResults: boolean,
    ...args: ArgumentTypes<Listeners[T]>
  ): Array<SuperReturnType<Listeners[typeof name]>> | boolean {
    if (this.reuseResults) {
      this.listenerResults[name] = args;
    }

    const arr: Array<SuperReturnType<Listeners[typeof name]>> = [];

    const listeners = this.listeners[name];
    if (listeners) {
      // ! this one will guarantee execution even if delete another listener during setting
      const left = listeners.slice();
      left.forEach(listener => {
        const index = listeners.findIndex(
          l => l.callback === listener.callback,
        );
        if (index === -1) {
          return;
        }

        const result = this.invokeListenerCallback(name, listener, ...args);
        if (collectResults) {
          arr.push(result);
        }
      });
    }

    return arr;
  }

  public dispatchResultableEvent<T extends keyof Listeners>(
    name: T,
    ...args: ArgumentTypes<Listeners[T]>
  ) {
    return this._dispatchEvent(name, true, ...args);
  }

  // * must be protected, but who cares
  public dispatchEvent<
    L extends EventListenerListeners = Listeners,
    T extends keyof L = keyof L,
  >(name: T, ...args: ArgumentTypes<L[T]>) {
    // @ts-ignore
    this._dispatchEvent(name, false, ...args);
  }

  public cleanup() {
    this.listeners = {};
    this.listenerResults = {};
  }
}
