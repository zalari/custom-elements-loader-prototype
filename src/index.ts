console.log('Hello world-Z!');

// we need to monkey patch CustomElements API

// we maintain a counter for each customElement and
// we will always generate a wrapper on the fly, that is passing
// for the time being nothing but the actual tag itself

const ceCache = new Map<string, { counter: number; ceClass: object; }>();

function createWrapperComponent(orgTagName: string) {
  // we dynamically create a customElement by returning an anon class
  return class extends HTMLElement {

    constructor() {
      super();
    }

    connectedCallback() {
      console.log('Wrapper for ', orgTagName, 'added!');
      this.innerHTML = this.render();
    }

    disconnectedCallback() {
      console.log('Wrapper for ', orgTagName, 'removed!');
    }

    get currentCe() {
      return ceCache.get(orgTagName);
    }


    render() {
      return `<${ orgTagName }-${ this.currentCe!.counter }/>`;
    }


  };
}

// old ref
// const oldCustomElements: {define: any} = {define: undefined};
// (oldCustomElements as any).define = customElements.define;

const oldCustomElements = customElements;
// and now be gone by using Object.defineProperty on window, because simply overwriting does not work :(
Object.defineProperty(window, 'customElements', {
  get: () => ({
    define(ceTagName: string, ceClass: object) {
      console.log('Want to define', ceTagName, 'with', ceClass);
      // make a lookup for ceTagName in cache if counter is not defined, zero it
      if (!ceCache.get(ceTagName)) {
        ceCache.set(ceTagName, {counter: 1, ceClass});
        // and define initial wrapper _ONCE_
        oldCustomElements.define(ceTagName, createWrapperComponent(ceTagName));
        // and actual impl
        oldCustomElements.define(`${ceTagName}-${ceCache.get(ceTagName)!.counter}`, ceClass as any);
      } else {
        console.log('Add another version of the truth');
        // it already exists so just increase the counter and define a new instance for it
        // increase counter
        ceCache.get(ceTagName)!.counter = ceCache.get(ceTagName)!.counter + 1;
        // and define "inner" ce
        oldCustomElements.define(`${ceTagName}-${ceCache.get(ceTagName)!.counter}`, ceClass as any);
      }
    },
    /*whenDefined(ceTagName: string) {
      return oldCustomElements.whenDefined(ceTagName);
    },*/
    get(ceTagName: string) {
      return oldCustomElements.get(ceTagName);
    },

  }),
});
