import React, { FC, MutableRefObject, useEffect, useRef } from 'react';
import MapView from "@arcgis/core/views/MapView.js";
import Zoom from "@arcgis/core/widgets/Zoom.js";


interface ZoomWidgetProps {
    view: MapView,
    showMapWidgets: boolean,
}


const ZoomWidget: FC<ZoomWidgetProps> = (props: ZoomWidgetProps) => {
    const widgetElementRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
    const zoom: MutableRefObject<Zoom> = useRef<Zoom>(new Zoom({
        view: props.view,
        layout: 'horizontal',
        visible: window.innerWidth >= 800 ? true : false
    }));

    useEffect(() => {
        if (widgetElementRef.current && !zoom.current.container) {
            zoom.current.container = widgetElementRef.current;
        }
    }, [])

    useEffect(() => {
        zoom.current.visible = props.showMapWidgets;
    }, [props.showMapWidgets])

    return (
        <div ref={widgetElementRef}></div>
    )
}

export default ZoomWidget;