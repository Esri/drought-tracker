import React, { FC, useEffect, useState, useRef, MutableRefObject } from 'react';
import WebMap from "@arcgis/core/WebMap.js";
import Layer from "@arcgis/core/layers/Layer.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import GroupLayer from "@arcgis/core/layers/GroupLayer.js";
import styles from './Shell.module.css';
import Map from '../Map/Map';
import BarChart from '../BarChart/BarChart';
import LeftPanel from '../LeftPanel/LeftPanel';
import Corner from '../Corner/Corner';
import config from '../../AppConfig.json';
import TabSelector from '../TabSelector/TabSelector';
import sharedTypes from '../../assets/sharedTypes';
import * as queryFunctions from 'query-functions-ts';
import InfoModal from '../InfoModal/InfoModal';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import "@esri/calcite-components/dist/components/calcite-loader";

/**
 * This component is used as the host of the rest of the components.
 * It handles drought data retrieval, broadcasting updates to the components,
 * tracking certain states of the application (period, active tab, chart feature category) and toggling the visibility of certain layers and elements.
 */

interface ShellProps {
    uponLoadParameters: sharedTypes.UrlParameters
}


const Shell: FC<ShellProps> = (props: ShellProps) => {
    // application configuration
    const appConfig: MutableRefObject<sharedTypes.AppConfig> = useRef<sharedTypes.AppConfig>(config);
    const firstRenderExecuted: MutableRefObject<boolean> = useRef<boolean>(false);
    // panel data
    const [panelClass, setPanelClass] = useState<string>(styles.panelContainerHidden)
    const panelTab: MutableRefObject<sharedTypes.PanelTabOptions> = useRef<sharedTypes.PanelTabOptions>(null);
    const [signalPanelTabChanged, setSignalPanelTabChanged] = useState<number>(Math.random());
    const areaType: MutableRefObject<sharedTypes.AreaTypeCategories> = useRef<sharedTypes.AreaTypeCategories>('nation');
    const lastActiveCountyOrStateMode: MutableRefObject<sharedTypes.CountyOrStateMode> = useRef<sharedTypes.CountyOrStateMode>(appConfig.current.stateModeValue as sharedTypes.StateMode); // used to track what the last 'county' or 'state' mode was, defaults to 'county'
    const [areaTypeChanged, signalAreaTypeChanged] = useState<number>(Math.random());
    // map data
    const [mapClickData, setMapClickData] = useState<{ geometry: sharedTypes.PointClickGeometry }>();
    const populationLayerOpacity: MutableRefObject<number | undefined> = useRef<number | undefined>();
    const [webmap] = useState<WebMap>(new WebMap({ portalItem: { id: appConfig.current.webMapId } }));
    const pointClickGraphicLayer: MutableRefObject<GraphicsLayer> = useRef<GraphicsLayer>(new GraphicsLayer({ title: appConfig.current.pointClickGraphicLayerTitle }));
    const droughtLayers: MutableRefObject<Array<{ originalExpression: string, layer: FeatureLayer }>> = useRef<Array<{ originalExpression: string, layer: FeatureLayer }>>([]);
    // time data, we will be comparing periods that come in "MMDDYYYY" string format
    const todaysPeriod: MutableRefObject<string>
        = useRef<string>(`${new Date().getFullYear()}` +
            `${(new Date().getMonth() + 1 < 10 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1)}` +
            `${(new Date().getDate() + 1 < 10 ? '0' + (new Date().getDate() + 1) : new Date().getDate() + 1)}`);
    // drought period is stored as yyyymmdd
    const selectedPeriod: MutableRefObject<string> = useRef<string>(todaysPeriod.current);
    const earliestPeriod: MutableRefObject<string> = useRef<string>('');
    const [signalPeriodChanged, setSignalPeriodChanged] = useState<number>(Math.random());
    // drought level data
    const [currentDroughtLevels, setCurrentDroughtLevels] = useState<sharedTypes.DroughtLevelData>({ d0: 0, d1: 0, d2: 0, d3: 0, d4: 0, nothing: 0 })
    const [currentCumulativeDroughtLevels, setCurrentCumulativeDroughtLevels] = useState<Array<any>>([]);
    // used to indicate whether we have retrieved the necessary information to render at least one iteration of charts
    const canRenderCharts: MutableRefObject<boolean> = useRef<boolean>(false);
    // used to tell TabSelector and barchart that user is hovering over a doughnut chart arc
    const [activeArc, setActiveArc] = useState<'d0' | 'd1' | 'd2' | 'd3' | 'd4' | null>(null);
    // store locations and their associated drought levels for the charts
    const storedDroughtLevels: MutableRefObject<any> = useRef<any>(
        {
            county: [],
            state: [],
            nation: [],
            huc4: [],
        }
    );
    // a list of period strings ("YYYYMMDD") for every week retrievable of national drought data
    const listOfPeriods: MutableRefObject<Array<{ period: string, date: Date }>> = useRef<Array<{ period: string, date: Date }>>([]);
    // the geometry of the feature that a user has selected to highlight
    const [selectedFeatureGeometry, setSelectedFeatureGeometry] = useState<any>(null);
    // component visibility determinators
    const [showBarChart, setShowBarChart] = useState<boolean>(window.innerWidth >= 800 ? true : false);
    const [showMapWidgets, setShowMapWidgets] = useState<boolean>(window.innerWidth >= 800 ? true : false);
    const [showModal, setShowModal] = useState<boolean>(false);


    /**
     * Updates the areaType
     * @param type The area type category to update areaType to
     * @returns void
     */
    const changeAreaType: (type: sharedTypes.AreaTypeCategories) => void = (type: sharedTypes.AreaTypeCategories) => {
        if (areaType.current === type) return;
        areaType.current = type;
        if (type === 'county' || type === 'state') lastActiveCountyOrStateMode.current = type;
        signalAreaTypeChanged(generateUniqueRandomNumber(areaTypeChanged));
    }

    /**
     * Updates the panelTab and areaType parameters
     * @returns void 
     */
    const updatePanelTabAndAreaTypeURLParameters: () => void = () => {
        const urlParams: URLSearchParams = new URLSearchParams(window.location.hash.replace('#', '').replace('%23', ''));
        if (areaType.current) urlParams.set('areaType', areaType.current);
        if (panelTab.current) urlParams.set('panelTab', panelTab.current);
        window.history.pushState({}, '', `#${urlParams.toString()}`)
    }

    /**
     * Queries for drought data for a given area, stores it, and updates the drought charts with the retrieved data
     * @param featureCategory the area type category of the feature being charted
     * @param id the unique identifier for the feature
     * @returns void
     */
    const updateChartingData: (featureCategory: sharedTypes.AreaTypeCategories, id?: string) => void = async (featureCategory: sharedTypes.AreaTypeCategories, id?: string) => {
        let previouslyRetrievedData: any;
        let comparisonField = featureCategory === 'nation' ? 'period_date' : 'id';
        let comparisonValue = featureCategory === 'nation' ? selectedPeriod.current : id;
        let feature =
            featureCategory === 'nation' ? storedDroughtLevels.current[featureCategory][0] :
                storedDroughtLevels.current[featureCategory].find((e: any) => e[comparisonField] === comparisonValue);
        if (feature) {
            setCurrentCumulativeDroughtLevels(feature.historicalData.map(({ period, cumulativeLevels }: any) => ({ period, cumulativeLevels })));
            // if we have a stored data object with an id that matches,
            // we have already found this area's drought information. Pull retrieved data instead of requesting to server
            previouslyRetrievedData = feature.historicalData.find((d: any) => d.period === selectedPeriod.current);
            if (previouslyRetrievedData) {
                setCurrentDroughtLevels(previouslyRetrievedData.singleLevels);
                selectedPeriod.current = previouslyRetrievedData.period;
                // condense map
                placeClickPointGraphic();
                updatePanelTabAndAreaTypeURLParameters();
                return;
            }
        }
        // if we reach here, we have not retrieved this area's drought data yet. Retrieve and store the data
        try {
            // get the list of drought period data we have at the national level.
            // we will use this list to populate data for missing weeks (weeks that an area does not have any drought conditions)
            if (listOfPeriods.current.length === 0) {
                const droughtPeriodsList: Array<{ period: string, date: Date }> = [];
                let droughtPeriodRequest = await queryFunctions.retrieveListOfNationalDroughtLevelPeriods()
                droughtPeriodRequest.forEach((value: any) => {
                    droughtPeriodsList.push({ period: value.period, date: value.period_date });
                });
                // comes in reversed order, could probably fix this at the time of the request
                droughtPeriodsList.reverse();
                listOfPeriods.current = droughtPeriodsList;
            }
            let request = await queryFunctions.retrieveDroughtLevelData(featureCategory === 'huc4' ? 'water' : featureCategory, id ?? undefined);
            let featureObj: any = {
                id: id ?? null,
                historicalData: []
            };

            listOfPeriods.current.forEach((dataSet: { period: string, date: Date }) => {
                let isCountyOrState: boolean = ['county', 'state'].find((f: string) => f === featureCategory) !== undefined;
                let feat = request.find((f: any) => f.period === dataSet.period)
                if (feat !== undefined) {
                    let singleLevels = {
                        d0: isCountyOrState ? feat.d0 : feat.D0_D4 - feat.D1_D4,
                        d1: isCountyOrState ? feat.d1 : feat.D1_D4 - feat.D2_D4,
                        d2: isCountyOrState ? feat.d2 : feat.D2_D4 - feat.D3_D4,
                        d3: isCountyOrState ? feat.d3 : feat.D3_D4 - feat.D4,
                        d4: isCountyOrState ? feat.d4 : feat.D4,
                        nothing: feat.nothing,
                    };

                    singleLevels.nothing = 100 - singleLevels.d0 - singleLevels.d1 - singleLevels.d2 - singleLevels.d3 - singleLevels.d4

                    featureObj.historicalData.push({
                        period: feat.period,
                        // date: feature.period,
                        singleLevels: singleLevels,
                        cumulativeLevels: {
                            D0_D4: feat.D0_D4,
                            D1_D4: feat.D1_D4,
                            D2_D4: feat.D2_D4,
                            D3_D4: feat.D3_D4,
                            D4: ['county', 'state'].find((f: string) => f === featureCategory) ? feat.d4 : feat.D4
                        }
                    });
                } else {
                    featureObj.historicalData.push({
                        period: dataSet.period,
                        // date: period,
                        singleLevels: { d0: 0, d1: 0, d2: 0, d3: 0, d4: 0, nothing: 100 },
                        cumulativeLevels: {
                            D0_D4: 0,
                            D1_D4: 0,
                            D2_D4: 0,
                            D3_D4: 0,
                            D4: 0
                        }
                    });
                }
            })
            storedDroughtLevels.current[featureCategory].push(featureObj);

            if (featureCategory === 'nation' && featureObj.historicalData.length > 0) {
                // the only time we will be here with the 'nation' category is upon first load...
                todaysPeriod.current = featureObj.historicalData[0].period;
                earliestPeriod.current = featureObj.historicalData[featureObj.historicalData.length - 1].period;
                updatePeriod(todaysPeriod.current);
                setDroughtFeatures();
                setCurrentDroughtLevels(featureObj.historicalData[0].singleLevels);
                setCurrentCumulativeDroughtLevels(featureObj.historicalData.map(({ period, cumulativeLevels }: any) => ({ period, cumulativeLevels })))


                if (props.uponLoadParameters.period) {
                    updatePeriod(props.uponLoadParameters.period);
                }
                // maybe here we will handle when a user is trying to process a click...
                if (props.uponLoadParameters.point) {
                    // check to see if we have a valid point string
                    const commaIndex = props.uponLoadParameters.point.indexOf(',');
                    let hasComma = commaIndex && commaIndex > 0; // if there was a comma found in the string
                    if (hasComma) {
                        const longitude = props.uponLoadParameters.point.substring(0, commaIndex);
                        const latitude = props.uponLoadParameters.point.substring(commaIndex + 1, props.uponLoadParameters.point.length);

                        // if both the parse longitude and latitude values are numbers, we can try and go to the point
                        if (!isNaN(parseFloat(longitude)) && !isNaN(parseFloat(latitude))) {

                            if (props.uponLoadParameters.areaType && props.uponLoadParameters.panelTab) {
                                changeAreaType(props.uponLoadParameters.areaType);
                                switch (props.uponLoadParameters.panelTab) {
                                    case ('pop'):
                                        togglePopulationTab();
                                        break;
                                    case ('water'):
                                        toggleWaterTab();
                                        break;
                                    case ('ag'):
                                        toggleAgricultureTab();
                                        break;
                                }
                            } else {
                                changeAreaType(lastActiveCountyOrStateMode.current);
                                togglePopulationTab();
                            }
                            mapClicked({
                                x: parseFloat(longitude),
                                y: parseFloat(latitude),
                                spatialReference: 4326
                            })
                        }
                    }
                }

                canRenderCharts.current = true;
                return;
            } else if (featureCategory === 'nation' && featureObj.historicalData.length === 0) { return; }
            // now set the drought singleLevels to match the currently selected date period
            let selectedData = featureObj.historicalData.find((d: any) => d.period === selectedPeriod.current);
            if (selectedData.singleLevels) {
                setCurrentDroughtLevels(selectedData.singleLevels);
                setCurrentCumulativeDroughtLevels(featureObj.historicalData.map(({ period, cumulativeLevels }: any) => ({ period, cumulativeLevels })))
                placeClickPointGraphic();
                updatePanelTabAndAreaTypeURLParameters();
            }
            return;
        } catch (e) {
            console.error('error updating chart data', e);
        }
    }

    /**
     * Updates the "period" parameter of the URL.
     * @param period The string to update the period URL parameter with.
     */
    const updateUrlPeriodParameters: (period: string) => void = (period: string) => {
        const urlParams: URLSearchParams = new URLSearchParams(window.location.hash.replace('#', '').replace('%23', ''));
        urlParams.set('period', period);
        window.history.pushState({}, '', `#${urlParams.toString()}`)
    }

    /**
     * Updates the "point" URL parameter.
     * @param geometry The geometry object to create a string to update the "point" URL parameter with.
     */
    const updateUrlPointParameters: (geometry: sharedTypes.PointClickGeometry) => void = (geometry: sharedTypes.PointClickGeometry) => {
        const urlParams: URLSearchParams = new URLSearchParams(window.location.hash.replace('#', '').replace('%23', ''));
        urlParams.set(appConfig.current.pointUrlParam, `${geometry.x.toString()},${geometry.y.toString()}`);
        window.history.pushState({}, '', `#${urlParams.toString()}`)
    }

    /**
     * Places the crosshair graphic on the map where it was last clicked.
     * @returns void
     */
    const placeClickPointGraphic: () => void = () => {
        if (mapClickData) {
            // add the click graphic to the layer
            pointClickGraphicLayer.current.graphics.removeAll();
            pointClickGraphicLayer.current.graphics.add(new Graphic({
                geometry: new Point({
                    ...mapClickData.geometry,
                    spatialReference: new SpatialReference({ wkid: mapClickData.geometry.spatialReference })
                }),
                symbol: new PictureMarkerSymbol({
                    url: require('../../assets/pointClickSymbol.png'),
                    height: '44px',
                    width: '44px'
                })
            }));
        }
    }

    /**
     * Updates the selected period.
     * @param newPeriod If the period is updated from the BarChart component, an existing period string will be passed to update the selected period with.
     * @param weekChangeCount If the period is updated from the DoughnutChart (in Corner), an existing period string will be passed to update the selected period with.
     */
    const updatePeriod: (newPeriod: string | null, weekChangeCount?: number) => void = (newPeriod: string | null, weekChangeCount?: number) => {
        // BarChart just changes the period string itself, so it passes in a new "period" string.
        // DoughnutChart, however, passes in a null value with a weekChangeCount value.
        // this is because BarChart has a list of all periods already, in order to make the chart,
        // while DoughnutChart (in Corner) does not, since it only needs the current period's drought data.
        if (newPeriod !== null) {
            if (listOfPeriods.current.find((period) => period.period === newPeriod))
                selectedPeriod.current = newPeriod;
            else selectedPeriod.current = todaysPeriod.current;
        }

        // must be DoughnutChart updating. This is for incrementing by the YEAR
        if (newPeriod === null && weekChangeCount && Math.abs(weekChangeCount) === 52) {
            // change by year, need to make it match week
            const thisYearsMonth = listOfPeriods.current
                .filter((value: any) => value.period.substring(0, 6) === selectedPeriod.current.substring(0, 6))
                .map((obj: { period: string }) => obj.period)
                .reverse();
            // take the list of periods, filter it for objects that have a matching YYYYMM portion of their period string with a properly incremented year
            const incrementedYearsMonth = listOfPeriods.current            // int value of the current period's YYYY (minus 1 if we are incrementing down, + 1 if we are incrementing up) PLUS the int value of the selected period's MM
                .filter((value: any) => value.period.substring(0, 6) === (parseInt(selectedPeriod.current.substring(0, 4)) - (weekChangeCount < 0 ? -1 : 1)) + selectedPeriod.current.substring(4, 6))
                .map((obj: { period: string }) => obj.period) // and then take that filtered list of period data objects for the properly incremented year's matching month (that we have now parsed down to just the period string)..
                .reverse(); // ... and reverse it, because we want it to be ordered from first week to last week of the month

            // now, if the length of periods for the incremented years month is 0, we must have either gone too far back in time or gone too far forward
            if (incrementedYearsMonth.length === 0) {
                // if we have gone too far forward, just set it to the latest period
                if (selectedPeriod.current.substring(0, 4) === todaysPeriod.current.substring(0, 4) || selectedPeriod.current.substring(0, 4) === `${parseInt(todaysPeriod.current.substring(0, 4)) - 1}`) selectedPeriod.current = listOfPeriods.current[0].period;
                // if we have gone too far backward, set it to the earliest period we have
                else selectedPeriod.current = listOfPeriods.current[listOfPeriods.current.length - 1].period;
            }
            // if we properly calculated this year's and last year's month period string arrays,
            else if (thisYearsMonth.length > 0 && incrementedYearsMonth.length > 0) {
                /**
                 * by now, thisYearsMonth and incrementedYearsMonth looks something like this:
                 * [
                 * 'YYYYMM',
                 * 'YYYYMM',
                 * 'YYYYMM',
                 * 'YYYYMM',
                 * ]
                 * 
                 * and we want to compare what index the selectedPeriod's string is in,
                 * because a user comparing the first week of January will expect to get the first week of full January data each time they increment by the year,
                 * for example.
                 */
                if (thisYearsMonth.indexOf(selectedPeriod.current) <= incrementedYearsMonth.length - 1)
                    selectedPeriod.current = incrementedYearsMonth[thisYearsMonth.indexOf(selectedPeriod.current)];
                else selectedPeriod.current = incrementedYearsMonth[incrementedYearsMonth.length - 1];
            }

        }
        // doughnut chart uses weekChangeCount, incrementing by the week
        else if (newPeriod === null && weekChangeCount && Math.abs(weekChangeCount) === 1) {
            let foundNewPeriod = false;
            for (let i = 0; i < listOfPeriods.current.length; i++) {
                if (listOfPeriods.current[i].period === selectedPeriod.current) {
                    // if we have found the current period in the list of periods
                    // this will hopefully have a more consistent date change than what we were trying to do
                    // with calculation
                    let newIndex: number = i + weekChangeCount;
                    if (newIndex >= listOfPeriods.current.length) newIndex = listOfPeriods.current.length - 1;
                    else if (newIndex < 0) newIndex = 0;
                    selectedPeriod.current = listOfPeriods.current[newIndex].period;
                    foundNewPeriod = true;
                }
                if (foundNewPeriod) i = listOfPeriods.current.length + 1; // break out of loop if we found the new period successfully
            }
        }
        // the individual tab components call the chart updating function, so we need to call it here if it is null
        if (panelTab.current === null) updateChartingData('nation');
        updateUrlPeriodParameters(selectedPeriod.current);
        setDroughtFeatures();
        setSignalPeriodChanged(generateUniqueRandomNumber(signalPeriodChanged));
    }

    /**
     * Updates the definition expression of the drought layers to display the features for the currently selected period.
     * @returns void
     */
    const setDroughtFeatures: () => void = async () => {
        if (droughtLayers.current.length === 0) {
            // identify the drought level layers if they have not been found already
            await webmap.when(() => {
                let group: GroupLayer | null = webmap.layers.find((layer: Layer) => layer.title === appConfig.current.droughtLayerTitle) as GroupLayer ?? new GroupLayer();
                if (group) {
                    group.layers.forEach((layer: Layer) => {
                        let theLayer: FeatureLayer = layer as FeatureLayer;
                        droughtLayers.current.push({
                            originalExpression: theLayer.definitionExpression,
                            layer: theLayer
                        });
                    })
                }
            });
        }
        // update each layer's definition expression
        droughtLayers.current.forEach((droughtLayer: { originalExpression: string, layer: FeatureLayer }) => {
            droughtLayer.layer.definitionExpression = droughtLayer.originalExpression + ` AND period = '${selectedPeriod.current}'`;
        });
    }

    /**
     * Called when the map is clicked. Updates mapClickData, updates the "point" URL parameter, and expands the left panel
     * @param geometry The geometry of the point where the map was clicked.
     * @returns void
     */
    const mapClicked: (geometry: sharedTypes.PointClickGeometry) => void = (geometry: sharedTypes.PointClickGeometry) => {
        if (panelTab.current === null) {
            panelTab.current = appConfig.current.popPanelOption as sharedTypes.PanelTabOptions;
            togglePopulationLayerOpacity(webmap.layers.find((layer: __esri.Layer) => layer.title === appConfig.current.populationLayerTitle), true);
        }
        setMapClickData({
            geometry: geometry,
        });
        updateUrlPointParameters(geometry);
        expandLeftPanel();
    }

    /**
     * Called when the point where the map was clicked was unable to retrieve valid data.
     * Places the click point, removes the selected feature geometry, and renders charts with national data.
     * @returns void
     */
    const invalidMapClick: () => void = () => {
        if (mapClickData && pointClickGraphicLayer.current) {
            placeClickPointGraphic();
            setSelectedFeatureGeometry(null);
            updateChartingData('nation');
        }
    }

    /**
     * Helper function to retrieve a unique random number.
     * @param originalNumber The original number that is being updated
     * @returns A random floating number between 0 and 1
     */
    const generateUniqueRandomNumber: (originalNumber: number) => number = (originalNumber: number) => {
        let newRand: number = Math.random();
        while (originalNumber === newRand) {
            newRand = Math.random();
        }
        return newRand;
    }

    /**
     * Triggered when a user clicks on the map.
     * Condenses the map, opens the left panel.
     * @returns void
     */
    const expandLeftPanel: () => void = () => {
        setPanelClass(styles.panelContainer);
    }

    /**
     * Triggered when a user closes the left panel.
     * Closes the panel, updates the panelTab, removes the selected feature geometry, and resets charts.
     * @returns void
     */
    const collapseLeftPanel: () => void = () => {
        setPanelClass(styles.panelContainerHidden);
        panelTab.current = appConfig.current.nullPanelOption
        setSelectedFeatureGeometry(null);
        updateChartingData('nation');
        setSignalPanelTabChanged(generateUniqueRandomNumber(signalPanelTabChanged));
    }

    /**
     * Called when the population tab is toggled.
     * @returns void
     */
    const togglePopulationTab = () => {
        if (panelTab.current === appConfig.current.popPanelOption) {
            collapseLeftPanel();
            return;
        }
        // turn on label reference layers
        webmap.basemap.referenceLayers.forEach((layer: __esri.Layer) => {
            layer.visible = true;
        });
        panelTab.current = appConfig.current.popPanelOption as sharedTypes.PopPanelOption;
        setSignalPanelTabChanged(generateUniqueRandomNumber(signalPanelTabChanged));
    };

    /**
     * Called when the water tab is toggled.
     * @returns void
     */
    const toggleWaterTab = () => {
        if (panelTab.current === appConfig.current.waterPanelOption) {
            collapseLeftPanel();
            return;
        }
        panelTab.current = appConfig.current.waterPanelOption as sharedTypes.WaterPanelOption;
        setSignalPanelTabChanged(generateUniqueRandomNumber(signalPanelTabChanged));
    }

    /**
     * Called when the agriculture tab is toggled.
     * @returns void
     */
    const toggleAgricultureTab = () => {
        if (panelTab.current === appConfig.current.agPanelOption) {
            collapseLeftPanel();
            return;
        }
        // turn on label reference layers
        webmap.basemap.referenceLayers.forEach((layer: __esri.Layer) => {
            layer.visible = true;
        });
        panelTab.current = appConfig.current.agPanelOption as sharedTypes.AgPanelOption;
        setSignalPanelTabChanged(generateUniqueRandomNumber(signalPanelTabChanged));
    }

    /**
     * Retrieve the original population layer opacity levels so that it can be used when re-toggling its opacity.
     * @returns void
     */
    const storePopulationLayerOpacity: (populationLayer: __esri.Layer) => void = (populationLayer: __esri.Layer) => {
        populationLayerOpacity.current = populationLayer.opacity;
    }

    /**
    * Toggle the population layer's opacity.
    * @returns void
    */
    const togglePopulationLayerOpacity: (populationLayer: __esri.Layer, turnOnOpacity: boolean) => void = (populationLayer: __esri.Layer, turnOnOpacity: boolean) => {
        if (turnOnOpacity) {
            // set opacity to 0
            populationLayer.opacity = populationLayerOpacity.current ?? 0;
        } else {
            // it must be set to 0, set it back to original
            populationLayer.opacity = 0;
        }
    }

    /**
     * Called when the panel tab is changed, toggles layer visibiilities.
     * @returns void
     */
    const handleLayerVisibilities: () => void = () => {
        webmap.when(() => {
            if (!populationLayerOpacity.current) {
                storePopulationLayerOpacity(webmap.layers.find((layer: __esri.Layer) => layer.title === appConfig.current.populationLayerTitle));
            }
            let layerTitle: string = '';
            switch (panelTab.current) {
                case (appConfig.current.popPanelOption):
                    layerTitle = appConfig.current.populationLayerTitle;
                    // set the opacity of the layer to its original opacity
                    togglePopulationLayerOpacity(webmap.layers.find((layer: __esri.Layer) => layer.title === appConfig.current.populationLayerTitle), true);
                    break;
                case (appConfig.current.waterPanelOption):
                    layerTitle = appConfig.current.waterLayerTitle;
                    break;
                case (appConfig.current.agPanelOption):
                    layerTitle = appConfig.current.agricultureLayerTitle;
                    break;
                case (appConfig.current.nullPanelOption):
                    // no action currently needed
                    break;
            }
            // if it is not null, turn off the layers. in the null state we will have population visible,
            // but with an opacity of 0 to allow the layers to be included in the hit test
            webmap.layers.forEach((layer: __esri.Layer) => {
                if ([
                    layerTitle,
                    appConfig.current.droughtLayerTitle,
                    appConfig.current.pointClickGraphicLayerTitle,
                    appConfig.current.selectedFeatureLayerTitle,
                    panelTab.current === appConfig.current.agPanelOption ? appConfig.current.croplandLayerTitle : '',
                    panelTab.current === appConfig.current.nullPanelOption ? appConfig.current.populationLayerTitle : ''
                ].find((title: string) => title === layer.title)) {
                    layer.visible = true;
                } else layer.visible = false;
            });

            if (panelTab.current === null) {
                togglePopulationLayerOpacity(webmap.layers.find((layer: __esri.Layer) => layer.title === appConfig.current.populationLayerTitle), false);
            } else {
                // no action currently needed
            }
        });
    }


    /**
     * Hides the info modal.
     * @param closeEvent The close event
     * @returns void
     */
    const infoModalClosed: (closeEvent?: any) => void = (closeEvent?: any) => {
        setShowModal(false);
    }

    /**
     * Displays the info modal.
     * @returns void
     */
    const showInfoModal: () => void = () => {
        setShowModal(true);
    }

    /**
     * modify layer visibilities based on what mode the user is in
     */
    useEffect(() => {
        if (panelTab.current !== null) expandLeftPanel();
        handleLayerVisibilities();
    }, [signalPanelTabChanged]);


    useEffect(() => {
        if (!firstRenderExecuted.current === true) {
            webmap.when(() => {
                updateChartingData('nation');
                webmap.layers.remove(pointClickGraphicLayer.current);
                webmap.layers.add(pointClickGraphicLayer.current);
            });

            // listen for window sizes that are too small to show the bar chart
            window.addEventListener('resize', () => {
                if (window.innerWidth < 800) {
                    setShowBarChart(false);
                    setShowMapWidgets(false);
                }
                else if (window.innerWidth >= 800) {
                    setShowBarChart(true);
                    setShowMapWidgets(true);
                }
            })
            firstRenderExecuted.current = true;
        }
    }, [])


    /**
     * re-render when map and panel class values are updated
     */
    useEffect(() => { }, [panelClass, mapClickData, showBarChart, showModal, currentDroughtLevels])

    return (
        <div className={styles.container}>
            {
                <div className={styles.modalDiv} hidden={!showModal}>
                    <InfoModal closeModal={(closeEvent?: any) => { infoModalClosed(closeEvent) }}></InfoModal>
                </div>
            }
            {showBarChart && <div className={styles.chart}>
                <BarChart
                    webmap={webmap}
                    panelTab={panelTab.current}
                    currentCumulativeDroughtLevels={currentCumulativeDroughtLevels}
                    todaysPeriod={todaysPeriod.current}
                    selectedPeriod={selectedPeriod.current}
                    signalPeriodChanged={signalPeriodChanged}
                    setNewPeriod={(newPeriod: string) => { updatePeriod(newPeriod) }}
                    setSignalPeriodChanged={() => { setSignalPeriodChanged(generateUniqueRandomNumber(signalPeriodChanged)) }}
                    activeArc={activeArc}
                ></BarChart>
            </div>}
            <div className={panelClass}>
                <LeftPanel
                    appConfig={appConfig.current}
                    signalPanelTabChanged={signalPanelTabChanged}
                    panelTab={panelTab.current}
                    mapClickData={mapClickData}
                    collapseLeftPanel={() => { collapseLeftPanel(); }}
                    selectedPeriod={selectedPeriod.current}
                    signalPeriodChanged={signalPeriodChanged}
                    updateChartingData={(featureCategory: sharedTypes.AreaTypeCategories, id?: string) => { updateChartingData(featureCategory, id ?? undefined) }}
                    webmap={webmap}
                    updateSelectedFeatureGeometry={(geometry: any) => { setSelectedFeatureGeometry(geometry) }}
                    listOfPeriods={listOfPeriods.current}
                    invalidMapClick={() => { invalidMapClick(); }}
                    areaType={areaType.current}
                    changeAreaType={(type: sharedTypes.AreaTypeCategories) => { changeAreaType(type) }}
                    areaTypeChanged={areaTypeChanged}
                    signalAreaTypeChanged={() => { signalAreaTypeChanged(generateUniqueRandomNumber(areaTypeChanged)); }}
                    lastActiveCountyOrStateMode={lastActiveCountyOrStateMode.current}
                ></LeftPanel>
            </div>
            {canRenderCharts.current === true &&
                <>

                    <div className={styles.cornerShadowContainer}>
                        <div className={styles.cornerShadow}></div>
                    </div>


                    <TabSelector
                        signalPanelTabChanged={signalPanelTabChanged}
                        panelTab={panelTab.current}
                        arcDroughtLevel={activeArc !== null ? currentDroughtLevels[activeArc] : 0}
                        togglePopulationTab={() => { togglePopulationTab(); }}
                        toggleWaterTab={() => { toggleWaterTab(); }}
                        toggleAgricultureTab={() => { toggleAgricultureTab(); }}
                        activeArc={activeArc}
                        areaType={areaType.current}
                    ></TabSelector>
                    <div className={styles.cornerContainer}>
                        <Corner
                            webmap={webmap}
                            panelTab={panelTab.current}
                            currentDroughtLevels={currentDroughtLevels}
                            selectedPeriod={selectedPeriod.current}
                            signalPeriodChanged={signalPeriodChanged}
                            signalPanelTabChanged={signalPanelTabChanged}
                            setNewPeriod={(newPeriod: string | null, weekChangeCount?: number) => { updatePeriod(newPeriod, weekChangeCount) }}
                            setSignalPeriodChanged={() => { setSignalPeriodChanged(generateUniqueRandomNumber(signalPeriodChanged)) }}
                            activeArc={activeArc}
                            setActiveArc={(arc: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | null) => { setActiveArc(arc) }}
                            areaType={areaType.current}
                            areaTypeChanged={areaTypeChanged}
                            showInfoModal={() => { showInfoModal(); }}
                            earliestPeriod={earliestPeriod.current}
                            todaysPeriod={todaysPeriod.current}
                        ></Corner>
                    </div>
                </>
            }
            <div className={styles.fullMap}>
                <Map
                    appConfig={appConfig.current}
                    signalPanelTabChanged={signalPanelTabChanged}
                    panelTab={panelTab.current}
                    webmap={webmap}
                    mapClicked={(geometry: sharedTypes.PointClickGeometry) => { mapClicked(geometry); }}
                    selectedFeatureGeometry={selectedFeatureGeometry}
                    areaType={areaType.current}
                    initialZoom={props.uponLoadParameters.zoom}
                    initialPoint={props.uponLoadParameters.point}
                    showMapWidgets={showMapWidgets}
                ></Map>
            </div>
        </div>
    );
}

export default Shell;