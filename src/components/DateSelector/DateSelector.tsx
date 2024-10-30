import React, { FC, useEffect, useRef, useState, MutableRefObject } from 'react';
import styles from './DateSelector.module.css';
import sharedTypes from '../../assets/sharedTypes';
import config from './config.json';
import { CalciteIcon } from '@esri/calcite-components-react';
import "@esri/calcite-components/dist/components/calcite-icon";

interface DateSelectorProps {
    selectedPeriod: string,
    setSignalPeriodChanged: () => void,
    setNewPeriod: (newPeriod: string | null, weekChangeCount?: number) => void,
    signalPeriodChanged: number,
    areaTypeChanged: number,
    areaType: sharedTypes.AreaTypeCategories, // 'county' | 'state' | 'nation' | 'huc4'
    signalPanelTabChanged: number,
    panelTab: sharedTypes.PanelTabOptions,
    earliestPeriod: string,
    todaysPeriod: string,
}



const DateSelector: FC<DateSelectorProps> = (props: DateSelectorProps) => {

    const componentConfig: MutableRefObject<any> = useRef<any>(config);
    const [activeMonth, setActiveMonth] = useState<string>(componentConfig.current.monthDisplayTexts.find((t: any) => t.key === props.selectedPeriod.substring(4, 6)).value);
    const [areaText, setAreaText] = useState<string>(props.areaType === 'nation' ? 'National' : 'Selected Area');


    const incrementWeek: (incrementingUp: boolean) => void = (incrementingUp: boolean) => {
        if (incrementingUp) {
            props.setNewPeriod(null, -1);
        } else if (!incrementingUp) {
            props.setNewPeriod(null, 1);
        }

    }

    const incrementYear: (incrementingUp: boolean) => void = (incrementingUp: boolean) => {
        if (incrementingUp) {
            props.setNewPeriod(null, -52);
        } else if (!incrementingUp) {
            props.setNewPeriod(null, 52);
        }

    }

    const checkWeekBounds: () => void = () => {

    }

    const checkYearBounds: () => void = () => {
        if (props.selectedPeriod.substring(0, 4) === props.todaysPeriod.substring(0, 4)) {

        }
    }

    useEffect(() => {
        // here we need to check if the current week is equal to the first period or the most recent period,
        // and then we need to check if the year is the same as the first or last period's year
        checkWeekBounds();
        checkYearBounds();
        setActiveMonth(componentConfig.current.monthDisplayTexts.find((t: any) => t.key === props.selectedPeriod.substring(4, 6)).value);
    }, [props.signalPeriodChanged]);

    useEffect(() => {
        setAreaText(props.areaType === 'nation' || props.panelTab === null ? 'National' : 'Selected Area');
    }, [props.areaTypeChanged, props.panelTab, props.areaType])

    useEffect(() => { }, [areaText]);


    return (
        <div className={styles.container}>

            <span className={styles.text + ' ' + styles.topText}>Week Of</span>
            <div className={styles.rowContainer + ' ' + styles.topRow}>
                <div className={styles.rowElement}>
                    <button
                        className={props.selectedPeriod === props.earliestPeriod ? styles.disabledDateButton : styles.button}
                        onClick={() => { incrementWeek(false) }}
                        disabled={props.selectedPeriod === props.earliestPeriod}
                    >
                        <CalciteIcon className={styles.buttonicon} icon='caret-left' scale='s'></CalciteIcon>
                    </button>
                </div>
                <div className={styles.rowElement}>
                    <div className={styles.textContainer}>
                        <span>{activeMonth} {props.selectedPeriod.substring(6, 8)}</span>
                    </div>
                </div>
                <div className={styles.rowElement}>
                    <button
                        className={props.selectedPeriod === props.todaysPeriod ? styles.disabledDateButton : styles.button}
                        onClick={() => { incrementWeek(true) }}
                        disabled={props.selectedPeriod === props.todaysPeriod}
                    >
                        <CalciteIcon className={styles.buttonicon} icon='caret-right' scale='s'></CalciteIcon>
                    </button>
                </div>
            </div>

            <div className={styles.rowContainer + ' ' + styles.bottomRow}>
                <div className={styles.rowElement}>
                    <button
                        className={props.selectedPeriod.substring(0, 4) === props.earliestPeriod.substring(0, 4) ? styles.disabledDateButton : styles.button}
                        onClick={() => { incrementYear(false) }}
                        disabled={props.selectedPeriod.substring(0, 4) === props.earliestPeriod.substring(0, 4)}
                    >
                        <CalciteIcon className={styles.buttonicon} icon='caret-left' scale='s'></CalciteIcon>
                    </button>
                </div>
                <div className={styles.rowElement}>
                    <div className={styles.textContainer}>
                        <span>{props.selectedPeriod.substring(0, 4)}</span>
                    </div>
                </div>
                <div className={styles.rowElement}>
                    <button
                        className={props.selectedPeriod.substring(0, 4) === props.todaysPeriod.substring(0, 4) ? styles.disabledDateButton : styles.button}
                        onClick={() => { incrementYear(true) }}
                        disabled={props.selectedPeriod.substring(0, 4) === props.todaysPeriod.substring(0, 4)}
                    >
                        <CalciteIcon className={styles.buttonicon} icon='caret-right' scale='s'></CalciteIcon>
                    </button>
                </div>
            </div>

            <span className={styles.text + ' ' + styles.areaText}>{areaText}</span>

        </div>
    );
}

export default DateSelector;