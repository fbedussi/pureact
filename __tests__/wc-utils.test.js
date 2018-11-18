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