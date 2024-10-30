import React, { FC, useEffect, useState } from 'react'
import styles from './Corner.module.css';
import sharedTypes from '../../assets/sharedTypes';
import WebMap from "@arcgis/core/WebMap.js";
import DoughnutChart from '../DoughnutChart/DoughnutChart';
import "@esri/calcite-components/dist/components/calcite-icon";
import { CalciteIcon } from '@esri/calcite-components-react';

interface CornerProps {
    webmap: WebMap,
    currentDroughtLevels: sharedTypes.DroughtLevelData,
    todaysPeriod: any,
    selectedPeriod: any,
    signalPeriodChanged: number,
    panelTab: sharedTypes.PanelTabOptions,
    signalPanelTabChanged: number,
    setSignalPeriodChanged: () => void,
    setNewPeriod: (newPeriod: string | null, weekChangeCount?: number) => void,
    activeArc: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | null
    setActiveArc: (arc: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | null) => void,
    areaType: sharedTypes.AreaTypeCategories,
    areaTypeChanged: number,
    showInfoModal: () => void,
    earliestPeriod: string,
}

const Corner: FC<CornerProps> = (props: CornerProps) => {

    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [resetDivClass, setResetDivClass] = useState(styles.resetDiv)

    const displayTooltip: () => void = () => {
        setShowTooltip(true);
        setResetDivClass(styles.resetDiv + ' ' + styles.pointerCursor)
    }

    const hideTooltip: () => void = () => {
        setShowTooltip(false);
        setResetDivClass(styles.resetDiv)
    }

    const resetPeriod = () => {
        props.setNewPeriod(props.todaysPeriod);
    }

    useEffect(() => {

    }, [props.signalPeriodChanged, showTooltip, resetDivClass])


    return (
        <>
            <div className={styles.boundingContainer}></div>
            <div className={styles.elements}>
                <div className={styles.leftBlock}>
                    <div className={styles.chartDiv}>
                        <DoughnutChart
                            webmap={props.webmap}
                            currentDroughtLevels={props.currentDroughtLevels}
                            selectedPeriod={props.selectedPeriod}
                            setNewPeriod={(newPeriod: string | null, weekChangeCount?: number) => { props.setNewPeriod(newPeriod, weekChangeCount) }}
                            signalPeriodChanged={props.signalPeriodChanged}
                            setSignalPeriodChanged={() => { props.setSignalPeriodChanged() }}
                            setActiveArc={(arc: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | null) => { props.setActiveArc(arc) }}
                            areaType={props.areaType}
                            areaTypeChanged={props.areaTypeChanged}
                            signalPanelTabChanged={props.signalPanelTabChanged}
                            panelTab={props.panelTab}
                            earliestPeriod={props.earliestPeriod}
                            todaysPeriod={props.todaysPeriod}
                        ></DoughnutChart>
                    </div>

                    <div className={styles.tooltipContent} hidden={!showTooltip}><strong>Reset To Current Week</strong></div>
                    <div className={styles.resetDiv} id='resetButton' onMouseEnter={() => { displayTooltip(); }} onMouseLeave={() => { hideTooltip(); }}>
                        <CalciteIcon icon="refresh" onClick={() => { resetPeriod(); }}></CalciteIcon>
                    </div>
                </div>
                <div className={styles.rightBlock}>
                    <div className={styles.infoDiv}>
                        <CalciteIcon scale='s' icon="information" onClick={() => { props.showInfoModal(); }}></CalciteIcon>
                    </div>
                    <div className={styles.logoDiv}>
                        <img src={require('../../assets/DroughtAwareHeaderLogo.png')} alt="Logo"></img>
                    </div>
                </div>
            </div>

            <div className={styles.container}>
            </div>
        </>
    );
}

export default Corner;