

export type WaterTabConfig = {
    primaryRiversSectionTitle: string,
    soilMoistureSectionTitle: string,
    reservoirsSectionTitle: string,
    riversLayerTitle: string,
    reservoirsLayerTitle: string,
    watershedsLayerTitle: string,
    waterAreaTypeValue: 'huc4',
    riverChartFieldNames: Array<string>,
    reservoirTableConfig: {
        headerHeight: 's' | 'm' | 'l',
        headers: Array<{ columnKey: string, value: string }>,
        columns: Array<{ columnKey: string, fieldName: string }>
    },
    xScaleValues: Array<{tick: string, fieldName: string, mm: string}>
}

export type StoredWaterFeatures = Array<WatershedData>;

export type StoredWatershedData = {
    OBJECTID: number,
    HUC4: string,
    NAME: string,
    rivers: Array<RiverData>,
    reservoirs: Array<ReservoirData>,
    geometry: { rings: Array<Array<number>> }
}

export type WatershedQueryResult = {
    OBJECTID: number,
    HUC4: string,
    NAME: string,
    geometry: { rings: Array<Array<number>> }
}

export type Rivers = Array<river>

export type PeriodCfsData = {
    OBJECTID: number,
    feature_id: string,
    huc4: string,
    period: string,
    Q_cfs: number
}

export type CfsData = Array<periodCfsData>

export type RiverRequestRiver = {
    OBJECTID: number,
    name: string,
    feature_id: string,
    huc4: string,
    QE_01: number,
    QE_02: number,
    QE_03: number,
    QE_04: number,
    QE_05: number,
    QE_06: number,
    QE_07: number,
    QE_08: number,
    QE_09: number,
    QE_10: number,
    QE_11: number,
    QE_12: number,
}

export type RiverRequest = Array<RiverRequestRiver>;

export type River = RiverRequestRiver & {cfsData: CfsData};