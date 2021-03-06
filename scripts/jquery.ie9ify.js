/*!
* jQuery ie9ify Plugin v1.3
* http://ie9ify.codeplex.com
*
* Copyright 2011, Brandon Satrom and Clark Sell
* Licensed under MS-PL.
* http://ie9ify.codeplex.com/license
*
* Date: Fri Mar 24 12:04:29 2011 -0600
*/
(function ($) {

    /* ie9ify jQuery Functions:
    *  init: Adds meta tags and startup tasks to a page
    *   enablePinning: Enables a content item to be enabled for pinning (meaning that it can be dragged to the taskbar to pin a site)
    *   enableSiteMode: Enables binding of an event that triggers a site mode dialog (asking if the user wants to pin the site to the *start* menu)
    *   pinTeaser: Adds a teaser bar to the site, directly underneath the address bar. Teaser bar encourages the user to pin the site.
    */
    var methods = {
        init: function (options) {
            var defaultOptions = {
                applicationName: document.title.toString(),
                favIcon: 'http://' + location.host + '/favicon.ico',
                navColor: '',
                startUrl: 'http://' + location.host,
                tooltip: document.title.toString(),
                window: 'width=800;height=600',
                tasks: []
            };

            options = $.extend({}, defaultOptions, options);

            return this.each(function () {
                if ($('link[type^=image]').length === 0) {
                    $('<link>').attr('rel', 'shortcut icon').attr('type', 'image/ico').attr('href', options.favIcon).appendTo(this);
                }

                createMetaTag('application-name', options.applicationName, this);
                createMetaTag('msapplication-tooltip', options.tooltip, this);
                createMetaTag('msapplication-starturl', options.startUrl, this);
                createMetaTag('msapplication-navbutton-color', options.navColor, this);
                createMetaTag('msapplication-window', options.window, this);

                var taskList = options.tasks;
                for (var i = 0; i < taskList.length; i++) {
                    var task = taskList[i];
                    createMetaTag('msapplication-task', 'name=' + task.name + ';action-uri=' + task.action + ';icon-uri=' + task.icon, this);
                }

            });
        },
        enablePinning: function (title) {
            return this.each(function () {
                if (title === undefined) {
                    title = "Drag this image to your Windows 7 Taskbar to pin this site with IE9";
                }

                $(this).addClass('msPinSite').attr("title", title);
            });
        },
        enableSiteMode: function (eventName) {
            if (!eventName) {
                eventName = 'click';
            }

            return this.each(function () {
                $(this).bind(eventName, function (event) {
                    event.preventDefault();

                    try {
                        window.external.msAddSiteMode();
                    } catch (e) { }
                });
            });
        },
        pinTeaser: function (options) {
            if (window.external.msIsSiteMode()) {
                return this;
            }

            var defaultOptions = {
                icon: 'http://' + location.host + '/favicon.ico',
                pinText: 'Drag this image to the taskbar to pin this site',
                addStartLink: true,
                linkText: 'Click here to add this site to the start menu',
                linkColor: 'rgb(0, 108, 172)',
                backgroundColor: 'rgb(0, 108, 172)',
                textColor: 'white',
                mainContentSelector: ''
            };

            options = $.extend({}, defaultOptions, options);

            return this.each(function () {
                if (options.mainContentSelector) {
                    var mainContent = $(options.mainContentSelector);

                    if (mainContent) {
                        var top = mainContent.css('top').replace('auto', '').replace('px', '');

                        mainContent.css('position', 'absolute').css('top', top + 60 + 'px');
                    }
                }

                $(this).css('padding', '5px').css('color', options.textColor).css('width', '350px').css('height', '20px').css('position', 'fixed').css('top', '0px').css('left', '80px').css('background-color', options.backgroundColor).css('border-radius', '0px 0px 10px 10px').css('font-size', '.87em');

                var img = $('<img>').addClass('msPinSite').attr('src', options.icon).css('height', '20px').css('width', '20px').css('vertical-align', 'top').css('float', 'left').css('margin-right', '5px').appendTo(this);

                var div = $('<div>').attr('id', 'divAddSite').css('width', '280px').css('height', '15px').css('position', 'fixed').css('top', '30px').css('left', '80px').css('padding', '5px').css('-webkit-border-radius', '10px').css('-moz-border-radius', '10px').css('border-radius', '10px 10px 10px 10px').appendTo($(this));

                var text = $('<div>').attr('id', 'pinText').attr('innerText', options.pinText).appendTo(this);

                if (!options.addStartLink) {
                    return;
                }

                link = $('<a>').attr('id', 'linkAddSite').attr('href', '#').click(function (event) {
                    event.preventDefault();

                    try {
                        window.external.msAddSiteMode();
                    } catch (e) { }
                }).css('text-decoration', 'none').css('color', options.linkColor).appendTo(div).text(options.linkText);
            });
        }
    };

    //main entry point for ie9ify methods that operate on a jQuery wrapped set (above)
    $.fn.ie9ify = function (method) {
        if (checkForIE()) {
            return this;
        }

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.ie9ify');
        }
    };

    /*  ie9ify Utility Functions
    *  firstRunState: determines wheter a pinned site has been lanched for the first time
    *  isPinned: Returns true if the site is pinned to the taskbar, false if not
    *  addJumpList: Given options, adds jumplist items to a pinned window
    *  clearJumpList: Clears all dynamic jumplist items from the pinned window 
    *  addOverlay: Given options, adds an overlay icon to the taskbar for the pinned site
    *  clearOverlay: Clears the current overlay icon
    *  flashTaskbar: Flashes the taskbar box of a pinned site
    *  createThumbbarButtons: creates buttons on the pinned site preview window thumbbar, and wires events to respond to button clicks
    */
    $.ie9ify = {}; //create the ie9ify namespace for all of our ie9ify utilty functions

    /* Return Values
    * 0 = The pinned site is not in a first run state, or is not pinned
    * 1 = First run from a drag and drop operation
    * 2 = First run from a shortcut added to the Start menu (msAddSiteMode)
    */
    $.ie9ify.firstRunState = function (preserveState) {
        if (checkForIE()) {
            return 0;
        }

        if (preserveState == undefined) {
            preserveState = false;
        }

        try {
            return window.external.msIsSiteModeFirstRun(preserveState);
        } catch (e) {
            return 0;
        }
    }

    $.ie9ify.isPinned = function () {
        if (checkForIE()) {
            return false;
        }

        try {
            return window.external.msIsSiteMode();
        } catch (e) {
            return false;
        }
    };

    $.ie9ify.addJumpList = function (options) {
        if (checkForIE()) {
            return this;
        }

        var defaultOptions = {
            title: '',
            items: []
        };

        options = $.extend({}, defaultOptions, options);

        try {
            if (window.external.msIsSiteMode()) {
                window.external.msSiteModeClearJumplist();
                window.external.msSiteModeCreateJumplist(options.title);

                var items = options.items;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    window.external.msSiteModeAddJumpListItem(item.name, item.url, item.icon);
                }

                window.external.msSiteModeShowJumplist();
            }
        } catch (e) { }

        return this;
    }

    $.ie9ify.clearJumpList = function () {
        if (checkForIE()) {
            return this;
        }

        try {
            if (window.external.msIsSiteMode()) {
                window.external.msSiteModeClearJumpList();
            }
        } catch (e) { }
    };

    $.ie9ify.addOverlay = function (options) {
        if (checkForIE()) {
            return this;
        }

        var defaultOptions = {
            eventName: 'click',
            title: '',
            icon: ''
        };

        options = $.extend({}, defaultOptions, options);

        try {
            if (window.external.msIsSiteMode()) {
                window.external.msSiteModeClearIconOverlay();
                window.external.msSiteModeSetIconOverlay(options.icon, options.title);
            }
        } catch (e) { }
    };

    $.ie9ify.clearOverlay = function () {
        if (checkForIE()) {
            return this;
        }

        try {
            if (window.external.msIsSiteMode()) {
                window.external.msSiteModeClearIconOverlay();
            }
        } catch (e) { }
    };

    $.ie9ify.flashTaskbar = function (options) {
        if (checkForIE()) {
            return this;
        }

        try {
            if (window.external.msIsSiteMode()) {
                window.external.msSiteModeActivate();
            }
        } catch (e) { }
    };

    $.ie9ify.createThumbbarButtons = function (options) {
        if (checkForIE()) {
            return this;
        }

        var defaultOptions = {
            buttons: []
        };

        options = $.extend({}, defaultOptions, options);

        try {
            if (window.external.msIsSiteMode()) {
                var determineClicked = function (btn) {
                    options.buttons[btn.buttonID-1].click();
                };

                $.each(options.buttons, function (key, value) {
                    btn = window.external.msSiteModeAddThumbBarButton(value.icon, value.name);

                    if (document.addEventListener) {
                        document.addEventListener('msthumbnailclick', determineClicked, false);
                    } else if (document.attachEvent) {
                        document.attachEvent('onmsthumbnailclick', determineClicked);
                    }
                });
                window.external.msSiteModeShowThumbBar();
            }
        } catch (e) { }
    };
    
    //private functions
    function createMetaTag(name, content, head) {
        if ($('meta[name=' + name + ']').length && name != 'msapplication-task') {
            return;
        }

        if (content.length === 0) {
            return;
        }

        $('<meta>').attr('name', name).attr('content', content).appendTo(head);
    }

    function checkForIE() {
        if ($.browser.msie === undefined) {
            return true;
        }

        if ($.browser.version < 9) {
            return true;
        }

        return false;
    }

})(jQuery);