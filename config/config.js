/*global define,location */
/*jslint sloppy:true */
/*
| Copyright 2017 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
define({

    // Sharing URL
    SHARING_COMMUNITY_URL: "www.arcgis.com/sharing/rest/community/users/",

    SHARING_CONTENT_URL: "www.arcgis.com/sharing/rest/content/users/",

    //Defaults to arcgis.com. Set this value to your portal or organization host name.
    SHARING_HOST: "http://www.arcgis.com",

    // Specify the domain where the map associated with the webmap id is located.
    ARCGIS_URL: "www.arcgis.com/sharing/rest/content/items",

    BOUNDARY_URL: window.location.protocol + "//" + "server.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer",
    DROUGHT_BY_COUNTY_FS_SECURE: window.location.protocol + "//" + "earthobs1.arcgis.com/arcgis/rest/services/US_Drought_by_County/FeatureServer/0",
    DROUGHT_BY_COUNTY_FS_UNSECURE: window.location.protocol + "//" + "utility.arcgis.com/usrsvcs/servers/6a9a3b41c17b4ccc93feebaa2b0b1fa1/rest/services/US_Drought_by_County/FeatureServer/0",
    DROUGHT_FS: window.location.protocol + "//" + "earthobs1.arcgis.com/arcgis/rest/services/US_Drought/FeatureServer",
    PRINT_URL: location.protocol + "//utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",

    APP_ID: /*"DroughtTracker",*/"xBKF2uVkEN2cxJyT",

    NEW_ITEM_TITLE: "US Drought Map | ",
    FADE_DURATION: 800,
    WEBMAP_ID_SECURE: "cee4e59ffa134e2189456d8aa80d8a86",
    WEBMAP_ID_UNSECURE: "7825773148e74e8ebe2e97e529ec53e0",// "bb6caba979b84d51b70bcc5813b611bc",
    CUSTOM_LODS: [
        {
            "level": 3,
            "resolution": 19567.87924099992,
            "scale": 7.3957190948944E7
        },
        {
            "level": 4,
            "resolution": 9783.93962049996,
            "scale": 3.6978595474472E7
        },
        {
            "level": 5,
            "resolution": 4891.96981024998,
            "scale": 1.8489297737236E7
        },
        {
            "level": 6,
            "resolution": 2445.98490512499,
            "scale": 9244648.868618
        },
        {
            "level": 7,
            "resolution": 1222.992452562495,
            "scale": 4622324.434309
        },
        {
            "level": 8,
            "resolution": 611.4962262813797,
            "scale": 2311162.217155
        },
        {
            "level": 9,
            "resolution": 305.74811314055756,
            "scale": 1155581.108577
        }
    ],
    EDITOR_PLUGINS: [
        "bold",
        "italic",
        "underline",
        "foreColor",
        "hiliteColor",
        "|",
        "justifyLeft",
        "justifyCenter",
        "justifyRight",
        "justifyFull",
        "|",
        "insertOrderedList",
        "insertUnorderedList",
        "|",
        "indent",
        "outdent",
        "|",
        "createLink",
        "insertImage",
        "unlink",
        "removeFormat",
        "|",
        "undo",
        "redo",
        "|",
        "viewSource"
    ],
    MONTH_CHART_PREVIOUS_WEEK_COUNT: 9,

    /* drought visualization color ramp */
    DRY_COLOR: "#FFFE90",
    MODERATE_COLOR: "#FCE5BA",
    SEVERE_COLOR: "#FED089",
    EXTREME_COLOR: "#F0787F",
    EXCEPTIONAL_COLOR: "#9A726D",

    /* drought visualization labels */
    EXCEPTIONAL: "exceptional",
    EXTREME: "extreme",
    SEVERE: "severe",
    MODERATE: "moderate",
    DRY: "dry",

    MONTH_NAMES: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],

    LEARN_MORE_LINK_1: "https://droughtmonitor.unl.edu/AboutUSDM/AbouttheData/DroughtClassification.aspx",
    DROUGHT_DATA_LINK: "http://www.drought.gov/drought/",

    /* Charts */
    LINE_STROKE_WIDTH: 2,

    /* main timeline chart */
    /* x-axis */
    MAIN_TIMELINE_X_AXIS: {
        labels: [
            {value: 52, text: "2001"},
            {value: 104, text: "2002"},
            {value: 156, text: "2003"},
            {value: 208, text: "2004"},
            {value: 260, text: "2005"},
            {value: 312, text: "2006"},
            {value: 364, text: "2007"},
            {value: 416, text: "2008"},
            {value: 468, text: "2009"},
            {value: 520, text: "2010"},
            {value: 572, text: "2011"},
            {value: 624, text: "2012"},
            {value: 676, text: "2013"},
            {value: 728, text: "2014"},
            {value: 780, text: "2015"},
            {value: 832, text: "2016"},
            {value: 884, text: "2017"},
            {value: 936, text: "2018"}
        ],
        stroke: {
            color: "#333"
        },
        fontColor: "#333",
        majorLabels: true,
        majorTicks: true,
        majorTickStep: 52,
        minorTicks: false
    },

    /* y-axis */
    MAIN_TIMELINE_Y_AXIS: {
        vertical: true,
        min: 0,
        max: 100,
        majorLabels: false,
        minorTicks: false,
        majorTicks: false
    },

    MAIN_TIMELINE_DRY_SERIES: {
        plot: "stackedColumnsPlot",
        areas: true,
        tension: "S",
        stroke: {
            color: "#FFFE90"
        },
        fill: "#FFFE90"
    },

    MAIN_TIMELINE_MODERATE_SERIES: {
        plot: "stackedColumnsPlot",
        lines: false,
        areas: true,
        markers: false,
        tension: "S",
        stroke: {
            color: "#FCE5BA"
        },
        fill: "#FCE5BA"
    },

    MAIN_TIMELINE_SEVERE_SERIES: {
        plot: "stackedColumnsPlot",
        lines: false,
        areas: true,
        markers: false,
        tension: "S",
        stroke: {
            color: "#FED089"
        },
        fill: "#FED089"
    },

    MAIN_TIMELINE_EXTREME_SERIES: {
        plot: "stackedColumnsPlot",
        lines: false,
        areas: true,
        markers: false,
        tension: "S",
        stroke: {
            color: "#F0787F"
        },
        fill: "#F0787F"
    },

    MAIN_TIMELINE_EXCEPTIONAL_SERIES: {
        plot: "stackedColumnsPlot",
        areas: true,
        tension: "S",
        stroke: {
            color: "#9A726D"
        },
        fill: "#9A726D"
    },


    /* annual timeline chart */
    /* chart data */
    ANNUAL_TIMELINE_CHART_DATA: [
        {value: 0, text: "2000"},
        {value: 1, text: "01"},
        {value: 2, text: "02"},
        {value: 3, text: "03"},
        {value: 4, text: "04"},
        {value: 5, text: "2005"},
        {value: 6, text: "06"},
        {value: 7, text: "07"},
        {value: 8, text: "08"},
        {value: 9, text: "09"},
        {value: 10, text: "2010"},
        {value: 11, text: "11"},
        {value: 12, text: "12"},
        {value: 13, text: "13"},
        {value: 14, text: "14"},
        {value: 15, text: "2015"},
        {value: 16, text: "16"},
        {value: 17, text: "17"},
        {value: 18, text: "18"}
    ],

    /* annual chart y axis */
    ANNUAL_TIMELINE_Y_AXIS: {
        vertical: true,
        min: 0,
        max: 105,
        majorLabels: false,
        majorTicks: false,
        minorLabels: false,
        minorTicks: false,
        microTicks: false,
        stroke: {
            color: "#FFFFFF"
        }
    },

    ANNUAL_TIMELINE_DRY_SERIES: {
        stroke: {
            width: 2,
            color: "#FFFE90"
        },
        tooltip: "%"
    },

    ANNUAL_TIMELINE_MODERATE_SERIES: {
        stroke: {
            width: 2,
            color: "#FCE5BA"
        },
        tooltip: "%"
    },

    ANNUAL_TIMELINE_SEVERE_SERIES: {
        stroke: {
            width: 2,
            color: "#FED089"
        },
        tooltip: "%"
    },

    ANNUAL_TIMELINE_EXTREME_SERIES: {
        stroke: {
            width: 2,
            color: "#F0787F"
        },
        tooltip: "%"
    },

    ANNUAL_TIMELINE_EXCEPTIONAL_SERIES: {
        stroke: {
            width: 2,
            color: "#9A726D"
        },
        tooltip: "%"
    },

    /* monthly timeline axis */
    MONTHLY_TIMELINE_X_AXIS: {
        labels: [
            {value: 1, text: "-8"},
            {value: 2, text: ""},
            {value: 3, text: "-6"},
            {value: 4, text: ""},
            {value: 5, text: "-4"},
            {value: 6, text: ""},
            {value: 7, text: "-2"},
            {value: 8, text: ""},
            {value: 9, text: "0"}
        ],
        stroke: {
            color: "#FFFFFF"
        },
        fontColor: "#FFFFFF",
        minorLabels: false,
        minorTicks: false,
        microTicks: false
    },

    MONTHLY_TIMELINE_Y_AXIS: {
        vertical: true,
        min: 1,
        max: 105,
        majorLabels: false,
        majorTicks: false,
        minorLabels: false,
        minorTicks: false,
        microTicks: false,
        majorTickStep: 0,
        stroke: {
            color: "#FFFFFF"
        }
    },

    MONTHLY_DRY_SERIES: {
        stroke: {
            width: 2,
            color: "#FFFE90"
        },
        tooltip: "%"
    },

    MONTHLY_MODERATE_SERIES: {
        stroke: {
            width: 2,
            color: "#FCE5BA"
        },
        tooltip: "%"
    },

    MONTHLY_SEVERE_SERIES: {
        stroke: {
            width: 2,
            color: "#FED089"
        },
        tooltip: "%"
    },

    MONTHLY_EXTREME_SERIES: {
        stroke: {
            width: 2,
            color: "#F0787F"
        },
        tooltip: "%"
    },

    MONTHLY_EXCEPTIONAL_SERIES: {
        stroke: {
            width: 2,
            color: "#9A726D"
        },
        tooltip: "%"
    },


    // fade charts
    FADE_IN_CHARTS: {
        node: "floating-panel",
        duration: 800
    },

    // fade out the splash screen
    SPLASH_SCREEN_FADE_IN_ARGS: {
        node: "floating-panel-mask",
        duration: 800
    },

    SPLASH_SCREEN_FADE_OUT_ARGS: {
        node: "floating-panel-mask",
        duration: 800
    },

    SAVE_BUTTON: "SAVE LAYER",

    NEW_FS_JSON: {
        "service": {
            "currentVersion": 10.31,
            "serviceDescription": "This service is available to all ArcGIS Online users with organizational accounts. For more information on this service, including the terms of use, visit us online at http://goto.arcgisonline.com/earthobs1/US_Drought",
            "hasVersionedData": false,
            "supportsDisconnectedEditing": false,
            "syncEnabled": false,
            "supportedQueryFormats": "JSON, AMF",
            "maxRecordCount": 1000,
            "capabilities": "Create,Delete,Query,Update,Editing",
            "description": "This service is available to all ArcGIS Online users with organizational accounts. For more information on this service, including the terms of use, visit us online at http://goto.arcgisonline.com/earthobs1/US_Drought",
            "copyrightText": "Copyright: 2015 National Drought Mitigation Center",
            "spatialReference": {
                "wkid": 102100,
                "latestWkid": 3857
            },
            "initialExtent": {
                "xmin": -20085668.703089,
                "ymin": -20085668.703089,
                "xmax": 20085668.703089,
                "ymax": 20085668.703089,
                "spatialReference": {
                    "wkid": 102100,
                    "latestWkid": 3857
                }
            },
            "fullExtent": {
                "xmin": -20085668.703089,
                "ymin": -20085668.703089,
                "xmax": 20085668.703089,
                "ymax": 20085668.703089,
                "spatialReference": {
                    "wkid": 102100,
                    "latestWkid": 3857
                }
            },
            "allowGeometryUpdates": true,
            "units": "esriMeters",
            "documentInfo": {
                "Title": "USA Drought Monitor",
                "Author": "Erika Boghici",
                "Comments": "The U.S. Drought Monitor, established in 1999, is a weekly map of drought conditions based on measurements of climatic, hydrologic and soil conditions as well as reported impacts and observations from more than 350 contributors around the US. D0-D4: The Drought Monitor summary map identifies general drought areas, labelling droughts by intensity, with D1 being the least intense and D4 being the most intense. D0, drought watch areas, are either drying out and possibly heading for drought, or are recovering from drought but not yet back to normal, suffering long-term impacts such as low reservoir levels.",
                "Subject": "Duration and severity of drought in the United States categorized on a severity scale from Abnormally Dry to Exceptional.",
                "Category": "",
                "Keywords": "weather,climate"
            },
            "tables": [],
            "enableZDefaults": false
        },
        "layers": [{
            "currentVersion": 10.31,
            "id": 0,
            "name": "USA Drought Intensity 2000-Present",
            "type": "Feature Layer",
            "description": "This service is available to all ArcGIS Online users with organizational accounts. For more information on this service, including the terms of use, visit us online at http://goto.arcgisonline.com/earthobs1/US_Drought",
            "copyrightText": "Copyright: 2015 National Drought Mitigation Center",
            "defaultVisibility": true,
            "editFieldsInfo": null,
            "ownershipBasedAccessControlForFeatures": null,
            "syncCanReturnChanges": false,
            "relationships": [],
            "isDataVersioned": false,
            "supportsRollbackOnFailureParameter": true,
            "supportsStatistics": true,
            "supportsAdvancedQueries": true,
            "advancedQueryCapabilities": {
                "supportsPagination": true,
                "supportsQueryWithDistance": true,
                "supportsReturningQueryExtent": true,
                "supportsStatistics": true,
                "supportsOrderBy": true,
                "supportsDistinct": true
            },
            "geometryType": "esriGeometryPolygon",
            "minScale": 0,
            "maxScale": 0,
            "extent": {
                "xmin": -18807505.1482,
                "ymin": 2023997.9016,
                "xmax": -7260352.2246,
                "ymax": 11539767.1613,
                "spatialReference": {
                    "wkid": 102100,
                    "latestWkid": 3857
                }
            },
            "drawingInfo": {
                "renderer": {
                    "type": "uniqueValue",
                    "field1": "dm",
                    "field2": null,
                    "field3": null,
                    "fieldDelimiter": ", ",
                    "defaultSymbol": null,
                    "defaultLabel": null,
                    "uniqueValueInfos": [
                        {
                            "symbol": {
                                "type": "esriSFS",
                                "style": "esriSFSSolid",
                                "color": [255, 255, 0, 255],
                                "outline": {
                                    "type": "esriSLS",
                                    "style": "esriSLSNull",
                                    "color": [0, 0, 0, 0],
                                    "width": 0
                                }
                            },
                            "value": "0",
                            "label": "Abnormally Dry",
                            "description": ""
                        },
                        {
                            "symbol": {
                                "type": "esriSFS",
                                "style": "esriSFSSolid",
                                "color": [252, 210, 126, 255],
                                "outline": {
                                    "type": "esriSLS",
                                    "style": "esriSLSNull",
                                    "color": [0, 0, 0, 0],
                                    "width": 0
                                }
                            },
                            "value": "1",
                            "label": "Drought - Moderate",
                            "description": ""
                        },
                        {
                            "symbol": {
                                "type": "esriSFS",
                                "style": "esriSFSSolid",
                                "color": [255, 170, 0, 255],
                                "outline": {
                                    "type": "esriSLS",
                                    "style": "esriSLSNull",
                                    "color": [0, 0, 0, 0],
                                    "width": 0
                                }
                            },
                            "value": "2",
                            "label": "Drought - Severe",
                            "description": ""
                        },
                        {
                            "symbol": {
                                "type": "esriSFS",
                                "style": "esriSFSSolid",
                                "color": [230, 0, 0, 255],
                                "outline": {
                                    "type": "esriSLS",
                                    "style": "esriSLSNull",
                                    "color": [0, 0, 0, 0],
                                    "width": 0
                                }
                            },
                            "value": "3",
                            "label": "Drought - Extreme",
                            "description": ""
                        },
                        {
                            "symbol": {
                                "type": "esriSFS",
                                "style": "esriSFSSolid",
                                "color": [115, 0, 0, 255],
                                "outline": {
                                    "type": "esriSLS",
                                    "style": "esriSLSNull",
                                    "color": [0, 0, 0, 0],
                                    "width": 0
                                }
                            },
                            "value": "4",
                            "label": "Drought - Exceptional",
                            "description": ""
                        }
                    ]
                },
                "transparency": 0,
                "labelingInfo": null
            },
            "hasM": false,
            "hasZ": false,
            "allowGeometryUpdates": false,
            "hasAttachments": false,
            "htmlPopupType": "esriServerHTMLPopupTypeAsHTMLText",
            "timeInfo": {
                "startTimeField": "ddate",
                "endTimeField": null,
                "trackIdField": null,
                "timeExtent": [
                    946944000000,
                    1439856000000
                ],
                "timeReference": null,
                "timeInterval": 1,
                "timeIntervalUnits": "esriTimeUnitsWeeks",
                "exportOptions": {
                    "useTime": true,
                    "timeDataCumulative": false,
                    "timeOffset": null,
                    "timeOffsetUnits": null
                },
                "hasLiveData": true
            },
            "objectIdField": "objectid_1",
            "globalIdField": "",
            "displayField": "filename",
            "typeIdField": "dm",
            "fields": [
                {
                    name: "objectid_1",
                    type: "esriFieldTypeOID",
                    alias: "OBJECTID_1",
                    domain: null,
                    editable: false,
                    nullable: false
                },
                {
                    name: "objectid",
                    type: "esriFieldTypeInteger",
                    alias: "OBJECTID",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "dm",
                    type: "esriFieldTypeSmallInteger",
                    alias: "DM",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "filename",
                    type: "esriFieldTypeString",
                    alias: "FILENAME",
                    domain: null,
                    editable: true,
                    nullable: true,
                    length: 50
                },
                {
                    name: "period",
                    type: "esriFieldTypeString",
                    alias: "Period",
                    domain: null,
                    editable: true,
                    nullable: true,
                    length: 14
                },
                {
                    name: "endyear",
                    type: "esriFieldTypeSmallInteger",
                    alias: "EndYear",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "endmonth",
                    type: "esriFieldTypeSmallInteger",
                    alias: "EndMonth",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "endday",
                    type: "esriFieldTypeSmallInteger",
                    alias: "EndDay",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "ddate",
                    type: "esriFieldTypeDate",
                    alias: "DDate",
                    domain: null,
                    editable: true,
                    nullable: true,
                    length: 36
                },
                {
                    name: "zipname",
                    type: "esriFieldTypeString",
                    alias: "ZipName",
                    domain: null,
                    editable: true,
                    nullable: true,
                    length: 50
                },
                {
                    name: "source",
                    type: "esriFieldTypeString",
                    alias: "Source",
                    domain: null,
                    editable: true,
                    nullable: true,
                    length: 99
                },
                {
                    name: "nothing",
                    type: "esriFieldTypeDouble",
                    alias: "Nothing",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "d0",
                    type: "esriFieldTypeDouble",
                    alias: "D0",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "d1",
                    type: "esriFieldTypeDouble",
                    alias: "D1",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "d2",
                    type: "esriFieldTypeDouble",
                    alias: "D2",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "d3",
                    type: "esriFieldTypeDouble",
                    alias: "D3",
                    domain: null,
                    editable: true,
                    nullable: true
                },
                {
                    name: "d4",
                    type: "esriFieldTypeDouble",
                    alias: "D4",
                    domain: null,
                    editable: true,
                    nullable: true
                }
            ],
            "dateFieldsTimeReference": {
                "timeZone": "UTC",
                "respectsDaylightSaving": false
            },
            "types": [
                {
                    "id": 0,
                    "name": "Abnormally Dry",
                    "domains": {},
                    "templates": [
                        {
                            "name": "D0 Abnormally Dry",
                            "description": "",
                            "prototype": {
                                "attributes": {
                                    "objectid": null,
                                    "d4": null,
                                    "dm": 0,
                                    "filename": null,
                                    "period": null,
                                    "endyear": null,
                                    "endmonth": null,
                                    "endday": null,
                                    "ddate": null,
                                    "zipname": null,
                                    "source": null,
                                    "nothing": null,
                                    "d0": null,
                                    "d1": null,
                                    "d2": null,
                                    "d3": null
                                }
                            },
                            "drawingTool": "esriFeatureEditToolPolygon"
                        }
                    ]
                },
                {
                    "id": 1,
                    "name": "Drought - Moderate",
                    "domains": {},
                    "templates": [
                        {
                            "name": "D1 Drought - Moderate",
                            "description": "",
                            "prototype": {
                                "attributes": {
                                    "objectid": null,
                                    "d4": null,
                                    "dm": 1,
                                    "filename": null,
                                    "period": null,
                                    "endyear": null,
                                    "endmonth": null,
                                    "endday": null,
                                    "ddate": null,
                                    "zipname": null,
                                    "source": null,
                                    "nothing": null,
                                    "d0": null,
                                    "d1": null,
                                    "d2": null,
                                    "d3": null
                                }
                            },
                            "drawingTool": "esriFeatureEditToolPolygon"
                        }
                    ]
                },
                {
                    "id": 2,
                    "name": "Drought - Severe",
                    "domains": {},
                    "templates": [
                        {
                            "name": "D2 Drought - Severe",
                            "description": "",
                            "prototype": {
                                "attributes": {
                                    "objectid": null,
                                    "d4": null,
                                    "dm": 2,
                                    "filename": null,
                                    "period": null,
                                    "endyear": null,
                                    "endmonth": null,
                                    "endday": null,
                                    "ddate": null,
                                    "zipname": null,
                                    "source": null,
                                    "nothing": null,
                                    "d0": null,
                                    "d1": null,
                                    "d2": null,
                                    "d3": null
                                }
                            },
                            "drawingTool": "esriFeatureEditToolPolygon"
                        }
                    ]
                },
                {
                    "id": 3,
                    "name": "Drought - Extreme",
                    "domains": {},
                    "templates": [
                        {
                            "name": "D3 Drought - Extreme",
                            "description": "",
                            "prototype": {
                                "attributes": {
                                    "objectid": null,
                                    "d4": null,
                                    "dm": 3,
                                    "filename": null,
                                    "period": null,
                                    "endyear": null,
                                    "endmonth": null,
                                    "endday": null,
                                    "ddate": null,
                                    "zipname": null,
                                    "source": null,
                                    "nothing": null,
                                    "d0": null,
                                    "d1": null,
                                    "d2": null,
                                    "d3": null
                                }
                            },
                            "drawingTool": "esriFeatureEditToolPolygon"
                        }
                    ]
                },
                {
                    "id": 4,
                    "name": "Drought - Exceptional",
                    "domains": {},
                    "templates": [
                        {
                            "name": "D4 Drought - Exceptional",
                            "description": "",
                            "prototype": {
                                "attributes": {
                                    "objectid": null,
                                    "d4": null,
                                    "dm": 4,
                                    "filename": null,
                                    "period": null,
                                    "endyear": null,
                                    "endmonth": null,
                                    "endday": null,
                                    "ddate": null,
                                    "zipname": null,
                                    "source": null,
                                    "nothing": null,
                                    "d0": null,
                                    "d1": null,
                                    "d2": null,
                                    "d3": null
                                }
                            },
                            "drawingTool": "esriFeatureEditToolPolygon"
                        }
                    ]
                }
            ],
            "templates": [],
            "maxRecordCount": 1000,
            "supportedQueryFormats": "JSON, AMF",
            "capabilities": "Create,Delete,Query,Update,Editing",
            "useStandardizedQueries": true
        }]
    },

    "TOOLTIP_CONTAINER": "<div class='CSSTableGenerator'>" +
    "<table>" +
    "  <tr>" +
    "     <th colspan='2'>" +
    "        <div id='tooltipHeader'>{dateTooltipLabel}</div>" +
    "     </th>" +
    "  </tr>" +
    "  <tr>" +
    "     <td class='tooltip-label' style='text-align: right'>Dry</td>" +
    "     <td class='tooltip-label' id='tooltipDry' style='width: 40px;'>{dryTooltipLabel} %</td>" +
    "  </tr>" +
    "  <tr>" +
    "     <td class='tooltip-label' style='text-align: right'>Moderate</td>" +
    "     <td class='tooltip-label' id='tooltipModerate' style='width: 40px;'>{moderateTooltipLabel} %</td>" +
    "  </tr>" +
    "  <tr>" +
    "     <td class='tooltip-label' style='text-align: right'>Severe</td>" +
    "     <td class='tooltip-label' id='tooltipSevere' style='width: 40px;'>{severeTooltipLabel} %</td>" +
    "  </tr>" +
    "  <tr>" +
    "     <td class='tooltip-label' style='text-align: right'>Extreme</td>" +
    "     <td class='tooltip-label' id='tooltipExtreme' style='width: 40px;'>{extremeTooltipLabel} %</td>" +
    "  </tr>" +
    "  <tr>" +
    "     <td class='tooltip-label' style='text-align: right'>Exceptional</td>" +
    "     <td class='tooltip-label' id='tooltipExceptional' style='width: 40px;'>{exceptionalTooltipLabel} %</td>" +
    "  </tr>" +
    "</table>" +
    "</div>",

    "SUCCESS_DIALOG": '<div class="container">' +
    '   <div class="row">' +
    '       <div class="column-24">' +
    '           <div class="new-layer-dialog-msg">The new layer, <b>{itemTitle}</b>, has been saved to your account.</div>' +
    '       </div>' +
    '   </div>' +
    '  <div class="row">' +
    '     <div class="column-4 pre-9">' +
    '        <button class="btn dialog-ok-success-btn"> OK </button>' +
    '     </div>' +
    '  </div>' +
    '</div>',

    "ERROR_DIALOG": '<div class="container">' +
    '   <div class="row">' +
    '       <div class="column-24">' +
    '           <div class="new-layer-dialog-msg">There has been an error saving the layer, <b>{itemTitle}</b>, to your account.</div>' +
    '       </div>' +
    '   </div>' +
    '  <div class="row">' +
    '     <div class="column-4 pre-9">' +
    '        <button class="btn dialog-ok-error-btn"> OK </button>' +
    '     </div>' +
    '  </div>' +
    '</div>',

    "ZOOM_TO_DIALOG": '<div class="container">' +
    '   <div class="row">' +
    '       <div class="column-24">' +
    '           <div class="new-layer-dialog-msg" style="text-align: center;">Please zoom a little closer to select a County.</div>' +
    '       </div>' +
    '   </div>' +
    '  <div class="row">' +
    '     <div class="column-4 pre-7">' +
    '        <button class="btn zoom-dialog-ok-btn"> OK </button>' +
    '     </div>' +
    '  </div>' +
    '</div>',

    "SAVE_DIALOG": '<div class="container">' +
    '   <div class="row">' +
    '       <div class="column-24">' +
    '           <div class="new-layer-dialog-msg">Specify a title, summary, and description for the new item.</div>' +
    '       </div>' +
    '   </div>' +
    '  <div class="row save-dialog-row">' +
    '     <div class="column-6">' +
    '       <img class="item-thumbnail-placeholder" src="images/nullThumbnail.png"/>' +
    '       <img class="item-thumbnail" />' +
    '       <div class="loader item-thumbnail-loader">' +
    '           <span class="side side-left">' +
    '               <span class="fill"></span>' +
    '           </span>' +
    '           <span class="side side-right">' +
    '               <span class="fill"></span>' +
    '           </span>' +
    '       </div>' +
    '     </div>' +
    '     <div class="column-18">' +
    '        <div class="field-label no-title-msg">Title (required)</div>' +
    '        <input class="new-layer-title" type="text" name="layer-title" value="" placeholder="Enter a title">' +
    '        <div class="field-label">Summary</div>' +
    '        <textarea rows="3" class="new-layer-snippet" placeholder="Enter a summary (optional)"></textarea>' +
    '     </div>' +
    '  </div>' +
    '  <div class="row save-dialog-row">' +
    '     <div class="column-24">' +
    '        <div class="field-label">Description</div>' +
    '        <textarea rows="10" class="new-layer-description" placeholder="Enter a description (optional)"></textarea>' +
    '     </div>' +
    '  </div>' +
    '  <div class="row">' +
    '     <div class="column-3 pre-8">' +
    '        <button class="btn dialog-ok-btn"> SAVE </button>' +
    '     </div>' +
    '     <div class="column-4">' +
    '        <button class="btn transparent dialog-cancel-btn"> CANCEL </button>' +
    '     </div>' +
    '  </div>' +
    '</div>'
});
