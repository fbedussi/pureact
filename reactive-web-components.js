function parseDomString(domStr) {
    return document.createRange().createContextualFragment(domStr);
}

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

        this._disconnectedCallback = this.disconnectedCallback;
        
        this.disconnectedCallback = function(...args) {
            this.unregisterComponent();
            
            if (typeof this._disconnectedCallback === 'function') {
                this._disconnectedCallback(...args)
            }
        }
    }

    clazz.prototype.unregisterComponent = function() {
        delete document._componentRegistry[this._id];
    }

    function registerParameter(componentId) {
        return function returnPrameter(param) {
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
        if (typeof this.componentWillUpdate === 'function') {
            this.componentWillUpdate();
        }

        morphdom(this, parseDomString(newDomStr), {childrenOnly: true});

        if (typeof this.componentDidUpdate === 'function') {
            this.componentDidUpdate();
        }
    }

    clazz.prototype.renderChildComponent = function(componentTag) {
        let component = this.querySelector(componentTag);
        
        if (!component) {
            component = new (window.customElements.get(componentTag))();
            component.render();
        }

        return component.outerHTML;
    }

    clazz.prototype.randomizeCssClass = function(cssClass) {
        if (!this._cssClasses) {
            this._cssClasses = {};
        }
        if (this._cssClasses[cssClass]) {
            return this._cssClasses[cssClass]
        }
        this._cssClasses[cssClass] = cssClass + '_' + getRandomString(6);
        return this._cssClasses[cssClass];
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
        return prevState ? classList[1] + ' ' + classList[2] : classList[1];
    } else {
        return prevState ? classList[3] : classList[0];
    }
}

function getRandomString(length) {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz";
  
    for (var i = 1; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  
    return text;
}

export function sanitizeString(str) {
	var temp = document.createElement('div');
	temp.textContent = str;
	return temp.innerHTML;
};