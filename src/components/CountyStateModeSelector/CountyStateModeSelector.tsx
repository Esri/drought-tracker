import React, { FC, MutableRefObject, useEffect, useRef, useState } from 'react';
import styles from './CountyStateModeSelector.module.css';
import sharedStyles from '../../assets/sharedStyles.module.css';
import sharedTypes from '../../assets/sharedTypes';
import config from '../../AppConfig.json';

interface CountyStateModeSelectorProps {
  countyOrStateMode: sharedTypes.CountyOrStateMode,
  updateMode: (mode: sharedTypes.CountyOrStateMode) => void
  disabled: boolean
}

const CountyStateModeSelector: FC<CountyStateModeSelectorProps> = (props: CountyStateModeSelectorProps) => {
  const appConfig: MutableRefObject<sharedTypes.AppConfig> = useRef<sharedTypes.AppConfig>(config);
  const activeMode: MutableRefObject<sharedTypes.CountyOrStateMode> = useRef<sharedTypes.CountyOrStateMode>(props.countyOrStateMode);
  const [countyButtonClass, setCountyButtonClass] = useState<any>(sharedStyles.disabledButton);
  const [stateButtonClass, setStateButtonClass] = useState<any>(sharedStyles.disabledButton);

  useEffect(() => {
    activeMode.current = props.countyOrStateMode;
    if (props.disabled) {
      setCountyButtonClass(sharedStyles.disabledButton);
      setStateButtonClass(sharedStyles.disabledButton);
    } else
      if (!props.disabled && props.countyOrStateMode === appConfig.current.countyModeValue) {
        setCountyButtonClass(sharedStyles.selectedButton);
        setStateButtonClass(sharedStyles.nonSelectedButton);
      } else if (!props.disabled && props.countyOrStateMode === appConfig.current.stateModeValue) {
        setCountyButtonClass(sharedStyles.nonSelectedButton);
        setStateButtonClass(sharedStyles.selectedButton);
      }
  }, [props.countyOrStateMode, props.disabled]);

  useEffect(() => { }, [countyButtonClass, stateButtonClass])


  return (
    <div className={styles.countyAndStateButtonsDiv}>
      <button
        className={countyButtonClass + ' ' + styles.button}
        onClick={() => { props.updateMode(appConfig.current.countyModeValue as sharedTypes.CountyMode) }}
      >
        COUNTY
      </button>
      <button
        className={stateButtonClass + ' ' + styles.button}
        onClick={() => { props.updateMode(appConfig.current.stateModeValue as sharedTypes.CountyMode) }}
      >
        STATE
      </button>
    </div>
  );
}

export default CountyStateModeSelector;