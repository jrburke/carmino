/*global console */
define(function (require, exports, module) {
  var tempDeck, html, deckNode, hasWebKitCalcBug,
      prim = require('prim'),
      registry = {},
      tempNode = document.createElement('div'),
      version = '1',
      storageVersionId = module.id + '-version',
      storageHtmlId = module.id + '-html',
      storedVersion = localStorage.getItem(storageVersionId),
      deckId = 0;

  // Hack for webkit browsers
  // https://bugs.webkit.org/show_bug.cgi?id=104390
  hasWebKitCalcBug = 'webkitTransform' in document.body.style;
  document.body.classList.add(hasWebKitCalcBug ? 'webkit' : 'nowebkit');

  function reset() {
    localStorage.setItem(storageVersionId, version);
    localStorage.removeItem(storageHtmlId);
  }

  window.addEventListener('error', function (evt) {
    // On an app error, reset state so app does not get stuck in a weird state.
    reset();
    console.error(evt);
    throw evt;
  }, false);

  // If version does not match this version of Deck, then reset.
  if (storedVersion !== version) {
    reset();
  }

  function slice(aryLike) {
    return [].slice.call(aryLike, 0);
  }

  function hasClass(node, name) {
    return node && node.classList.contains(name);
  }

  function addClass(node, name) {
    return node && node.classList.add(name);
  }

  function removeClass(node, name) {
    return node && node.classList.remove(name);
  }

  function addEvent(targetNode, evtName, deck, prop) {
    var fn = deck[prop].bind(deck);
    deck.handlers[evtName] = {
      node: targetNode,
      fn: fn
    };
    targetNode.addEventListener(evtName, fn, false);
  }

  function stopEvent(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }

  function cleanRegistry(node) {
    var id = 'id' + node.getAttribute('data-deckid'),
        deck = registry[id];
    if (deck) {
      deck.destroy();
      delete registry[id];
    }
  }

  function htmlEscape(value) {
    return value
           .replace(/</g, '&lt;')
           .replace(/\>/g, '&gt;')
           .replace(/\&/g, '&amp;')
           .replace(/\"/g, '&quot;');
  }

  function parseHref(value) {
    value = value || location.href;

    var parts,
        result = {},
        index = value.indexOf('#');

    if (index !== -1) {
      value = value.substring(index + 1);
      result.href = value;
      index = value.indexOf('?');
      if (index === -1) {
        result.target = value;
      } else {
        result.target = value.substring(0, index);
        value = value.substring(index + 1);
        parts = value.split('&');
        if (parts && parts.length) {
          result.data = {};
          parts.forEach(function (part) {
            part = part.split('=');
            result.data[decodeURIComponent(part[0])] = decodeURIComponent(part[1]) || true;
          });
        }
      }

      //Split the target into two pieces, if it is a special command
      if (result.target) {
        index = result.target.indexOf(':');
        if (index !== -1) {
          result.secondaryTarget = result.target.substring(index + 1);
          result.target = result.target.substring(0, index);
        }
      }
    }

    return result;
  }

  function Deck(node, options) {
    options = options || {};

    var indexSet, restored,
        transitionEventName = 'transitionend';

    this.id = deckId += 1;
    this.node = node || document.createElement('section');
    this.node.classList.add('deck');

    registry['id' + this.id] = this;

    if (options.deckClass) {
      options.deckClass.split(' ').forEach(function (cls) {
        addClass(this.node, cls);
      }.bind(this));
    }

    this.cards = [];
    this.handlers = {};
    this.cardIdCounter = 0;
    this.index = 0;

    this.node.setAttribute('data-deckid', this.id);

    // Track any cards in the DOM already.
    slice(this.node.children).forEach(function (node) {
      var oldCardId = node.getAttribute('data-cardid');
      if (oldCardId) {
        restored = true;
        oldCardId = parseInt(oldCardId, 10);
        // Rehydrated. Up internal ID to be past this ID.
        if (this.cardIdCounter < oldCardId) {
          this.cardIdCounter = oldCardId + 1;
        }
      } else {
        node.setAttribute('data-cardid', this.cardIdCounter += 1);
      }

      if (hasClass(node, 'card')) {
        this.cards.push(node);
        if (!indexSet && hasClass(node, 'center')) {
          // Choose the first "center" card. With menu/settings,
          // the
          indexSet = true;
          this.index = this.cards.length - 1;
        }
      }
    }.bind(this));

    // Set history state for current card, if there is one.
    if (this.cards[this.index]) {
      this.saveState();
    }

    if (!options.skipPreload) {
      this._preloadModules();
    }


    if ('webkitTransition' in this.node.style) {
      transitionEventName = 'webkitTransitionEnd';
    } else if ('OTransition' in this.node.style) {
      transitionEventName = 'otransitionend';
    }

    addEvent(this.node, transitionEventName, this, '_onTransitionEnd');
    addEvent(this.node, 'click', this, '_onClick');

    addEvent(this.node, 'touchstart', this, '_onTouchStart');
    addEvent(this.node, 'touchmove', this, '_onTouchMove');
    addEvent(this.node, 'touchcancel', this, '_onTouchCancel');
    addEvent(this.node, 'touchend', this, '_onTouchEnd');

    if (restored) {
      this.notify('onShow', this.cards[this.index]);
    }
  }

  // Expose reset, so that a developer could do a state reset in
  // the console via require('Deck').reset();
  Deck.reset = reset;

  Deck.hasWebKitCalcBug = hasWebKitCalcBug;

  Deck.registry = registry;

  Deck.init = function (moduleId) {
    // If no deckNode from initial hydration (done at end of this file)
    // then init a new deck.
    if (!deckNode) {
      var deck = new Deck();
      document.body.appendChild(deck.node);
      require([moduleId], function (init) {
        prim().start(function () {
          return init(deck.makeLocalDeck('', moduleId));
        }).then(function () {
          deck._preloadModules();
        }).end();
      });
    }

    //Clear docNode, no longer need it
    deckNode = null;
  };

  Deck.persistHtml = function () {
    // Do not block anything going on in the UI, wait until after
    // the animation is probably done.
    setTimeout(function () {
      localStorage.setItem(storageHtmlId, document.body.innerHTML);
    }, 500);
  };

  Deck.updateCards = function (moduleId, cardFn) {
    var hasError;

    slice(document.querySelectorAll('[data-moduleid="' +
                 moduleId +
                 '"]')).forEach(function (cardNode) {
      try {
        cardFn(cardNode);
      } catch (e) {
        hasError = true;
        console.error(e);
      }
    });

    if (!hasError) {
      Deck.persistHtml();
    }
  };

  Deck.prototype = {
    destroy: function () {
      Object.keys(this.handlers).forEach(function (evtName) {
        var obj = this.handlers[evtName];
        obj.node.removeEventListener(evtName, obj.fn, false);
      }.bind(this));
    },

    notify: function (evtName, node) {
      if (node) {
        var id = node.getAttribute('data-moduleid');
        if (id) {
          require([id], function (mod) {
            if (mod.hasOwnProperty(evtName)) {
              mod[evtName](node, this.makeLocalDeck(parseHref(), id));
            }
          }.bind(this));
        }
      }
    },

    create: function (href, moduleId, options) {
      var deck = new Deck(null, {
        deckClass: options.deckClass
      });

      deck.parent = this;

      if (options.card) {
        deck.after(href, moduleId, options.card, {immediate: true});
      }

      return deck.node;
    },

    card: function (title, content, options) {
      options = options || {};

      var html = '<section class="card ' + (options.cardClass || '') + '" role="region"><header>';

      if (options.back) {
        html += '<a data-href="#!back"><span class="icon icon-back"></span></a>';
      } else if (options.menu) {
        html += '<a data-href="#!menu?action=' + options.menu + '"><span class="icon icon-menu"></span></a>';
      }

      html += '<h1>' +
             htmlEscape(title) +
             '</h1>';

      if (options.toolbar) {
        html += '<menu type="toolbar">';
        Object.keys(options.toolbar).forEach(function (name) {
          html += '<button data-href="' + name + '">' + options.toolbar[name] + '</button>';
        });
        html += '</menu>';
      }

      html += '</header><div class="content">' +
             content +
             '</div></section>';

      return html;
    },

    toCardNode: function (htmlOrNode, href, moduleId, optClass) {
      if (typeof htmlOrNode === 'string') {
        tempNode.innerHTML = htmlOrNode;
        htmlOrNode = tempNode.children[0];
        tempNode.innerHTML = '';
      }

      htmlOrNode.setAttribute('data-cardid', (this.cardIdCounter += 1));
      htmlOrNode.setAttribute('data-moduleid', moduleId || '');
      htmlOrNode.setAttribute('data-location', href || '');

      addClass(htmlOrNode, 'card');

      if (optClass) {
        addClass(htmlOrNode, optClass);
      }

      return htmlOrNode;
    },

    before: function (href, moduleId, node, options) {
      options = options || {};
      node = this.toCardNode(node, href, moduleId,
                             options.immediate ? 'center' : 'before');
      this.node.insertBefore(node, this.cards[0]);
      this.cards.unshift(node);
      this.index += 1;
      this._afterTransition = this._preloadModules;
      options.direction = 'forward';
      this.nav(0, options);
    },

    after: function (href, moduleId, node, options) {
      options = options || {};
      node = this.toCardNode(node, href, moduleId,
                             options.immediate ? 'center' : 'after');
      this.node.appendChild(node);
      this.cards.push(node);
      this._afterTransition = this._preloadModules;
      options.direction = 'forward';
      this.nav(this.cards.length - 1, options);
    },

    saveState: function () {
      var href,
          node = this.cards[this.index];

      if (!node) {
        // Card setup is not done
        return;
      }

      href = node.getAttribute('data-location') || '';

      location.replace('#' + href);

      Deck.persistHtml();
    },

    nav: function (cardIndex, options) {
      options = options || {};

      // Do not do anything if this is a show card for the current card.
      if (cardIndex === this.index) {
        // Could be an immediate injection, first card in the stack. Still do
        // post transition processing, like preloading next actions.
        this._handleAfterTransition();

        // The state of the HTML could have still changed, so write it out here.
        this.saveState();
        return;
      }

      var temp,
          updateData = options.update,
          finalIndex = cardIndex,
          beginNode = this.cards[this.index],
          endNode = this.cards[cardIndex],
          isForward = options.direction === 'forward';


      prim().start(function () {
        // If an update to the endNode is requested before doing the transition,
        // load up module responsible for endNode and ask for an update.
        var d,
            moduleId = updateData && updateData.target;

        if (moduleId && endNode &&
            endNode.getAttribute('data-moduleid') === moduleId) {
          d = prim();
          require([moduleId], function (mod) {
            if (mod.update) {
              prim().start(function () {
                return mod.update({
                  card: this.card.bind(this)
                }, endNode, updateData.data);
              }.bind(this)).then(function (cardHtml) {
                if (cardHtml) {
                  //Replace the node
                  var node = this.toCardNode(cardHtml, updateData.href, moduleId);
                  node.className = endNode.className;
                  this.node.insertBefore(node, endNode);
                  endNode.parentNode.removeChild(endNode);
                  endNode = this.cards[cardIndex] = node;
console.log('DONE');
                }
              }.bind(this)).then(d.resolve, d.reject);
            } else {
              d.resolve();
            }
          }.bind(this), d.reject);
          return d.promise;
        }
      }.bind(this)).then(function () {
        // If going forward and it is an overlay node, then do not animate the
        // beginning node, it will just sit under the overlay.
        if (isForward && hasClass(endNode, 'anim-overlay')) {
          beginNode = null;
        }
console.log('start transition');
        // Trim out dead nodes, ones that are considered "forward" in the
        // navigation, even though that could happen from either the left
        // or right side of the current card.
        if (!isForward) {
          if (cardIndex < this.index) {
            // Trim nodes from the "right"
            this._deadNodes = this.cards.splice(cardIndex + 1,
                                              this.cards.length - cardIndex);
          } else {
            // Trim nodes from the "left"
            this._deadNodes = this.cards.splice(0, cardIndex);
            finalIndex = 0;
          }
        }

        // If going back and the beginning node was an overlay, do not animate
        // the end node, since it should just be hidden under the overlay.
        if (beginNode && hasClass(beginNode, 'anim-overlay')) {
          if (isForward) {
            // If a forward animation and overlay had a vertical transition,
            // disable it, use normal horizontal transition.
            if (!options.immediate && hasClass(beginNode, 'anim-vertical')) {
              removeClass(beginNode, 'anim-vertical');
              addClass(beginNode, 'disabled-anim-vertical');
            }
          } else {
            endNode = null;
          }
        }

        if (options.immediate) {
          addClass(beginNode, 'no-anim');
          addClass(endNode, 'no-anim');
        }

        this._transitionCount = (beginNode && endNode && !options.immediate) ? 2 : 1;
        this._animating = true;

        // make sure the reflow sees the correct transition state, whether
        // it is on or off. Otherwise, forward navigation in Firefox
        // did not seem to know animation was involved.
        temp = this.node.clientWidth;

        if (this.index === cardIndex) {
          // same node, no transition, just bootstrapping UI.
          removeClass(beginNode, 'before');
          removeClass(beginNode, 'after');
          addClass(beginNode, 'center');
        } else if (this.index > cardIndex) {
          // back
          removeClass(beginNode, 'center');
          addClass(beginNode, 'after');

          removeClass(endNode, 'before');
          addClass(endNode, 'center');
        } else {
          // forward
          removeClass(beginNode, 'center');
          addClass(beginNode, 'before');

          removeClass(endNode, 'after');
          addClass(endNode, 'center');
        }

        this._beginNode = beginNode;
        this._endNode = endNode;
        this._endNodeEvent = isForward ? null : 'onShow';

        this.index = finalIndex;

        if (options.immediate) {
          // make sure the instantaneous transition is seen before we turn
          // transitions back on.
          temp = this.node.clientWidth;

          removeClass(beginNode, 'no-anim');
          removeClass(endNode, 'no-anim');

          // Manually call transition end to finish up any common work.
          this._onTransitionEnd();
        }
      }.bind(this)).end();
    },

    back: function (link) {
      var options;

      if (link && link.secondaryTarget) {
        options = {
          update: {
            //Trim the primary target from href, since already handled
            href: link.href.substring(link.href.indexOf(':') + 1),
            target: link.secondaryTarget,
            data: link.data
          }
        };
      }

      if (this.index === 0) {
        if (this.cards.length === 1 && this.parent) {
          this.parent.back(link);
        } else {
          // A "back" from a card that was added to the front of the queue,
          // like a settings screen.
          this.nav(1, options);
        }
      } else {
        this.nav(this.index - 1, options);
      }
    },

    menu: function (link) {
      var data = link.data;
      if (this.node.querySelector('.card.menu')) {
        // Go "back" to other card.
        this.nav(this.index + 1);
      } else {
        // Just a normal nav
        this._navLink({
          href: data.action,
          target: data.action
        });
      }
    },

    makeLocalDeck: function (href, moduleId) {
      return {
        hasWebKitCalcBug: hasWebKitCalcBug,
        create: this.create.bind(this, href, moduleId),
        card: this.card.bind(this),
        before: this.before.bind(this, href, moduleId),
        after: this.after.bind(this, href, moduleId),
        saveState: this.saveState.bind(this)
      };
    },

    _navLink: function (link) {
      if (link.target) {
        require([link.target], function (mod) {
          mod(this.makeLocalDeck(link.href, link.target), link.data);
        }.bind(this));
      }
    },

    _onTouchStart: function (evt) {
      Deck.usingTouch = true;
      var touches = evt.touches;

      if (touches.length === 1) {
        this.storedTouch = touches[0];
      }
    },

    _onTouchMove: function (evt) {
      var touches = evt.touches;

      if (this.storedTouch && (touches.length !== 1 ||
          touches[0].clientX !== this.storedTouch.clientX ||
          touches[0].clientY !== this.storedTouch.clientY)) {
        this.storedTouch = null;
      }
    },

    _onTouchCancel: function () {
      this.storedTouch = null;
    },

    _onTouchEnd: function (evt) {
      var touches = evt.changedTouches;
      if (this.storedTouch && touches.length === 1 && touches[0].target === this.storedTouch.target) {
        this.storedTouch = null;
        this._onClick(evt);
      }
    },

    _onClick: function (evt) {
      if (this._animating || Deck.usingTouch && evt.type !== 'touchend') {
        stopEvent(evt);
        return;
      }

      var href = evt.target.href || evt.target.getAttribute('data-href'),
          link = href && parseHref(href),
          target = link && link.target;

      if (target) {
        if (target.indexOf('!') === 0) {
          //Deck action
          target = target.substring(1);
          this[target](link);
        } else {
          this._navLink(link);
        }

        stopEvent(evt);
      }
    },

    _onTransitionEnd: function () {
      var endNode, beginNodeDestroyed;

      // Do not pay attention to events that are not part of this deck.
      if (!this._animating) {
        return;
      }

      // Multiple cards can animate, so there can be multiple transitionend
      // events. Only do the end work when all have finished animating.
      if (this._transitionCount > 0) {
        this._transitionCount -= 1;
      }

      if (this._transitionCount === 0) {
        this._animating = false;

        if (this._deadNodes) {
          this._deadNodes.forEach(function (domNode) {
            if (domNode === this._beginNode) {
              beginNodeDestroyed = true;
            }

            // Destroy any decks in play, to be good event listener
            // and memory citizens
            slice(domNode.querySelectorAll('[data-deckid]'))
              .forEach(cleanRegistry);

            // This node could be a deck.
            cleanRegistry(domNode);

            // Notify controllers of card destruction
            slice(domNode.querySelectorAll('[data-cardid]'))
              .forEach(function (cardNode) {
                this.notify('onDestroy', cardNode);
              }.bind(this));

            if (!hasClass(domNode, 'deck')) {
              this.notify('onDestroy', domNode);
            }

            // Clean up the DOM
            if (domNode.parentNode) {
              domNode.parentNode.removeChild(domNode);
            }
          }.bind(this));
          this._deadNodes = [];
        }

        // If a vertical overlay transition was disabled, if
        // current node index is an overlay, enable it again.
        endNode = this._endNode;
        if (endNode) {
          if (endNode.classList.contains('disabled-anim-vertical')) {
            removeClass(endNode, 'disabled-anim-vertical');
            addClass(endNode, 'anim-vertical');
          }
          if (this._endNodeEvent) {
            this.notify(this._endNodeEvent, endNode);
            this._endNodeEvent = null;
          }
        }

        // Notify beginNode on being hidden, but do not do so if
        // it has already been destroyed and onDestroy triggered.
        if (!beginNodeDestroyed && !hasClass(this._beginNode, 'deck')) {
          this.notify('onHide', this._beginNode);
        }

        this._beginNode = null;
        this._endNode = null;

        this._handleAfterTransition();

        this.saveState();
      }
    },

    _handleAfterTransition: function () {
      if (this._afterTransition) {
        var afterTransition = this._afterTransition;
        delete this._afterTransition;
        afterTransition.call(this);
      }
    },

    _preloadModules: function (node) {
      var modules = [];

      node = node || this.cards[this.index];

      if (!node) {
        return;
      }

      // Scan for next jump points and preload the modules for them.
      slice(node.querySelectorAll('[href], [data-href], [data-moduleid]'))
        .forEach(function (node) {
          var link = parseHref(node.href ||
                     node.getAttribute('data-href') ||
                     node.getAttribute('data-moduleid')),
              validHost = !node.href || (node.hostname === location.hostname);

          if (validHost && link.target && link.target.charAt(0) !== '!') {
            modules.push(link.target);
          }
        });
      if (modules.length) {
        require(modules);
      }
    }
  };

  // Read existing state to know if it needs to be hydrated. Do this here
  // as part of module initialization to get the fastest inject before waiting
  // for all app code.
  document.body.setAttribute('role', 'application');
  html = localStorage.getItem(storageHtmlId);
  if (html) {
    document.body.innerHTML = html;
    deckNode = document.querySelector('body > .deck');
    if (deckNode) {
      tempDeck = new Deck(deckNode, {
        skipPreload: true
      });
      //Scan for all modules used.
      tempDeck._preloadModules(deckNode);
      tempDeck = null;
    }
    html = null;
  }

  return Deck;
});
