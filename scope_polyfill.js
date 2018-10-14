"use strict";

(function() {
    if (!HTMLElement.prototype.querySelectorAll) {
        throw new Error('rootedQuerySelectorAll: This polyfill can only be used with browsers that support querySelectorAll');
    }

    // A temporary element to query against for elements not currently in the DOM
    // We'll also use this element to test for :scope support
    let container = document.createElement('div');

    // Check if the browser supports :scope
    try {
        // Browser supports :scope, do nothing
        container.querySelectorAll(':scope *');
    }
    catch (e) {
        // Match usage of scope
        let scopeRE = /:scope/gi;

        // Overrides
        let overrideNodeMethod = (prototype, methodName)=>{
            // Store the old method for use later
            let oldMethod = prototype[methodName];

            // Override the method
            prototype[methodName] = function(query) {
                let nodeList,
                    gaveId = false,
                    gaveContainer = false;

                if (query.match(scopeRE)) {

                    if (!this.parentNode) {
                        // Add to temporary container
                        container.appendChild(this);
                        gaveContainer = true;
                    }

                    let parentNode = this.parentNode;

                    if (!this.id) {
                        // Give temporary ID
                        this.id = 'rootedQuerySelector_id_'+(new Date()).getTime();
                        gaveId = true;
                    }

                    query = query.replace(scopeRE, '#'+this.id);

                    // Find elements against parent node
                    nodeList = oldMethod.call(parentNode, query);

                    // Reset the ID
                    if (gaveId) {
                        this.id = '';
                    }

                    // Remove from temporary container
                    if (gaveContainer) {
                        container.removeChild(this);
                    }

                    return nodeList;
                }
                else {
                    // No immediate child selector used
                    return oldMethod.call(this, query);
                }
            };
        };

        // Browser doesn't support :scope, add polyfill
        overrideNodeMethod(HTMLElement.prototype, 'querySelector');
        overrideNodeMethod(HTMLElement.prototype, 'querySelectorAll');
    }
}());
