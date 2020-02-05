console.log('Hello world-Z!');

// we need to monkey patch CustomElements API

// we maintain a counter for each customElement and
// we will always generate a wrapper on the fly, that is passing
// for the time being nothing but the actual tag itself

const ceCache = new Map<string, { counter: number; ceClass: object; }>();

function createWrapperComponent(orgTagName: string) {
  // we dynamically create a customElement by returning an anon class
  return class extends HTMLElement {

    private _realElementRef: HTMLElement | undefined;

    constructor() {
      super();
    }

    connectedCallback() {
      console.log('Wrapper for ', orgTagName, 'added!');
      this.attachShadow({ mode: 'open' });
      // console.log('assignedElements:', slotRef.assignedElements());
      this.shadowRoot!.innerHTML = this.render();
      this._realElementRef = this.shadowRoot!.querySelector(`${orgTagName}-${this.currentCe!.counter}`) as HTMLElement;
      // we need to register an slotchanged event handler for the slot, once the slot contents changes,
      // change it in the real deal...
      const slotRef = this.shadowRoot!.querySelector('slot') as HTMLSlotElement;
      slotRef.addEventListener('slotchanged', ()=> {
        console.log('Slot content changed...')
      });
      // for the time being we just support text content
      // TODO add at least some minor typeguards...
      const hasFirstTextNode = slotRef.assignedNodes()[0] as Text;
      if (hasFirstTextNode) {
        console.log('Got me text', hasFirstTextNode);
        // this should not work, but in the end it does :)
        this._realElementRef.innerText = hasFirstTextNode.wholeText;
      }
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
    whenDefined(ceTagName: string) {
      // basically this boils down to returning whether the wrapper as been setup
      return oldCustomElements.whenDefined(ceTagName);
    },
    get(ceTagName: string) {
      // all tags that we manage are wrapped; those that we do not manage
      // which should be none, because we need to be loaded _early_ are
      // resort to the original registry
      if (ceCache.get(ceTagName)) {
        // we resort to undefined, because our managed CEs would that way only return the wrapper
        // because the far most often usage of ce.get() is whether to define an element or not,
        // we deliberately return undefined, because we can _re-define_ custom elements
        return undefined;
      } else {
        return oldCustomElements.get(ceTagName);
      }
    },

  }),
});
