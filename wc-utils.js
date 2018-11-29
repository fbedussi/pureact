var parser = new DOMParser();

function convertFromString(attribute) {
    if (attribute === 'true') {
        return true;
    }

    if (attribute === 'false') {
        return false;
    }

    const num = Number(attribute); 

    if (!isNaN(num)) {
        return num;
    }

    try {
        const obj = JSON.parse(attribute);
        return obj;
    } catch(e) {
        return attribute;
    }
}

function convertToString(attribute) {
    if (attribute === true) {
        return 'true';
    }

    if (attribute === false) {
        return 'false';
    }

    if (!isNaN(attribute)) {
        return attribute.toString();
    }

    try {
        const obj = JSON.stringify(attribute);
        return obj;
    } catch(e) {
        return attribute;
    }
}

var nextId = 0;
export function extendComponent(clazz, attributes = []) {
    if (!document._componentRegistry) {
        document._componentRegistry = { };
    }
    
    Object.defineProperty(clazz, 'observedAttributes', { get: function() { return attributes; } });
    attributes.forEach((attribute) => {
        Object.defineProperty(
            clazz.prototype, 
            attribute, 
            { 
                get: function() { 
                    const attr = this.getAttribute(attribute);
                    return convertFromString(attr);
                }, 
                set: function(newValue) { 
                    const convertedAttribute = convertToString(newValue);
                    return this.setAttribute(attribute, convertedAttribute); 
                } 
            });
    });

    clazz.prototype.attributeChangedCallback = function(name, oldValue, newValue) {
        if (typeof clazz.prototype.propertyChangedCallback === 'function') {
            clazz.prototype.propertyChangedCallback.call(this, name, convertFromString(oldValue), convertFromString(newValue));
        }
    }

    clazz.prototype.setState = function(stateUpdate) {
        this.state = this.state ? {...this.state, ...stateUpdate} : {...stateUpdate};
        this.render(this.state);
    }

    clazz.prototype.registerComponent = function() {
        this._id = ++nextId;
        document._componentRegistry[this._id] = this;

        this.disconnectedCallback = function() {
            this.unregisterComponent();
        }
    }

    clazz.prototype.unregisterComponent = function() {
        delete document._componentRegistry[this._id];
    }

    function registerParameter(componentId) {
        return function returnPramater(param) {
            document._componentRegistry[componentId]._parameterRegistry.push(param);
            const paramIndex = document._componentRegistry[componentId]._parameterRegistry.length - 1;
            return `document._componentRegistry[${componentId}]._parameterRegistry[${paramIndex}]`;
        }
    }
    
    clazz.prototype.getHandlerRef = function(handler, ...params) {
        return `return document._componentRegistry[${this._id}]['${handler.name}'](event${params.length ? ', ' + params.map(registerParameter(this._id)).join(',') : ''})`;
    }   

    clazz.prototype.resetParameterRegistry = function() {
        if (!this._id || !document._componentRegistry) {
            return;
        }
        document._componentRegistry[this._id]._parameterRegistry = [];
    }

    clazz.prototype._render = clazz.prototype.render;

    clazz.prototype.render = function(...args) {
        this.resetParameterRegistry();
        if (typeof this._render === 'function') {
            this._render(...args);
        }
    }

    clazz.prototype.html = function(newDomStr) {
        const newDom = parser.parseFromString(newDomStr, 'text/html');
        morphdom(this, newDom, {childrenOnly: true});
    }

    clazz.prototype.renderChildComponent = function(componentTag) {
        const component = new (window.customElements.get(componentTag))();
        component.render()
        return component.outerHTML;
    }

    return clazz;
}

//classList is an array with 4 values in this order:
//0 - base state
//1 - progress animation
//2 - animation ended state
//3 - reverse animation
export function getAnimationClass(currentState, prevState, classList) {
    if (currentState) {
        return prevState ? classList[2] : classList[2] + ' ' + classList[1];
    } else {
        return prevState ? classList[2] + ' ' + classList[3] : classList[0];
    }
}