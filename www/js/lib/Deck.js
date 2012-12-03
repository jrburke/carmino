define(function () {
  var slice = [].slice.call,
    tempNode = document.createElement('div');

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

    addClass(htmlOrNode, 'card' + (optClass ? ' ' + optClass : ''));

    return htmlOrNode;
  }

  function Deck(node) {
    this.node = node || document.createElement('section');
    this.node.classList.add('deck');
    this.cards = [];
    this.index = 0;

    // Track any cards in the DOM already.
    slice(0, this.node.children).forEach(function (node) {
      if (hasClass(node, 'card')) {
        this.cards.push(node);
        if (hasClass('center')) {
          this.index = this.cards.length - 1;
        }
      }
    }.bind(this));

    this.node.addEventListener('transitionend',
                               this._onTransitionEnd.bind(this),
                               false);
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

        // make sure the reflow sees the transition is turned off.
        temp = this.node.clientWidth;
      } else {
        this._transitionCount = (beginNode && endNode) ? 2 : 1;
        this._animating = true;
      }

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

    _onTransitionEnd: function () {
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

        if (this._deadNodes.length) {
          this._deadNodes.forEach(function (domNode) {
            if (domNode.parentNode) {
              domNode.parentNode.removeChild(domNode);
            }
          });
          this._deadNodes = [];
        }

        // If an vertical overlay transition was was disabled, if
        // current node index is an overlay, enable it again.
        var endNode = this.cards[this.index];
        if (endNode.classList.contains('disabled-anim-vertical')) {
          removeClass(endNode, 'disabled-anim-vertical');
          addClass(endNode, 'anim-vertical');
        }
      }
    },

    before: function (node) {
      node = toCardNode(node, 'before');
      this.node.insertBefore(node, this.cards[0]);
      this.cards.unshift(node);
      this.nav(0);

    },
    after: function (node) {
      node = toCardNode(node, 'after');
      this.node.appendChild(node);
      this.cards.push(node);
      this.nav(this.cards.length - 1);
    }
  };

  return Deck;
});
