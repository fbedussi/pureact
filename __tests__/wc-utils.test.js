import {extendComponent} from '../wc-utils';

test('setState calls render', () => {
    class TestElement {}
    TestElement.prototype.render = jest.fn();
    const myExtendedElement = new (extendComponent(TestElement))();
    console.log(myExtendedElement);
    myExtendedElement.setState({});
    expect(myExtendedElement.render).toBeCalled();
});

test('observedAttributes returns the right value', () => {
    class TestElement {}
    const propsArray = ['prop'];
    const myExtendedElement = extendComponent(TestElement, propsArray);
    expect(myExtendedElement.observedAttributes).toEqual(propsArray);
});

test('propertyChangedCallback() is called every time attributeChangedCallback() is called', () => {
    class TestElement {}
    TestElement.prototype.propertyChangedCallback = jest.fn();
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback();
    myExtendedElement.attributeChangedCallback();
    myExtendedElement.attributeChangedCallback();
    expect(myExtendedElement.propertyChangedCallback).toBeCalledTimes(3);
});

test('propertyChangedCallback() boolean properties are converted from string', () => {
    class TestElement {}
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function(name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", "false", "true");
    expect(oldValue).toBe(false);
    expect(newValue).toBe(true);
});

test('propertyChangedCallback() numeric properties are converted from string', () => {
    class TestElement {}
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function(name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", "1", "2");
    expect(oldValue).toBe(1);
    expect(newValue).toBe(2);
});

test('propertyChangedCallback() object properties are converted from string', () => {
    class TestElement {}
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function(name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", '{"old": 1}', '{"new": "2"}');
    expect(oldValue).toEqual({old: 1});
    expect(newValue).toEqual({new: '2'});
});

test('propertyChangedCallback() string properties are untouched', () => {
    class TestElement {}
    let oldValue;
    let newValue;
    TestElement.prototype.propertyChangedCallback = function(name, ov, nv) {
        oldValue = ov;
        newValue = nv;
    };
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.attributeChangedCallback("test", "old", "new");
    expect(oldValue).toBe('old');
    expect(newValue).toBe('new');
});

test('registerComponent() registers the component', () => {
    class TestElement {}
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.registerComponent();
    expect(myExtendedElement._id !== undefined).toBe(true);
    expect(document.componentRegistry[myExtendedElement._id]).toEqual(myExtendedElement);
});

test('registerComponent() sets the disconnectedCallback to call unregisterComponent', () => {
    class TestElement {}
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.unregisterComponent = jest.fn();
    myExtendedElement.registerComponent();
    myExtendedElement.disconnectedCallback();
    expect(myExtendedElement.unregisterComponent).toBeCalled();
});

test('unregisterComponent() deletes the component entry from the componentRegistry', () => {
    class TestElement {}
    const myExtendedElement = new (extendComponent(TestElement))();
    myExtendedElement.registerComponent();
    myExtendedElement.unregisterComponent();
    expect(document.componentRegistry[myExtendedElement._id]).toBe(undefined);
});