define(function (require) {

    function appNext(deck, data) {
        deck.after(deck.card('THIS IS NEXT', 'some other content'));
    }

    return appNext;
});