console.log('CustomElementLoaderPrototype is ev0l');

// we need to monkey patch CustomElements API

// we maintain a version for each customElement and
// we will always generate a wrapper on the fly, that is passing
// for the time being nothing but the actual tag itself

const ceCache = new Map<string, { version: number; ceClass: object; }>();

// whitelist ces, that do not get the special treatment...
const CE_WHITELIST: string[] = [
];

function createWrapperComponent(orgTagName: string) {
  // we dynamically create a customElement by returning an anon class
  return class extends HTMLElement {

    private _realElementRef: HTMLElement | undefined;

    constructor() {
      super();
    }

    connectedCallback() {
      console.log('Wrapper for ', orgTagName, 'added!');
      this.attachShadow({mode: 'open'});
      this.shadowRoot!.innerHTML = this.render();
      this._realElementRef = this.shadowRoot!.querySelector(`${orgTagName}-${this.currentCe!.version}`) as HTMLElement;
      const slotRef = this.shadowRoot!.querySelector('slot') as HTMLSlotElement;
      // TODO: this seems to be a race condition
      // slotRef.addEventListener('slotchanged', ()=> {
      //   console.log('Slot content changed...')
      // });
      // for the time being we just support text content
      // TODO add at least some minor typeguards...
      const hasFirstTextNode = slotRef.assignedNodes()[0] as Text;
      if (hasFirstTextNode) {
        // this should not work, but in the end it does :)
        this._realElementRef.innerText = hasFirstTextNode.wholeText;
        // -> https://github.com/w3c/webcomponents/issues/753
        // we set the TextNode to empty... because we cannot style it...
        // TODO: this does not really work for the time being :(
        // hasFirstTextNode.data = '';
      }
    }

    disconnectedCallback() {
      console.log('Wrapper for ', orgTagName, 'removed!');
    }

    get currentCe() {
      return ceCache.get(orgTagName);
    }


    render() {
      return `<${orgTagName}-${this.currentCe!.version}/><slot></slot>`;
    }


  };
}

// old ref
const oldCustomElements = customElements;
// and now be gone by using Object.defineProperty on window, because simply overwriting does not work :(
Object.defineProperty(window, 'customElements', {
  get: () => ({
    define(ceTagName: string, ceClass: object) {
      // obey whitelist
      // @ts-ignore
      if (CE_WHITELIST.includes(ceTagName)) {
        console.log('Whitelisted CE:', ceTagName);
        // @ts-ignore
        oldCustomElements.define(ceTagName, ceClass);
      } else {
        console.log('Want to define', ceTagName, 'with', ceClass);
        // make a lookup for ceTagName in cache if version is not defined, zero it
        if (!ceCache.get(ceTagName)) {
          ceCache.set(ceTagName, {version: 1, ceClass});
          // and define initial wrapper _ONCE_
          oldCustomElements.define(ceTagName, createWrapperComponent(ceTagName));
          // and actual impl
          oldCustomElements.define(`${ceTagName}-${ceCache.get(ceTagName)!.version}`, ceClass as any);
        } else {
          console.log('Add another version of the truth');
          // it already exists so just increase the version and define a new instance for it
          // increase version
          ceCache.get(ceTagName)!.version = ceCache.get(ceTagName)!.version + 1;
          // and define "inner" ce
          oldCustomElements.define(`${ceTagName}-${ceCache.get(ceTagName)!.version}`, ceClass as any);
        }
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
    rollback(ceTagName: string, version?: number): number | undefined {
      // rollback a ceTagName to either the previous version or a specific one...
      const managedTag = ceCache.get(ceTagName);
      if (managedTag) {
        // either we rollback to a specific version that gets passed
        if (version && version < managedTag.version) {
          managedTag.version = version;
          return version;
        } else if (version && version > managedTag.version) {
          return undefined;
        } else {
        // or we rollback to the last version
          managedTag.version = managedTag.version - 1;
          return managedTag.version;
        }
      } else {
        return undefined;
      }
    }
  })
});
