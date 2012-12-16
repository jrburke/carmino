/*jslint nomen: true, indent: 4 */
/*global define, navigator, location, window, chrome */

define(function (require) {
    'use strict';

    var events = require('events');

    /**
     * Detects if the current app has been installed.
     *
     * See https://github.com/wavysandbox/install/blob/master/README.md
     * for details on how to use.
     *
     */
    function install() {
        var fn = install[install.type + 'Install'];
        if (fn) {
            fn();
        } else {
            install.trigger('error', 'unsupported install: ' + install.type);
        }
    }

    function triggerChange(state) {
        install.state = state;
        install.trigger('change', install.state);
    }

    /**
     *  The install state. Values are:
     *  'unknown': the code has not tried to detect any state.
     *
     * @type {String}
     */
    install.state = 'unknown';

    install.check = function () {
        var apps = navigator.mozApps,
            request;

        if (navigator.mozApps) {
            //Mozilla web apps
            install.type = 'mozilla';
            request = navigator.mozApps.getSelf();
            request.onsuccess = function () {
                if (this.result) {
                    triggerChange('installed');
                } else {
                    triggerChange('uninstalled');
                }
            };

            request.onerror = function (err) {
                // Just console log it, no need to bother the user.
                install.error = err;
                triggerChange('error');
            };

        } else if (typeof chrome !== 'undefined' &&
                   chrome.app) {
            //Chrome web apps
            install.type = 'chrome';
            if (chrome.app.isInstalled) {
                triggerChange('installed');
            } else {
                triggerChange('uninstalled');
            }
        } else if (typeof window.navigator.standalone !== 'undefined') {
            install.type = 'ios';
            if (window.navigator.standalone) {
                triggerChange('installed');
            } else {
                triggerChange('uninstalled');
            }
        } else {
            install.type = 'unsupported';
            triggerChange('unsupported');
        }
    };

    /* Mozilla/Firefox installation */
    install.mozillaInstallUrl = location.href + 'manifest.webapp';
    install.mozillaInstall = function () {
        var installRequest = navigator.mozApps.install(install.mozillaInstallUrl);

        installRequest.onsuccess = function (data) {
            triggerChange('installed');
        };

        installRequest.onerror = function (err) {
            install.error = err;
            triggerChange('error');
        };
    };

    /* Chrome installation */
    install.chromeInstallUrl = null;
    install.chromeInstall = function () {
        chrome.webstore.install(install.chromeInstallUrl,
            function () {
                triggerChange('installed');
            }, function (err) {
                install.error = err;
                triggerChange('error');
            });
    };

    /* iOS installation */
    //Right now, just asks that something show a UI
    //element mentioning how to install using the Safari
    //"Add to Home Screen" button.
    install.iosInstall = function () {
        install.trigger('showiOSInstall', navigator.platform.toLowerCase());
    };

    //Allow install to do events.
    events.mix(install);

    //Start up the checks
    install.check();

    return install;
});