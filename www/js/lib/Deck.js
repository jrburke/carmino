define(function (require) {
  var tempNode = document.createElement('div');

  function slice(aryLike) {
    return [].slice.call(aryLike, 0);
  }

  function hasClass(node, name) {
    return node.classList.contains(name);
  }

  function addClass(node, name) {
    return node && node.classList.add(name);
  }

  function removeClass(node, name) {
    return node && node.classList.remove(name);
  }

  function toCardNode(htmlOrNode, optClass) {
    if (typeof htmlOrNode === 'string') {
      tempNode.innerHTML = htmlOrNode;
      htmlOrNode = tempNode.children[0];
      tempNode.innerHTML = '';
    }

    addClass(htmlOrNode, 'card');
    if (optClass) {
      addClass(htmlOrNode, optClass);
    }

    return htmlOrNode;
  }

  function parseHref(value) {
    var parts,
        result = {},
        index = value ? value.indexOf('#') : -1;

    if (index !== -1) {
      value = value.substring(index + 1);
      index = value.indexOf('?');
      if (index === -1) {
        result.target = value;
      } else {
        result.target = value.substring(0, index);
        value = value.substring(index + 1, value);
        parts = value.split('&');
        if (parts && parts.length) {
          result.data = {};
          parts.forEach(function (part) {
            part = part.split('=');
            result.data[decodeURIComponent(part[0])] = decodeURIComponent(part[1]) || true;
          });
        }
      }
    }

    return result;
  }

  function Deck(node) {
    this.node = node || document.createElement('section');
    this.node.classList.add('deck');
    this.cards = [];
    this.index = 0;

    // Track any cards in the DOM already.
    slice(this.node.children).forEach(function (node) {
      if (hasClass(node, 'card')) {
        this.cards.push(node);
        if (hasClass(node, 'center')) {
          this.index = this.cards.length - 1;
        }
      }
    }.bind(this));

    this._preloadModules();

    this.node.addEventListener('transitionend',
                               this._onTransitionEnd.bind(this),
                               false);
    this.node.addEventListener('click', this._onClick.bind(this), false);
  }

  Deck.prototype = {
    nav: function (cardIndex, options) {
      options = options || {};

      // Do not do anything if this is a show card for the current card.
      if (cardIndex === this.index) {
        return;
      }

      var temp,
          beginNode = this.cards[this.index],
          endNode = this.cards[cardIndex],
          isForward = options.direction === 'forward';

      // If going forward and it is an overlay node, then do not animate the
      // beginning node, it will just sit under the overlay.
      if (isForward && hasClass(endNode, 'anim-overlay')) {
        beginNode = null;
      }

      if (cardIndex < this.cards.length - 1) {
        this._deadNodes = this.cards.splice(cardIndex + 1,
                                            this.cards.length - cardIndex);
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
      } else {
        this._transitionCount = (beginNode && endNode) ? 2 : 1;
        this._animating = true;
      }

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

      if (options.immediate) {
        // make sure the instantaneous transition is seen before we turn
        // transitions back on.
        temp = this.node.clientWidth;

        removeClass(beginNode, 'no-anim');
        removeClass(endNode, 'no-anim');
      }

      this.index = cardIndex;
    },

    back: function () {
      this.nav(this.index - 1);
    },

    _onClick: function (evt) {
      // Another deck claimed this event, so bail.
      if (evt.deck) {
        return;
      }

      var href = evt.target.href || evt.target.getAttribute('data-href'),
          link = href && parseHref(href),
          target = link && link.target;

      if (target) {
        if (target.indexOf('!') === 0) {
          //Deck action, do it and kill the event.
          target = target.substring(1);
          this[target](link.data);
          evt.stopPropagation();
          evt.preventDefault();
        } else {
          require([link.target], function (mod) {
            mod(this, link.data);
          }.bind(this));
        }

        evt.deck = true;
      }
    },

    _onTransitionEnd: function () {
      var afterTransition, endNode;

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
            if (domNode.parentNode) {
              domNode.parentNode.removeChild(domNode);
            }
          });
          this._deadNodes = [];
        }

        // If a vertical overlay transition was disabled, if
        // current node index is an overlay, enable it again.
        endNode = this.cards[this.index];
        if (endNode.classList.contains('disabled-anim-vertical')) {
          removeClass(endNode, 'disabled-anim-vertical');
          addClass(endNode, 'anim-vertical');
        }

        if (this._afterTransition) {
          afterTransition = this._afterTransition;
          delete this._afterTransition;
          afterTransition();
        }
      }
    },

    _preloadModules: function () {
      var modules = [];
      // Scan for next jump points and preload the modules for them.
      slice(this.cards[this.index].querySelectorAll('[href], [data-href]'))
        .forEach(function (node) {
          var link = parseHref(node.href || node.getAttribute('data-href'));
          if (link.target) {
            modules.push(link.target);
          }
        });
      if (modules.length) {
        require(modules);
      }
    },

    card: function (title, content, options) {
      options = options || {};

      var back = options.back || !!options.backTitle,
          backTitle = options.backTitle || (options.back ? 'Back' : '');

      return '<section class="card"><header>' +
            (back ? '<button data-href="#!back">' + backTitle + '</button>' : '') +
            '<h1>' +
             title +
             '</h1></header><div class="content">' +
             content +
             '</div></section>';
    },

    before: function (node) {
      node = toCardNode(node, 'before');
      this.node.insertBefore(node, this.cards[0]);
      this.cards.unshift(node);
      this._afterTransition = this._preloadModules.bind(this);
      this.nav(0);

    },

    after: function (node) {
      node = toCardNode(node, 'after');
      this.node.appendChild(node);
      this.cards.push(node);
      this._afterTransition = this._preloadModules.bind(this);
      this.nav(this.cards.length - 1);
    }
  };

  return Deck;
});
