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

export function extendComponent(clazz, attributes = []) {
    if (!document.componentRegistry) {
        document.componentRegistry = { };
    }
    if (!document.nextId) {
        document.nextId = 0;
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
        this.state = this.state ? {...this.state, stateUpdate} : {...stateUpdate};
        if (typeof this.render === 'function') {
            this.render();
        }
    }

    clazz.prototype.registerComponent = function() {
        this._id = ++document.nextId;
        document.componentRegistry[this._id] = this;

        this.disconnectedCallback = function() {
            this.unregisterComponent();
        }
    }

    clazz.prototype.unregisterComponent = function() {
        delete document.componentRegistry[this._id];
    }

    let paramId = 0;
    function registerParameter(componentId, handlerName) {
        return function returnPramater(param) {
            paramId += 1;
            document.componentRegistry[componentId][handlerName][`param_${paramId}`] = param;
            return `document.componentRegistry[${componentId}]['${handlerName}']['${`param_${paramId}`}']`;
        }
    }

    clazz.prototype.getHandlerRef = function(handler, ...params) {
        return `return document.componentRegistry[${this._id}]['${handler.name}'](event, ${params.map(registerParameter(this._id, handler.name)).join(',')})`;
    }   

    clazz.prototype.html = function(newDomStr) {
        const newDom = parser.parseFromString(newDomStr, 'text/html');
        morphdom(this, newDom.body, {childrenOnly: true});
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