/**
 * @license The MIT License (MIT)
 * @copyright Stanislav Kalashnik <darkpark.main@gmail.com>
 */

/* eslint no-path-concat: 0 */
/* eslint complexity: [error, 37] */
/* eslint max-lines-per-function: 1 */
/* eslint no-fallthrough: 1 */
/* eslint complexity: 1 */

'use strict';

var Component = require('stb-component'),
    keys      = require('stb-keys');


/**
 * Mouse click event.
 *
 * @event module:stb/ui/list~List#click:item
 *
 * @type {Object}
 * @property {Element} $item clicked HTML item
 * @property {Event} event click event data
 */


/**
 * Base list implementation.
 *
 * Each data item can be either a primitive value or an object with these fields:
 *
 *  Name    | Description
 * ---------|-------------
 *  value   | actual cell value to render
 *  mark    | is it necessary or not to render this cell as marked
 *
 * @constructor
 * @extends Component
 *
 * @param {Object}   [config={}]          init parameters (all inherited from the parent)
 * @param {Array}    [config.data=[]]     component data to visualize
 * @param {function} [config.render]      method to build each grid cell content
 * @param {function} [config.navigate]    method to move focus according to pressed keys
 * @param {number}   [config.size=5]      amount of visible items on a page
 * @param {number}   [config.viewIndex=0] move view window to this position on init
 * @param {number}   [config.focusIndex]  list item index to make item focused (move view window to this position)
 * @param {boolean}  [config.cycle=true]  allow or not to jump to the opposite side of a list when there is nowhere to go next
 * @param {boolean}  [config.scroll=null] associated ScrollBar component link
 * @param {Object}   [config.provider]    data provider
 *
 * @fires module:stb/ui/list~List#click:item
 */
function List ( config ) {
    // current execution context
    //var self = this;

    // sanitize
    config = config || {};

    console.assert(typeof this === 'object', 'must be constructed via new');

    if ( DEVELOP ) {
        if ( typeof config !== 'object' ) {
            throw new Error(__filename + ': wrong config type');
        }
        if ( config.type && Number(config.type) !== config.type ) {
            throw new Error(__filename + ': config.type must be a number');
        }
    }

    /**
     * Link to the currently focused DOM element.
     *
     * @type {Element}
     */
    this.$focusItem = null;

    /**
     * Position of the visible window to render.
     *
     * @type {number}
     */
    this.viewIndex = null;

    /**
     * Component data to visualize.
     *
     * @type {Array}
     */
    this.data = [];

    /**
     * Component orientation.
     *
     * @type {number}
     */
    this.type = this.TYPE_VERTICAL;

    /**
     * Amount of visible items on a page.
     *
     * @type {number}
     */
    this.size = 5;

    /**
     * Allow or not to jump to the opposite side of a list when there is nowhere to go next.
     *
     * @type {boolean}
     */
    this.cycle = false;

    /**
     * Associated ScrollBar component link.
     *
     * @type {ScrollBar}
     */
    this.scroll = null;

    // horizontal or vertical
    if ( config.type ) {
        // apply
        this.type = config.type;
    }

    /**
     * Associated data provider
     *
     * @type {Provider}
     */
    this.provider = null;

    if ( this.type === this.TYPE_HORIZONTAL ) {
        config.className += ' horizontal';
    }

    //config.className += ' theme-main';

    // parent constructor call
    Component.call(this, config);

    // component setup
    this.init(config);

    // custom navigation method
    //if ( config.navigate ) {
    //    if ( DEVELOP ) {
    //        if ( typeof config.navigate !== 'function' ) { throw new Error(__filename + ': wrong config.navigate type'); }
    //    }
    //    // apply
    //    this.navigate = config.navigate;
    //}

    // navigation by keyboard
    //this.addListener('keydown', this.navigate);

    // navigation by mouse
    //this.$body.addEventListener('mousewheel', function ( event ) {
    //    // scrolling by Y axis
    //    if ( self.type === self.TYPE_VERTICAL && event.wheelDeltaY ) {
    //        self.move(event.wheelDeltaY > 0 ? 38 : keys.down);
    //    }
    //
    //    // scrolling by X axis
    //    if ( self.type === self.TYPE_HORIZONTAL && event.wheelDeltaX ) {
    //        self.move(event.wheelDeltaX > 0 ? 37 : 39);
    //    }
    //});
}


// inheritance
List.prototype = Object.create(Component.prototype);
List.prototype.constructor = List;

// set component name
List.prototype.name = 'mag-component-list';

List.prototype.TYPE_VERTICAL   = 1;
List.prototype.TYPE_HORIZONTAL = 2;


/**
 * Fill the given item with data.
 *
 * @param {Element} $item item DOM link
 * @param {*} data associated with this item data
 */
List.prototype.renderItemDefault = function ( $item, data ) {
    $item.innerText = data.value;
};


/**
 * Method to build each list item content.
 * Can be redefined to provide custom rendering.
 *
 * @type {function}
 */
List.prototype.renderItem = List.prototype.renderItemDefault;


/**
 * List of all default event callbacks.
 *
 * @type {Object.<string, function>}
 */
List.prototype.defaultEvents = {
    /**
     * Default method to handle mouse wheel events.
     *
     * @param {Event} event generated event
     */
    mousewheel: function ( event ) {
        // scrolling by Y axis
        if ( this.type === this.TYPE_VERTICAL && event.wheelDeltaY ) {
            this.move(event.wheelDeltaY > 0 ? keys.up : keys.down);
        }

        // scrolling by X axis
        if ( this.type === this.TYPE_HORIZONTAL && event.wheelDeltaX ) {
            this.move(event.wheelDeltaX > 0 ? keys.left : keys.right);
        }
    },

    /**
     * Default method to handle keyboard keydown events.
     *
     * @param {Object} event generated event
     */
    keydown: function ( event ) {
        switch ( event.code ) {
            case keys.up:
            case keys.down:
            case keys.right:
            case keys.left:
            case keys.pageUp:
            case keys.pageDown:
            case keys.home:
            case keys.end:
                // cursor move only on arrow keys
                this.move(event.code);
                break;
            case keys.enter:
                // there are some listeners
                if ( this.events['click:item'] && this.$focusItem ) {
                    // notify listeners
                    this.emit('click:item', {$item: this.$focusItem, event: event});
                }
                break;
        }
    }
};


/**
 * Default method to move focus according to pressed keys.
 *
 * @param {Object} event generated event source of movement
 */
//List.prototype.navigateDefault = function ( event ) {
//    switch ( event.code ) {
//        case 38:
//        case 40:
//        case 39:
//        case 37:
//        case 33:
//        case 34:
//        case 36:
//        case 35:
//            // cursor move only on arrow keys
//            this.move(event.code);
//            break;
//        case 13:
//            // there are some listeners
//            if ( this.events['click:item'] ) {
//                // notify listeners
//                this.emit('click:item', {$item: this.$focusItem, event: event});
//            }
//            break;
//    }
//};


/**
 * Current active method to move focus according to pressed keys.
 * Can be redefined to provide custom navigation.
 *
 * @type {function}
 */
//List.prototype.navigate = List.prototype.navigateDefault;


/**
 * Make all the data items identical.
 * Wrap to objects if necessary.
 *
 * @param {Array} data incoming array
 * @return {Array} reworked incoming data
 */
function normalize ( data ) {
    var idx, item;

    if ( DEVELOP ) {
        if ( arguments.length !== 1 ) {
            throw new Error(__filename + ': wrong arguments number');
        }
        if ( !Array.isArray(data) ) {
            throw new Error(__filename + ': wrong data type');
        }
    }

    // rows
    for ( idx = 0; idx < data.length; idx++ ) {
        // cell value
        item = data[idx];
        // primitive value
        if ( typeof item !== 'object' ) {
            // wrap with defaults
            item = data[idx] = {
                value: data[idx]
            };
        }

        if ( DEVELOP ) {
            //if ( !('value' in item) ) { throw new Error(__filename + ': field "value" is missing'); }
            if ( ('mark' in item) && Boolean(item.mark) !== item.mark ) {
                throw new Error(__filename + ': item.mark must be boolean');
            }
        }
    }

    return data;
}


/**
 * Init or re-init of the component inner structures and HTML.
 *
 * @param {Object} config init parameters (subset of constructor config params)
 */
List.prototype.init = function ( config ) {
    var self     = this,
        currSize = this.$body.children.length,
        /**
         * Item mouse click handler.
         *
         * @param {Event} event click event data
         *
         * @this Element
         *
         * @fires module:stb/ui/list~List#click:item
         */
        onClick = function ( event ) {
            if ( this.data ) {
                self.focusItem(this);

                // there are some listeners
                if ( self.events['click:item'] ) {
                    // notify listeners
                    self.emit('click:item', {$item: this, event: event});
                }
            }
        },
        item, idx;

    if ( DEVELOP ) {
        if ( arguments.length !== 1 ) {
            throw new Error(__filename + ': wrong arguments number');
        }
        if ( typeof config !== 'object' ) {
            throw new Error(__filename + ': wrong config type');
        }
    }

    // apply cycle behaviour
    if ( config.cycle !== undefined ) { this.cycle = config.cycle; }

    // apply ScrollBar link
    if ( config.scroll ) { this.scroll = config.scroll; }

    // apply data provider
    if ( config.provider ) { this.provider = config.provider; }


    // custom render method
    if ( config.render ) {
        if ( DEVELOP ) {
            if ( typeof config.render !== 'function' ) {
                throw new Error(__filename + ': wrong config.render type');
            }
        }

        // apply
        this.renderItem = config.render;
    }

    // list items amount on page
    if ( config.size ) {
        if ( DEVELOP ) {
            if ( Number(config.size) !== config.size ) {
                throw new Error(__filename + ': config.size must be a number');
            }
            if ( config.size <= 0 ) {
                throw new Error(__filename + ': config.size should be positive');
            }
        }

        // apply
        this.size = config.size;
    }

    if ( config.events ) {
        // apply all given events
        Object.keys(config.events).forEach(function ( name ) {
            self.events[name] = null;
            self.addListener(name, config.events[name]);
        });
    }

    // geometry has changed or initial draw
    if ( this.size !== currSize ) {
        // non-empty list
        if ( currSize > 0 ) {
            // clear old items
            this.$body.innerText = null;
        }

        // create new items
        for ( idx = 0; idx < this.size; idx++ ) {
            item = document.createElement('div');
            item.index = idx;
            //item.className = 'item theme-list-item';
            item.className = 'item';

            item.addEventListener('click', onClick);
            this.$body.appendChild(item);
        }
    }

    if ( this.provider ) {
        if ( this.provider.blocked ) {
            return;
        }

        this.provider.get( null, function ( error, data ) {
            if ( error ) {
                if ( self.events['data:error'] ) {
                    /**
                     * Provider get error while take new data
                     *
                     * @event module:stb/ui/list~List#data:error
                     */
                    self.emit('data:error', error);
                }
            } else {
                if ( data ) {
                    config.data = data;
                    self.setData(config);
                    if ( self.scroll ) {
                        self.scroll.init({
                            realSize: self.provider.maxCount,
                            viewSize: self.provider.size,
                            value: self.provider.head + self.provider.pos
                        });
                    }
                }
                if ( self.events['data:get'] ) {
                    /**
                     * Provider request new data
                     *
                     * @event module:stb/ui/list~List#data:get
                     *
                     * @type {Object}
                     */
                    self.emit('data:get');
                }
            }
        });
    } else if ( config.data ) {
        this.setData(config);
    }
};

/**
 * Set data and render inner structures and HTML.
 *
 * @param {Object} config init parameters (subset of constructor config params)
 */
List.prototype.setData = function ( config ) {
    // apply list of items

    if ( config.data ) {
        if ( DEVELOP ) {
            if ( !Array.isArray(config.data) ) { throw new Error(__filename + ': wrong config.data type'); }
        }
        // prepare user data
        this.data = normalize(config.data);
    }

    // view window position
    if ( DEVELOP ) {
        if ( config.viewIndex !== undefined ) {
            if ( Number(config.viewIndex) !== config.viewIndex ) {
                throw new Error(__filename + ': config.viewIndex must be a number');
            }
            if ( config.viewIndex < 0 ) {
                throw new Error(__filename + ': config.viewIndex should be positive');
            }
        }
    }

    // reset current view window position
    this.viewIndex = null;

    if ( this.$focusItem ) {
        this.blurItem(this.$focusItem);
    }

    if ( this.scroll ) {
        if ( this.provider ) {
            if ( this.scroll.realSize !== this.provider.maxCount ) {
                this.scroll.init({
                    realSize: this.provider.maxCount,
                    viewSize: this.provider.size,
                    value: this.provider.head + this.provider.pos
                });
            }
        } else {
            this.scroll.init({
                realSize: this.data.length,
                viewSize: this.size,
                value: config.viewIndex || 0
            });
        }
    }

    // set focus item
    if ( config.focusIndex !== undefined && this.data.length ) {
        if ( DEVELOP ) {
            if ( Number(config.focusIndex) !== config.focusIndex ) {
                throw new Error(__filename + ': config.focusIndex must be a number');
            }
            if ( config.focusIndex < 0 ) {
                throw new Error(__filename + ': config.focusIndex should be positive');
            }
            // if ( config.focusIndex > this.data.length - 1 ) {
            //     throw new Error(__filename + ': config.focusIndex should be less than data size');
            // }
        }

        // jump to the necessary item
        this.focusIndex(config.focusIndex);
    } else {
        // go to the first page
        this.renderView(config.viewIndex || 0);
    }
};


/**
 * Shift the visible view window event.
 *
 * @event module:stb/ui/list~List#move:view
 *
 * @type {Object}
 * @property {number} prevIndex previous view window position
 * @property {number} currIndex current view window position
 */


/**
 * Draw the visible window.
 *
 * @param {number} index start position to render
 *
 * @return {boolean} operation status
 *
 * @fires module:stb/ui/list~List#move:view
 */
List.prototype.renderView = function ( index ) {
    var $item, idx, itemData, prevIndex, currIndex;

    if ( DEVELOP ) {
        if ( arguments.length !== 1 ) {
            throw new Error(__filename + ': wrong arguments number');
        }
        if ( Number(index) !== index ) {
            throw new Error(__filename + ': index must be a number');
        }
        if ( index < 0 ) {
            throw new Error(__filename + ': index should be more than zero');
        }
        // if ( index >= this.data.length ) {
        //     throw new Error(__filename + ': index should be less than data size');
        // }
    }

    // has the view window position changed
    if ( this.viewIndex !== index ) {
        // save for emit
        prevIndex = this.viewIndex;
        // sync global pointer
        this.viewIndex = currIndex = index;

        // rebuild all visible items
        for ( idx = 0; idx < this.size; idx++ ) {
            // shortcuts
            $item    = this.$body.children[idx];
            itemData = this.data[index];

            // real item or stub
            if ( itemData ) {
                // correct inner data/index and render
                $item.data  = itemData;
                $item.index = index;
                this.renderItem($item, itemData);

                // apply CSS
                if ( itemData.mark ) {
                    $item.classList.add('mark');
                } else {
                    $item.classList.remove('mark');
                }
            } else {
                // nothing to render
                $item.data = $item.index = undefined;
                $item.innerHTML = '&nbsp;';
                $item.ready = false;
            }
            index++;
        }

        // there are some listeners
        if ( this.events['move:view'] ) {
            // notify listeners
            this.emit('move:view', {prevIndex: prevIndex, currIndex: currIndex});
        }

        // there are some listeners
        if ( this.events['select:item'] ) {
            this.emit('select:item', {$item: $item});
        }

        // update a linked scroll component
        if ( this.scroll ) {
            this.scroll.scrollTo(this.provider ? this.provider.head + this.provider.pos : this.viewIndex);
        }

        // full rebuild
        return true;
    }

    // nothing was done
    return false;
};


/**
 * Move focus to the given direction.
 *
 * @param {number} direction arrow key code
 *
 * @fires module:stb/ui/list~List#cycle
 * @fires module:stb/ui/list~List#overflow
 */
List.prototype.move = function ( direction ) {
    var self = this,
        force = false;


    if ( DEVELOP ) {
        if ( arguments.length !== 1 ) {
            throw new Error(__filename + ': wrong arguments number');
        }
        if ( Number(direction) !== direction ) {
            throw new Error(__filename + ': direction must be a number');
        }
    }

    // empty list
    if ( !this.data.length ) {
        return;
    }

    switch ( direction ) {
        case keys.left:
            if ( this.type === this.TYPE_HORIZONTAL ) {
                force = true;
            } else {
                break;
            }
        case keys.up:
            if ( force || this.type === this.TYPE_VERTICAL ) {
                if ( this.$focusItem && this.$focusItem.index > 0 ) {
                    if ( this.$focusItem === this.$body.firstChild ) {
                        this.renderView(this.viewIndex - 1);
                    } else {
                        this.focusItem(this.$focusItem.previousSibling);
                    }
                } else if ( this.provider ) {
                    if ( this.provider.blocked ) {
                        return;
                    }

                    this.provider.get(direction, function ( error, data, pos ) {
                        if ( error ) {
                            if ( self.events['data:error'] ) {
                                /**
                                     * Provider get error while take new data
                                     *
                                     * @event module:stb/ui/list~List#data:error
                                     */
                                self.emit('data:error', error);
                            }
                        } else if ( data ) {
                            self.setData({data: data, focusIndex: pos || pos === 0 ? pos : self.$focusItem.index});
                        }
                    });
                } else {
                    // already at the beginning
                    if ( this.cycle ) {
                        // jump to the end of the list
                        this.move(keys.end);
                    }
                    if ( this.events['overflow'] ) {
                        // notify listeners
                        this.emit('overflow', {direction: direction, cycle: this.cycle});
                    }
                }
            }
            break;
        case keys.right:
            if ( this.type === this.TYPE_HORIZONTAL ) {
                force = true;
            } else {
                break;
            }
        case keys.down:
            if ( force || this.type === this.TYPE_VERTICAL ) {
                if ( this.$focusItem && this.$focusItem.index < this.data.length - 1 ) {
                    if ( this.$focusItem === this.$body.lastChild ) {
                        this.renderView(this.viewIndex + 1);
                    } else {
                        this.focusItem(this.$focusItem.nextSibling);
                    }
                } else if ( this.provider ) {
                    if ( this.provider.blocked ) {
                        return;
                    }

                    this.provider.get(direction, function ( error, data, pos ) {
                        if ( error ) {
                            if ( self.events['data:error'] ) {
                                /**
                                     * Provider get error while take new data
                                     *
                                     * @event module:stb/ui/list~List#data:error
                                     */
                                self.emit('data:error', error);
                            }
                        } else if ( data ) {
                            self.setData({data: data, focusIndex: pos || pos === 0 ? pos : self.$focusItem.index});
                        }
                    });
                } else {
                    // already at the beginning
                    if ( this.cycle ) {
                        // jump to the beginning of the list
                        this.move(keys.home);
                    }
                    if ( this.events['overflow'] ) {
                        // notify listeners
                        this.emit('overflow', {direction: direction, cycle: this.cycle});
                    }
                }
            }
            break;
        case keys.pageUp:
            if ( this.provider ) {
                if ( this.provider.blocked ) {
                    return;
                }

                this.provider.get(direction, function ( error, data, pos ) {
                    if ( error ) {
                        if ( self.events['data:error'] ) {
                            /**
                             * Provider get error while take new data
                             *
                             * @event module:stb/ui/list~List#data:error
                             */
                            self.emit('data:error', error);
                        }
                    } else if ( data ) {
                        self.setData({data: data, focusIndex: pos ? pos : 0});
                    }
                });

                return;
            }
            if ( this.viewIndex < this.size ) {
                // first page
                this.renderView(0);
            } else {
                // second page and further
                this.renderView(this.viewIndex - this.size + 1);
            }

            this.focusItem(this.$body.firstChild);
            break;
        case keys.pageDown:
            if ( this.provider ) {
                if ( this.provider.blocked ) {
                    return;
                }

                this.provider.get(direction, function ( error, data, pos ) {
                    var focusIndex;

                    if ( error ) {
                        if ( self.events['data:error'] ) {
                            /**
                             * Provider get error while take new data
                             *
                             * @event module:stb/ui/list~List#data:error
                             */
                            self.emit('data:error', error);
                        }
                    } else if ( data ) {
                        if ( pos || pos === 0 ) {
                            focusIndex = pos;
                        } else {
                            focusIndex = data.length < self.size ?  data.length - 1 : self.size - 1;
                        }

                        self.setData({data: data, focusIndex: focusIndex});
                    }
                });
                break;
            }
            // data is bigger then one page
            if ( this.data.length > this.size ) {
                // determine jump size
                if ( this.viewIndex > this.data.length - this.size * 2 ) {
                    // last page
                    this.renderView(this.data.length - this.size);
                } else {
                    // before the last page
                    this.renderView(this.viewIndex + this.size - 1);
                }
                this.focusItem(this.$body.lastChild);
            } else {
                // not the last item on the page
                this.focusItem(this.$body.children[this.data.length - 1]);
            }
            break;
        case keys.home:
            if ( this.provider ) {
                if ( this.provider.blocked ) {
                    return;
                }

                this.provider.get(direction, function ( error, data, pos ) {
                    if ( error ) {
                        if ( self.events['data:error'] ) {
                            /**
                             * Provider get error while take new data
                             *
                             * @event module:stb/ui/list~List#data:error
                             */
                            self.emit('data:error', error);
                        }
                    } else if ( data ) {
                        self.setData({data: data, focusIndex: pos ? pos : 0});
                    }
                });
                break;
            }
            this.renderView(0);
            this.focusItem(this.$body.firstChild);
            break;
        case keys.end:
            if ( this.provider ) {
                if ( this.provider.blocked ) {
                    return;
                }

                this.provider.get(direction, function ( error, data, pos ) {
                    var focusIndex;

                    if ( error ) {
                        if ( self.events['data:error'] ) {
                            /**
                             * Provider get error while take new data
                             *
                             * @event module:stb/ui/list~List#data:error
                             */
                            self.emit('data:error', error);
                        }
                    } else if ( data ) {
                        if ( pos || pos === 0 ) {
                            focusIndex = pos;
                        } else {
                            focusIndex = data.length < self.size ?  data.length - 1 : self.size - 1;
                        }

                        self.setData({data: data, focusIndex: focusIndex});
                    }
                });
                break;
            }
            if ( this.data.length > this.size ) {
                this.renderView(this.data.length - this.size);
                this.focusItem(this.$body.lastChild);
            } else {
                // not the last item on the page
                this.focusItem(this.$body.children[this.data.length - 1]);
            }
            break;
    }
};


/**
 * Highlight the given DOM element as focused.
 * Remove focus from the previously focused item and generate associated event.
 *
 * @param {Node|Element} $item element to focus
 *
 * @return {boolean} operation status
 *
 * @fires module:stb/ui/list~List#focus:item
 * @fires module:stb/ui/list~List#blur:item
 */
List.prototype.focusItem = function ( $item ) {
    var $prev = this.$focusItem;

    if ( DEVELOP ) {
        if ( arguments.length !== 1 ) {
            throw new Error(__filename + ': wrong arguments number');
        }
    }

    // different element
    if ( $item && $prev !== $item ) {
        if ( DEVELOP ) {
            if ( !($item instanceof Element) ) {
                throw new Error(__filename + ': wrong $item type');
            }
            if ( $item.parentNode !== this.$body ) {
                throw new Error(__filename + ': wrong $item parent element');
            }
        }

        // some item is focused already
        if ( $prev !== null ) {
            if ( DEVELOP ) {
                if ( !($prev instanceof Element) ) {
                    throw new Error(__filename + ': wrong $prev type');
                }
            }

            // style
            $prev.classList.remove('focus');
            //$prev.classList.remove('theme-focus');

            // there are some listeners
            if ( this.events['blur:item'] ) {
                /**
                 * Remove focus from an element.
                 *
                 * @event module:stb/ui/list~List#blur:item
                 *
                 * @type {Object}
                 * @property {Element} $item previously focused HTML element
                 */
                this.emit('blur:item', {$item: $prev});
            }
        }
        // reassign
        this.$focusItem = $item;

        this.$focusItem.data = this.data[this.$focusItem.index];

        // correct CSS
        $item.classList.add('focus');
        //$item.classList.add('theme-focus');

        // there are some listeners
        if ( this.events['focus:item'] ) {
            /**
             * Set focus to a DOM element.
             *
             * @event module:stb/ui/list~List#focus:item
             *
             * @type {Object}
             * @property {Element} $prev old/previous focused HTML element
             * @property {Element} $curr new/current focused HTML element
             */
            this.emit('focus:item', {$prev: $prev, $curr: $item});
        }

        // there are some listeners
        if ( this.events['select:item'] ) {
            /**
             * Set focus to a list item.
             *
             * @event module:stb/ui/list~List#select:item
             *
             * @type {Object}
             * @property {Element} $item new/current focused item
             */
            this.emit('select:item', {$item: $item});
        }

        return true;
    }

    // nothing was done
    return false;
};

/**
 * Highlight the given DOM element as blur.
 * Remove focus from the item and generate associated event.
 *
 * @param {Node|Element} $item element to focus
 *
 * @return {boolean} operation status
 *
 * @fires module:stb/ui/list~List#focus:item
 * @fires module:stb/ui/list~List#blur:item
 */
List.prototype.blurItem = function ( $item ) {
    if ( DEVELOP ) {
        if ( arguments.length !== 1 ) { throw new Error(__filename + ': wrong arguments number'); }
    }

    // different element
    if ( $item ) {
        if ( $item === this.$focusItem ) {
            this.$focusItem = null;
        }

        $item.classList.remove('focus');
        //$item.classList.remove('theme-focus');

        // there are some listeners
        if ( this.events['blur:item'] ) {
            /**
             * Remove focus from an element.
             *
             * @event module:stb/ui/list~List#blur:item
             *
             * @type {Object}
             * @property {Element} $item previously focused HTML element
             */
            this.emit('blur:item', {$item: $item});
        }

        return true;
    }

    // nothing was done
    return false;
};

/**
 * Set the given item focused by item index.
 *
 * @param {number} index item data index
 */
List.prototype.focusIndex = function ( index ) {
    var viewIndex = this.viewIndex || 0;

    if ( DEVELOP ) {
        if ( Number(index) !== index ) {
            throw new Error(__filename + ': index must be a number');
        }
        if ( index < 0 ) {
            throw new Error(__filename + ': index should be positive');
        }
        // if ( index > this.data.length - 1 ) {
        //     throw new Error(__filename + ': index should be less than data size');
        // }
    }

    // determine direction
    if ( index >= viewIndex + this.size ) {
        // check range
        index = index < this.data.length - 1 ? index : this.data.length - 1;
        // move down
        this.renderView(index - this.size + 1);
        this.focusItem(this.$body.lastChild);
    } else if ( index < viewIndex ) {
        // check range
        index = index > 0 ? index : 0;
        // move up
        this.renderView(index);
        this.focusItem(this.$body.firstChild);
    } else {
        // no move
        if ( this.viewIndex === null ) {
            // first attempt
            this.renderView(0);
        }
        this.focusItem(this.$body.children[index - viewIndex]);
    }
};


/**
 * Set item state and appearance as marked.
 *
 * @param {Node|Element} $item element to focus
 * @param {boolean} state true - marked, false - not marked
 */
List.prototype.markItem = function ( $item, state ) {
    if ( DEVELOP ) {
        if ( arguments.length !== 2 ) {
            throw new Error(__filename + ': wrong arguments number');
        }
        if ( !($item instanceof Element) ) {
            throw new Error(__filename + ': wrong $item type');
        }
        if ( $item.parentNode !== this.$body ) {
            throw new Error(__filename + ': wrong $item parent element');
        }
        if ( Boolean(state) !== state ) {
            throw new Error(__filename + ': state must be boolean');
        }
    }

    // correct CSS
    if ( state ) {
        $item.classList.add('mark');
    } else {
        $item.classList.remove('mark');
    }

    // apply flag
    $item.data.mark = state;
};


// public
module.exports = List;
