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

// monkey patch CustomElementAPI

// old ref
const oldCustomElementAPI = customElements;
// and now be gone
customElements = {
  define(ceTagName: string, ceClass: object) {
    console.log('Want to define', ceTagName, 'with', ceClass);
    // make a lookup for ceTagName in cache if counter is not defined, zero it
    if (!ceCache.get(ceTagName)) {
      ceCache.set(ceTagName, { counter: 0, ceClass });
      // and define initial wrapper _ONCE_
      oldCustomElementAPI.define(ceTagName, createWrapperComponent(ceTagName));
    }
    // increase counter
    ceCache.get(ceTagName)!.counter++;
    // and define "inner" ce
    oldCustomElementAPI.define(`${ceTagName}-${ceCache.get(ceTagName)!.counter}`, ceClass as any);
  }
} as any;
