define([], function() {
    var isDefined = function(value) {
            return value !== void(0);
        };

    return SPA = {
        // Return the map of extracted DOM nodes having specific attribute
        // context can be a node or a DocumentFragment
        extract: function(attrName, context) {
            return Array.prototype.slice.call((context || document).querySelectorAll('['+attrName+']')).reduce(function(map, node) {
                map[node.getAttribute(attrName)] = node;
                node.remove();
                node.removeAttribute(attrName);
                return map;
            }, {});
        },

        template: function(dom, impl) {
            return function(data) {
                if (data) {
                    var node = document.contains(dom) ? dom : dom.cloneNode(true);

                    impl.call(node, data);

                    return node;
                }
            };
        },

        // Return parsed URI with map of query params
        uri: function(uri) {
            var a = document.createElement('a');
            a.href = uri;
            a.params = a.search.replace(/^\?/, '').split('&').reduce(function(obj, pair) {
                var tokens = pair.split('=');
                obj[tokens[0]] = decodeURIComponent(tokens[1]);
                return obj;
            }, {});
            return a;
        },

        // Allow deferred activation and visibility management
        UI: function(dom, onactivate) {
            return {
                activate: function() {
                    onactivate && onactivate.apply(dom, Array.prototype.slice.call(arguments));
                },
                show: function() { if (dom) dom.style.display = 'inherit'; },
                hide: function() { if (dom) dom.style.display = 'none'; },
            };
        },

        // Set of views with only one view active at a time
        // Views are lazily activated
        ViewStack: function() {
            var current,
                views = {};

            return {
                add: function(id, view) {
                    views[id] = {active: false, view: view};
                },
                switch: function(id) {
                    current && current.view.hide();
                    if (id && views[id]) {
                        current = views[id];
                        if (!current.active) {
                            current.view.activate();
                            current.active = true;
                        }
                        current.view.show();
                    }
                }
            };
        },

        // Apply provided list of style rules to the node
        styleNode: function(dom, style) {
            for (var property in style) {
                dom.style[property] = style[property];
            }
        },

        toggleAttribute: function(node, name, value) {
            if (value) {
                node.setAttribute(name, value);
            } else {
                node.removeAttribute(name);
            }
        },

        // Create a function that updates a node with given value
        // or display a loader if value is undefined
        loader: function(dom) {
            var overlay = document.createElement("div"),
                handler = function(value) {
                    if (isDefined(value)) {
                        overlay.parentNode && dom.removeChild(overlay);
                    } else {
                        dom.style.position = 'relative';
                        dom.appendChild(overlay);
                    }
                };

            SPA.styleNode(overlay, {
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                display: 'block',
                textAlign: 'center',
                backgroundImage: 'url(\'data:image/gif;base64,R0lGODlhEAAQAPIAAP////9mAP7awv6NQv9mAP6gYv6zgv69kiH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQACgABACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkEAAoAAgAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkEAAoAAwAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkEAAoABAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQACgAFACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQACgAGACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAAKAAcALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==\')',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundColor: '#fff',
            });

            handler();

            return handler;
        },

        // Create a function that can serve as a stream handler,
        // and which updates the given node with the stream values
        toNode: function(dom, update) {
            var handler = function(value) {
                    if (update) {
                        value = update.call(dom, value);
                    }
                    if (typeof value == 'string') {
                        dom.innerHTML = value;
                    } else if (value instanceof Element) {
                        // empty parent node
                        while (dom.firstChild) {
                            dom.removeChild(dom.firstChild);
                        }
                        value && dom.appendChild(value);
                    };
                };

            handler();

            return handler;
        },

        // Create the closured bindings of a tab-based navigation
        // observable -> tabs (view)
        toTabs: function(tabs) {
            return function(tabid) {
                if (tabid) {
                    var tab = SPA.select('a[href="#'+tabid+'"]', tabs);

                    if (tab) {
                        SPA.selectAll('>li', tabs).forEach(function(node) {
                            node.classList.remove('active');
                        });
                        tab.parentNode.classList.add('active');
                    }
                }
            };
        },
        // tabs (controller) -> update
        tabsEventListener: function(handler) {
            return function(e) {
                var target = e.target || e.srcElement,
                    href = target.getAttribute('href');

                href && handler(href.substr(1));
                e.stopPropagation();
                e.preventDefault();
            };
        },

        toTextNode: function(dom) {
            var text;
            return function(value) {
                if (text) {
                    dom.removeChild(text);
                    text = null;
                }
                if (value) {
                    dom.appendChild(text = document.createTextNode(value));
                }
            }
        },

        toNodeAttribute: function(dom, name) {
            return function(value) {
                dom.setAttribute(name, value);
            };
        },

        // Create a function that can serve as a collection stream handler
        // and which updates the given container with nodes created from items
        toNodes: function(dom, render) {
            return function(collection) {
                // empty parent node
                while (dom.firstChild) {
                    dom.removeChild(dom.firstChild);
                }
                // render each item as a DOM node and append it to parent
                if (collection && collection.forEach) {
                    // iteratively add nodes to provisional fragment
                    var fragment = document.createDocumentFragment();
                    collection.forEach(function(item) {
                        fragment.appendChild(render(item));
                    });
                    // transfer fragment to DOM
                    dom.appendChild(fragment);
                }
            }
        },

        toggle: function(dom, flag) {
            dom.style.display = flag ? 'block' : 'none';
        },

        delegate: function(selector, cb) {
            return function(e) {
                if (e.target && e.target.matches(selector)) {
                    cb.call(e.target, e);
              	}
            }
        },

        // Scoped query selector (TODO: :scope polyfill)
        // Return the first occurence found
        select: function(selector, scope) {
            return scope instanceof Element ? scope.querySelector(':scope '+selector) : document.querySelector(selector);
        },

        // Scoped query selector (TODO: :scope polyfill)
        // Return a true Array of all occurences found
        selectAll: function(selector, scope) {
            return Array.prototype.slice.call(scope instanceof Element ? scope.querySelectorAll(':scope '+selector) : document.querySelectorll(selector));
        },

        // Generate a fragment (hence avoiding page reflow) with provided HTML
        fragmentFromHtml: function(html) {
            var frag = document.createDocumentFragment(),
                tmp = document.createElement('body'),
                child;

            tmp.innerHTML = html;
            while (child = tmp.firstElementChild) {
                frag.appendChild(child);
            }

            return frag;
        },
    };
});
