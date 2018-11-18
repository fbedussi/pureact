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
    }

    clazz.prototype.getHandlerRef = function(handlerName) {
        return `document.componentRegistry[${this._id}]['${handlerName.name}']()`;
    }   

    return clazz;
}