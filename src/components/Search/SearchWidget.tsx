import React, { FC, MutableRefObject, useEffect, useRef } from 'react';
import Search from "@arcgis/core/widgets/Search.js";
import MapView from "@arcgis/core/views/MapView.js";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource.js";
import sharedTypes from '../../assets/sharedTypes';

interface SearchWidgetProps {
    view: MapView,
    showMapWidgets: boolean,
    processSearchResult: (geometry: sharedTypes.PointClickGeometry) => void
}

const SearchWidget: FC<SearchWidgetProps> = (props: SearchWidgetProps) => {
    const widgetElementRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
    const searchWidget: MutableRefObject<Search> = useRef<Search>(new Search({
        view: props.view,
        popupEnabled: false,
        resultGraphicEnabled: false,
        includeDefaultSources: false,
        visible: window.innerWidth >= 800 ? true : false,
        sources: [
            new LocatorSearchSource(
                {
                    url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
                    placeholder: 'Search For a Location',
                    countryCode: 'US',
                    autoNavigate: true
                }
            )
        ]
    }));

    useEffect(() => {
        // if we haven't assigned the container for the component, this must be the first time
        // loading it. We should add the on search-complete event now while we're at it...
        if (widgetElementRef.current && !searchWidget.current.container) {
            searchWidget.current.container = widgetElementRef.current
            // props.view.ui.add('zoom', 'top-right');
            searchWidget.current.on('search-complete', (event: any) => {
                // console.log('event');
                if (
                    event.results[0]?.results[0].feature?.geometry?.longitude &&
                    event.results[0]?.results[0].feature?.geometry?.latitude
                ) {
                    props.processSearchResult({
                        x: event.results[0].results[0].feature.geometry.longitude,
                        y: event.results[0].results[0].feature.geometry.latitude,
                        spatialReference: 4326
                    })
                }
            })
        }

    }, [])

    useEffect(() => {
        searchWidget.current.visible = props.showMapWidgets;
    }, [props.showMapWidgets])

    return (
        <div ref={widgetElementRef} hidden={!props.showMapWidgets}></div>
    )
}

export default SearchWidget;