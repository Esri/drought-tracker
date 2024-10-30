
export type CountyMode = 'county';
export type StateMode = 'state';
export type CountyOrStateMode = CountyMode | StateMode;
export type PopPanelOption = 'pop';
export type WaterPanelOption = 'water';
export type AgPanelOption = 'ag';
export type NullPanelOption = null;
export type PanelTabOptions = PopPanelOption | WaterPanelOption | AgPanelOption | NullPanelOption;

export type PointClickGeometry = {
    spatialReference: number,
    x: number,
    y: number,
};

export type IntersectingFeature = {
    OBJECTID: number,
    parentTitle: string,
    layerTitle: string
};

export type IntersectingFeatures = Array<IntersectingFeature>;

export type AreaTypeCategories = 'county' | 'state' | 'nation' | 'huc4';


export type DroughtLevelData = {
    d0: number,
    d1: number,
    d2: number,
    d3: number,
    d4: number,
    nothing: number;
}

export type CumulativeDroughtLevelData = {
    D0_D4: number,
    D1_D4: number,
    D2_D4: number,
    D3_D4: number,
    D4: number
}

export type StoredDroughtData = {
    fipsCode?: string,
    timePeriod: any,
    levels: DroughtLevelData
}


export type StoredDroughtLevels = {
    storedNationalData: { storedData: Array<StoredDroughtData> },
    storedCountyData: Array<StoredDroughtData>,
    storedStateData: Array<StoredDroughtData>,
}

export type DateData = {
    month: number,
    day: number,
    year: number
}

export type AreaTypeParameters = 'county' | 'state' | 'huc4' | 'nation';
export type PanelTabParameters = 'pop' | 'water' | 'ag' | null;
export type PointParameter = string;
export type ZoomParameter = number;

export type UrlParameters = {
    areaType: AreaTypeParameters | null,
    panelTab: PanelTabParameters | null,
    point: PointParameter | null,
    zoom: ZoomParameter | null,
    period: string | null,
}


export type AppConfig = {
    agPanelOption: string,
    agricultureLayerTitle: string,
    countyAgricultureLayerTitle: string,
    countyFieldName: string,
    countyFipsFieldName: string,
    croplandLayerTitle: string,
    countyModeValue: string,
    countyPopLayerTitle: string,
    droughtLayerTitle: string,
    labelBasemapLayerIds: Array<string>,
    nullPanelOption: null,
    objectIdFieldName: string,
    pointClickGraphicLayerTitle: string,
    popPanelOption: string,
    populationLayerTitle: string,
    stateAgricultureLayerTitle: string,
    stateFieldName: string,
    stateModeValue: string,
    statePopLayerTitle: string,
    waterLayerTitle: string,
    waterPanelOption: string,
    waterModeValue: string,
    webMapId: string,
    exceptionalDroughtLayerTitle: string,
    extremeDroughtLayerTitle: string,
    selectedFeatureLayerTitle: string,
    severeDroughtLayerTitle: string,
    moderateDroughtLayerTitle: string,
    abnormalDroughtLayerTitle: string,
    levelLabels: {
        d0: string,
        d1: string,
        d2: string,
        d3: string,
        d4: string,
    },
    levelColorClass: {
        d0: string,
        d1: string,
        d2: string,
        d3: string,
        d4: string,
    },
    areaTypes: Array<string>,
    pointUrlParam: string,
    pointClickSpatialReference: number,
    nullUrlParamObject: {
        areaType: AreaTypeParameters | null,
        panelTab: PanelTabParameters | null,
        point: string | null,
        zoom: number | null,
        period: string | null,
    },
}

