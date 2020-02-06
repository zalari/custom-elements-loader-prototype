# Custom-Element-Loader-Prototype

## Intro
This is a rough-but-working prototype, that showcases loading CustomElements via `script` tags _as often_ as you like and it will re-apply the code by internally _monkey-patching_ the `CustomElements` API (for your own good!).

This can be used to either conditionally reload composable code pieces that are either natively written as _Custom Elements_ (vulgo **Web Components**) or are wrapped as those or simply reload them, **without** a reload of the hosting web page.

Think of it as _production HotModuleReplacement_; but without _augmenting_ your code, nor maintaining a deep reference to use code paths.

This will happily work together with a CDN like [Unpkg.com](https://unpkg.com) because the code gets loaded via `script tags` there is also no problem with the _Same-Origin-Policy_ at all. Even _Content-Secure-Policy_ should be no problem, if you have proper _white-lists_ in place.

## Example
* basically you have to _just_ load the custom-element-loader-prototype **as early as possible** and then _things should just work_(**TM**):
  * _add_ the markup for your _CustomElement_ to your code
  * _load_ your _CustomElement_ the way you want to load it and _define_ it: `CustomElements.define()`...
  * _rinse_ and _repeat_, i.e. repeat the above steps but with an _updated_ version of your code and remove and add the initial markup for your custom element in your app _dynamically_

* see [src/examples/simple-static.html](src/examples/simple-static.html) for a simple example with a CustomElement fetched via [unpkg](https://unpkg.com/)

## Known Limitations
* currently only tested in a most most recentish Chrome (but the actual technique should even work with Polyfills for the Custom Element API)
* not-memory optimized, meaning it is unlikely whether _old_ versions of a Custom Element are properly _garbage-collected_
* no _event-rerouting_ this is in theory possible via _monkey-patching_ `.addEventListener` and `.dispatchEvent` as well; but I'd suggest using an indirection mechanism (read: message bus) for inter-component communication.

## TODOs:
* write at least basic tests, that are running the _manual integration tests_(**TM**) _automatically_ via [Puppeteer](https://github.com/puppeteer/puppeteer)
  * test for good impl of CE API
* actually do not abuse TS anymore:
  * get rid of `any`
  * use DOM Interfaces for contracts
* re-route attributes
* re-route slot projections
* do some naive comparison whether new version of CE is the same as old one...
