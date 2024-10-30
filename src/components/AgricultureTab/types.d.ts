import sharedTypes from '../../assets/sharedTypes';

export type AgricultureTabConfig = {
    agricultureGroupLayerTitle: string,
    countyLayerTitle: string,
    countyModeValue: string,
    defaultCountyStateModeValue: sharedTypes.CountyOrStateMode,
    stateLayerTitle: string,
    stateModeValue: string,
    tableConfig: any,
    bottomDisclaimerText: string,
    laborTableConfig: any,
    exposureTableConfig: any,
    nullString: string,
    dataFormattingConfig: Array<{
        startYear: number,
        endYear: number,
        censusYear: number,
        missingCrops?: Array<string>,
        missingLaborFields?: Array<string>
    }>
} 