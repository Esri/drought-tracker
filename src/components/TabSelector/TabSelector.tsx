import React, { FC, useEffect, useState, useRef, MutableRefObject } from 'react';
import AppConfig from '../../AppConfig.json';
import styles from './TabSelector.module.css';
import sharedStyles from '../../assets/sharedStyles.module.css';
import sharedTypes from '../../assets/sharedTypes';

interface TabSelectorProps {
    panelTab: sharedTypes.PanelTabOptions,
    signalPanelTabChanged: number,
    togglePopulationTab: () => void,
    toggleWaterTab: () => void,
    toggleAgricultureTab: () => void,
    areaType: sharedTypes.AreaTypeCategories,
    activeArc: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | null,
    arcDroughtLevel: number,
}

const TabSelector: FC<TabSelectorProps> = (props: TabSelectorProps) => {

    const [droughtPercentInfo, setDroughtPercentInfo] = useState<string>('');
    const appConfig: MutableRefObject<sharedTypes.AppConfig> = useRef<sharedTypes.AppConfig>(AppConfig);

    const selectTab: (tabKey: 'pop' | 'water' | 'ag') => void = (tabKey: 'pop' | 'water' | 'ag') => {
        switch (tabKey) {
            case 'pop':
                props.togglePopulationTab();
                break;
            case 'water':
                props.toggleWaterTab();
                break;
            case 'ag':
                // will do same thing when ag is being built
                props.toggleAgricultureTab();
                break;
        }
    }

    useEffect(() => {
        setDroughtPercentInfo(`${Math.ceil(props.arcDroughtLevel)}% of the ` +
            `${props.areaType === 'nation' || props.panelTab === null ? 'U.S.' : props.areaType === 'huc4' ? 'watershed' : props.areaType}`
        );
    }, [props.activeArc, props.areaType]);

    useEffect(() => {

    }, [droughtPercentInfo, props.panelTab])

    return (
        <div className={styles.outerContainer}>

            <div className={styles.container}>
                {props.activeArc !== null &&
                    <div className={styles.areaInfoContainer}>
                        <div className={styles.levelLabelContainer + ' ' + sharedStyles[appConfig.current.levelColorClass[props.activeArc]]}>
                            <span className={styles.levelLabel}> {appConfig.current.levelLabels[props.activeArc]}</span>
                        </div>
                        <p>{droughtPercentInfo}</p>
                    </div>
                }

                <div hidden={props.activeArc !== null}>

                    <div className={styles.buttonRowContainer}>
                        <div className={styles.buttonRow}>
                            <button className={(props.panelTab === 'pop' ? sharedStyles.selectedButton : sharedStyles.nonSelectedButton) + ' ' + styles.button} onClick={() => { selectTab('pop') }}>POPULATION</button>
                            <button className={(props.panelTab === 'water' ? sharedStyles.selectedButton : sharedStyles.nonSelectedButton) + ' ' + styles.button} onClick={() => { selectTab('water') }}>WATER</button>
                            <button className={(props.panelTab === 'ag' ? sharedStyles.selectedButton : sharedStyles.nonSelectedButton) + ' ' + styles.button} onClick={() => { selectTab('ag') }}>AGRICULTURE</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TabSelector;