# ExtendComponent
extendComponent adds some convenience methods to a custom element class in order to manage props and inline event handlers. 

### How to use it
Signature:
`extendComponent(MyComponent: class, propsArray: string[])`

It is used like this:
```javascript
window.customElements.define('my-custom-element', extendComponent(MyCustomElelment, ['prop1', 'prop2']));
```
or 
```javascript
window.customElements.define('my-custom-button', extendComponent(MyCustomButton, ['prop1', 'prop2']), {extends: button});
```

### What it does

#### Watch attributes and link attributes to properties
`extendComponent` takes care of some boilerplate code to watch for attributes change and to reflect attributes to properties:
- sets the `observedAttributes` method to return the `propsArray`.
- sets the getter and setters for every attribute in the `propsArray` in order to reflect attributes to properties and vice versa. It converts boolean, numbers and plain objects to and from string in the process.

### setState
`extendComponent` adds a `setState` method that updates the `state` property and calls the `render` methods (if there is one).

### Utilities to use inline events handler
Good ol' inline event handlers, like this one:
```html
<button onclick="clickHandler()"></button>
```
can be handy in writing declarative code, but they have a problem: they are executed when the event is triggered, so their scope is the global object and they loose any reference to `this`.
The solution, as suggested in [this article](https://css-tricks.com/reactive-uis-vanillajs-part-2-class-based-components/) is to create a global registry of components with a reference to every component registered in the page, in order to be able to call a component method event form the global scope. 

`extendComponent` create such registry and provides two methods:
- `registerComponent()` to register a component in the registry
- `getHandlerRef(handlerName: string)` to get e reference to a component's method to pass as an inline event handler

#### Usage
First register the component
```javascript
    constructor() {
        super();
        this.registerComponent();
    }
```
then define an event handler as a component's method
```javascript
    handleToggleSearch() {
        //Handle toggle search
    }
```
finnally use `this.getHandlerRef` to get a reference to the method to pass as an inline event handler 
```javascript
    render(warrantyTypes) {
        this.innerHTML = /*html*/`<form class="searchWrapper">
            ${ToggleSearch(this.getHandlerRef(this.handleToggleSearch))}
        `;
    }
```
`ToggleSearch` being a functional component like this:
```javascript
export default (handleClick) => /*html*/`
    <label class="d-flex align-items-center mt-3">
        <span class="switch switch-3d switch-secondary mr-2">
            <input id="toggleAdvancedSearch" type="checkbox" class="switch-input" onclick="${handleClick}">
            <span class="switch-label"></span>
            <span class="switch-handle"></span>
        </span>
        <span>Ricerca avanzata</span>
    </label>`;
```