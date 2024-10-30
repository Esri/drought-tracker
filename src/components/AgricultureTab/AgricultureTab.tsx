import React, { FC, useEffect, useRef, useState, MutableRefObject } from 'react';
import WebMap from '@arcgis/core/WebMap';
import GroupLayer from "@arcgis/core/layers/GroupLayer.js";
import Layer from "@arcgis/core/layers/Layer.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import styles from './AgricultureTab.module.css';
import config from './AgricultureTabConfig.json';
import sharedTypes from '../../assets/sharedTypes';
import types from './types';
import tableTypes from '../Table/types';
import CountyStateModeSelector from '../CountyStateModeSelector/CountyStateModeSelector';
import * as queryFunctions from 'query-functions-ts';
import RegionalInformation from '../RegionalInformation/RegionalInformation';
import Table from '../Table/Table';
import { CalciteIcon } from '@esri/calcite-components-react';
import TableErrorBox from '../TableErrorBox/TableErrorBox';

interface AgricultureTabProps {
    appConfig: sharedTypes.AppConfig,
    webmap: WebMap,
    selectedPeriod: string,
    signalPeriodChanged: number,
    collapseLeftPanel: () => void,
    updateChartingData: (featureCategory: sharedTypes.AreaTypeCategories, id?: string) => void
    updateSelectedFeatureGeometry: (geometry: any) => void,
    listOfPeriods: any,
    signalPanelTabChanged: number,
    panelTab: sharedTypes.PanelTabOptions,
    invalidMapClick: () => void,
    mapClickData: any,
    areaType: sharedTypes.AreaTypeCategories,
    changeAreaType: (type: sharedTypes.AreaTypeCategories) => void,
    areaTypeChanged: number,
    signalAreaTypeChanged: () => void;
    lastActiveCountyOrStateMode: sharedTypes.CountyOrStateMode
}

const AgricultureTab: FC<AgricultureTabProps> = (props: AgricultureTabProps) => {
    // component config
    const componentConfig: MutableRefObject<types.AgricultureTabConfig> = useRef<types.AgricultureTabConfig>(config as types.AgricultureTabConfig);
    // area information header texts
    const primaryText: MutableRefObject<string> = useRef<string>('');
    const secondaryText: MutableRefObject<string> = useRef<string>('');
    //table content elements
    const [columnHeaders, setColumnHeaders] = useState<Array<any>>([]);
    const [tableRows, setTableRows] = useState<Array<any>>([]);
    const [laborTableRows, setLaborTableRows] = useState<Array<any>>([]);
    const [exposureTableRows, setExposuretableRows] = useState<Array<any>>([]);
    // layer references
    const agGroupLayer: MutableRefObject<GroupLayer | undefined> = useRef<GroupLayer | undefined>();
    const countyAgLayer: MutableRefObject<FeatureLayer | undefined> = useRef<FeatureLayer | undefined>();
    const stateAgLayer: MutableRefObject<FeatureLayer | undefined> = useRef<FeatureLayer | undefined>();
    const defaultLayerOpacity: MutableRefObject<number> = useRef<number>(1);
    const nullString: String = componentConfig.current.nullString;
    const [censusYear, setCensusYear] = useState<string>('2022');
    // stored features and panel state
    const storedFeatures: MutableRefObject<any> = useRef<any>({ stateFeatures: [], countyFeatures: [] });
    const [panelState, setPanelState] = useState<'standby' | 'loading' | 'loaded' | 'invalid' | 'initial'>();

    const updateCountyOrStateMode: (mode: sharedTypes.CountyOrStateMode) => void = (mode: sharedTypes.CountyOrStateMode) => {
        // dont update if same value
        if (props.areaType === mode) return;
        props.changeAreaType(mode);
        toggleLayerOpacities();
        props.signalAreaTypeChanged();
    }

    const checkForData: () => void = async () => {
        // only intended to be called when mapClickData exists and panelTab is 'ag'
        if (props.mapClickData && props.panelTab === 'ag') {
            // have found data before but the last click while on this tab is not the same as the current click, so do at least first query
            // check if we have already retrieved this feature before
            // if we have, it means we have already attempted finding the layer data and associated table data
            const layerData = await getLayerData();
            if (layerData) {
                if (props.lastActiveCountyOrStateMode === 'county') {
                    if (storedFeatures.current.countyFeatures.find((d: any) => d.OBJECTID === layerData.OBJECTID) !== undefined) {
                        constructFullUI(storedFeatures.current.countyFeatures.find((d: any) => d.OBJECTID === layerData.OBJECTID));
                        return;
                    }
                } else if (props.lastActiveCountyOrStateMode === 'state') {
                    if (storedFeatures.current.stateFeatures.find((data: any) => data.OBJECTID === layerData.OBJECTID) !== undefined) {
                        // already got that feature, pull and set
                        constructFullUI(storedFeatures.current.stateFeatures.find((data: any) => data.OBJECTID === layerData.OBJECTID));
                        return;
                    }
                }
                // have not found the feature yet, get the historical data
                updateActiveData(layerData);
            }
        }

        return;
    }

    const getLayerData: () => any = async () => {
        try {
            // try to get location information (name, geoid, etc.) from layer
            const layerRequest = await queryFunctions.getPopulationServiceData(
                props.lastActiveCountyOrStateMode === 'county' ? 'county' : props.lastActiveCountyOrStateMode === 'state' ? 'state' : 'county',
                props.mapClickData.geometry,
                true, false, false, false, false, true);
            // if we successfully found at least 1 feature (and should be just 1), take that feature and return a data object created with it
            if (layerRequest.length > 0) {
                return {
                    ...layerRequest[0].attributes,
                    geometry: layerRequest[0].geometry
                }
            } else {
                console.log('womp womp');
                invalidClick();
            }
        } catch (e) {
            // if an error occurs when we query the layer
            console.error('could not retrieve layer data', e);
            invalidClick();
        }
    }

    const updateActiveData = async (data: any) => {
        try {
            // we now have all the id information and ag data stored on the layer. need to get historical data next:
            const historicalData = await queryFunctions.getAgricultureHistory(props.lastActiveCountyOrStateMode, data.OBJECTID);
            if (historicalData.length === 0) {
                invalidClick(
                    data.NAME ?? undefined,
                    data.State ?? undefined
                );
                if (data.geometry) props.updateSelectedFeatureGeometry(data.geometry);
                return;
            }
            const formattedHistoricalData = formatHistoricalData(historicalData);
            data = {
                ...data,
                historicalData: formattedHistoricalData
            };

        } catch (e) {
            console.error('an error occured while retrieving historical data for the feature', e);
            data.historicalData = [];
            invalidClick();
            return;
        }
        // store the created object that consists of layer data and an array of historical data objects
        if (props.lastActiveCountyOrStateMode === props.appConfig.stateModeValue) {
            storedFeatures.current.stateFeatures.push(data);
        }
        else if (props.lastActiveCountyOrStateMode === props.appConfig.countyModeValue) {
            storedFeatures.current.countyFeatures.push(data);
        }
        // the data retrieval was successful,
        // create the UI with the selected data
        constructFullUI(data);
    }

    const formatHistoricalData: (data: any) => any = (data: any) => {
        // let dataFormattingConfig = [
        //     {
        //         "startYear": 2000,
        //         "endYear": 2004,
        //         "censusYear": 2002,
        //         "missingCrops": [
        //             "corn_sales",
        //             "rice_sales",
        //             "sorghum_sales",
        //             "barley_sales",
        //             "wheat_sales",
        //             "soybean_sales"
        //         ],
        //         "missingLaborFields": [
        //             "labor_n_unpaid",
        //             "labor_n_mgt"
        //         ]
        //     },
        //     {
        //         "startYear": 2005,
        //         "endYear": 2009,
        //         "censusYear": 2007,
        //         "missingCrops": [],
        //         "missingLaborFields": [
        //             "labor_n_unpaid",
        //             "labor_n_mgt"
        //         ]
        //     },
        //     {
        //         "startYear": 2010,
        //         "endYear": 2014,
        //         "censusYear": 2012,
        //         "missingCrops": [
        //             "hay_sales"
        //         ],
        //         "missingLaborFields": []
        //     },
        //     {
        //         "startYear": 2015,
        //         "endYear": 2019,
        //         "censusYear": 2017,
        //         "missingCrops": [
        //             "hay_sales"
        //         ],
        //         "missingLaborFields": []
        //     },
        //     {
        //         "startYear": 2020,
        //         "endYear": null,
        //         "censusYear": 2022,
        //         "missingCrops": [
        //             "hay_sales"
        //         ],
        //         "missingLaborFields": []
        //     },
        // ];

        let dataFormattingConfig = componentConfig.current.dataFormattingConfig;

        data.forEach((set: any) => {
            const year = set.period.substring(0, 4);
            // find a config where is the set's year is inclusively within the startYear and endYear
            let formatConfig: any = dataFormattingConfig.find((c: any) => c.startYear <= year && (c.endYear >= year || c.endYear === null));
            if (formatConfig) {
                // successfully found configuration for the set
                formatConfig.missingCrops.forEach((crop: string) => {
                    set[crop] = '--';
                });
                formatConfig.missingLaborFields.forEach((field: string) => {
                    set[field] = '--';
                });
                // The other way around, -999 = --, null = 0. Missing entry in tables = 0. Unless (exceptions) described in the email,
                //  use -- instead of 0 for the cases in which we don't have data,
                // for example many crops don't report sales in the 2002 census, those are -- regardless if there's drought or not
                for (let key in set) {
                    if (set[key] === -999) {
                        set[key] = '--';
                    }
                    else if (set[key] === null || (set[key] < 0 && set[key] > -999)) {
                        set[key] = 0;
                    }
                }
                // later on we can add a field, "sumLabor", and assign it the value of labor_n_hrd + labor_n_unpaid,
                // but assign it to null if the labor_n_unpaid is missing
                // so we will want to do this at least before we make the table

                // set sumLabor field
                if (set['labor_n_hrd'] && set['labor_n_unpaid'] && set['labor_n_hrd'] !== '--' && set['labor_n_unpaid'] !== '--')
                    set['sumLabor'] = set['labor_n_hrd'] + set['labor_n_unpaid']
                else set['sumLabor'] = '--';

                // so now we have the missing fields accounted for for each year,
                // and we have the -999 and null values accounted for
                // and we have set the sumLabor field


                // after we do the formatting of known missing values,
                // we will need to assign weeks that do not have any entry.
                // for this, we should create a default object to use somehow...
                data.censusYear = formatConfig.censusYear.toString() ?? '0';
            }
            else {
                console.error('could not find formatting configuration for the provided period: ', set.period);
            }

        });
        // now that we're done formatting the data for missing values, we can create the missing weeks
        data = populateMissingWeeks(data, dataFormattingConfig.map((config: any) => { return { startYear: config.startYear, endYear: config.endYear, censusYear: config.censusYear } }));
        return data;
    }

    const toggleLayerOpacities: () => void = () => {
        if (agGroupLayer.current && countyAgLayer.current && stateAgLayer.current) {
            if (props.lastActiveCountyOrStateMode === componentConfig.current.countyModeValue) {
                countyAgLayer.current.opacity = defaultLayerOpacity.current;
                stateAgLayer.current.opacity = 0;
            } else {
                stateAgLayer.current.opacity = defaultLayerOpacity.current;
                countyAgLayer.current.opacity = 0;
            }
        }
    }

    const populateMissingWeeks: (data: any, config: any) => any = (data: any, config: Array<any>) => {
        // 1. make the default entries for each census period
        // 2. loop through the list of national drought periods
        // 3. populate with default entry if there is no matching period in data
        const defaultObjects: Array<any> = [];
        config.forEach((yearSet: any) => {
            const obj = { ...data.find((set: any) => set.period.substring(0, 4) >= yearSet.startYear && (yearSet.endYear === null || set.period.substring(0, 4) <= yearSet.endYear)) };
            obj.startYear = yearSet.startYear;
            obj.endYear = yearSet.endYear;
            obj.censusYear = yearSet.censusYear;
            defaultObjects.push(obj);
        });

        // fields to exclude from formatting
        let fieldsToExclude = [
            "GEOID",
            "OBJECTID",
            "startYear",
            "endYear",
            "censusYear"
        ]

        // format each default object to have its correct 0s
        defaultObjects.forEach((object: any) => {
            for (let key in object) {
                if (!fieldsToExclude.includes(key) && object[key] !== '--') {
                    object[key] = 0;
                }
            }
        });

        let temp: Array<any> = [];

        for (let i = 0; i < props.listOfPeriods.length; i++) {
            let currentPeriod = props.listOfPeriods[i].period;
            let currentDate = props.listOfPeriods[i].date;

            let entry = null;
            data.forEach((set: any) => {
                if (set.period === currentPeriod) {
                    entry = set;
                }
            });
            if (entry === null) {
                entry = { ...defaultObjects.find((obj: any) => obj.startYear <= currentPeriod.substring(0, 4) && (obj.endYear === null || obj.endYear >= currentPeriod.substring(0, 4))) };
                entry.period = currentPeriod;
                entry.period_date = currentDate;

            }

            entry.censusYear = defaultObjects.find((obj: any) => obj.startYear <= currentPeriod.substring(0, 4) && (obj.endYear === null || obj.endYear >= currentPeriod.substring(0, 4))).censusYear;
            temp.push(entry);
        }

        return temp;
    }

    const invalidClick: (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => void = (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => {
        constructInvalidClickUI(retrievedPrimaryText ?? undefined, retrievedSecondaryText ?? undefined);
        props.invalidMapClick();
    }

    const constructCropTableHeaders: () => void = () => {
        const headerArray: Array<any> = [];
        config.tableConfig.headers.forEach((headerConfig: { columnKeyAccessor: string, value?: string, values?: Array<string> }) => {
            const header: tableTypes.ColumnHeadCell = {
                // satisfy typescript
                columnKey: componentConfig.current.tableConfig[headerConfig.columnKeyAccessor as keyof typeof componentConfig.current.tableConfig] as string,
                cellValue: headerConfig.value ?? (headerConfig.values && headerConfig.values[0] && headerConfig.values[1] ? headerConfig.values[0] + ' ' + headerConfig.values[1] : ''),
            };

            let value: any = '';
            if (headerConfig.values && headerConfig.values[0] && headerConfig.values[1]) {
                value = <span>{headerConfig.values[0]}<br />{headerConfig.values[1]}</span>
            } else if (headerConfig.value) {
                value = headerConfig.value
            }

            header.element =
                <div key={header.columnKey + '-header'} className={styles.headerDiv}>
                    <span key={header.columnKey + '-span'} className={styles.tableHeaderText}>{value}</span>
                </div>
            headerArray.push(header);
        });
        setColumnHeaders(headerArray);
    }

    const constructCropTableRows: (periodData: any) => void = (periodData: any) => {
        const rowArray: Array<any> = [];
        componentConfig.current.tableConfig.rowConfig.rows.forEach((row: any) => {
            const tempCellArray: Array<any> = [];
            row.cells.forEach((cellConfig: any) => {
                const cell = {
                    ...cellConfig
                };
                switch (componentConfig.current.tableConfig[cellConfig.columnKey as keyof typeof componentConfig.current.tableConfig]) {
                    case ('crop'):
                        cell.element = <div key={cellConfig.value + '-table-cell'} className={styles.cropCell}>{cellConfig.value}</div>
                        break;
                    case ('prl'):
                        cell.value = (periodData[cellConfig.fieldNameAccessor] !== '--' ? '$' : '') + periodData[cellConfig.fieldNameAccessor].toLocaleString();
                        break;
                    case ('ad'):
                        let acreText: string = '0';
                        let percentText: string = '(0%)';
                        acreText = periodData[cellConfig.acreFieldAccessor] && periodData[cellConfig.acreFieldAccessor] !== '--' ? (periodData[cellConfig.acreFieldAccessor].toLocaleString()) : '--';

                        if (props.lastActiveCountyOrStateMode === 'county') {
                            percentText = '';
                        } else {
                            if (periodData[cellConfig.percentFieldAccessor] !== '--' && periodData[cellConfig.percentFieldAccessor]) percentText = `(${periodData[cellConfig.percentFieldAccessor]}%) `
                            else if (periodData[cellConfig.percentFieldAccessor] === '--' || !periodData[cellConfig.percentFieldAccessor]) percentText = '-- '
                        }
                        cell.value = `${acreText} ${percentText}`;
                        break;
                }
                tempCellArray.push(cell);
            });
            rowArray.push({
                rowHeight: row.height,
                rowKey: row.rowKey,
                cells: tempCellArray
            });
        });
        setTableRows(rowArray);
    }

    const constructLaborTable: (periodData: any) => void = (periodData: any) => {
        const rowArray: Array<any> = [];

        componentConfig.current.laborTableConfig.rows.forEach((rowConfig: any) => {
            let rowCells: Array<any> = [];
            const leftCell =
                <div className={styles.simpleLeftCellContainer}>
                    <div className={styles.simpleTableLeftCell + ' ' + (rowConfig.label.length > 25 ? styles.leftCellSmallText : '')}>
                        <span>{rowConfig.label}</span>
                    </div>
                </div>;
            rowCells.push({
                rowKey: rowConfig.key,
                element: leftCell
            });

            let rightCell;
            if (rowConfig.key === 'laborers') {

                const value = !isNaN(parseInt(periodData[rowConfig.field])) ? periodData[rowConfig.field].toLocaleString() : 0;


                rightCell =
                    <div className={styles.simpleRightCellContainer}>
                        <div className={styles.simpleTablRightCell}>
                            <span>{value}</span>
                        </div>
                    </div>;
            } else if (rowConfig.key === 'laborCost') {
                rightCell =
                    <div className={styles.simpleRightCellContainer}>
                        <div className={styles.simpleTablRightCell}>
                            <span>{periodData[rowConfig.field] &&
                                periodData[rowConfig.field] > 0 ?
                                '$' + (periodData[rowConfig.field]).toLocaleString() : nullString}</span>
                        </div>
                    </div>;
            } else {
                rightCell =
                    <div className={styles.simpleRightCellContainer}>
                        <div className={styles.simpleTablRightCell}>
                            <span>{periodData[rowConfig.field] &&
                                periodData[rowConfig.field] > 0 ?
                                (periodData[rowConfig.field]).toLocaleString() : nullString}</span>
                        </div>
                    </div>;
            }

            rowCells.push({
                rowKey: rowConfig.key,
                element: rightCell
            });

            rowArray.push({
                cells: rowCells,
                rowKey: rowConfig.key
            })

        })
        setLaborTableRows(rowArray);
    }

    const constructExposureTable: (data: any, periodData: any) => void = (data: any) => {
        const rowArray: Array<any> = [];

        componentConfig.current.exposureTableConfig.rows.forEach((rowConfig: any) => {
            let rowCells: Array<any> = [];
            // create the left cell
            const leftCell =
                <div className={styles.simpleLeftCellContainer}>
                    <div className={styles.simpleTableLeftCell + ' ' + (rowConfig.label.length > 25 ? styles.leftCellSmallText : '')}>
                        <span>{rowConfig.label}</span>
                    </div>
                </div>;

            rowCells.push({
                rowKey: rowConfig.key,
                element: leftCell
            });

            let rightCell =
                <div className={styles.simpleRightCellContainer}>
                    <div className={styles.simpleTablRightCell}>
                        <span>{data[rowConfig.field] &&
                            data[rowConfig.field] > 0 ?
                            '$' + (data[rowConfig.field]).toLocaleString() : '$' + nullString}</span>
                    </div>
                </div>;


            rowCells.push({
                rowKey: rowConfig.key,
                element: rightCell
            });

            rowArray.push({
                cells: rowCells,
                // rowHeight: 'm',
                rowKey: rowConfig.key
            })
        });
        setExposuretableRows(rowArray);
    }

    const constructFullUI: (data: any) => void = (data: any) => {
        // missing weeks are already populated by the time we get here
        let periodData = data.historicalData.find((d: any) => d.period === props.selectedPeriod);
        // format the values for the table
        if (props.lastActiveCountyOrStateMode === props.appConfig.countyModeValue) {
            primaryText.current = data.NAME;
            secondaryText.current = data.State;
        } else {
            // must be in state mode
            primaryText.current = data.NAME;
            secondaryText.current = '';
        }
        // create the tables UI
        constructCropTableHeaders();
        constructCropTableRows(periodData);
        // censusYear.current = data.censusYear;
        setCensusYear(periodData.censusYear)
        constructLaborTable(periodData);
        constructExposureTable(data, periodData);
        toggleLayerOpacities();
        // signal to update chart
        props.updateChartingData(props.lastActiveCountyOrStateMode, data.GEOID);
        props.updateSelectedFeatureGeometry(data.geometry);
        setPanelState('loaded');
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
        // when there is an update to the click, area mode, or period, check for features if the panelTab is 'ag' and you have a click to reference
        if (props.mapClickData && props.panelTab === 'ag' && panelState !== 'loading') {
            updateCountyOrStateMode(props.lastActiveCountyOrStateMode);
            // if (props.areaType !== 'county' && props.areaType !== 'state') props.changeAreaType(props.lastActiveCountyOrStateMode);
            constructLoadingUI();
        }
        else if ((!props.mapClickData && props.panelTab === 'ag') || props.panelTab !== 'ag') {
            // could only occur when a user hasn't clicked the map yet but has toggled the agriculture tab button
            // and potentially has jumped around in time or toggled between county and state mode
            // we should now show the UI that says to select an area within the US
            constructStandbyUI();
        }
    }, [props.mapClickData, props.signalPanelTabChanged, props.signalPeriodChanged, props.areaTypeChanged])

    useEffect(() => {
        if (panelState === 'loading') {
            checkForData();
        }
    }, [panelState])

    useEffect(() => {
        props.webmap.when(() => {
            agGroupLayer.current = props.webmap.layers.find((layer: Layer) => layer.title === componentConfig.current.agricultureGroupLayerTitle) as GroupLayer;
            countyAgLayer.current = agGroupLayer.current.layers.find((layer: Layer) => layer.title === componentConfig.current.countyLayerTitle) as FeatureLayer;
            stateAgLayer.current = agGroupLayer.current.layers.find((layer: Layer) => layer.title === componentConfig.current.stateLayerTitle) as FeatureLayer;
            defaultLayerOpacity.current = stateAgLayer.current.opacity;
            toggleLayerOpacities();
        })
    }, [props.webmap])

    useEffect(() => { }, [censusYear]);

    return (
        <>

            <div className={styles.outerContainer}>

                <div className={styles.mainInformationDiv}>

                    <div className={styles.modeSelectorSection}>
                        <div className={styles.selectorRow}>
                            <CountyStateModeSelector
                                disabled={panelState !== 'loaded'}
                                countyOrStateMode={props.areaType === 'county' ? 'county' : props.areaType === 'state' ? 'state' : 'county'}
                                updateMode={(mode: sharedTypes.CountyOrStateMode) => { updateCountyOrStateMode(mode) }}
                            />
                        </div>
                    </div>
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
                            <div className={styles.sectionTitleDiv}>ECONOMIC IMPACT BY CROP</div>
                            <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                                <Table
                                    useStripedRows={true}
                                    columnHeaders={columnHeaders}
                                    rows={tableRows}
                                    headerHeight={config.tableConfig.headerHeight as tableTypes.HeaderHeight}
                                ></Table>
                                <p className={styles.disclaimerText}>{`Sales estimates are based on ${censusYear} USDA Ag Census.`}</p>
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
                            <div className={styles.sectionTitleDiv}>AGRICULTURAL LABOR</div>
                            <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                                <Table
                                    rows={laborTableRows}
                                ></Table>
                                <p className={styles.disclaimerText}>{'H/C: Hired & Contracted.'}<br></br>{`Labor estimates are based on ${censusYear} USDA Ag Census.`}</p>
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
                            <div className={styles.sectionTitleDiv}>EXPOSURE</div>
                            <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                                <Table
                                    rows={exposureTableRows}
                                ></Table>
                                <p className={styles.disclaimerText}>FEMA NRI, applies to entire area.</p>
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
                        <div className={styles.bottomDisclaimerDiv}>
                            <span >{componentConfig.current.bottomDisclaimerText}</span>
                        </div>

                    </div>

                </div>


            </div>

        </>
    );
}

export default AgricultureTab;