# Reactive Web Components

Reactive Web Components (aka RWC) is a thiny library (less than 200 lines of code, 1.4kb minified and zipped) to use the [reactive programming paradigm](https://en.wikipedia.org/wiki/Reactive_programming) with web components. 
The actual DOM manipulation is handled by [morphdom](https://github.com/patrick-steele-idem/morphdom) a lightweight and super fast DOM diffing/patching library that works with actual DOM, no virtual DOM involved. Morphdom is at the core of [marko.js](https://markojs.com/) the library used by Ebay. 

RWC has performance similar to React (same fps, slightly more memory usage), but offers several advantages over a virtual DOM library like React:
- minimal footprint (1.4kb + 2.6kb for morphodom, minified and zipped)
- works with standard JavaScript features, no fancy syntax to learn, no update hell, no framework obsolescence
- just one tiny dependency, this means the maximum of transparency and no security threaths hidden in the dependency tree
- working with actual DOM means a super easy integration with other libraries that perform DOM manipulation, like jQuery plugins, for instance 

Caveats:
- No automatic input sanitification. The library provides a `sanitizeString` function, but it must be used manually. 

[Demo](https://fbedussi.github.io/store-locator-web-component/) - [Demo Code](https://github.com/fbedussi/store-locator-web-component) 

## Getting started

Write a custom element class in the usual way, then:
- in the constructor register the component calling `this.registerComponent()`, this is necessary to use inline event handlers 
- wrap the class with the `extendComponent` function when you define the custom element:
```javascript
class MyCustomElement extends HTMLElement {
    constructor() {
        super();
        this.registerComponent();
    }

    //Class implementation
}

window.customElements.define('my-custom-element', extendComponent(MyCustomElement));
```

Since `extendComponent` is just a function that takes a class and returns a class it can be used with any HTML Element Class:
```javascript
class MyCustomButton extends HTMLButtonElement {
    constructor() {
        super();
        this.registerComponent();
    }

    //Class implementation
}
window.customElements.define('my-custom-button', extendComponent(MyCustomButton), {extends: button});
```

**N.B. Morphdom must be included separately as a global function, e.g.:**
```html
<script src="https://cdn.jsdelivr.net/npm/morphdom@2.3.3/dist/morphdom.min.js"></script>
```
This is by design, in order to allow you to include a regular version, or a minified or a customized one and to let you inspect what's inside the dependency. Total control and transparency it the matra of this project.

## Watch for props change and reflect attributes to properties
`extendComponent` takes as second argument an array thats specifies the attributes to watch for change: `extendComponent(MyComponent: class, propsArray: string[])`

It is used like this:
```javascript
window.customElements.define('my-custom-element', extendComponent(MyCustomElelment, ['prop1', 'prop2']));
```

These attributes are automatically reflected to properties with the same name, and viceversa. 
**N.B. no conversion is made between hyphenated synthax typical of HTML attributes and camel case syntax typical of JS properties.**
When reflecting attributes to properties, and the other way around, HTML attributes values (that are always strings) are automatically casted to the right type, while properties values are casted to strings.
**N.B. boolean attributes are handled in the form `attribute="true"` instead of regular HTML boolean `attribute` with no value** 

When the `propsArray` is passed `extendComponent` automatically creates getters and setters for every property and automatically sets the `observedAttributes` static method on the class to return the `propsArray`. 


## Render a component

To render a component a `render` method must be defined, receiving the state as argument. Inside the method is possible to call the `html` method that uses [morphdom](https://github.com/patrick-steele-idem/morphdom) to update the DOM in a non destructive and very efficient way. 

**N.B. morphdom must be included separately as a global function, e.g.:**
```html
<script src="https://cdn.jsdelivr.net/npm/morphdom@2.3.3/dist/morphdom.min.js"></script>
```

the `html` method must receive a string (tipically a template literal string) that represents the DOM to be rendered.  

```javascript
render() {
    this.html(`<button onclick="${this.getHandlerRef(this.closePanel)}">
            <span>${LeftArrow()}</span>
            <span class="text">close</span>
        </button>`);
}
```
N.B. Pay attention not to leave any spaces at the beginning of the string. 

To have synthax highlight inside template literal string use a plugin for your IDE/Editor, e.g. [ES6 String HTML](https://marketplace.visualstudio.com/items?itemName=hjb2012.vscode-es6-string-html) for VS Code.

The HTML string can contain multiple children, it is not mandatory to have just one parent:
```javascript
this.html(`<div>
                <!-- content -->    
            </div>
            <ul>
                <!-- content -->    
            </ul>`);
    }
```

To render multiple elements from an array use `map` to convert the array into an array of strings, then `join('')` to render the final HTML string:
```javascript
this.html(`<ul>
    ${stores.map((store) => `<li>
        <div>${store.name}</div>
    </li>`}).join('')}
</ul>`);
```

## State management

To use a component's state just initialize a `state` property in the class constructor:
```javascript
constructor() {
    super();
    this.state = {
        //state definition
    }
}
```
Then, to update the state and rerender the component call the `setState` method passing the (partial) state update.

RWC can be used with any global state manager, like Redux. State change can be observed inside the `connectedCallback` method. To avoid unnecessary rerendering is better to watch for a [partial state change](https://redux.js.org/faq/store-setup#how-do-i-subscribe-to-only-a-portion-of-the-state-can-i-get-the-dispatched-action-as-part-of-the-subscription):  
```javascript
connectedCallback() {
    subscribePartialState('stores', (state) => {
        this.render(state.stores);
    });
}
```

## Inline events handler

Good ol' inline event handlers, like this one:
```html
<button onclick="clickHandler()"></button>
```
can be handy in writing declarative code, but they have a problem: they are executed when the event is triggered, so their scope is the global object and they loose any reference to `this`.
The solution, as suggested in [this article](https://css-tricks.com/reactive-uis-vanillajs-part-2-class-based-components/) is to create a global registry of components with a reference to every component registered in the page, in order to be able to call a component method event form the global scope. 

`extendComponent` create such registry and provides two methods:
- `registerComponent()` to register a component in the registry
- `getHandlerRef(handlerName: string)` to get e reference to a component's method to pass as an inline event handler

First register the component
```javascript
    constructor() {
        super();
        this.registerComponent();
    }
```
then define an event handler as a component's method
```javascript
    handleToggle() {
        //Handle toggle search
    }
```
finnally use `this.getHandlerRef` to get a reference to the method to pass as an inline event handler 
```javascript
    render() {
        this.html(`<form class="searchWrapper">
            <button onclick="${this.getHandlerRef(this.handleToggle)}">toggle</button>
        `);
    }
```

you can pass any number of arguments to events handler:
```javascript
<ul>
    ${storeTypes.map((storeType) => {
        return `<li>
                <button class="storeTypeBtn" 
                    onclick="${this.getHandlerRef(this.handleFilterClick, storeType)}">
                    <span class="icon">x</span>    
                    <span class="text">${storeType.name}</span>
                </button>
            </li>
        `
    }).join('')}
</ul>
```

the handler will receive those arguments, plus the `event` object as first parameter: 
```javascript
handleFilterClick(event, storeType) {
    dispatch(toggleStoreTypeAction(storeType.id));
}
```

## Functional Stateless Component

Functional stateless components are just regular functions that take props and return an HTML string:

```javascript
export default (handleClick) => `<label>
        <input id="toggleAdvancedSearch" type="checkbox" onclick="${handleClick}">
        <span>Advanced Search</span>
    </label>`;
```


## Child Component

To render a child component:
- just drop it in, if it is a functional stateless component (`SearchIcon` in the example below)
- if it is a custom element, wrap the custom element tag it in the `renderChildComponent` method (`search-suggestion` in the example below). This is necessary bacause the parent component rerendering will otherwise reinitialize the child component and destroy its internal state:
```javascript
 render(searchTerm) {
        this.html(`<div>
            <label for="searchInput" >Search a store</label>
            <div>
                ${SearchIcon()}
                <div>
                    <input id="searchInput" type="text" placeholder="Search..." oninput="${`document._componentRegistry['${this._id}'].handleInput(event)`}" value="${searchTerm}"/>
                    ${this.renderChildComponent('search-suggestions')}
                </div>
            </div>
        </div>`);
    }
```

## CSS in JS

To render CSS via JS just include a `<style>` node in the HTML string passed to the `html` method:
```javascript
this.html(`
            <style>
                filter-panel {
                    padding: var(--padding);
                }
                .filter-panel_toggleBtn {
                    display: inline-flex;
                    align-items: center;
                }
                .filter-panel_toggleBtn_text {
                    margin-right: 0.5rem;
                }
            </style>
            <div class="filter-bar_header">
                <!--...-->
            </div>`);
    }
```

To encapsulate the CSS in the component generate a unique class name with `randomizeCssClass`:
```javascript
render(stores) {
        const storeNameCssClass = this.randomizeCssClass('storeName');
        this.html(`<style>
                .${storeNameCssClass} {
                    margin-bottom: 0.5em;
                }
            </style>
            <ul>
                ${stores
                    .map((store, i) => /*html*/`
                        <li class="${storeNameCssClass}">
                            ${store.name}
                        </li>`).join('')}
            </ul>
        `;
    }
```

## Animations

RWC provides `getAnimationClass(currentState: boolean, prevState: boolean, classList: string[]): string` to choose the class to apply the right CSS animation, based on current and previous state

classList is an array with 4 values in this order:

0. base state
1. progress animation
2. animation ended state
3. reverse animation

```javascript
const animationClass = getAnimationClass(isActive, wasActive, ['invisible', 'fade-in', 'visible', 'fade-out']);
return `<li>
        <button class="storeTypeBtn" 
            <span class="icon ${animationClass}">x</span>    
            <span class="text">${storeType.name}</span>
        </button>
    </li>`;
```
