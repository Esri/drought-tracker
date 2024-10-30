import React, { FC, useEffect, useState, useRef, MutableRefObject } from 'react';
import WebMap from "@arcgis/core/WebMap.js";
import PopulationTab from '../PopulationTab/PopulationTab';
import WaterTab from '../WaterTab/WaterTab';
import AgricultureTab from '../AgricultureTab/AgricultureTab';
import styles from './LeftPanel.module.css';
import sharedTypes from '../../assets/sharedTypes';

interface LeftPanelProps {
  collapseLeftPanel: () => void,
  webmap: WebMap,
  countyOrStateMode?: 'county' | 'state' | null,
  appConfig: sharedTypes.AppConfig,
  signalPanelTabChanged: number,
  panelTab: sharedTypes.PanelTabOptions,
  mapClickData: {
    geometry: sharedTypes.PointClickGeometry,
  } | undefined,
  selectedPeriod: string,
  signalPeriodChanged: number,
  updateChartingData: (featureCategory: sharedTypes.AreaTypeCategories, id?: string) => void
  updateSelectedFeatureGeometry: (geometry: any) => void,
  listOfPeriods: any,
  invalidMapClick: () => void,


  areaType: sharedTypes.AreaTypeCategories,
  changeAreaType: (type: sharedTypes.AreaTypeCategories) => void,
  areaTypeChanged: number,
  signalAreaTypeChanged: () => void;
  lastActiveCountyOrStateMode: sharedTypes.CountyOrStateMode
}

// left panel could know the active source category for layer data (county, state, water, no need for national)
// and retrieve the layer data.
// then, left panel could pass along the layer data for the click to the proper

/**
 * the parent component of the population, water, and agriculture tabs
 */
const LeftPanel: FC<LeftPanelProps> = (props: LeftPanelProps) => {

  useEffect(() => {
  }, [props.mapClickData, props.signalPanelTabChanged])


  return (
    <>
      <div className={styles.container}>
        <div className={styles.topDiv}>
          <div className={styles.legendDiv}>
            {props.panelTab === 'pop' && <img src={require('../../assets/LegendFull_Pop.png')} alt="legend"></img>}
            {props.panelTab === 'water' && <img src={require('../../assets/LegendFull_Water.png')} alt="legend"></img>}
            {props.panelTab === 'ag' && <img src={require('../../assets/LegendFull_Ag.png')} alt="legend"></img>}
          </div>
        </div>

        <div className={styles.sectionTopLine}></div>
        <div className={styles.sectionBottomLine}></div>

        <div className={navigator.userAgent.toLowerCase().includes('firefox') ? styles.mainInformationDivFirefoxScroll : styles.mainInformationDivChromiumScroll}>
          {
            <div hidden={props.panelTab !== props.appConfig.popPanelOption}>
              <PopulationTab
                appConfig={props.appConfig}
                webmap={props.webmap}
                selectedPeriod={props.selectedPeriod}
                signalPeriodChanged={props.signalPeriodChanged}
                collapseLeftPanel={() => { props.collapseLeftPanel(); }}
                updateChartingData={(featureCategory: sharedTypes.AreaTypeCategories, id?: string) => { props.updateChartingData(featureCategory, id ?? undefined) }}
                updateSelectedFeatureGeometry={(geometry: any) => { props.updateSelectedFeatureGeometry(geometry) }}
                signalPanelTabChanged={props.signalPanelTabChanged}
                panelTab={props.panelTab}
                invalidMapClick={() => { props.invalidMapClick(); }}
                mapClickData={props.mapClickData}
                areaType={props.areaType}
                changeAreaType={(type: sharedTypes.AreaTypeCategories) => { props.changeAreaType(type) }}
                areaTypeChanged={props.areaTypeChanged}
                signalAreaTypeChanged={() => { props.signalAreaTypeChanged(); }}
                lastActiveCountyOrStateMode={props.lastActiveCountyOrStateMode}
              ></PopulationTab>
            </div>
          }
          {
            <div hidden={props.panelTab !== props.appConfig.waterPanelOption}>
              <WaterTab
                appConfig={props.appConfig}
                webmap={props.webmap}
                selectedPeriod={props.selectedPeriod}
                signalPeriodChanged={props.signalPeriodChanged}
                collapseLeftPanel={() => { props.collapseLeftPanel(); }}
                updateChartingData={(featureCategory: sharedTypes.AreaTypeCategories, id?: string) => { props.updateChartingData(featureCategory, id ?? undefined) }}
                updateSelectedFeatureGeometry={(geometry: any) => { props.updateSelectedFeatureGeometry(geometry) }}
                signalPanelTabChanged={props.signalPanelTabChanged}
                panelTab={props.panelTab}
                invalidMapClick={() => { props.invalidMapClick(); }}
                mapClickData={props.mapClickData}
                areaType={props.areaType}
                changeAreaType={(type: sharedTypes.AreaTypeCategories) => { props.changeAreaType(type) }}
                areaTypeChanged={props.areaTypeChanged}
                signalAreaTypeChanged={() => { props.signalAreaTypeChanged(); }}
              ></WaterTab>
            </div>
          }
          {
            <div hidden={props.panelTab !== props.appConfig.agPanelOption}>
              <AgricultureTab
                appConfig={props.appConfig}
                webmap={props.webmap}
                selectedPeriod={props.selectedPeriod}
                signalPeriodChanged={props.signalPeriodChanged}
                collapseLeftPanel={() => { props.collapseLeftPanel(); }}
                updateChartingData={(featureCategory: sharedTypes.AreaTypeCategories, id?: string) => { props.updateChartingData(featureCategory, id ?? undefined) }}
                updateSelectedFeatureGeometry={(geometry: any) => { props.updateSelectedFeatureGeometry(geometry) }}
                listOfPeriods={props.listOfPeriods}
                signalPanelTabChanged={props.signalPanelTabChanged}
                panelTab={props.panelTab}
                invalidMapClick={() => { props.invalidMapClick(); }}
                mapClickData={props.mapClickData}
                areaType={props.areaType}
                changeAreaType={(type: sharedTypes.AreaTypeCategories) => { props.changeAreaType(type) }}
                areaTypeChanged={props.areaTypeChanged}
                signalAreaTypeChanged={() => { props.signalAreaTypeChanged(); }}
                lastActiveCountyOrStateMode={props.lastActiveCountyOrStateMode}
              ></AgricultureTab>
            </div>
          }
        </div>


      </div>
    </>
  );
}

export default LeftPanel;