import { extendComponent, sanitizeString, getAnimationClass } from '../reactive-web-components';

test('observedAttributes returns the right value', () => {
    class TestElement { }
    const propsArray = ['prop'];
    const myExtendedElement = extendComponent(TestElement, propsArray);
    expect(myExtendedElement.observedAttributes).toEqual(propsArray);
});

test('attributes to properties reflection - string', () => {
    class TestElement {}
    const value = 'value';
    TestElement.prototype.getAttribute = function() {
        return value;
    };
    TestElement.prototype.setAttribute = jest.fn();
    const testElement = new (extendComponent(TestElement, ['prop']))();
    expect(testElement.prop).toEqual(value);
    const newValue = 'new value';
    testElement.prop = newValue;
    expect(testElement.setAttribute).toBeCalledWith('prop', JSON.stringify(newValue));
});

test('attributes to properties reflection - number', () => {
    class TestElement {}
    const value = 1;
    TestElement.prototype.getAttribute = function() {
        return value.toString();
    };
    TestElement.prototype.setAttribute = jest.fn();
    const testElement = new (extendComponent(TestElement, ['prop']))();
    expect(testElement.prop).toEqual(value);
    const newValue = 2;
    testElement.prop = newValue;
    expect(testElement.setAttribute).toBeCalledWith('prop', JSON.stringify(newValue));
});

test('attributes to properties reflection - boolean', () => {
    class TestElement {}
    const value = true;
    TestElement.prototype.getAttribute = function() {
        return value.toString();
    };
    TestElement.prototype.setAttribute = jest.fn();
    const testElement = new (extendComponent(TestElement, ['prop']))();
    expect(testElement.prop).toEqual(value);
    const newValue = false;
    testElement.prop = newValue;
    expect(testElement.setAttribute).toBeCalledWith('prop', JSON.stringify(newValue));
    testElement.prop = value;
    expect(testElement.setAttribute).toBeCalledWith('prop', JSON.stringify(newValue));
});

test('attributes to properties reflection - objects', () => {
    class TestElement {}
    const value = {a: 'a'};
    TestElement.prototype.getAttribute = function() {
        return JSON.stringify(value);
    };
    TestElement.prototype.setAttribute = jest.fn();
    const testElement = new (extendComponent(TestElement, ['prop']))();
    expect(testElement.prop).toEqual(value);
    const newValue = false;
    testElement.prop = newValue;
    expect(testElement.setAttribute).toBeCalledWith('prop', JSON.stringify(newValue));
});

test('propertyChangedCallback() is called every time attributeChangedCallback() is called', () => {
    class TestElement { }
    TestElement.prototype.propertyChangedCallback = jest.fn();
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback();
    myExtendedElement.attributeChangedCallback();
    myExtendedElement.attributeChangedCallback();
    expect(myExtendedElement.propertyChangedCallback).toBeCalledTimes(3);
});

test('propertyChangedCallback() boolean properties are converted from string', () => {
    class TestElement { }
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function (name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", "false", "true");
    expect(oldValue).toBe(false);
    expect(newValue).toBe(true);
});

test('propertyChangedCallback() numeric properties are converted from string', () => {
    class TestElement { }
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function (name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", "1", "2");
    expect(oldValue).toBe(1);
    expect(newValue).toBe(2);
});

test('propertyChangedCallback() object properties are converted from string', () => {
    class TestElement { }
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function (name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", '{"old": 1}', '{"new": "2"}');
    expect(oldValue).toEqual({ old: 1 });
    expect(newValue).toEqual({ new: '2' });
});

test('propertyChangedCallback() string properties are untouched', () => {
    class TestElement { }
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function (name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", "old", "new");
    expect(oldValue).toBe('old');
    expect(newValue).toBe('new');
});

test('setState sets a new state', () => {
    class TestElement { }
    const myExtendedElement = new (extendComponent(TestElement))();
    const state = {a: 'a'};
    myExtendedElement.setState(state);
    expect(myExtendedElement.state).toEqual(state);
});

test('setState updates current state', () => {
    class TestElement { }
    const myExtendedElement = new (extendComponent(TestElement))();
    const state = {a: 'a'};
    myExtendedElement.state = state;
    const stateUpdate = {b: 'b'};
    myExtendedElement.setState(stateUpdate);
    expect(myExtendedElement.state).toEqual({...state, ...stateUpdate});
});

test('setState calls render', () => {
    class TestElement { }
    TestElement.prototype.render = jest.fn();
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.setState({});
    expect(myExtendedElement._render).toBeCalled();
});

test('registerComponent() registers the component', () => {
    class TestElement { }
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.registerComponent();
    expect(myExtendedElement._id !== undefined).toBe(true);
    expect(document._componentRegistry[myExtendedElement._id]).toEqual(myExtendedElement);
});

test('registerComponent() sets the disconnectedCallback to call unregisterComponent', () => {
    class TestElement { }
    TestElement.prototype.disconnectedCallback = jest.fn();
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.unregisterComponent = jest.fn();
    myExtendedElement.registerComponent();
    myExtendedElement.disconnectedCallback();
    expect(myExtendedElement.unregisterComponent).toBeCalled();
});

test('unregisterComponent() deletes the component entry from the componentRegistry', () => {
    class TestElement { }
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.registerComponent();
    myExtendedElement.unregisterComponent();
    expect(document._componentRegistry[myExtendedElement._id]).toBe(undefined);
});

test('render reset parameterRegistry', () => {
    class TestElement {
        constructor() {
            this.registerComponent();
        }
    }
    TestElement.prototype.render = function() {
    }
    const myExtendedElement = new (extendComponent(TestElement))();
    document._componentRegistry[myExtendedElement._id]._parameterRegistry = [1,2,3];
    myExtendedElement.render();
    expect(document._componentRegistry[myExtendedElement._id]._parameterRegistry.length).toBe(0);  
});

test('getHandlerRef', () => {
    class TestElement {
        constructor() {
            this.registerComponent();
        }
    }
    TestElement.prototype.handler = jest.fn();
    const param = 1;
    TestElement.prototype.render = function() {
        const inlineEventFunction = `(function(event) {${myExtendedElement.getHandlerRef(function handler() {}, param)}})({})`;
        eval(inlineEventFunction);
    }
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.render();
    expect(myExtendedElement.handler).toBeCalledWith({}, param);  
});

test('html', () => {
    document.createRange = function() {
        return {
            createContextualFragment: function() {}
        };
    };
    class TestElement {  }
    TestElement.prototype.componentWillUpdate = jest.fn();
    TestElement.prototype.componentDidUpdate = jest.fn();
    global.morphdom = jest.fn();
    const myExtendedElement = new (extendComponent(TestElement))();TestElement.prototype.componentWillUpdate = jest.fn();
    TestElement.prototype.componentDidUpdate = jest.fn();
    global.morphdom = jest.fn();
    
    myExtendedElement.html();
    expect(myExtendedElement.componentWillUpdate).toBeCalled();
    expect(global.morphdom).toBeCalled();
    expect(myExtendedElement.componentDidUpdate).toBeCalled();
});

test('render child component', () => {
    class TestElement {  }
    TestElement.prototype.querySelector = () => document.createElement('div');
    const myExtendedElement = new (extendComponent(TestElement))();
    expect(myExtendedElement.renderChildComponent()).toEqual('<div></div>');
});

test('randomize css class', () => {
    class TestElement {  }
    const myExtendedElement = new (extendComponent(TestElement))();
    const cssClass = 'foo';
    const randomizedClass = myExtendedElement.randomizeCssClass(cssClass);
    expect(randomizedClass).not.toEqual(cssClass);
    const randomizedClass2 = myExtendedElement.randomizeCssClass(cssClass);
    expect(randomizedClass2).toEqual(randomizedClass);
});

test('sanitizeString', () => {
    const string = '<script></script>';
    const sanitizedString = sanitizeString(string);
    expect(sanitizedString).toEqual('&lt;script&gt;&lt;/script&gt;');
});

test('getAnimationClass', () => {
    const cssClasses = ['base', 'progress', 'ended', 'reverse'];
    let isVisible = false;
    let wasVisible = false;
    expect(getAnimationClass(isVisible, wasVisible, cssClasses)).toEqual('base');
    isVisible = true;
    wasVisible = false;
    expect(getAnimationClass(isVisible, wasVisible, cssClasses)).toEqual('progress');
    isVisible = true;
    wasVisible = true;
    expect(getAnimationClass(isVisible, wasVisible, cssClasses)).toEqual('progress ended');
    isVisible = false;
    wasVisible = true;
    expect(getAnimationClass(isVisible, wasVisible, cssClasses)).toEqual('reverse');
});