define([
    "config/config",
    "dojo/_base/fx",
    "dojo/fx/easing",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/number",
    "dojo/query"
], function (Config, fx, easing, dom, domConstruct, domStyle, number, query) {

    "use strict";

    var formatValue = function (value) {
        return {
            "y": value,
            "tooltip": number.format(value, {
                places: 0
            }) + "%"
        };
    };

    var formatDate = function (date) {
        var selectedDate = new Date(date);
        return Config.MONTH_NAMES[selectedDate.getMonth()] + " " + selectedDate.getDate() + ", " + selectedDate.getFullYear();
    };

    var fadeInMask = function () {
        fx.fadeIn(Config.SPLASH_SCREEN_FADE_IN_ARGS).play();
    };

    var fadeOutMask = function () {
        fx.fadeOut(Config.SPLASH_SCREEN_FADE_OUT_ARGS).play();
        domStyle.set("floating-panel-mask", "display", "none");
    };

    var fadeInCharts = function () {
        fx.fadeIn(Config.FADE_IN_CHARTS).play();
    };

    var animateUpdateHeight = function () {
        return fx.animateProperty({
            // use the bounceOut easing routine to have the box accelerate
            // and then bounce back a little before stopping
            easing: easing.quintOut,
            duration: 2100,
            node: query(".chart-container")[0],
            properties: {
                // calculate the 'floor'
                // and subtract the height of the node to get the distance from top we need
                height: 150
            }
        }).play();
    };

    var mapUpdateStartHandler = function (error) {
        var LOADING_NODE = query(".loader")[0];
        domStyle.set(LOADING_NODE, "display", "block");
    };

    var mapUpdateEndHandler = function (error) {
        var LOADING_NODE = query(".loader")[0];
        domStyle.set(LOADING_NODE, "display", "none");
    };

    var chartMouseOutHandler = function () {
        // destroy the tooltip container
        domConstruct.destroy("custom-tooltip-container");
        // hide the vertical bar
        domStyle.set(dom.byId("chart-container-vertical-bar"), "display", "none");
    };

    return {
        formatValue: formatValue,
        formatDate: formatDate,
        fadeInMask: fadeInMask,
        fadeOutMask: fadeOutMask,
        fadeInCharts: fadeInCharts,
        animateUpdateHeight: animateUpdateHeight,
        mapUpdateStartHandler: mapUpdateStartHandler,
        mapUpdateEndHandler: mapUpdateEndHandler,
        chartMouseOutHandler: chartMouseOutHandler
    }
});