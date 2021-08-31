import "../../style/index.scss";
import config from './config.json';

import { loadCss, loadModules } from 'esri-loader';

import * as AgricultureComponent from './components/agriculture';
import * as BookmarksComponent from './components/bookmarks/index';
import * as Conditions from './components/conditions/index';
import * as Chart from './components/charts/index';
import * as ErrorHandler from './utils/ErrorHandler';
import * as FormatUtils from './utils/FormatUtils';
import * as HistoryComponent from './components/history/index';
import * as HomeComponent from './components/home/index';
import * as LayerUtils from './utils/LayerUtils';
import * as LocationComponent from './components/location/index';
import * as Mobile from './utils/Mobile';
import * as Outlook from './components/Outlook';
import * as QueryUtils from './utils/QueryUtils';
import * as Scrim from "./components/scrim";
import * as SearchComponent from './components/search/index';
import * as ZoomComponent from './components/zoom/index';

import * as calcite from "calcite-web";
import * as d3 from "d3";
import { format } from 'date-fns';

(async () => {

    // initialize calcite
    calcite.init();
    // esri styles
    loadCss();

    loadModules([
        "esri/WebMap",
        "esri/geometry/Point",
        "esri/Graphic",
        "esri/geometry/Extent",
        "esri/views/MapView",
        "esri/core/watchUtils"
    ]).then(([WebMap, Point, Graphic, Extent, MapView, watchUtils]) => {

        const isMobile = Mobile.isMobileBrowser();

        // Cache DOM elements
        let dataComponentLoadingIndicator = document.getElementById("dataComponentLoader");
        let bottomComponent = document.getElementById("bottomComponent");
        let countyButtonEle = document.getElementsByClassName("county");
        let stateButtonEle = document.getElementsByClassName("state");
        // data model
        let inputDataset = [];
        // selected date
        let selectedDateObj = {};

        // The URLSearchParams spec defines an interface and convenience methods for working with the query string of a
        // URL (e.g. everything after "?"). This means no more regex'ing and string splitting URLs!
        let params = new URLSearchParams(location.search);
        // url params
        let selectedX = parseFloat(params.get("x"));
        let selectedY = parseFloat(params.get("y"));
        config.selected.adminAreaId = params.get("admin") || config.COUNTY_ADMIN;
        params.set("admin", config.selected.adminAreaId);
        // If there was no selected point, do not append it to the URL
        window.history.replaceState({}, '', `${location.pathname}?${params}`);

        // Hydrate the boundary query from url params
        let boundaryQueryUrl = "";
        let boundaryQueryOutFields = [];
        if (config.selected.adminAreaId === config.COUNTY_ADMIN) {
            boundaryQueryUrl = config.county_boundary;
            boundaryQueryOutFields = config.county_boundary_outfields;
        } else {
            boundaryQueryUrl = config.state_boundary;
            boundaryQueryOutFields = config.state_boundary_outfields;
            // update admin toggle buttons
            for (let i = 0, max = countyButtonEle.length; i < max; i++) {
                countyButtonEle.checked = false;
            }
            for (let i = 0, max = stateButtonEle.length; i < max; i++) {
                stateButtonEle.checked = true;
            }
        }

        config.boundaryQuery = {
            url: boundaryQueryUrl,
            returnGeometry: true,
            outFields: boundaryQueryOutFields,
            geometry: new Point({
                "x": selectedX,
                "y": selectedY,
                "spatialReference": {
                    "wkid": 3857
                },
                "type": "point"
            }),
            q: ""
        };

        // MapView
        let mapView = null;

        // Fetch the latest date in the service
        // We will use the response to apply the correct Time Extent to the drought layer
        // This query also doubles as a check to determine if the drought feature service is operational.
        // If this query returns an error the entire app is un-usable.
        QueryUtils.fetchData({
            url: config.droughtURL + "2?resultRecordCount=1",
            returnGeometry: false,
            orderByFields: ["ddate desc"],
            outFields: ["ddate"],
            q: ""
        }).then(mostRecentRecordHandler).catch(ErrorHandler.hydrateErrorAlert);

        function mostRecentRecordHandler(response) {
            const { features } = response;
            selectedDateObj = selectedDateHandler(parseInt(params.get("date")) || features[0].attributes.ddate);

            let webMap = new WebMap({
                portalItem: {
                    id: config.webMapId
                }
            });
            webMap.when(webMapLoadedSuccessHandler, ErrorHandler.hydrateWebMapErrorAlert);

            mapView = new MapView({
                container: "viewDiv",
                map: webMap,
                constraints: {
                    snapToZoom: true,
                    rotationEnabled: false,
                    minScale: config.mapViewMinScale,
                    maxScale: config.mapViewMaxScale
                },
                padding: {
                    bottom: 320 // Same value as the #sidebar width in CSS
                },
                ui: {
                    components: []
                }
            });
            mapView.when(viewLoadedSuccessHandler, ErrorHandler.hydrateMapViewErrorAlert);

            watchUtils.whenTrue(mapView, "stationary", viewStationaryHandler);
        }

        function webMapLoadedSuccessHandler(response) {
            // TODO
        }

        function viewLoadedSuccessHandler(response) {
            // zoom
            ZoomComponent.init({
                view: response,
                position: config.widgetPositions.zoom
            });

            // home
            HomeComponent.init({
                view: response,
                position: config.widgetPositions.home
            });

            // bookmarks
            BookmarksComponent.init({
                view: response
            });

            // search
            SearchComponent.init({
                view: response,
                position: ""
            }).then(response => {
                response.on("search-complete", event => {
                    const feature = event.results[0].results[0].feature;
                    config.boundaryQuery.geometry = feature.geometry;
                    mapClickHandler({
                        "mapPoint": new Point({
                            "x": feature.geometry.x,
                            "y": feature.geometry.y,
                            "spatialReference": {
                                "wkid": 3857
                            },
                            "type": "point"
                        })
                    });
                });
            }, error => {
                console.debug(error)
            });

            response.ui.add("topComponent", "top-right");

            response.on("click", mapClickHandler);

            let params = new URLSearchParams(location.search);
            let urlExtent = new Extent({
                "xmin": params.get("xmin") || response.map.initialViewProperties.viewpoint.targetGeometry.xmin,
                "ymin": params.get("ymin") || response.map.initialViewProperties.viewpoint.targetGeometry.ymin,
                "xmax": params.get("xmax") || response.map.initialViewProperties.viewpoint.targetGeometry.xmax,
                "ymax": params.get("ymax") || response.map.initialViewProperties.viewpoint.targetGeometry.ymax,
                "spatialReference": {
                    "wkid": 3857
                }
            });
            response.goTo(urlExtent)
                .catch(function(error) {
                    if (error.name !== "AbortError") {
                        console.error(error);
                    }
                });

            LayerUtils.addLayer({
                "url": config.droughtURL,
                "start": selectedDateObj.startDate,
                "end": selectedDateObj.endDate,
                "title": config.drought_layer_name,
                "view": response
            });

            if (!isNaN(selectedX) && !isNaN(selectedY)) {
                mapClickHandler(null);
            }

            // splash screen
            calcite.addClass(document.getElementById("splash"), "hide");
            calcite.addClass(document.getElementById("appLoadingIndicator"), "hide");
            document.getElementsByClassName("info-modal")[0].style.display = "";
            document.getElementById("topComponent").style.display = "";

            document.querySelectorAll(".radio-group-input").forEach(ele => {
                ele.addEventListener("click", event => {
                    config.selected.adminAreaId = event.target.dataset.adminAreaId;
                    if (config.selected.adminAreaId === config.COUNTY_ADMIN) {
                        config.boundaryQuery.url = config.county_boundary;
                        config.boundaryQuery.outFields = config.county_boundary_outfields;
                    } else if (config.selected.adminAreaId === config.STATE_ADMIN) {
                        config.boundaryQuery.url = config.state_boundary;
                        config.boundaryQuery.outFields = config.state_boundary_outfields;
                    }

                    const params = new URLSearchParams(location.search);
                    params.set("admin", config.selected.adminAreaId);
                    window.history.replaceState({}, '', `${location.pathname}?${params}`);
                    selectedX = parseFloat(params.get("x"));
                    selectedY = parseFloat(params.get("y"));

                    config.boundaryQuery.geometry.x = selectedX;
                    config.boundaryQuery.geometry.y = selectedY;
                    config.boundaryQuery.geometry.type = "point";

                    if (!isNaN(selectedX) && !isNaN(selectedY)) {
                        mapClickHandler(null);
                    } else {
                        let dateFromUrl = params.get("date") || new Date(inputDataset[inputDataset.length - 1].date);
                        Scrim.showScrim({
                            "mostRecentDate": new Date(inputDataset[inputDataset.length - 1].date),
                            "selectedDate": new Date(parseInt(dateFromUrl))
                        });
                    }
                });
            });

            document.querySelectorAll(".reset-chart-btn").forEach(ele => {
                ele.addEventListener('click', event => {
                    // most recent date
                    let mostRecentDate = new Date(inputDataset[inputDataset.length - 1].date).getTime();
                    // set the scrubber on the most recent date
                    Chart.setSelectedEvent(d3.select("rect[id='" + mostRecentDate + "']"));
                    let initXPosition = d3.select("rect[id='" + mostRecentDate + "']").attr("x");
                    // mouse-over scrubber
                    Chart.setScrubberPosition(initXPosition);
                    // scrubber tooltip text
                    let formattedDate = FormatUtils.getFormattedDate(new Date(mostRecentDate));
                    d3.select(".click-scrubber-text").text(formattedDate);

                    let endDate = new Date(inputDataset[inputDataset.length - 1].date);
                    let startDate = new Date(endDate.getTime() - (60 * 60 * 24 * 7 * 1000));
                    let urlSearchParams = new URLSearchParams(location.search);
                    urlSearchParams.set("date", mostRecentDate.toString());
                    window.history.replaceState({}, '', `${location.pathname}?${urlSearchParams}`);

                    HistoryComponent.updateDroughtPercentage(inputDataset[inputDataset.length - 1]["d1_d4"]);

                    // update ag layer visibility
                    LayerUtils.toggleLayer(mapView, {
                        "mostRecentDate": new Date(inputDataset[inputDataset.length - 1].date),
                        "selectedDate": endDate
                    });
                    // remove drought layer
                    LayerUtils.removeLayers(mapView);
                    // add drought layer
                    LayerUtils.addLayer({
                        "url": config.droughtURL,
                        "start": startDate,
                        "end": endDate,
                        "title": config.drought_layer_name,
                        "view": mapView
                    });

                    // hide the scrim
                    Scrim.showScrim({
                        "mostRecentDate": new Date(),
                        "selectedDate": new Date(),
                    });
                });
            });

            document.querySelectorAll(".reset-app-btn").forEach(ele => {
                ele.addEventListener("click", event => {
                    bottomComponent.style.display = "none";
                    for (const graphic of mapView.graphics){
                        if (graphic.attributes === "BOUNDARY") {
                            mapView.graphics.remove(graphic);
                        }
                    }
                    Scrim.showScrim({
                        "mostRecentDate": new Date(),
                        "selectedDate": new Date()
                    });
                });
            });

            if (isMobile) {
                // TODO: A mess!
                document.getElementById("topComponent").style.width = "100%";
                document.getElementsByClassName("subheading")[0].style.display = "none";
                document.getElementsByClassName("drawer-btn")[0].style.display = "";
                document.getElementsByClassName("information-icon")[0].style.display = "none";
                document.getElementById("administrativeSubdivision").style.display = "none";
                document.getElementsByClassName("m-flex-item")[0].style.margin = "";
                document.getElementsByClassName("historic-data-container")[0].style.margin = "";
                document.getElementById("bottomComponent").style.maxHeight = "400px";
                document.getElementById("bottomComponent").style.overflowY = "scroll";

                document.getElementsByClassName("esri-ui-inner-container")[0].style.inset = "unset";
                document.getElementsByClassName("esri-ui-inner-container")[0].style.width = "100%";
                document.getElementsByClassName("esri-ui-top-right")[0].style.inset = "unset";
                document.getElementsByClassName("esri-ui-top-right")[0].style.width = "100%";
            }

            Promise.all([
                QueryUtils.fetchData(config.qParams.outlook.monthly.date).catch(error => { return error }),
                QueryUtils.fetchData(config.qParams.outlook.seasonal.date).catch(error => { return error }),
            ]).then(([monthlyDate, seasonalDate]) => {
                Outlook.monthlyDroughtOutlookDateResponseHandler(monthlyDate);
                Outlook.seasonalDroughtOutlookDateResponseHandler(seasonalDate);
            }).catch(err => console.debug(err));
        }

        function mapClickHandler(event) {
            const params = new URLSearchParams(location.search);
            if (event !== null) {
                config.boundaryQuery.geometry = event.mapPoint;
                params.set("x", event.mapPoint.x);
                params.set("y", event.mapPoint.y);
                window.history.replaceState({}, '', `${location.pathname}?${params}`);
            } else {
                selectedX = parseFloat(params.get("x"));
                selectedY = parseFloat(params.get("y"));
                config.boundaryQuery.geometry = new Point({
                    "x": selectedX,
                    "y": selectedY,
                    "spatialReference": {
                        "wkid": 3857
                    },
                    "type": "point"
                })
            }

            QueryUtils.fetchData(config.boundaryQuery).then(retrieveGeometryResponseHandler).then(response => {
                if (response.features.length > 0) {
                    bottomComponent.style.display = "";
                    dataComponentLoadingIndicator.setAttribute("active", "");

                    let selectedFeature = response.features[0];
                    config.selected.state_name = selectedFeature.attributes["STATE_NAME"];

                    // Severe Drought conditions for n number of weeks
                    let agrQuery = "";

                    let selectedFIPS = "";
                    if (config.selected.adminAreaId === config.COUNTY_ADMIN) {
                        selectedFIPS = selectedFeature.attributes["CountyFIPS"];
                        agrQuery = `CountyFIPS = '${selectedFIPS}'`;
                        config.qParams.severeDroughtConditions.url = config.droughtURL + "1";
                        config.qParams.historicDroughtConditions.url = config.droughtURL + "1";
                    } else if (config.selected.adminAreaId === config.STATE_ADMIN) {
                        selectedFIPS = selectedFeature.attributes["STATE_FIPS"];
                        agrQuery = `SateFIPS = '${selectedFIPS}'`;
                        config.qParams.severeDroughtConditions.url = config.droughtURL + "0";
                        config.qParams.historicDroughtConditions.url = config.droughtURL + "0";
                    }

                    config.qParams.severeDroughtConditions.q = `admin_fips = ${selectedFIPS} AND D2_D4 = 0 AND ddate <= date '${format(selectedDateObj.selectedDate, "P")}'`;
                    config.qParams.historicDroughtConditions.q = `admin_fips = ${selectedFIPS}`;
                    config.qParams.outlook.monthly.value.geometry = selectedFeature.geometry;
                    config.qParams.outlook.seasonal.value.geometry = selectedFeature.geometry;
                    config.qParams.agriculture.q = agrQuery;

                    Promise.all([
                        QueryUtils.fetchData(config.qParams.agriculture).catch(error => { return error }),
                        QueryUtils.fetchData(config.qParams.outlook.monthly.value).catch(error => { return error }),
                        QueryUtils.fetchData(config.qParams.outlook.seasonal.value).catch(error => { return error }),
                        QueryUtils.fetchData(config.qParams.severeDroughtConditions).catch(error => { return error }),
                        QueryUtils.fetchData(config.qParams.historicDroughtConditions).catch(error => { return error }),
                    ]).then(([agriculture, monthlyValue, seasonalValue, severeDroughtConditions, historicDroughtConditions]) => {
                        AgricultureComponent.updateAgriculturalImpactComponent(agriculture);
                        Outlook.monthlyDroughtOutlookResponseHandler(monthlyValue);
                        Outlook.seasonalDroughtOutlookResponseHandler(seasonalValue);
                        Conditions.droughtConditionsSuccessHandler(severeDroughtConditions, selectedDateObj);
                        historicDataQuerySuccessHandler(historicDroughtConditions);
                        LocationComponent.updateSelectedLocationComponent(historicDroughtConditions);

                        if (isMobile) {
                            document.getElementsByClassName("bottom-component-content")[0].style.flexDirection = "column";
                            document.getElementsByClassName("drought-status-component")[0].style.width = "100%";
                            document.getElementsByClassName("drought-status-component")[0].style.maxWidth = "unset";
                            document.getElementsByClassName("agricultural-impacts-container")[0].style.width = "100%";
                            document.getElementsByClassName("agricultural-impacts-container")[0].style.maxWidth = "unset";
                        }
                    }).catch(err => console.debug(err));
                } else {
                    ErrorHandler.noResponseHandler();
                }
            });
        }

        function historicDataQuerySuccessHandler(response) {
            const { features } = response;
            inputDataset = features.map(feature => {
                const { attributes } = feature;
                let date = new Date(attributes.ddate);
                return {
                    d0: attributes.d0,
                    d1: attributes.d1,
                    d2: attributes.d2,
                    d3: attributes.d3,
                    d4: attributes.d4,
                    nothing: attributes.nothing,
                    date: date,
                    d1_d4: attributes.D1_D4,
                };
            });
            inputDataset.reverse();

            config.chart.width = getChartContainerDimensions(isMobile);
            let params = new URLSearchParams(location.search);
            let dateFromUrl = params.get("date") || new Date(inputDataset[inputDataset.length - 1].date).getTime();
            Chart.createChart({
                data: inputDataset,
                view: mapView
            });

            // selected date/time
            Chart.setSelectedEvent(d3.select("rect[id='" + dateFromUrl + "']"));
            let initXPosition = d3.select("rect[id='" + dateFromUrl + "']").attr("x");
            // mouse-over scrubber
            Chart.setScrubberPosition(initXPosition);
            let formattedDate = FormatUtils.getFormattedDate(new Date(parseInt(dateFromUrl)));
            d3.select(".click-scrubber-text").text(formattedDate);

            let found = response.features.find(feature => {
                return parseInt(dateFromUrl) === feature.attributes.ddate;
            });
            HistoryComponent.updateDroughtPercentage(found.attributes["D1_D4"]);
            Conditions.updateCurrentDroughtStatus(response);
            dataComponentLoadingIndicator.removeAttribute("active");

            Scrim.showScrim({
                "mostRecentDate": new Date(inputDataset[inputDataset.length - 1].date),
                "selectedDate": new Date(parseInt(dateFromUrl))
            });
        }

        function viewStationaryHandler(response) {
            // Get the new extent of the view only when view is stationary.
            const currentExtent = mapView.extent;
            if (currentExtent) {
                const params = new URLSearchParams(location.search);
                params.set("xmin", currentExtent.xmin);
                params.set("ymin", currentExtent.ymin);
                params.set("xmax", currentExtent.xmax);
                params.set("ymax", currentExtent.ymax);
                window.history.replaceState({}, '', `${location.pathname}?${params}`);
            }
        }

        function selectedDateHandler(inputDate) {
            let endDate = new Date(inputDate);
            return {
                "selectedDate" : inputDate,
                "startDate": new Date(endDate.getTime() - (60 * 60 * 24 * 7 * 1000)),
                "endDate": endDate
            }
        }

        async function retrieveGeometryResponseHandler(response) {
            if (response.features.length > 0) {
                config.boundaryQuery.geometry = response.features[0].geometry;
                for (const graphic of mapView.graphics){
                    if (graphic.attributes === "BOUNDARY") {
                        mapView.graphics.remove(graphic);
                    }
                }

                const polygonGraphic = new Graphic({
                    geometry: response.features[0].geometry,
                    symbol: config.selectedGeographicSymbology,
                    attributes: "BOUNDARY"
                });
                mapView.graphics.add(polygonGraphic);
            } else {
                // no features
            }
            return await response;
        }






        // timeOutFunctionId stores a numeric ID which is
        // used by clearTimeOut to reset timer
        let timeOutFunctionId;
        // The function that we want to execute after
        // we are done resizing
        function workAfterResizeIsDone() {
            config.chart.width = getChartContainerDimensions(isMobile);

            let params = new URLSearchParams(location.search);
            let dateFromUrl = params.get("date") || new Date(inputDataset[inputDataset.length - 1].date).getTime();
            Chart.createChart({
                data: inputDataset,
                view: mapView
            });

            // selected date/time
            Chart.setSelectedEvent(d3.select("rect[id='" + dateFromUrl + "']"));
            let initXPosition = d3.select("rect[id='" + dateFromUrl + "']").attr("x");
            // mouse-over scrubber
            Chart.setScrubberPosition(initXPosition);
            let formattedDate = FormatUtils.getFormattedDate(new Date(parseInt(dateFromUrl)));
            d3.select(".click-scrubber-text").text(formattedDate);
        }

        // The following event is triggered continuously
        // while we are resizing the window
        window.addEventListener("resize", function() {

            // clearTimeOut() resets the setTimeOut() timer
            // due to this the function in setTimeout() is
            // fired after we are done resizing
            clearTimeout(timeOutFunctionId);

            // setTimeout returns the numeric ID which is used by
            // clearTimeOut to reset the timer
            timeOutFunctionId = setTimeout(workAfterResizeIsDone, 500);
        });

        function getChartContainerDimensions(isMobile) {
            let droughtConditionsContainer = document.getElementsByClassName("drought-status-component")[0];
            let w1 = droughtConditionsContainer.getBoundingClientRect().width;

            let agrEleContainer = document.getElementsByClassName("agricultural-impacts-container")[0];
            let w2 = agrEleContainer.getBoundingClientRect().width;

            let size = {
                width: window.innerWidth || document.body.clientWidth,
                height: window.innerHeight || document.body.clientHeight
            }

            return isMobile ? Math.round(document.getElementsByClassName("historic-data-container")[0].getBoundingClientRect().width) - 20 : (size.width - (w1 + w2)) - 40;
        }
    });
})();
