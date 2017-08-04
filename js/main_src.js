/*global define,location */

/*jslint sloppy:true */

/*
| Copyright 2017 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/

/*
|
|  UI/UXD
|       Sean Breyer
|       Daniel Siegel
|       Andrew Skinner
|
|  Application/Visualization
|       Required to use Dojo's charting API and not pull in any 3rd party dependencies.
|       An alternative (and possibly better) approach would have been to use D3.
|
|  CSS Framework
|       Still consumes Esri's older CSS framework, Tailcoat.
*/
require([
    "utils/AuthenticationUtils",
    "utils/UserInterfaceUtils",
    "config/config",
    "dijit/Dialog",
    "dijit/Editor",
    "dijit/_editor/plugins/LinkDialog",
    "dijit/_editor/plugins/TextColor",
    "dijit/_editor/plugins/ViewSource",
    "dijit/_editor/plugins/FontChoice",
    "dojo/cookie",
    "dojo/dom-geometry",
    "dojo/dnd/move",
    "dojo/dnd/Moveable",
    "dojo/window",
    "esri/dijit/Geocoder",
    "dojo/mouse",
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/date",
    "dojo/Deferred",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/html",
    "dojo/on",
    "dojo/string",
    "dojo/query",
    "esri/arcgis/Portal",
    "esri/arcgis/OAuthInfo",
    "esri/layers/FeatureLayer",
    "esri/IdentityManager",
    "esri/arcgis/utils",
    "esri/config",
    "esri/lang",
    "esri/graphic",
    "esri/map",
    "esri/dijit/Print",
    "esri/geometry/Extent",
    "esri/geometry/Point",
    "esri/geometry/webMercatorUtils",
    "esri/tasks/PrintParameters",
    "esri/tasks/PrintTask",
    "esri/tasks/PrintTemplate",
    "esri/request",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/SpatialReference",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/TimeExtent",
    "esri/renderers/SimpleRenderer",
    "esri/Color",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/parser",
    "dojo/ready",
    "dojox/charting/Chart",
    "dojox/charting/themes/Julie",
    "dojox/charting/plot2d/StackedAreas",
    "dojox/charting/plot2d/StackedColumns",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/Magnify",
    "dojox/charting/plot2d/Grid",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default",
    "dojo/NodeList-traverse"
], function (AuthenticationUtils, UserInterfaceUtils, Config, Dialog, Editor, LinkDialog, TextColor, ViewSource, FontChoice, cookie, domGeom, move, Moveable, win, Geocoder, mouse, array, declare,
             lang, date, Deferred, dom, domAttr, domClass, domConstruct, domStyle, html,
             on, string, query, arcgisPortal, OAuthInfo, FeatureLayer, esriId, arcgisUtils, esriConfig, esriLang, Graphic, Map,
             Print, Extent, Point, webMercatorUtils,
             PrintParameters, PrintTask, PrintTemplate,
             esriRequest, ArcGISDynamicMapServiceLayer, SpatialReference, SimpleFillSymbol, SimpleLineSymbol, TimeExtent, SimpleRenderer, Color, IdentifyTask,
             IdentifyParameters, Query, QueryTask, parser, ready,
             Chart, theme, StackedAreas, StackedColumns,
             Lines, Tooltip, Magnify, Grid) {


    parser.parse();

    ready(function () {
        var queryFeatureServiceURL = "",
            IDENTIFY_URL = Config.BOUNDARY_URL,
            portal,
            map,
            itemResponse = null,
            userID = "",
            credentials = null,
            identifyTask = null,
            identifyParams = null,
            features = null,
            createMapOptions = {
                mapOptions: {
                    slider: true,
                    lods: Config.CUSTOM_LODS
                },
                usePopupManager: true
            },
            descriptionEditor = null,
            mainChart = null,
            annualChart = null,
            monthChart = null,
            dateValues = [],
            dryValues = [],
            moderateValues = [],
            severeValues = [],
            extremeValues = [],
            exceptionalValues = [],
            dateAnnualValues = [],
            dryAnnualValues = [],
            moderateAnnualValues = [],
            severeAnnualValues = [],
            extremeAnnualValues = [],
            exceptionalAnnualValues = [],
            dryMonthValues = [],
            moderateMonthValues = [],
            severeMonthValues = [],
            extremeMonthValues = [],
            exceptionalMonthValues = [],
            chartOffsetLeft,
            barWidth,
            dummyIndex,
            newDummyIndex,
            windowGeom,
            dateTooltipLabel = "",
            dryTooltipLabel = "",
            moderateTooltipLabel = "",
            severeTooltipLabel = "",
            extremeTooltipLabel = "",
            exceptionalTooltipLabel = "",
            floatingPanelNode = null,
            scrubber = null,
            selectedDate = "",
            selectedLocation = "",
            clickedDate = "",
            mainSeriesClickPoint = null,
            oauthConfig = null,
            LOADING_NODE = null,
            SAVE_LAYER_BUTTON_NODE = null,
            // re-size browser window
            rtime = new Date(1, 1, 2000, 12, 00, 00),
            timeout = false,
            delta = 200,
            // definition expression
            defExp = "",
            // store the select map point
            selectedMapPoint = null,
            // item thumbnail URL generated
            generatedThumbnailUrl = "",
            itemTitle = "",
            itemSnippet = "",
            itemDescription = "",
            tags,
            currentExtent = [],
            saveLayerDialog = null,
            zoomInDialog = null,
            webMapID = null;

        run();

        function run() {
            // loading indicator node
            LOADING_NODE = query(".loader")[0];
            // "Save Layer" butotn node
            SAVE_LAYER_BUTTON_NODE = query(".save-lyr-btn")[0];
            // Add URLs for servers with cross-origin resource sharing enabled to this array. Cross-Origin Resource
            // Sharing (CORS) allows web applications to bypass the browser's same origin policy file and access
            // resources or services on different servers/domains. When both the web server and browser support CORS,
            // esri.request will not use a proxy to perform cross-domain requests. The API includes some Esri servers
            // by default so it's important to push items on to this array rather than overwriting it.
            esriConfig.defaults.io.corsEnabledServers.push("sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task");

            oauthConfig = AuthenticationUtils.registerOAuthConfig();

            esriId.checkSignInStatus(oauthConfig.portalUrl).then(
                function (credentials) {
                    // User authenticated...
                    new arcgisPortal.Portal(Config.SHARING_HOST).signIn().then(function (portalUser) {
                        portal = portalUser.portal;
                        // Authenticated
                        //
                        // Update "Save Layer"/"Sign In" button label
                        SAVE_LAYER_BUTTON_NODE.innerHTML = "SAVE LAYER";
                        // Set user ID
                        userID = esriId.credentials[0].userId;
                        // Set credentials
                        credentials = esriId.credentials;
                        // Update FS being used in the application
                        queryFeatureServiceURL = Config.DROUGHT_BY_COUNTY_FS_SECURE;
                        var deferred = arcgisUtils.getItem(Config.WEBMAP_ID_SECURE);
                        deferred.then(function (response) {
                            itemResponse = response;

                            on(SAVE_LAYER_BUTTON_NODE, "click", function () {
                                var label = SAVE_LAYER_BUTTON_NODE.innerHTML;
                                if (label === "SAVE LAYER") {
                                    _saveLayerBtnClickHander();
                                }
                            });
                        });
                    });
                }
            ).otherwise(
                function () {
                    // User NOT authenticated
                    //
                    // Update "Save Layer"/"Sign In" button label
                    SAVE_LAYER_BUTTON_NODE.innerHTML = "SIGN IN";
                    // Update FS being used in the application
                    queryFeatureServiceURL = Config.DROUGHT_BY_COUNTY_FS_UNSECURE;

                    on(SAVE_LAYER_BUTTON_NODE, "click", function () {
                        var label = SAVE_LAYER_BUTTON_NODE.innerHTML;
                        if (label !== "SAVE LAYER") {
                            // User is attempting to sign in
                            esriId.getCredential(oauthConfig.portalUrl, {
                                    oAuthPopupConfirmation: false
                                }
                            ).then(function (response) {
                                new arcgisPortal.Portal(Config.SHARING_HOST).signIn().then(function (portalUser) {
                                    portal = portalUser.portal;
                                    // Update the button label
                                    SAVE_LAYER_BUTTON_NODE.innerHTML = "SAVE LAYER";
                                    // Update the button style
                                    var attrs = domAttr.get(SAVE_LAYER_BUTTON_NODE, "class");
                                    var newAttrs = attrs.replace("default", "green");
                                    domAttr.set(SAVE_LAYER_BUTTON_NODE, "class", newAttrs);
                                    //
                                    userID = esriId.credentials[0].userId;
                                    // update the services
                                    queryFeatureServiceURL = Config.DROUGHT_BY_COUNTY_FS_SECURE;
                                    // update webmap item being used
                                    var deferred = arcgisUtils.getItem(Config.WEBMAP_ID_SECURE);
                                    deferred.then(function (response) {
                                        itemResponse = response;
                                    });
                                });
                            });
                        } else {
                            _saveLayerBtnClickHander();
                        }
                    });
                }
            );

            windowGeom = win.getBox();
            floatingPanelNode = dom.byId("floating-panel");

            // learn more link handler
            on(query(".learn-more-link")[0], "click", _learnMoreLinkClickHandler);
            on(query(".drought-data-link")[0], "click", _droughtDataLinkClickHandler);

            // query the webmap item to get the latest date
            var deferred = null;
            if (esriLang.isDefined(credentials)) {
                deferred = arcgisUtils.getItem(Config.WEBMAP_ID_SECURE);
                webMapID = Config.WEBMAP_ID_SECURE;
            } else {
                deferred = arcgisUtils.getItem(Config.WEBMAP_ID_UNSECURE);
                webMapID = Config.WEBMAP_ID_UNSECURE;
            }
            deferred.then(function (response) {
                itemResponse = response;
                var operationalLayerUrl = itemResponse.itemData.operationalLayers[0].url + "/0";
                var q = new Query();
                q.returnGeometry = false;
                q.outFields = ["*"];
                q.orderByFields = ["ddate DESC"];
                q.returnDistinctValues = true;
                q.where = "1 = 1";
                var queryTask = new QueryTask(operationalLayerUrl);
                queryTask.execute(q).then(queryTaskSuccessHandler, queryTaskErrorHandler);
            });
        }

        function queryTaskSuccessHandler(queryResponse) {
            var lastFeature = queryResponse.features[0];
            // End Date:
            var endDate = new Date(lastFeature.attributes.ddate);
            // Start Date:
            // one week prior to the end date
            var startDate = new Date(endDate.getTime() - (60 * 60 * 24 * 7 * 1000));
            arcgisUtils.createMap(webMapID, "map", createMapOptions).then(function (createMapResponse) {
                // fade in panel
                UserInterfaceUtils.fadeInMask();
                map = createMapResponse.map;

                dom.byId("selectedDate").innerHTML = UserInterfaceUtils.formatDate(endDate);
                domStyle.set(dom.byId("selectedDateContainer"), "display", "block");

                var timeExtent = new TimeExtent(startDate, endDate);
                // set the map's time extent
                map.setTimeExtent(timeExtent);

                // operational layer
                var countyLayer = new ArcGISDynamicMapServiceLayer(Config.BOUNDARY_URL, {
                    useMapImage: true,
                    opacity: 0.0
                });
                map.addLayer(countyLayer);

                // Identify Task
                identifyTask = new IdentifyTask(IDENTIFY_URL);
                identifyParams = new IdentifyParameters();
                identifyParams.tolerance = 1;
                identifyParams.returnGeometry = true;
                identifyParams.layerIds = [3, 4];
                identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
                identifyParams.width = map.width;
                identifyParams.height = map.height;
                // map
                map.on("click", mapClickHandler);
                // map update start
                map.on("update-start", UserInterfaceUtils.mapUpdateStartHandler);
                // map update end
                map.on("update-end", UserInterfaceUtils.mapUpdateEndHandler);
                // load geo-coder
                loadGeocoder(map);
                updateMainChart();
                updateAnnualChart();
                updateMonthlyChart();
            }, function (error) {
                //console.log("Error: ", error.code, " Message: ", error.message);
            });

            on(window, "resize", _windowResizeHandler);
        }

        function queryTaskErrorHandler(error) {
            console.debug("ERROR", error);
        }

        function resizeend() {
            if (new Date() - rtime < delta) {
                setTimeout(resizeend, delta);
            } else {
                timeout = false;
                domConstruct.destroy("chartNode");
                domConstruct.place("<div id='chartNode' style='height: 135px;'></div>", query(".chart-container")[0], "first");
                windowGeom = win.getBox();
                updateMainChart();
                runIdentifyTask(selectedMapPoint);
            }
        }

        function updateMainChart() {
            // main chart
            mainChart = new Chart("chartNode");
            // X-axis
            mainChart.addAxis("x", Config.MAIN_TIMELINE_X_AXIS);
            // Y-axis
            mainChart.addAxis("y", Config.MAIN_TIMELINE_Y_AXIS);
            mainChart.addPlot("stackedColumnsPlot", {
                type: StackedColumns,
                areas: true,
                tension: "S"
            });
            mainChart.addSeries(Config.EXCEPTIONAL, exceptionalValues, Config.MAIN_TIMELINE_EXCEPTIONAL_SERIES);
            mainChart.addSeries(Config.EXTREME, extremeValues, Config.MAIN_TIMELINE_EXTREME_SERIES);
            mainChart.addSeries(Config.SEVERE, severeValues, Config.MAIN_TIMELINE_SEVERE_SERIES);
            mainChart.addSeries(Config.MODERATE, moderateValues, Config.MAIN_TIMELINE_MODERATE_SERIES);
            mainChart.addSeries(Config.DRY, dryValues, Config.MAIN_TIMELINE_DRY_SERIES);
            // x-axis styling
            if (query("#chartNode > svg > g:nth-child(7)").length > 0) {
                domStyle.set(query("#chartNode > svg > g:nth-child(7) > line")[0], "stroke-opacity", "0");
                domStyle.set(query("#chartNode > svg > g:nth-child(7) > line")[1], "stroke-opacity", "0");
                domStyle.set(query("#chartNode > svg > g:nth-child(7) > line")[2], "stroke-opacity", "0");
            }
        }

        function updateAnnualChart() {
            var annualChartData = Config.ANNUAL_TIMELINE_CHART_DATA;
            annualChart = new Chart("annualChart");
            annualChart.setTheme(theme);
            var myLabelFunc = function (value) {
                return annualChartData[value - 1].text;
            };
            annualChart.addAxis("x", {
                labelFunc: myLabelFunc,
                majorLabels: true,
                majorTicks: true,
                minorLabels: false,
                minorTicks: false,
                majorTickStep: 1,
                stroke: {
                    color: "#CCC"
                },
                includeZero: false,
                fontColor: "#FFFFFF"
            });
            annualChart.addAxis("y", Config.ANNUAL_TIMELINE_Y_AXIS);
            annualChart.addSeries(Config.EXCEPTIONAL, exceptionalAnnualValues, Config.ANNUAL_TIMELINE_EXCEPTIONAL_SERIES);
            annualChart.addSeries(Config.EXTREME, extremeAnnualValues, Config.ANNUAL_TIMELINE_EXTREME_SERIES);
            annualChart.addSeries(Config.SEVERE, severeAnnualValues, Config.ANNUAL_TIMELINE_SEVERE_SERIES);
            annualChart.addSeries(Config.MODERATE, moderateAnnualValues, Config.ANNUAL_TIMELINE_MODERATE_SERIES);
            annualChart.addSeries(Config.DRY, dryAnnualValues, Config.ANNUAL_TIMELINE_DRY_SERIES);
            annualChart.addPlot("default", {
                type: "Default",
                lines: true,
                markers: true,
                tension: 2,
                animate: {
                    duration: Config.FADE_DURATION
                }
            });

            annualChart.addPlot("grid", {
                type: Grid,
                markers: true,
                vMajorLines: true,
                vMinorLines: true,
                hMajorLines: false,
                hMinorLines: false,
                majorVLine: {
                    color: "#ddd",
                    width: 0.5
                },
                minorVLine: {
                    color: "#ccc",
                    width: 0.5
                }
            });
            var annualTooltip = new Tooltip(annualChart, "default");
            var magnify = new Magnify(annualChart, "default");
            annualChart.render();
            // styling
            domStyle.set(query("#annualChart > svg > rect")[0], "fill-opacity", "0");
            domStyle.set(query("#annualChart > svg > rect")[1], "fill-opacity", "0.1");
        }

        function updateMonthlyChart() {
            // monthly chart
            monthChart = new Chart("monthChart");
            monthChart.addAxis("x", Config.MONTHLY_TIMELINE_X_AXIS);
            monthChart.addAxis("y", Config.MONTHLY_TIMELINE_Y_AXIS);
            monthChart.addSeries(Config.EXCEPTIONAL, exceptionalMonthValues, Config.MONTHLY_EXCEPTIONAL_SERIES);
            monthChart.addSeries(Config.EXTREME, extremeMonthValues, Config.MONTHLY_EXTREME_SERIES);
            monthChart.addSeries(Config.SEVERE, severeMonthValues, Config.MONTHLY_SEVERE_SERIES);
            monthChart.addSeries(Config.MODERATE, moderateMonthValues, Config.MONTHLY_MODERATE_SERIES);
            monthChart.addSeries(Config.DRY, dryMonthValues, Config.MONTHLY_DRY_SERIES);
            monthChart.addPlot("default", {
                type: "Default",
                lies: true,
                markers: true,
                tension: 2,
                animate: {
                    duration: Config.FADE_DURATION
                }
            });
            monthChart.addPlot("grid", {
                type: Grid,
                markers: true,
                vMajorLines: true,
                vMinorLines: true,
                hMajorLines: false,
                hMinorLines: false,
                majorVLine: {
                    color: "#ddd",
                    width: 0.5
                },
                minorVLine: {
                    color: "#ccc",
                    width: 0.5
                }
            });
            var monthTooltip = new Tooltip(monthChart, "default");
            var monthChartMagnify = new Magnify(monthChart, "default");
            monthChart.render();
            domStyle.set(query("#monthChart > svg > rect")[0], "fill-opacity", "0");
            domStyle.set(query("#monthChart > svg > rect")[1], "fill-opacity", "0.1");
        }

        function mapClickHandler(event) {
            // Returns the current zoom level of the map.
            var zoomLevel = map.getZoom();
            if (zoomLevel < 2) {
                // user zoomed to far out
                if (esriLang.isDefined(dom.byId("zoomInDialog"))) {
                    zoomInDialog = null;
                    dijit.byId("zoomInDialog").destroy();
                }
                zoomInDialog = new Dialog({
                    id: "zoomInDialog",
                    title: "",
                    content: lang.replace(Config.ZOOM_TO_DIALOG),
                    style: {
                        "width": "250px"
                    }
                });
                zoomInDialog.show();
                on(query(".zoom-dialog-ok-btn")[0], "click", _zoomDialogOkBtnClickHandler);
                on(zoomInDialog, "hide", _zoomDialogHideHandler);
            } else {
                if (domStyle.get(query(".chart-container")[0], "height") !== 150) {
                    var updateHeight = UserInterfaceUtils.animateUpdateHeight();
                    on(updateHeight, "End", function () {
                        domStyle.set(dom.byId("map"), "bottom", "150px");
                        map.resize();
                        map.reposition();
                    });
                }
                // fade in the charts
                UserInterfaceUtils.fadeInCharts();
                // fade out the instructions
                UserInterfaceUtils.fadeOutMask();
                // store the last selected map point for browser resizing logic
                selectedMapPoint = event.mapPoint;
                // run the identify task logic
                runIdentifyTask(selectedMapPoint);
            }
        }

        function runIdentifyTask(selMapPoint) {
            if (esriLang.isDefined(selMapPoint)) {
                identifyParams.geometry = selMapPoint;
                identifyParams.mapExtent = map.extent;
                identifyTask.execute(identifyParams).then(function (results) {
                    if (results.length > 0 && (results[0].layerId === 3)) {
                        // show loader
                        domStyle.set(LOADING_NODE, "display", "block");
                        // highlight geometry
                        addHighlightGraphic(map, results);
                        // run query
                        var q = new Query();
                        q.returnGeometry = false;
                        q.outFields = ["*"];
                        // FIPS
                        q.where = "countycategories_admin_fips = '" + results[0].feature.attributes.ID + "'";
                        q.orderByFields = ["countycategories_date"];
                        var qt = new QueryTask(queryFeatureServiceURL);
                        // execute a query against the FS
                        qt.execute(q).then(function (res) {
                            // features
                            features = res.features;
                            // set selected county name
                            setSelectedCountyLabel(features);
                            // set selected the date
                            if (mainSeriesClickPoint !== null) {
                                // date other than default was already selected previously, only a new county has been selected
                                dom.byId("selectedDate").innerHTML = UserInterfaceUtils.formatDate(clickedDate);// MONTH_NAMES[clickedDate.getMonth()] + " " + clickedDate.getDate() + ", " + clickedDate.getFullYear();
                            } else {
                                // need to set the initial date and definition expression in case the user just immediately wants to download the latest data/time
                                var initialQueryDate = new Date(parseFloat(features[features.length - 1].attributes.countycategories_date));
                                var initialQueryStartDate = initialQueryDate.getFullYear() + "-" + (initialQueryDate.getMonth() + 1) + "-" + initialQueryDate.getDate();
                                var initialQueryEndDate = initialQueryDate.getFullYear() + "-" + (initialQueryDate.getMonth() + 1) + "-" + (initialQueryDate.getDate() + 1);
                                defExp = "ddate BETWEEN timestamp '" + initialQueryStartDate + "' AND timestamp '" + initialQueryEndDate + "'";
                                dom.byId("selectedDate").innerHTML = UserInterfaceUtils.formatDate(features[features.length - 1].attributes.countycategories_date);
                            }

                            // clear the arrays
                            clearDataStructures();

                            var inTargetMonth = true;
                            array.forEach(features, function (feature) {
                                // populate data structures for the charts
                                var utcSeconds = feature.attributes.countycategories_date;
                                var date = new Date(parseFloat(utcSeconds));
                                var dry = feature.attributes.countycategories_d0;
                                var moderate = feature.attributes.countycategories_d1;
                                var severe = feature.attributes.countycategories_d2;
                                var extreme = feature.attributes.countycategories_d3;
                                var exceptional = feature.attributes.countycategories_d4;

                                //
                                dateValues.push(date);
                                dryValues.push(dry);
                                moderateValues.push(moderate);
                                severeValues.push(severe);
                                extremeValues.push(extreme);
                                exceptionalValues.push(exceptional);

                                // populate data structure for the annual chart
                                var currentMonth = date.getMonth();
                                var today = new Date();
                                var thisMonth = today.getMonth();
                                if (currentMonth === thisMonth) {
                                    if (inTargetMonth) {
                                        dateAnnualValues.push(date);
                                        dryAnnualValues.push(UserInterfaceUtils.formatValue(dry));
                                        moderateAnnualValues.push(UserInterfaceUtils.formatValue(moderate));
                                        severeAnnualValues.push(UserInterfaceUtils.formatValue(severe));
                                        extremeAnnualValues.push(UserInterfaceUtils.formatValue(extreme));
                                        exceptionalAnnualValues.push(UserInterfaceUtils.formatValue(exceptional));
                                        inTargetMonth = false;
                                    }
                                } else {
                                    inTargetMonth = true;
                                }
                            }); // end loop

                            // update main chart
                            mainChart.updateSeries(Config.DRY, dryValues);
                            mainChart.updateSeries(Config.MODERATE, moderateValues);
                            mainChart.updateSeries(Config.SEVERE, severeValues);
                            mainChart.updateSeries(Config.EXTREME, extremeValues);
                            mainChart.updateSeries(Config.EXCEPTIONAL, exceptionalValues);
                            mainChart.render();
                            domStyle.set(query("#chartNode > svg > g:nth-child(7) > line")[0], "stroke-opacity", "0");
                            domStyle.set(query("#chartNode > svg > g:nth-child(7) > line")[1], "stroke-opacity", "0");
                            domStyle.set(query("#chartNode > svg > g:nth-child(7) > line")[2], "stroke-opacity", "0");

                            // mouse mover handler for the main chart
                            chartOffsetLeft = mainChart.calculateGeometry().offsets.l;
                            // #chartNode > svg > rect:nth-child(3)
                            barWidth = query("#chartNode > svg > g:nth-child(5) > g > g:nth-child(1) > rect:nth-child(1)")[0].width.baseVal.value;
                            //console.debug("barWidth", barWidth);
                            on(query("svg")[3], "mousemove", function (evt) {
                                var offsetDiff = (evt.x - chartOffsetLeft) + barWidth;
                                dummyIndex = Math.round(offsetDiff / barWidth);
                                if (dummyIndex >= 0) {
                                    domStyle.set(dom.byId("chart-container-vertical-bar"), "display", "block");
                                    if (dummyIndex <= features.length) {
                                        if (esriLang.isDefined(dateValues[dummyIndex])) {
                                            selectedDate = new Date(dateValues[dummyIndex]);
                                            dateTooltipLabel = Config.MONTH_NAMES[selectedDate.getMonth()] + " " + selectedDate.getDate() + ", " + selectedDate.getFullYear();
                                            dryTooltipLabel = Math.round(dryValues[dummyIndex]);
                                            moderateTooltipLabel = Math.round(moderateValues[dummyIndex]);
                                            severeTooltipLabel = Math.round(severeValues[dummyIndex]);
                                            extremeTooltipLabel = Math.round(extremeValues[dummyIndex]);
                                            exceptionalTooltipLabel = Math.round(exceptionalValues[dummyIndex]);
                                            if (isNaN(dryTooltipLabel)) {
                                                domConstruct.destroy("custom-tooltip-container");
                                            } else {
                                                domStyle.set(dom.byId("chart-container-vertical-bar"), "left", offsetDiff + "px");
                                            }
                                        }
                                    }
                                } else {
                                    domStyle.set(dom.byId("chart-container-vertical-bar"), "display", "none");
                                }
                            });
                            // END mouse move handler

                            // click handler for the main chart
                            on(query("svg")[3], "click", function (evt) {
                                mainSeriesClickPoint = evt.x;
                                var offsetDiff = (mainSeriesClickPoint - chartOffsetLeft) + barWidth;
                                dummyIndex = Math.round(offsetDiff / barWidth);
                                //console.log("MOUSE CLICK (dummyIndex): " + dummyIndex);
                                // assign (window resize logic)
                                newDummyIndex = dummyIndex;
                                if (dummyIndex <= features.length && dummyIndex >= 0) {
                                    if (esriLang.isDefined(dateValues[dummyIndex])) {
                                        selectedDate = new Date(dateValues[dummyIndex]);
                                        clickedDate = selectedDate;
                                        dateTooltipLabel = Config.MONTH_NAMES[selectedDate.getMonth()] + " " + selectedDate.getDate() + ", " + selectedDate.getFullYear();
                                        var startDate = new Date(dateValues[dummyIndex]);
                                        var endDate = new Date(dateValues[dummyIndex]);
                                        var timeExtent = new TimeExtent(startDate, endDate);
                                        map.setTimeExtent(timeExtent);

                                        // update selected date node
                                        dom.byId("selectedDate").innerHTML = dateTooltipLabel;
                                        domStyle.set(scrubber, "left", mainSeriesClickPoint + "px");

                                        // month chart
                                        var _backInTime = dummyIndex - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT;
                                        var tmpDateValues = dateValues.slice(_backInTime, dummyIndex);
                                        var tmpDryValues = dryValues.slice(_backInTime, dummyIndex);
                                        var tmpModerateValues = moderateValues.slice(_backInTime, dummyIndex);
                                        var tmpSevereValues = severeValues.slice(_backInTime, dummyIndex);
                                        var tmpExtremeValues = extremeValues.slice(_backInTime, dummyIndex);
                                        var tmpExceptionalValues = exceptionalValues.slice(_backInTime, dummyIndex);

                                        // convert months to JSON
                                        var dryMonthlyValues = [],
                                            moderateMonthlyValues = [],
                                            severeMonthlyValues = [],
                                            extremeMonthlyValues = [],
                                            exceptionalMonthlyValues = [];
                                        array.forEach(tmpDryValues, function (value, i) {
                                            dryMonthlyValues.push(UserInterfaceUtils.formatValue(tmpDryValues[i]));
                                            moderateMonthlyValues.push(UserInterfaceUtils.formatValue(tmpModerateValues[i]));
                                            severeMonthlyValues.push(UserInterfaceUtils.formatValue(tmpSevereValues[i]));
                                            extremeMonthlyValues.push(UserInterfaceUtils.formatValue(tmpExtremeValues[i]));
                                            exceptionalMonthlyValues.push(UserInterfaceUtils.formatValue(tmpExceptionalValues[i]));
                                        });
                                        monthChart.updateSeries(Config.DRY, dryMonthlyValues);
                                        monthChart.updateSeries(Config.MODERATE, moderateMonthlyValues);
                                        monthChart.updateSeries(Config.SEVERE, severeMonthlyValues);
                                        monthChart.updateSeries(Config.EXTREME, extremeMonthlyValues);
                                        monthChart.updateSeries(Config.EXCEPTIONAL, exceptionalMonthlyValues);
                                        monthChart.render();

                                        // annual chart
                                        dryAnnualValues = [];
                                        moderateAnnualValues = [];
                                        severeAnnualValues = [];
                                        extremeAnnualValues = [];
                                        exceptionalAnnualValues = [];
                                        array.forEach(features, function (feature) {
                                            var utcSeconds = feature.attributes.countycategories_date,
                                                date = new Date(parseFloat(utcSeconds)),
                                                dry = feature.attributes.countycategories_d0,
                                                moderate = feature.attributes.countycategories_d1,
                                                severe = feature.attributes.countycategories_d2,
                                                extreme = feature.attributes.countycategories_d3,
                                                exceptional = feature.attributes.countycategories_d4;
                                            // populate data structure for the annual chart
                                            var currentMonth = date.getMonth(),
                                                currentYear = date.getFullYear();
                                            var selectedMonth = selectedDate.getMonth();
                                            if (currentMonth === selectedMonth) {
                                                if (inTargetMonth) {
                                                    dateAnnualValues.push(date);
                                                    dryAnnualValues.push(UserInterfaceUtils.formatValue(dry));
                                                    moderateAnnualValues.push(UserInterfaceUtils.formatValue(moderate));
                                                    severeAnnualValues.push(UserInterfaceUtils.formatValue(severe));
                                                    extremeAnnualValues.push(UserInterfaceUtils.formatValue(extreme));
                                                    exceptionalAnnualValues.push(UserInterfaceUtils.formatValue(exceptional));
                                                    inTargetMonth = false;
                                                }
                                            } else {
                                                inTargetMonth = true;
                                            }
                                        });
                                        annualChart.updateSeries(Config.DRY, dryAnnualValues);
                                        annualChart.updateSeries(Config.MODERATE, moderateAnnualValues);
                                        annualChart.updateSeries(Config.SEVERE, severeAnnualValues);
                                        annualChart.updateSeries(Config.EXTREME, extremeAnnualValues);
                                        annualChart.updateSeries(Config.EXCEPTIONAL, exceptionalAnnualValues);
                                        annualChart.render();
                                    }
                                }
                            });
                            // END click handler

                            // update annual chart
                            annualChart.updateSeries(Config.DRY, dryAnnualValues);
                            annualChart.updateSeries(Config.MODERATE, moderateAnnualValues);
                            annualChart.updateSeries(Config.SEVERE, severeAnnualValues);
                            annualChart.updateSeries(Config.EXTREME, extremeAnnualValues);
                            annualChart.updateSeries(Config.EXCEPTIONAL, exceptionalAnnualValues);
                            annualChart.render();

                            // update month chart
                            var tmpDateValues = dateValues.slice(Math.max(dateValues.length - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT, 1));
                            var tmpDryValues = dryValues.slice(Math.max(dryValues.length - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT, 1));
                            var tmpModerateValues = moderateValues.slice(Math.max(moderateValues.length - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT, 1));
                            var tmpSevereValues = severeValues.slice(Math.max(severeValues.length - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT, 1));
                            var tmpExtremeValues = extremeValues.slice(Math.max(extremeValues.length - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT, 1));
                            var tmpExceptionalValues = exceptionalValues.slice(Math.max(exceptionalValues.length - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT, 1));

                            // convert months to JSON
                            var dryMonthlyValues = [],
                                moderateMonthlyValues = [],
                                severeMonthlyValues = [],
                                extremeMonthlyValues = [],
                                exceptionalMonthlyValues = [];
                            array.forEach(tmpDryValues, function (value, i) {
                                dryMonthlyValues.push(UserInterfaceUtils.formatValue(tmpDryValues[i]));
                                moderateMonthlyValues.push(UserInterfaceUtils.formatValue(tmpModerateValues[i]));
                                severeMonthlyValues.push(UserInterfaceUtils.formatValue(tmpSevereValues[i]));
                                extremeMonthlyValues.push(UserInterfaceUtils.formatValue(tmpExtremeValues[i]));
                                exceptionalMonthlyValues.push(UserInterfaceUtils.formatValue(tmpExceptionalValues[i]));
                            });

                            monthChart.updateSeries(Config.DRY, dryMonthlyValues);
                            monthChart.updateSeries(Config.MODERATE, moderateMonthlyValues);
                            monthChart.updateSeries(Config.SEVERE, severeMonthlyValues);
                            monthChart.updateSeries(Config.EXTREME, extremeMonthlyValues);
                            monthChart.updateSeries(Config.EXCEPTIONAL, exceptionalMonthlyValues);
                            monthChart.render();

                            // main chart mouse move handler
                            on(dom.byId("chartNode"), "mousemove", chartMouseMoveHandler);
                            // main chart mouse out handler
                            on(dom.byId("chartNode"), "mouseout", UserInterfaceUtils.chartMouseOutHandler);

                            // main chart vertical mouse-over bar
                            if (dom.byId("chart-container-vertical-bar") === null) {
                                domConstruct.create("div", {
                                    id: "chart-container-vertical-bar",
                                    style: {
                                        "display": "block",
                                        "position": "absolute",
                                        "zIndex": "1000",
                                        "height": "115px",
                                        "width": "1px",
                                        "left": "22px",
                                        "bottom": "25px",
                                        "backgroundColor": "rgb(97, 97, 97)",
                                        "opacity": "0.5",
                                        "pointer-events": "none"
                                    },
                                    innerHTML: "<div class='chart-container-vertical-bar-style'></div>"
                                }, query("svg")[3], "before");
                            }

                            var mainChartWidth = query("#chartNode > svg > rect:nth-child(3)")[0].width.baseVal.value;

                            // main chart scrubber
                            if (dom.byId("scrubber") === null) {
                                // create the scrubber
                                domConstruct.create("div", {
                                    id: "scrubber",
                                    style: {
                                        "display": "block",
                                        "position": "absolute",
                                        "zIndex": "1000",
                                        "height": "120px",
                                        "width": "1px",
                                        "left": (mainChartWidth + 18) + "px",
                                        "backgroundColor": "rgb(97, 97, 97)",
                                        "opacity": "0.90"
                                    },
                                    innerHTML: '<div id="scrubber-thumb">' +
                                    '  <div class="arrow-left"></div>' +
                                    '  <div class="arrow-right"></div>' +
                                    '</div>'
                                }, query("svg")[3], "before");

                                // scrubber node
                                scrubber = dom.byId("scrubber");

                                var dndAreaNode = dom.byId("dndArea");
                                domStyle.set(dndAreaNode, "width", (mainChartWidth + 18) + "px");

                                var computedStyle = domStyle.getComputedStyle(dndAreaNode);
                                var dndContentBox = domGeom.getContentBox(dndAreaNode, computedStyle);
                                var pcm = new dojo.dnd.move.boxConstrainedMoveable(scrubber, {
                                    box: dndContentBox,
                                    within: true
                                });

                                // scrubber has started moving
                                dojo.connect(pcm, "onMoveStart", function (mover) {
                                    //console.log("SCRUBBER DRAG START");
                                    domStyle.set(dom.byId("chart-container-vertical-bar"), "opacity", "0");
                                });

                                // scrubber is moving
                                dojo.connect(pcm, "onMove", function (mover) {
                                    //console.log("DRAGGING scrubber...");
                                    var offsetDiff = (domStyle.get(scrubber, "left") - chartOffsetLeft) + barWidth;
                                    var newDummyIndex = Math.round(offsetDiff / barWidth);
                                    if (newDummyIndex <= features.length && newDummyIndex >= 0) {
                                        if (esriLang.isDefined(dateValues[newDummyIndex])) {
                                            selectedDate = new Date(dateValues[newDummyIndex]);
                                            dateTooltipLabel = Config.MONTH_NAMES[selectedDate.getMonth()] + " " + selectedDate.getDate() + ", " + selectedDate.getFullYear();
                                            dryTooltipLabel = Math.round(dryValues[newDummyIndex]);
                                            moderateTooltipLabel = Math.round(moderateValues[newDummyIndex]);
                                            severeTooltipLabel = Math.round(severeValues[newDummyIndex]);
                                            extremeTooltipLabel = Math.round(extremeValues[newDummyIndex]);
                                            exceptionalTooltipLabel = Math.round(exceptionalValues[newDummyIndex]);
                                            if (dryTooltipLabel !== undefined) {
                                                domStyle.set(dom.byId("chart-container-vertical-bar"), "left", offsetDiff + "px");
                                            } else {
                                                domConstruct.destroy("custom-tooltip-container");
                                            }
                                        }
                                    }
                                });

                                // scrubber has stopped moving
                                dojo.connect(pcm, "onMoveStop", function (mover) {
                                    //console.log("SCRUBBER DRAG STOP");
                                    domStyle.set(dom.byId("chart-container-vertical-bar"), "opacity", "1.0");
                                    var offsetDiff = (domStyle.get(scrubber, "left") - chartOffsetLeft) + barWidth;
                                    // g index
                                    newDummyIndex = Math.round(offsetDiff / barWidth);
                                    //console.log("newDummyIndex: " + newDummyIndex);
                                    mainSeriesClickPoint = offsetDiff;
                                    if (newDummyIndex <= features.length && newDummyIndex >= 0) {
                                        if (esriLang.isDefined(dateValues[newDummyIndex])) {
                                            selectedDate = new Date(dateValues[newDummyIndex]);
                                            clickedDate = selectedDate;
                                            // date label
                                            dateTooltipLabel = Config.MONTH_NAMES[selectedDate.getMonth()] + " " + selectedDate.getDate() + ", " + selectedDate.getFullYear();
                                            var startDate = new Date(dateValues[newDummyIndex]);
                                            var endDate = new Date(dateValues[newDummyIndex]);
                                            var timeExtent = new TimeExtent(startDate, endDate);
                                            map.setTimeExtent(timeExtent);
                                            dom.byId("selectedDate").innerHTML = dateTooltipLabel;

                                            var _backInTime = newDummyIndex - Config.MONTH_CHART_PREVIOUS_WEEK_COUNT;
                                            var tmpDryValues = dryValues.slice(_backInTime, newDummyIndex);
                                            var tmpModerateValues = moderateValues.slice(_backInTime, newDummyIndex);
                                            var tmpSevereValues = severeValues.slice(_backInTime, newDummyIndex);
                                            var tmpExtremeValues = extremeValues.slice(_backInTime, newDummyIndex);
                                            var tmpExceptionalValues = exceptionalValues.slice(_backInTime, newDummyIndex);
                                            // convert months to JSON
                                            var dryMonthlyValues = [],
                                                moderateMonthlyValues = [],
                                                severeMonthlyValues = [],
                                                extremeMonthlyValues = [],
                                                exceptionalMonthlyValues = [];
                                            array.forEach(tmpDryValues, function (value, i) {
                                                dryMonthlyValues.push(UserInterfaceUtils.formatValue(tmpDryValues[i]));
                                                moderateMonthlyValues.push(UserInterfaceUtils.formatValue(tmpModerateValues[i]));
                                                severeMonthlyValues.push(UserInterfaceUtils.formatValue(tmpSevereValues[i]));
                                                extremeMonthlyValues.push(UserInterfaceUtils.formatValue(tmpExtremeValues[i]));
                                                exceptionalMonthlyValues.push(UserInterfaceUtils.formatValue(tmpExceptionalValues[i]));
                                            });
                                            monthChart.updateSeries(Config.DRY, dryMonthlyValues);
                                            monthChart.updateSeries(Config.MODERATE, moderateMonthlyValues);
                                            monthChart.updateSeries(Config.SEVERE, severeMonthlyValues);
                                            monthChart.updateSeries(Config.EXTREME, extremeMonthlyValues);
                                            monthChart.updateSeries(Config.EXCEPTIONAL, exceptionalMonthlyValues);
                                            monthChart.render();

                                            // annual chart
                                            dryAnnualValues = [];
                                            moderateAnnualValues = [];
                                            severeAnnualValues = [];
                                            extremeAnnualValues = [];
                                            exceptionalAnnualValues = [];
                                            array.forEach(features, function (feature) {
                                                var utcSeconds = feature.attributes.countycategories_date,
                                                    date = new Date(parseFloat(utcSeconds)),
                                                    dry = feature.attributes.countycategories_d0,
                                                    moderate = feature.attributes.countycategories_d1,
                                                    severe = feature.attributes.countycategories_d2,
                                                    extreme = feature.attributes.countycategories_d3,
                                                    exceptional = feature.attributes.countycategories_d4;
                                                // populate data structure for the annual chart
                                                var currentMonth = date.getMonth();
                                                var selectedMonth = selectedDate.getMonth();
                                                if (currentMonth === selectedMonth) {
                                                    if (inTargetMonth) {
                                                        dateAnnualValues.push(date);
                                                        dryAnnualValues.push(UserInterfaceUtils.formatValue(dry));
                                                        moderateAnnualValues.push(UserInterfaceUtils.formatValue(moderate));
                                                        severeAnnualValues.push(UserInterfaceUtils.formatValue(severe));
                                                        extremeAnnualValues.push(UserInterfaceUtils.formatValue(extreme));
                                                        exceptionalAnnualValues.push(UserInterfaceUtils.formatValue(exceptional));
                                                        inTargetMonth = false;
                                                    }
                                                } else {
                                                    inTargetMonth = true;
                                                }
                                            });
                                            annualChart.updateSeries(Config.DRY, dryAnnualValues);
                                            annualChart.updateSeries(Config.MODERATE, moderateAnnualValues);
                                            annualChart.updateSeries(Config.SEVERE, severeAnnualValues);
                                            annualChart.updateSeries(Config.EXTREME, extremeAnnualValues);
                                            annualChart.updateSeries(Config.EXCEPTIONAL, exceptionalAnnualValues);
                                            annualChart.render();
                                        }
                                    }
                                });

                                dojo.connect(pcm, "onMouseDown", function (mover) {
                                    domStyle.set(scrubber, "cursor", "ew-resize");
                                });

                                dojo.connect(pcm, "onMouseUp", function (mover) {
                                    domStyle.set(scrubber, "cursor", "default");
                                    domStyle.set(dom.byId("chart-container-vertical-bar"), "opacity", "1.0");
                                });
                            }
                            // hide loader
                            domStyle.set(LOADING_NODE, "display", "none");
                            // show selected date container
                            domStyle.set(dom.byId("selectedDateContainer"), "display", "block");

                            // if the user resized the window, we need to retain the location of the scrubber
                            var selectedY_verticalBar = query("#chartNode > svg > g:nth-child(5) > g > g:nth-child(1) > rect:nth-child(" + newDummyIndex + ")")[0];
                            if (esriLang.isDefined(selectedY_verticalBar)) {
                                domStyle.set(scrubber, "left", selectedY_verticalBar.x.baseVal.value + "px");
                            }
                        });
                    }
                });
            }
        }

        function chartMouseMoveHandler(evt) {
            var _cx = evt.x;
            if (_cx > (windowGeom.w - 160)) {
                _cx = (windowGeom.w - 160);
            }

            // destroy previous tooltip container
            domConstruct.destroy("custom-tooltip-container");

            if (!isNaN(dryTooltipLabel)) {
                // create the new tooltip container
                domConstruct.create("div", {
                        id: "custom-tooltip-container",
                        class: "customTooltip",
                        style: {
                            "position": "absolute",
                            "zIndex": "2000",
                            "width": "150px",
                            "left": _cx + "px",
                            "bottom": "150px",
                            "backgroundColor": "rgb(97, 97, 97)",
                            "opacity": "0.95",
                            "borderRadius": "5px",
                            "color": "#FFF",
                            "-webkit-font-smoothing": "antialiased"
                        },
                        innerHTML: lang.replace(Config.TOOLTIP_CONTAINER, {
                            "dateTooltipLabel": dateTooltipLabel,
                            "dryTooltipLabel": dryTooltipLabel,
                            "moderateTooltipLabel": moderateTooltipLabel,
                            "severeTooltipLabel": severeTooltipLabel,
                            "extremeTooltipLabel": extremeTooltipLabel,
                            "exceptionalTooltipLabel": exceptionalTooltipLabel
                        })
                    },
                    dom.byId("map"), "before");
                domStyle.set(dom.byId("chart-container-vertical-bar"), "left", evt.x + "px");
            }
            dummyIndex = null;
        }

        function addHighlightGraphic(map, results) {
            map.graphics.clear();
            var geometry = results[0].feature.geometry,
                highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 0.95]), 1), new Color([125, 125, 125, 0.30])),
                highlightGraphic = new Graphic(geometry, highlightSymbol);
            map.graphics.add(highlightGraphic);
        }

        function loadGeocoder(map) {
            var geocoder = new Geocoder({
                map: map,
                arcgisGeocoder: {
                    placeholder: "Search"
                }
            }, "search");
            geocoder.startup();
            on(geocoder, "find-results", function (geocodeResults) {
                if (geocodeResults.results.results.length > 0) {
                    var newExtent = new Extent(geocodeResults.results.results[0].extent);
                    // Returns the center point of the extent in map units.
                    selectedMapPoint = newExtent.getCenter();
                    // run the identify task logic
                    runIdentifyTask(selectedMapPoint);
                } else {
                    // no results
                }
            });
        }

        function clearDataStructures() {
            // empty data structures
            // main chart
            dateValues = [];
            dryValues = [];
            moderateValues = [];
            severeValues = [];
            extremeValues = [];
            exceptionalValues = [];
            // annual chart
            dryAnnualValues = [];
            moderateAnnualValues = [];
            severeAnnualValues = [];
            extremeAnnualValues = [];
            exceptionalAnnualValues = [];
            // month chart
            dryMonthValues = [];
            moderateMonthValues = [];
            severeMonthValues = [];
            extremeMonthValues = [];
            exceptionalMonthValues = [];
        }

        function setSelectedCountyLabel(features) {
            selectedLocation = features[0].attributes.countycategories_name + ", " + features[0].attributes.countycategories_stateabb;
            dom.byId("selectedCounty").innerHTML = selectedLocation;
        }

        function _zoomDialogOkBtnClickHandler() {
            zoomInDialog.destroy();
        }

        function _zoomDialogHideHandler() {
            zoomInDialog.destroy();
        }

        function _learnMoreLinkClickHandler() {
            window.open(Config.LEARN_MORE_LINK_1, "_blank");
        }

        function _droughtDataLinkClickHandler() {
            window.open(Config.DROUGHT_DATA_LINK, "_blank");
        }

        function _windowResizeHandler() {
            rtime = new Date();
            if (timeout === false) {
                timeout = true;
                setTimeout(resizeend, delta);
            }
        }

        function _saveLayerBtnClickHander() {
            // SAVE dialog
            if (esriLang.isDefined(dom.byId("saveLayerDialog"))) {
                dijit.byId("saveLayerDialog").destroy();
            }
            saveLayerDialog = new Dialog({
                id: "saveLayerDialog",
                title: "Save As Layer",
                style: {
                    "width": "700px",
                    "height": "510px"
                },
                content: lang.replace(Config.SAVE_DIALOG)
            });

            // set the snippet and description for the user
            var suggestedTitle = Config.NEW_ITEM_TITLE + selectedLocation + " | " + dom.byId("selectedDate").innerText;
            domAttr.set(query(".new-layer-title")[0], "value", suggestedTitle);
            domAttr.set(query(".new-layer-snippet")[0], "value", itemResponse.item.snippet);

            descriptionEditor = new Editor({
                plugins: Config.EDITOR_PLUGINS,
                innerHTML: itemResponse.item.description
            }, query(".new-layer-description")[0]);
            descriptionEditor.startup();

            on(saveLayerDialog, "hide", function () {
                saveLayerDialog.destroy();
            });

            on(query(".dialog-ok-btn")[0], "click", function () {
                itemTitle = query(".new-layer-title")[0].value;
                itemSnippet = query(".new-layer-snippet")[0].value;
                itemDescription = descriptionEditor.attr("value");

                if (clickedDate !== "") {
                    var selectedStartDate = clickedDate.getFullYear() + "-" + (clickedDate.getMonth() + 1) + "-" + clickedDate.getDate();
                    var selectedEndDate = clickedDate.getFullYear() + "-" + (clickedDate.getMonth() + 1) + "-" + (clickedDate.getDate() + 1);
                    defExp = "ddate BETWEEN timestamp '" + selectedStartDate + "' AND timestamp '" + selectedEndDate + "'";
                }
                tags = itemResponse.item.tags.join();
                currentExtent = [];
                var lowerLeft = new Point(map.extent.xmin, map.extent.ymin);
                var lowerLeft_x = webMercatorUtils.webMercatorToGeographic(lowerLeft).x;
                var lowerLeft_y = webMercatorUtils.webMercatorToGeographic(lowerLeft).y;
                currentExtent.push(lowerLeft_x);
                currentExtent.push(lowerLeft_y);
                var upperRight = new Point(map.extent.xmax, map.extent.ymax);
                var upperRight_x = webMercatorUtils.webMercatorToGeographic(upperRight).x;
                var upperRight_y = webMercatorUtils.webMercatorToGeographic(upperRight).y;
                currentExtent.push(upperRight_x);
                currentExtent.push(upperRight_y);

                if (itemTitle.length > 1) {
                    // user has entered a valid item title
                    esriRequest({
                            url: window.location.protocol + "//" + Config.SHARING_CONTENT_URL + userID + "/addItem",
                            content: {
                                f: "json",
                                url: Config.DROUGHT_FS, //Config.DROUGHT_BY_COUNTY_FS_SECURE,
                                title: itemTitle,
                                snippet: itemSnippet,
                                description: itemDescription,
                                accessInformation: itemResponse.item.accessInformation,
                                licenseInfo: itemResponse.item.licenseInfo,
                                tags: tags,
                                thumbnailurl: generatedThumbnailUrl,
                                extent: currentExtent.join(),//[-119.465, 33.022, -117.026, 34.881].join(),
                                type: "Feature Service",
                                text: JSON.stringify({
                                    "layers": [
                                        {
                                            "id": 0,
                                            "layerDefinition": {
                                                "definitionExpression": defExp
                                            }
                                        }
                                    ]
                                })
                            }
                        }, {
                            usePost: true
                        }
                    ).then(function (response) {
                        if (response.success) {
                            saveLayerDialog.hide();
                            // display the SUCCESS dialog
                            if (esriLang.isDefined(dom.byId("successDialog"))) {
                                dijit.byId("successDialog").destroy();
                            }

                            var successDialog = new Dialog({
                                id: "successDialog",
                                title: "Layer Saved",
                                content: lang.replace(Config.SUCCESS_DIALOG, {
                                    "itemTitle": itemTitle
                                }),
                                style: "width: 450px"
                            });
                            on(query(".dialog-ok-success-btn")[0], "click", function () {
                                successDialog.destroy();
                            });
                            on(successDialog, "hide", function () {
                                successDialog.destroy();
                            });
                            successDialog.show();
                        } else {
                            // display the ERROR dialog
                            if (esriLang.isDefined(dom.byId("errorDialog"))) {
                                dijit.byId("errorDialog").destroy();
                            }
                            var errorDialog = new Dialog({
                                id: "errorDialog",
                                title: "Error saving layer",
                                content: lang.replace(Config.ERROR_DIALOG, {
                                    "itemTitle": itemTitle
                                }),
                                style: "width: 450px"
                            });
                            on(query(".dialog-ok-error-btn")[0], "click", function () {
                                errorDialog.destroy();
                            });
                            on(errorDialog, "hide", function () {
                                errorDialog.destroy();
                            });
                            errorDialog.show();
                        }
                    });
                } else {
                    domStyle.set(query(".no-title-msg")[0], "color", "red");
                }
            });

            on(query(".dialog-cancel-btn")[0], "click", function () {
                saveLayerDialog.hide();
            });
            saveLayerDialog.show();

            // The PrintTask class generates a printer-ready version of the map using an Export Web Map
            // Task. The PrintTask class is used when you want more granular control of the user interface
            // for example, if you want to provide users the ability to define what appears on the printed
            // page. View the Print widget for an out-of-the-box widget that provides a simple user
            // interface for printing maps.
            var printTask = new PrintTask(Config.PRINT_URL);
            // Define the layout template options used by the PrintTask and Print widget to generate the
            // print page.
            var template = new PrintTemplate();
            template.exportOptions = {
                width: 200,
                height: 133,
                dpi: 96
            };
            template.format = "PNG8";
            template.layout = "MAP_ONLY";
            template.preserveScale = false;
            template.showAttribution = false;
            // Input parameters for the PrintTask.
            var params = new PrintParameters();
            params.template = template;
            params.map = map;
            printTask.execute(params, function (obj) {
                var thumbnailUrl = obj.url;
                generatedThumbnailUrl = thumbnailUrl;
                var thumbnailImgNode = query(".item-thumbnail")[0];
                domStyle.set(thumbnailImgNode, "display", "block");
                domAttr.set(thumbnailImgNode, "src", thumbnailUrl);
                domStyle.set(query(".item-thumbnail-placeholder")[0], "display", "none");
                domStyle.set(query(".item-thumbnail-loader")[0], "display", "none");
            });
        }
    });
});