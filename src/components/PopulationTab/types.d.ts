import sharedTypes from '../../assets/sharedTypes';

export type PopulationTabConfig = {
  defaultCountyStateModeValue: sharedTypes.CountyMode | sharedTypes.StateMode,
  countyPopulationLayerTitle: string,
  statePopulationLayerTitle: string,
  totalPopFieldName: string,
  totalHousingFieldName: string,
  urbanPopFieldName: string,
  urbanHousingFieldName: string,
  ruralPopFieldName: string,
  ruralHousingFieldName: string,
  popFieldD4: string,
  popFieldD3: string,
  popFieldD2: string,
  popFieldD1: string,
  popFieldD0: string,
  popFieldDx: string,
  droughtPopUrbanFieldName: string,
  droughtPopRuralFieldName: string,
  droughtTableTitle: string,
  vulnerablePopulationsTitle: string,
  economicImpactTitle: string,
  housingFieldD4: string,
  housingFieldD3: string,
  housingFieldD2: string,
  housingFieldD1: string,
  housingFieldD0: string,
  housingFieldDx: string,
  tableConfig: {
    droughtLevelColumnKey: string,
    populationColumnKey: string,
    householdsColumnKey: string,
    singleMultiFamilyColumnKey: string,
    headerHeight: string,
    headers: Array<{
      columnKeyAccessor: string,
      value: string | number | null
    }>,
    rowConfig: {
      rows: Array<{
        height: string,
        rowKey: string,
        cells: Array<{
          rowKey: string,
          columnKey: string,
          value: string | number | null,
          element?: HTMLElement | ReactElement,
          fieldNameAccessor: string,
          multiFamilyField?: string,
          singleFamilyField?: string,
        }>
      }>
    }
  },
  vulnerablePopTableConfig: {
    rows: Array<{
      key: string,
      label: string,
      fields?: Array<string>,
      field?: string
    }>
  },
  economicImpactTableConfig: {
    rows: Array<{
      key: string,
      label: string,
      fields?: Array<string>,
      field?: string
    }>
  }
}

export type StoredPopulationFeatures = {
  countyFeatures: Array<
    {
      OBJECTID: number,
      GEOID: string,
      H0010001: number,
      NAME: string,
      P0010001: number,
      P0020002: number,
      P0020003: number,
      State: string,
      historicalData: Array<any> //type out historical data is on TODO list
    } | []
  >,
  stateFeatures: Array<
    {
      OBJECTID: number,
      GEOID: string,
      H0010001: number,
      NAME: string,
      P0010001: number,
      P0020002: number,
      P0020003: number,
      State: string,
      STUSPS: string,
      STATENS: string,
      historicalData: Array<any>
    } | []>
}