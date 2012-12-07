# Carmino

::experimental: nothing works, it is a mess, and may completely fail

TODO
* rehydrate w/ multiple "center" tags
* generate appcache

Build web apps targeted for mobile apps using a card metaphor. Each
screen is a card. Navigation is done by slide cards horizontally.

Each card is given to carmino as a string of HTML. Carmino will slot the card
into the DOM, and save the HTML string persistently, so that cold loads of the
app resume to where the user was last.

User input should be collected by using event delegation, since the card HTML
will be injected into the DOM before the app logic has loaded.

An AMD loader, alameda, is included, to dynamically load in app functionality,
and give a pleasing structure and layout to code via JS modules.

The history API is used to keep track of current urls and to be able to recover
previous cards.

AppCache should be used for the web app, and it should be a "single page web
app".

This approach is best for small mobile apps that generally have lists of
information, with detail views. The primary design goals are fast loading,

## Support level

Targeted at modern browsers. So, latest Firefox, Chrome, iOS Safari.

At some point, maybe the stock Android browser and latest mobile IE, if that
mobile IE is like desktop IE 10 or greater.

Why not broader? This project is primarily for web apps that run in Firefox OS,
with the hope that by the time that gets popular, the basic browsers used by
people will be up to the same web platform level as Firefox.

## Usage

Create the index.html for the web app, and add carmino.js to it:

```html
<!DOCTYPE html>
<html>
    <head>
        <script data-main="js/app" async src="carmino.js"></script>
    </head>
    <body>
        <section class="deck">
            <section class="card">
                <header>Start Screen</header>
                <div class="content yscroll">
                    <p>This is the default content that shows
                        up if there is no state to restore.</p>
                </div>
            </section>
        </section>
    </body>
</html>
```

There should only be one "deck" section in the <body> and no other visible
HTML tags in the body. You can have other tags for things like templates, but
they should be display: none.

## Should I do builds?

If you want, but the goal is to use appcache to serve the files, and to do
dynamic loading of layers of functionality, so a build is not required, and
may loose some benefits of waiting to load functionality until it is needed.
However, if you prefer to do builds of the layers of functionality, that is
fine. It is just not required, and likely will not give that much advantage.


