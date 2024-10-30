import React, { useEffect, useState, useRef, MutableRefObject, FC } from 'react';
import styles from './WaterTab.module.css';
import sharedTypes from '../../assets/sharedTypes';
import tableTypes from '../Table/types';
import types from './types'
import * as queryFunctions from 'query-functions-ts';
import config from './WaterTabConfig.json';
import WebMap from '@arcgis/core/WebMap';
import RegionalInformation from '../RegionalInformation/RegionalInformation';
import Table from '../Table/Table';
import TableErrorBox from '../TableErrorBox/TableErrorBox';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Layer from '@arcgis/core/layers/Layer';
import { CalciteIcon } from '@esri/calcite-components-react';
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect.js";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter.js";
import * as d3 from 'd3';

interface WaterTabProps {
    appConfig: sharedTypes.AppConfig,
    webmap: WebMap,
    selectedPeriod: string,
    signalPeriodChanged: number,
    collapseLeftPanel: () => void,
    updateChartingData: (featureCategory: sharedTypes.AreaTypeCategories, id?: string) => void
    updateSelectedFeatureGeometry: (geometry: any) => void,
    signalPanelTabChanged: number,
    panelTab: sharedTypes.PanelTabOptions,
    invalidMapClick: () => void,
    mapClickData: any,
    areaType: sharedTypes.AreaTypeCategories,
    changeAreaType: (type: sharedTypes.AreaTypeCategories) => void,
    areaTypeChanged: number,
    signalAreaTypeChanged: () => void,

}


const WaterTab: FC<WaterTabProps> = (props: WaterTabProps) => {
    // component configuration
    const componentConfig: MutableRefObject<types.WaterTabConfig> = useRef<types.WaterTabConfig>(config as types.WaterTabConfig);
    // area information header texts
    const primaryText: MutableRefObject<string> = useRef<string>('');
    const secondaryText: MutableRefObject<string> = useRef<string>('');
    // table content elements
    const [reservoirTableHeaders, setReservoirTableHeaders] = useState<any>([]);
    const [reservoirTableRows, setReservoirTableRows] = useState<any>([]);

    const [reservoirTooltipElement, setReservoirTooltipElement] = useState<any>(null);
    const [riverTooltipElement, setRiverTooltipElement] = useState<any>(null);

    const xScaleValues = useRef<Array<{ tick: string, fieldName: string, mm: string }>>(componentConfig.current.xScaleValues)
    const containerRef = useRef<any>();
    const legendRef = useRef<any>();

    // layer references
    const waterGroupLayer: MutableRefObject<GroupLayer | undefined> = useRef<GroupLayer | undefined>();
    const riversLayer: MutableRefObject<FeatureLayer | undefined> = useRef<FeatureLayer | undefined>();
    const reservoirsLayer: MutableRefObject<FeatureLayer | undefined> = useRef<FeatureLayer | undefined>();
    // stored features and panel state
    const storedFeatures: MutableRefObject<types.StoredWaterFeatures> = useRef<types.StoredWaterFeatures>([]);
    const [panelState, setPanelState] = useState<'standby' | 'loading' | 'loaded' | 'invalid' | 'initial'>('initial');
    const [showNoResultsRiverUI, setShowNoResultsRiverUI] = useState<boolean>(false);


    const checkForData: () => void = async () => {
        // only intended to be called when mapClickData exists and panelTab is 'water'
        if (props.mapClickData && props.panelTab === 'water') {
            // have found data before but the last click while on this tab is not the same as the current click, so do at least first query
            // check if we have already retrieved this feature before
            // if we have, it means we have already attempted finding the layer data and associated table data
            const data = await getPrimaryData();
            if (data && storedFeatures.current.find((d: any) => d.HUC4 === data.HUC4)) {
                constructFullUI(storedFeatures.current.find((d: any) => d.HUC4 === data.HUC4));
                return;
            }
            else if (!data || data?.length === 0) {
                invalidClick();
                return
            }
            // have not found the feature yet, get the historical data
            getFullDataset(data);
        }

        return;
    }

    // get the huc4 data that we will use to retrieve the rest of the data
    const getPrimaryData: () => any = async () => {
        try {
            const watershedFeatureData: types.WatershedQueryResult = await getWatershedData();
            // 1. get watershed data (huc4 id, geometry, NAME)
            return watershedFeatureData;
        } catch (e) {
            // if an error occurs when we query the layer
            console.error('could not retrieve layer data', e);
            invalidClick();
        }
    }

    // get the rest of the data if we have not retrieved this watershed's data yet
    const getFullDataset: (data: any) => void = async (data: any) => {
        try {
            // get the list of rivers within the huc4 boundaries
            const riversRequest: types.RiverRequest = await getRiverData(data.HUC4);
            if (riversRequest) {
                if (riversRequest.length > 0) {
                    const rivers: types.Rivers = [];
                    // for each river, make a request to get the related flow data for each river
                    for (let i: number = 0; i < riversRequest.length; i++) {
                        const river: types.River = {
                            ...riversRequest[i],
                            cfsData: []
                        }
                        const cfsRequest: types.CfsData = await getFlowlineTableData(riversRequest[i].feature_id);
                        if (cfsRequest) {
                            river.cfsData = cfsRequest;
                        }
                        rivers.push(river);
                        data.rivers = rivers;
                    }

                } else data.rivers = [];
            } else {
                data.rivers = [];
            }

            // now its time to retrieve reservoir data
            const reservoirData = await queryFunctions.getLocalReservoirData(data.HUC4);
            if (reservoirData) {
                data.reservoirs = reservoirData;
            }
            else if (!reservoirData || (reservoirData && reservoirData.length === 0)) data.reservoirs = [];

            storedFeatures.current.push(data);
            constructFullUI(data);

        } catch (e) {
            console.error('caught in getFullDataset', e);
            invalidClick();
        }
    }

    const getWatershedData: () => any | Error = async () => {
        try {
            const watershedFeatureData = await queryFunctions.getHuc4WatershedData(props.mapClickData.geometry);
            if (watershedFeatureData[0]) {
                const result: types.WatershedQueryResult = {
                    OBJECTID: watershedFeatureData[0].attributes.OBJECTID,
                    HUC4: watershedFeatureData[0].attributes.HUC4,
                    NAME: watershedFeatureData[0].attributes.NAME,
                    geometry: watershedFeatureData[0].geometry
                }
                return result;
            }
        } catch (e) {
            console.error('caught in getWatershedData', e)
            return e;
        }
    }

    const getRiverData: (huc4ID: string) => any | Error = async (huc4ID: string) => {
        try {
            return await queryFunctions.getFlowlineData(huc4ID);
        } catch (e) {
            console.error('could not retrieve river data', e);
            invalidClick();
        }
    }

    const getFlowlineTableData: (featureID: string) => any | Error = async (featureID: string) => {
        try {
            const data = await queryFunctions.getRelatedFlowsData(featureID);
            return data;
        } catch (e) {
            console.error('getFlowlineTableData catch', e);
            return e;
        }
    }

    // Performing the query elsewhere, keeping this function to eventually use again.
    const getReservoirTableData: (huc4ID: string) => any | Error = async (huc4ID: string) => {
        try {
            return await queryFunctions.getLocalReservoirData(huc4ID);
        } catch (e) {
            return e;
        }
    }

    const constructReservoirTableHeaders: () => void = () => {
        const headerArray: Array<any> = [];
        componentConfig.current.reservoirTableConfig.headers.forEach((headerConfig: { columnKey: string, value: string }) => {
            const header: tableTypes.ColumnHeadCell = {
                columnKey: headerConfig.columnKey,
                cellValue: headerConfig.value,
            };

            header.element = <div key={header.columnKey + 'Header'} className={styles.headerDiv}><span className={styles.tableHeaderText}>{headerConfig.value}</span></div>
            headerArray.push(header);
        });
        setReservoirTableHeaders(headerArray);
    }

    const constructReservoirTableRows: (data: any) => void = (data: any) => {
        const rows: Array<any> = [];
        data.reservoirs.forEach((dataSet: any) => {
            const tempCellArray: Array<any> = [];
            componentConfig.current.reservoirTableConfig.columns.forEach((columnConfig: any) => {
                const cell: any = {
                    columnKey: columnConfig.columnKey,
                    rowKey: dataSet.NIDID,  //hard coded
                }
                // format the capacity cells to have commas
                if (columnConfig.columnKey === 'capacity') {
                    let text: string = dataSet[columnConfig.fieldName] ? dataSet[columnConfig.fieldName].toLocaleString() : '--';
                    cell.element = <div key={text + Math.random().toString()} className={styles.tableValueCells}>{text}</div>
                } else if (columnConfig.columnKey === 'purpose' || columnConfig.columnKey === 'name') {

                    // if the value of the name or purpose cell is longer than 20 characters, truncate it and add the tooltip hover functionality
                    const text: string = dataSet[columnConfig.fieldName] ? dataSet[columnConfig.fieldName].length > 20 ? dataSet[columnConfig.fieldName].substring(0, 20) + '...' : dataSet[columnConfig.fieldName] : '--';

                    cell.element =
                        <div
                            key={text + Math.random().toString()}
                            className={styles.purposeCellContainer}
                            onMouseEnter={(event) => {
                                highlightReservoir(dataSet.OBJECTID);
                                if (text.length > 20) displayReservoirTooltip(event, dataSet[columnConfig.fieldName]);
                            }}
                            onMouseLeave={(event) => {
                                unHighlightReservoir();
                                hideReservoirTooltip(event);
                            }}
                        >
                            <div className={styles.tableValueCells}>
                                {text}
                            </div>
                        </div>

                }
                tempCellArray.push(cell);
            });
            rows.push(({
                rowHeight: 'm',
                rowKey: dataSet.NIDID,
                cells: tempCellArray
            }));
        });
        setReservoirTableRows(rows);
    }

    const displayReservoirTooltip: (event: any, text: string) => void = (event: any, text: string) => {
        if (reservoirTooltipElement === null) setReservoirTooltipElement(
            <div className={styles.tooltipContent} style={{ left: `${event.clientX}px`, top: `${event.clientY}px` }}><span>{text}</span></div>
        )
    }

    const getFormattedDateLabel: (period: string) => string = (period: string) => {
        return `${(period.substring(4, 6))}/${period.substring(6, 8)}/${period.substring(0, 4)}`;
    }

    const hideReservoirTooltip: (event?: any) => void = (event?: any) => {
        setReservoirTooltipElement(null);
    }

    const displayRiverTooltip: (event: any, data: Array<number | string>, river: types.River, currentCfsData: types.PeriodCfsData) => void = (event: any, data: Array<number | string>, river: types.River, currentCfsData: types.PeriodCfsData) => {
        let selectedPeriodMonthCode = props.selectedPeriod.substring(4, 6);
        let activeHoverMonthCode = xScaleValues.current.find((tick: { tick: string, fieldName: string, mm: string }) => tick.mm === selectedPeriodMonthCode)?.fieldName ?? null;

        let cfsData = null;
        if (currentCfsData.period === props.selectedPeriod && data[0] === activeHoverMonthCode) {
            const dateString = getFormattedDateLabel(props.selectedPeriod);
            const q = currentCfsData.Q_cfs;
            if (q) cfsData =
                <span>
                    <strong>{`${dateString}: `}</strong>
                    {(q ? Math.round(parseFloat(q.toString())).toLocaleString() : 'N/A')}
                </span>
        }
        const textElement =
            <div className={styles.riverTooltipText}>
                <span>
                    <strong>{`Mean cfs: `}</strong><span>{(data[1] ? Math.round(parseFloat(data[1].toString())).toLocaleString() : 'N/A')}</span>
                </span>
                {cfsData && cfsData}
            </div>;

        if (riverTooltipElement === null) setRiverTooltipElement(
            <div className={styles.tooltipContent} style={{ left: `${event.clientX}px`, top: `${event.clientY}px` }}><span>{textElement}</span></div>
        )
    }

    const hideRiverTooltip: (event?: any) => void = (event?: any) => {
        setRiverTooltipElement(null);
    }

    const highlightReservoir: (OBJECTID: number) => void = (OBJECTID: number) => {
        if (reservoirsLayer.current) {
            const where: string = `OBJECTID = ${OBJECTID}`;
            const effect: FeatureEffect = new FeatureEffect({
                filter: new FeatureFilter({ where: where }),
                excludedEffect: 'opacity(35%)',
            });
            reservoirsLayer.current.featureEffect = effect;
        }
    }

    const unHighlightReservoir: () => void = () => {
        if (reservoirsLayer.current) {
            reservoirsLayer.current.featureEffect = new FeatureEffect({});
        }
    }

    const highlightRiver: (featureID: string) => void = (featureID: string) => {
        if (riversLayer.current) {

            const where: string = `feature_id = '${featureID}'`;
            const effect: FeatureEffect = new FeatureEffect({
                filter: new FeatureFilter({ where: where }),
                includedEffect: 'opacity(100%)',
                excludedEffect: 'opacity(35%)',
            });
            riversLayer.current.featureEffect = effect;
        }
    }

    const unHighlightRiver: () => void = () => {
        if (riversLayer.current) {
            riversLayer.current.featureEffect = new FeatureEffect({});
        }
    }

    const constructRiverCharts: (rivers: Array<any>) => void = (rivers: Array<any>) => {
        containerRef.current.innerHTML = '';
        if (legendRef.current && rivers.length > 0) {
            legendRef.current.className = styles.chartLegendContainer
            containerRef.current.append(legendRef.current);
        } else if (legendRef.current && rivers.length <= 0) {
            legendRef.current.className = styles.hidden;
        }

        let width = 320;
        let height = 90;
        // set the dimensions and margins of the graph
        let margin = { left: 15, right: 5, top: 10, bottom: 25 }
        rivers.forEach((river: any) => {
            const titleContainer = document.createElement('div');
            titleContainer.className = styles.riverChartTitleContainer;
            titleContainer.innerHTML = `${river.name ? river.name.toString().toUpperCase() : 'NAME NOT AVAILABLE'}`
            containerRef.current.append(titleContainer);

            let hasNullValues: boolean = false;
            xScaleValues.current.forEach((obj: any) => {
                if (!river[obj.fieldName] || river[obj.fieldName] === null) {
                    hasNullValues = true;
                }
            });

            // if any of the values used to make the chart are null, we won't be able to make the line
            if (hasNullValues) {
                const noChartEl = document.createElement('div');
                noChartEl.className = styles.noResultsUI;
                noChartEl.innerHTML = `<p>Flow Data Not Available</p>`;
                containerRef.current.append(noChartEl)
                return;
            } else {
                const el = document.createElement('div');
                el.className = styles.chartContainer;
                containerRef.current.append(el);
                // create the svg
                const svg = d3.select(el)
                    .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                    .append("g")
                    .attr('transform',
                        'translate(' + margin.left + ',' + margin.top + ')');

                svg.on('mouseover', (d, i) => {
                    if (river.feature_id) {
                        highlightRiver(river.feature_id);
                    }
                });
                svg.on('mouseout', () => { unHighlightRiver(); })
                // create the x scale, although we will add it later (this is also for the line chart, we will use a different scale for points);
                const xScale = d3.scaleBand()
                    .domain(xScaleValues.current.map(d => d.fieldName)) // Use 'fieldName' for domain
                    .range([0, width - margin.left - margin.right]);

                // y values
                const yValues: Array<number> = []
                componentConfig.current.riverChartFieldNames.forEach((field: string) => {
                    if (river[field]) yValues.push(river[field]);
                });

                // retrieve current cfs data. This is the dot and horizontal line that we will place on the chart
                const currentCfsData = river.cfsData
                    .find((d: any) => d.period === props.selectedPeriod);
                // retrieve the max value for the y scale
                const yMax: number = (Math.ceil((Math.max(...yValues) / 1000)) * 1000)
                // create the y scale
                const yScale = d3.scaleLinear()
                    .domain([0, yMax])
                    .range([height - margin.bottom, 0]);
                const yTickValues: Array<number> = [0, (Math.ceil((Math.max(...yValues) / 1000)) * 1000)];

                // add the y scale
                svg.append('g')
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(yScale)
                        .tickValues(yTickValues)
                        .tickFormat((d: any) => {
                            if (d === 0) return '0';
                            // for formatting of y scale values, divide by 1000 and round to 3 significant figures
                            let tickString: string = '';
                            // let tickString: string = (d / 1000).toPrecision(2).toString();
                            let tickValue: number = d / 1000;
                            if (tickValue < 1) {
                                tickString = '1';
                            } else
                                if (d >= 1000000) {
                                    tickString = tickValue.toString().substring(0, 4);
                                }
                                else tickString = tickValue.toString().substring(0, 3);

                            return tickString;
                        }));

                // line generator function
                const line = d3.line()
                    .x((d, i) => {
                        // this is where the line gets its x positioning from
                        return xScale(xScaleValues.current[i].fieldName)! + xScale.bandwidth()
                    })
                    .y((d) => {
                        // this is where the line gets its y positioning from
                        return yScale(d[1])
                    });


                // get the river's line data in to the format that is consumable by the d3 line object
                let lineChartValues: Array<any> = [];
                Object.keys(river).
                    filter(key => componentConfig.current.riverChartFieldNames.includes(key))
                    .forEach((key: string) => {
                        lineChartValues.push([key, river[key]]);
                    });

                // append lines to the SVG for each river
                svg.append("path")
                    .attr("fill", "none")
                    .attr("stroke", "#44b7bd")
                    .attr("stroke-width", 2)
                    .attr("d", line(lineChartValues))

                // add the x scale last so that if the line overlaps with the scale (e.g. in cases where a value is very close to 0), it does not look crowded
                svg.append("g")
                    .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
                    .call(d3.axisBottom(xScale)
                        .tickValues(xScaleValues.current.map(d => d.fieldName))
                        .tickSize(0)
                        .tickFormat(d => xScaleValues.current.find(obj => obj.fieldName === d)!.tick)
                    );


                // before we add the cfs data, lets add the invisible bars we'll use to listen
                // for chart hovering.
                const barsGraphic = svg.append('g');
                const barsObj = barsGraphic.selectAll('rect')
                    .data(lineChartValues, (d: any) => d)
                barsObj.enter()
                    .append('rect')
                    .attr('x', (d) => {
                        return xScale(d[0])!
                    })
                    .attr("transform", `translate(${margin.left},-${margin.top})`)
                    .attr('y', yScale(yMax))
                    .attr('width', (width - margin.left - margin.right) / lineChartValues.length)
                    .attr('height', height - margin.bottom + margin.top)
                    .attr('fill', '#FFFFFF')
                    .style('fill-opacity', 0)
                    .on('mouseover', (event, data) => {
                        d3.select(event.target)
                            .style('fill-opacity', .1)
                            .attr('fill', '#FFFFFF');

                        displayRiverTooltip(event, data, river, currentCfsData)
                    })
                    .on('mouseout', (event, data) => {
                        d3.select(event.target)
                            .style('fill-opacity', 0) // reset to invisible 
                        hideRiverTooltip();
                    })

                // if we have the cfs data, add the point and the dashed line
                if (currentCfsData.Q_cfs && currentCfsData.period) {
                    // put the point on the chart
                    let currentMonthCode = currentCfsData.period.substring(4, 6);
                    let x = xScaleValues.current.find((tick: { tick: string, fieldName: string, mm: string }) => tick.mm === currentMonthCode)?.fieldName ?? null;
                    const point = {
                        x: x,
                        y: currentCfsData.Q_cfs
                    };

                    // we have made a proper point for the Q_cfs field. lets add the point and line
                    if (x && currentCfsData.Q_cfs && xScale(x) !== undefined) {
                        if (currentCfsData.Q_cfs > yMax) {

                            point.y = yMax;
                            let triangle = d3.symbol().type(d3.symbolTriangle).size(27);
                            // create the triangle
                            svg.append('g')
                                .append("path")
                                .attr('d', triangle)
                                .style("fill", "#FFFFFF")
                                .style('pointer-events', 'none')
                                .attr("transform", `translate(${((xScale(point.x ?? '') ?? 0) + margin.left + (xScale.bandwidth() / 2) - 2)},0)`) // translate to the right to accomodate the margin, then move half a bandwidth to the right. finally, subtract 2 to place the triangle more precisely

                        } else {
                            // create the point
                            svg.append('g')
                                .selectAll('dot')
                                .data([point])
                                .enter()
                                .append("circle")
                                .attr("cx", (d: any) => { return xScale(d.x) ?? ''; })
                                .attr("cy", (d: any) => { return yScale(d.y); })
                                .attr("r", 3)
                                .style("fill", "#FFFFFF")
                                .style('pointer-events', 'none')
                                .attr("transform", `translate(${margin.left + (xScale.bandwidth() / 2) - 1.5},0)`) // translate to the right to accomodate the margin, then move half a bandwidth to the right. finally, subtract 1.5 to handle the radius size of 3
                        }
                    }
                }
            }
        });
    }

    const invalidClick: (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => void = (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => {
        containerRef.current.innerHTML = '';
        if (reservoirsLayer.current) reservoirsLayer.current.definitionExpression = '1=0';
        if (riversLayer.current) riversLayer.current.definitionExpression = '1=0';
        constructInvalidClickUI(retrievedPrimaryText ?? undefined, retrievedSecondaryText ?? undefined);
        props.invalidMapClick();
    }

    const constructFullUI: (data: any) => void = (data: any) => {
        primaryText.current = data.NAME ?? '';
        secondaryText.current = `${data.HUC4 ? 'HUC ' + data.HUC4 + ' | ' : ''}${data.rivers?.length ?? 0} Major River${data.rivers?.length !== 1 ? 's' : ''}`

        if (data.rivers?.length > 0) { setShowNoResultsRiverUI(false); }
        else setShowNoResultsRiverUI(true);
        constructRiverCharts(data.rivers);

        if (data.reservoirs) {
            constructReservoirTableHeaders();
            constructReservoirTableRows(data);
        }

        if (data.HUC4) {
            filterReservoirsLayer(data.HUC4);
            filterRiversLayer(data.HUC4);
            // signal to update chart
            props.updateChartingData(props.areaType, data.HUC4);
        }

        if (data.geometry) {
            props.updateSelectedFeatureGeometry(data.geometry);
        }
        setPanelState('loaded');
    }

    const filterReservoirsLayer: (huc4: string) => void = (huc4: string) => {
        if (reservoirsLayer.current) reservoirsLayer.current.definitionExpression = `huc4 = '${huc4}'`
    }

    const filterRiversLayer: (huc4: string) => void = (huc4: string) => {
        if (riversLayer.current) riversLayer.current.definitionExpression = `huc4 = '${huc4}'`
    }

    const constructStandbyUI: () => void = () => {
        primaryText.current = 'SELECT AN AREA';
        secondaryText.current = '';
        setPanelState('standby');
    }

    const constructLoadingUI: () => void = () => {
        primaryText.current = 'LOADING'
        secondaryText.current = '';
        setPanelState('loading');
    }

    const constructInvalidClickUI: (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => void = (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => {
        primaryText.current = retrievedPrimaryText ?? 'INVALID AREA';
        secondaryText.current = retrievedSecondaryText ?? '';
        setPanelState('invalid');
    }

    useEffect(() => {
        // when there is an update to the click, area mode, or period, check for features if the panelTab is 'pop' and you have a click to reference
        if (props.mapClickData && props.panelTab === 'water' && panelState !== 'loading') {
            if ((props.areaType !== 'huc4')) {
                props.changeAreaType('huc4');
            }
            else
                constructLoadingUI();
        }
        else if ((!props.mapClickData && props.panelTab === 'water') || props.panelTab !== 'water') {
            // could only occur when a user hasn't clicked the map yet but has toggled the water tab button
            // we should now show the UI that says to select an area within the US
            constructStandbyUI();
        }
        else if (props.panelTab !== 'water') {
            setReservoirTableHeaders(null);
            setReservoirTableRows(null);
        }
    }, [props.mapClickData, props.signalPanelTabChanged, props.signalPeriodChanged, props.areaTypeChanged])

    useEffect(() => {
        if (panelState === 'loading') {
            checkForData();
        }
    }, [panelState])

    useEffect(() => {
        props.webmap.when(() => {
            waterGroupLayer.current = props.webmap.layers.find((layer: Layer) => layer.title === props.appConfig.waterLayerTitle) as GroupLayer;
            riversLayer.current = waterGroupLayer.current.layers.find((layer: Layer) => layer.title === componentConfig.current.riversLayerTitle) as FeatureLayer;
            reservoirsLayer.current = waterGroupLayer.current.layers.find((layer: Layer) => layer.title === componentConfig.current.reservoirsLayerTitle) as FeatureLayer;
            riversLayer.current.definitionExpression = '1=0';
            reservoirsLayer.current.definitionExpression = '1=0';
        })
    }, [props.webmap])

    useEffect(() => { }, [riverTooltipElement, reservoirTooltipElement])

    return (
        <>
            {reservoirTooltipElement}
            {riverTooltipElement}
            <div className={styles.outerContainer}>

                <div className={styles.mainInformationDiv}>

                    <div className={styles.areaTextSection}>
                        <RegionalInformation
                            primaryText={primaryText.current}
                            secondaryText={secondaryText.current}
                        />
                        <div className={styles.closeDiv} onClick={() => { props.collapseLeftPanel(); }}>
                            <CalciteIcon icon={'x-circle'}></CalciteIcon>
                        </div>
                    </div>

                    <div className={styles.tablesContainer}>
                        <div className={styles.sectionContainers}>
                            <div className={styles.sectionTitleDiv}>{componentConfig.current.primaryRiversSectionTitle}</div>
                            <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                                <div ref={legendRef} className={styles.chartLegendContainer}>
                                    <div className={styles.lineLegend}></div>
                                    <span>Mean Flow, 1,000s cfs</span>
                                    <div className={styles.circleLegend}></div>
                                    <span>{getFormattedDateLabel(props.selectedPeriod)}</span>
                                </div>
                                <div hidden={!showNoResultsRiverUI}><Table rows={[]}></Table></div>
                                <div className={styles.riverSectionCharts} ref={containerRef}></div>
                            </div>
                            <div className={styles.tableDiv} hidden={panelState !== 'invalid'}>
                                <TableErrorBox
                                    messageType={'invalid'}
                                ></TableErrorBox>
                            </div>
                            <div className={styles.tableDiv} hidden={panelState !== 'standby'}>
                                <TableErrorBox
                                    messageType={'standby'}
                                ></TableErrorBox>
                            </div>
                        </div>

                        <div className={styles.sectionContainers}>
                            <div className={styles.sectionTitleDiv}>{componentConfig.current.reservoirsSectionTitle}</div>
                            <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                                <Table
                                    useStripedRows={true}
                                    columnHeaders={reservoirTableHeaders}
                                    rows={reservoirTableRows}
                                    panelState={panelState}
                                    headerHeight={componentConfig.current.reservoirTableConfig.headerHeight as tableTypes.HeaderHeight}
                                ></Table>
                            </div>
                            <div className={styles.tableDiv} hidden={panelState !== 'invalid'}>
                                <TableErrorBox
                                    messageType={'invalid'}
                                ></TableErrorBox>
                            </div>
                            <div className={styles.tableDiv} hidden={panelState !== 'standby'}>
                                <TableErrorBox
                                    messageType={'standby'}
                                ></TableErrorBox>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </>
    );
}

export default WaterTab;