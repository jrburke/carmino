# Carmino

An experiment:

Build web apps targeted for mobile apps using a card metaphor. Each
screen is a card. Navigation is done by slide cards horizontally.

Each card is given to carmino as a string of HTML. Carmino will slot the card
into the DOM, and save the HTML string persistently, so that cold loads of the
app resume to where the user was last.

User input should be collected by using event delegation, since the card HTML
will be injected into the DOM before the app logic has loaded.

An AMD loader, alameda, is included, to dynamically load in app functionality,
and give a pleasing structure and layout to code via JS modules.

AppCache should be used for the web app, and it should be a "single page web
app".

This approach is best for small mobile apps that generally have lists of
information, with detail views.

The primary design goals are fast loading, fast state recovery after an app
is terminated by the OS to reclaim memory, and work across browsers in mobile
operating systems.

This repo will use a feed reader app as the test ground for the ideas, and if
they prove out, the individual modules in this project will be split out into
stand-alone projects.

## Support level

Targeted at modern browsers found primarily on mobile devices. So, latest
Firefox, Chrome, iOS Safari. Right now, only Firefox is actively tested during
this development phase, with occasional checks in iOS.

## Usage

See `www` directory for in-progress code.

## Should I do builds?

If you want, but the goal is to use appcache to serve the files, and to do
dynamic loading of modules of functionality, so a build is not required, and
may lose some benefits of waiting to load functionality until it is needed.
However, if you prefer to do builds of the layers of functionality, that is
fine. It is just not required, and depending on the build, may have negative
performance characteristics.

## TODO

* rehydrate w/ multiple "center" tags
* for build, only keep lib/shared parts that are used. Need to scan the
  generated CSS for used urls and just keep them, but delete the rest.
  Makes the appcache smaller.


