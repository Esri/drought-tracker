import React, { useState, useRef, useEffect, FC, MutableRefObject } from 'react';
import WebMap from '@arcgis/core/WebMap';
import GroupLayer from "@arcgis/core/layers/GroupLayer.js";
import Layer from "@arcgis/core/layers/Layer.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import sharedTypes from '../../assets/sharedTypes';
import styles from './PopulationTab.module.css';
import sharedStyles from '../../assets/sharedStyles.module.css';
import Table from '../Table/Table';
import config from './PopulationTabConfig.json';
import tableTypes from '../Table/types';
import types from './types';
import * as queryFunctions from 'query-functions-ts'
import CountyStateModeSelector from '../CountyStateModeSelector/CountyStateModeSelector';
import RegionalInformation from '../RegionalInformation/RegionalInformation';
import TableErrorBox from '../TableErrorBox/TableErrorBox';
import { CalciteIcon } from '@esri/calcite-components-react';
import "@esri/calcite-components/dist/components/calcite-icon";

interface PopulationTabProps {
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
  lastActiveCountyOrStateMode: sharedTypes.CountyOrStateMode,
}

const PopulationTab: FC<PopulationTabProps> = (props: PopulationTabProps) => {
  // component configuration
  const componentConfig: MutableRefObject<types.PopulationTabConfig> = useRef<types.PopulationTabConfig>(config as types.PopulationTabConfig);
  // area information header texts
  const primaryText: MutableRefObject<string> = useRef<string>('');
  const secondaryText: MutableRefObject<string> = useRef<string>('');
  // table content elements
  const [droughtTableColumnHeaders, setDroughtTableColumnHeaders] = useState<Array<any>>([]);
  const [droughtTableRows, setDroughtTableRows] = useState<Array<any>>([]);
  const [vulnerablePopulationRows, setVulnerablePopulationRows] = useState<Array<any>>([]);
  const [economicImpactRows, setEconomicImpactRows] = useState<Array<any>>([]);
  // layer references
  const popGroupLayer: MutableRefObject<GroupLayer | undefined> = useRef<GroupLayer | undefined>();
  const countyPopLayer: MutableRefObject<FeatureLayer | undefined> = useRef<FeatureLayer | undefined>();
  const statePopLayer: MutableRefObject<FeatureLayer | undefined> = useRef<FeatureLayer | undefined>();
  const defaultLayerOpacity: MutableRefObject<number> = useRef<number>(1);
  // stored features and panel state
  const storedFeatures: MutableRefObject<types.StoredPopulationFeatures> = useRef<types.StoredPopulationFeatures>({ stateFeatures: [], countyFeatures: [] });
  const [panelState, setPanelState] = useState<'standby' | 'loading' | 'loaded' | 'invalid' | 'initial'>('initial');

  const updateCountyOrStateMode: (mode: sharedTypes.CountyOrStateMode) => void = (mode: sharedTypes.CountyOrStateMode) => {
    // dont update if same value
    if (props.areaType === mode) return;
    props.changeAreaType(mode);
    toggleLayerOpacities();
  }

  const checkForData: () => void = async () => {
    // only intended to be called when mapClickData exists and panelTab is 'pop'
    if (props.mapClickData && props.panelTab === 'pop') {
      // have found data before but the last click while on this tab is not the same as the current click, so do at least first query
      // check if we have already retrieved this feature before
      // if we have, it means we have already attempted finding the layer data and associated table data
      const data = await getData();
      if (data) {
        if (props.lastActiveCountyOrStateMode === 'county') {
          if (storedFeatures.current.countyFeatures.find((d: any) => d.OBJECTID === data.OBJECTID) !== undefined) {
            constructFullUI(storedFeatures.current.countyFeatures.find((d: any) => d.OBJECTID === data.OBJECTID));
            return;
          }
        } else if (props.lastActiveCountyOrStateMode === 'state') {
          if (storedFeatures.current.stateFeatures.find((d: any) => d.OBJECTID === data.OBJECTID) !== undefined) {
            // already got that feature, pull and set
            constructFullUI(storedFeatures.current.stateFeatures.find((d: any) => d.OBJECTID === data.OBJECTID));
            return;
          }
        }
        // have not found the feature yet, get the historical data
        updateActiveData(data);
      }
    }

    return;
  }

  const getData: () => any = async () => {
    try {
      // try to get location information (name, geoid, etc.) from layer
      const data = await queryFunctions.getPopulationServiceData(
        props.lastActiveCountyOrStateMode === 'county' ? 'county' : props.areaType === 'state' ? 'state' : 'county',
        props.mapClickData.geometry,
        true, true, true, false, true, false);
      // if we successfully found at least 1 feature (and should be just 1), take that feature and return a data object created with it
      if (data.length > 0) {
        return {
          ...data[0].attributes,
          geometry: data[0].geometry
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
      // we now have all the id information and pop/housing data stored on the layer. need to get historical data next:
      const historicalData = await queryFunctions.getPopulationHistory(props.lastActiveCountyOrStateMode, data.OBJECTID);
      data = {
        ...data,
        historicalData
      };
    } catch (e) {
      console.error('an error occured while retrieving historical data for the feature', e);
      data.historicalData = [];
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

  const toggleLayerOpacities: () => void = () => {
    if (popGroupLayer.current && countyPopLayer.current && statePopLayer.current) {
      if (props.lastActiveCountyOrStateMode === 'county') {
        countyPopLayer.current.opacity = defaultLayerOpacity.current;
        statePopLayer.current.opacity = 0;
      } else if (props.lastActiveCountyOrStateMode === 'state') {
        statePopLayer.current.opacity = defaultLayerOpacity.current;
        countyPopLayer.current.opacity = 0;
      }
    }
  }

  const createDefaultDataset: (data: any) => void = (data) => {
    // if there is not a period of data that was found that matches the selected period,
    // reference the first entry in the array of historical data to create a default one
    let temp: any = {};
    Object.entries(data).forEach((keyValue: any) => {
      temp[keyValue[0]] = 0;
    });
    return temp;
  }

  const invalidClick: (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => void = (retrievedPrimaryText?: string, retrievedSecondaryText?: string) => {
    constructInvalidClickUI(retrievedPrimaryText ?? undefined, retrievedSecondaryText ?? undefined);
    props.invalidMapClick();
  }

  const constructTableHeaders: () => void = () => {
    const headerArray: Array<any> = [];
    config.tableConfig.headers.forEach((headerConfig: { columnKeyAccessor: string, value: string }) => {
      const header: tableTypes.ColumnHeadCell = {
        // satisfy typescript
        columnKey: componentConfig.current.tableConfig[headerConfig.columnKeyAccessor as keyof typeof componentConfig.current.tableConfig] as string,
        cellValue: headerConfig.value,
      };

      if (header.columnKey !== componentConfig.current.tableConfig.singleMultiFamilyColumnKey) {
        header.element = <div className={styles.headerDiv}><span className={styles.tableHeaderText}>{headerConfig.value}</span></div>
      }
      // create single multi family header element
      else if (header.columnKey === componentConfig.current.tableConfig.singleMultiFamilyColumnKey) {
        header.element = <div className={styles.headerDiv}><div className={styles.splitTextContainer}><span>Multi-Family %</span><span>Single Family %</span></div></div>
      }
      headerArray.push(header);
    });
    setDroughtTableColumnHeaders(headerArray);
  }

  const constructTableRows: (data: any, periodData: any) => void = (data: any, periodData: any) => {
    const rowArray: Array<any> = [];
    componentConfig.current.tableConfig.rowConfig.rows.forEach((row: any) => {
      const tempCellArray: Array<any> = [];
      row.cells.forEach((cellConfig: any) => {
        const cell = {
          ...cellConfig
        };
        // if it is the drought level cell, make the html element for it
        if (componentConfig.current.tableConfig[cellConfig.columnKey as keyof typeof componentConfig.current.tableConfig] === 'droughtLevel') {
          cell.element = <div className={sharedStyles[cellConfig.cellStyleAccessor] + ' ' + styles.droughtCell}>{cellConfig.value ?? 0}</div>
        }
        // if it is the single/multi cell, make the html element
        else if (componentConfig.current.tableConfig[cellConfig.columnKey as keyof typeof componentConfig.current.tableConfig] === 'familyHousing') {
          let multiValue = row.rowKey === 'general' ? data[cellConfig.multiFamilyField] : periodData[cellConfig.multiFamilyField];
          let singleValue = row.rowKey === 'general' ? data[cellConfig.singleFamilyField] : periodData[cellConfig.singleFamilyField];

          cell.element = <div className={styles.tableValueCells}><span>{multiValue ?? 0} | {singleValue ?? 0}</span></div>
        }
        // if it has a field name accessor, use it to set the value
        if (cellConfig.fieldNameAccessor && cellConfig.fieldNameAccessor !== '') {
          cell.element = <div className={styles.tableValueCells}>{periodData[cellConfig.fieldNameAccessor] ? periodData[cellConfig.fieldNameAccessor].toLocaleString() : 0}</div>
        }
        tempCellArray.push(cell);
      });
      rowArray.push({
        rowHeight: row.height,
        rowKey: row.rowKey,
        cells: tempCellArray
      });
    });
    setDroughtTableRows(rowArray);
  }

  const createVulnerablePopulationsTable: (data: any, periodData: any) => void = (data: any, periodData: any) => {
    const rowArray: Array<any> = [];
    componentConfig.current.vulnerablePopTableConfig.rows.forEach((rowConfig: any) => {
      let rowCells: Array<any> = [];
      // create the left cell
      const leftCell =
        <div className={styles.simpleLeftCellContainer}>
          <div className={styles.simpleTableLeftCell}>
            <span>{rowConfig.label}</span>
          </div>
        </div>;

      rowCells.push({
        rowKey: rowConfig.key,
        element: leftCell
      });

      let rightCell;
      if (rowConfig.key === 'underNine' || rowConfig.key === 'overSeventy') {
        rightCell =
          <div className={styles.simpleRightCellContainer}>
            <div className={styles.simpleTablRightCell}>
              <span>{periodData[rowConfig.field] ? periodData[rowConfig.field].toLocaleString() : 0} | {periodData[rowConfig.field] ? (Math.round(periodData[rowConfig.field] / data['P0010001'] * 100) + '%') : '0%'}</span>
            </div>
          </div>;
      } else {
        rightCell =
          <div className={styles.simpleRightCellContainer}>
            <div className={styles.simpleTableRightCell}>
              <span>{props.lastActiveCountyOrStateMode === 'county' && data[rowConfig.field] ? data[rowConfig.field] : 'N/A'}</span>
            </div>
          </div>;
      }

      // only push the row if it is not (state mode AND the row isn't social or community) [this can definitely be improved] 
      if (props.lastActiveCountyOrStateMode === 'county' || (props.lastActiveCountyOrStateMode === 'state' && (rowConfig.key !== 'socialVulnerability' && rowConfig.key !== 'communityResiliance'))) {
        rowCells.push({
          rowKey: rowConfig.key,
          element: rightCell
        });

        rowArray.push({
          cells: rowCells,
          rowKey: rowConfig.key
        })
      }
    });
    setVulnerablePopulationRows(rowArray);
  }

  const createEconomicImpactTable: (data: any) => void = (data) => {
    const rowArray: Array<any> = [];
    componentConfig.current.economicImpactTableConfig.rows.forEach((rowConfig: any) => {
      if (!(props.lastActiveCountyOrStateMode === 'state' && rowConfig.key === 'riskRating')) {
        let rowCells: Array<any> = [];
        // create the left cell
        const leftCell =
          <div className={styles.simpleLeftCellContainer}>
            <div className={styles.simpleTableLeftCell}>
              <span>{rowConfig.label}</span>
            </div>
          </div>;

        rowCells.push({
          rowKey: rowConfig.key,
          element: leftCell
        });

        let rightCell;
        if (rowConfig.fields) {
          rightCell =
            <div className={styles.simpleRightCellContainer}>
              <div className={styles.simpleTablRightCell}>
                <span>{'$' + (data[rowConfig.fields[0]] ? Math.round(data[rowConfig.fields[0]]).toLocaleString() : 0)}</span> <span className={styles.economicImpactLossRating}> {data[rowConfig.fields[1]] ? ' | ' + data[rowConfig.fields[1]] : ''}</span>
              </div>
            </div>;
        } else {
          rightCell =
            <div className={styles.simpleRightCellContainer}>
              <div className={styles.simpleTableRightCell}>
                <span>{data[rowConfig.field] ?? 'N/A'}</span>
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


      }

    });
    setEconomicImpactRows(rowArray);
  }

  const constructFullUI: (data: any) => void = (data: any) => {
    let periodData = data.historicalData.find((d: any) => d.period === props.selectedPeriod);
    if (!periodData) periodData = createDefaultDataset(data.historicalData[0]);
    // format the values for the table
    if (props.lastActiveCountyOrStateMode === props.appConfig.countyModeValue) {
      secondaryText.current = data.State;
      primaryText.current = data.NAME;
    } else {
      // must be in state mode
      primaryText.current = data.NAME;
      secondaryText.current = '';
    }
    // construct column headers for table
    constructTableHeaders();
    // construct table rows
    constructTableRows(data, periodData);
    createVulnerablePopulationsTable(data, periodData);
    createEconomicImpactTable(data);
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
    // when there is an update to the click, area mode, or period, check for features if the panelTab is 'pop' and you have a click to reference
    if (props.mapClickData && props.panelTab === 'pop' && panelState !== 'loading') {
      updateCountyOrStateMode(props.lastActiveCountyOrStateMode);
      constructLoadingUI();
    }
    else if ((!props.mapClickData && props.panelTab === 'pop') || props.panelTab !== 'pop') {
      // could only occur when a user hasn't clicked the map yet but has toggled the population tab button
      // and potentially has jumped around in time or toggled between county and state mode
      // we should now show the UI that says to select an area within the US
      constructStandbyUI();
    }
  }, [props.mapClickData, props.signalPanelTabChanged, props.signalPeriodChanged, props.areaTypeChanged])

  useEffect(() => {
    if (panelState === 'loading') {
      if (!['county', 'state'].some((value: any) => value === props.areaType)) props.changeAreaType(props.lastActiveCountyOrStateMode);
      checkForData();
    }
  }, [panelState])

  useEffect(() => {
    props.webmap.when(() => {
      popGroupLayer.current = props.webmap.layers.find((layer: Layer) => layer.title === props.appConfig.populationLayerTitle) as GroupLayer;
      countyPopLayer.current = popGroupLayer.current.layers.find((layer: Layer) => layer.title === componentConfig.current.countyPopulationLayerTitle) as FeatureLayer;
      statePopLayer.current = popGroupLayer.current.layers.find((layer: Layer) => layer.title === componentConfig.current.statePopulationLayerTitle) as FeatureLayer;
      defaultLayerOpacity.current = statePopLayer.current.opacity;
      toggleLayerOpacities();
    })
  }, [props.webmap])

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
              <div className={styles.sectionTitleDiv}>{componentConfig.current.droughtTableTitle}</div>
              <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                <Table
                  useStripedRows={true}
                  columnHeaders={droughtTableColumnHeaders}
                  rows={droughtTableRows}
                  headerHeight={config.tableConfig.headerHeight as tableTypes.HeaderHeight}
                ></Table>
                <p className={styles.disclaimerText}>Based on 2020 U.S. Census.</p>
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
              <div className={styles.sectionTitleDiv}>{componentConfig.current.vulnerablePopulationsTitle}</div>
              <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                <Table
                  rows={vulnerablePopulationRows}
                ></Table>
                <p className={styles.disclaimerText}>U.S. Census ACS and FEMA NRI, applies to entire area.<br />Social and community ratings are only available for counties.</p>
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
              <div className={styles.sectionTitleDiv}>{componentConfig.current.economicImpactTitle}</div>
              <div className={styles.tableDiv} hidden={panelState !== 'loaded'}>
                <Table
                  rows={economicImpactRows}
                ></Table>
                <p className={styles.disclaimerText}>FEMA NRI, applies to entire area.<br />Risk ratings are only available for counties.</p>

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

export default PopulationTab;