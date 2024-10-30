import React, { FC, useEffect, useState, useRef, MutableRefObject } from 'react';
import styles from './Map.module.css';
import sharedTypes from '../../assets/sharedTypes';
import MapView from "@arcgis/core/views/MapView.js";
import WebMap from "@arcgis/core/WebMap.js";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import SearchWidget from '../Search/SearchWidget';
import Point from "@arcgis/core/geometry/Point.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import ZoomWidget from '../ZoomWidget/Zoom';

interface MapProps {
  webmap: WebMap,
  appConfig: sharedTypes.AppConfig,
  signalPanelTabChanged: number,
  panelTab: sharedTypes.PanelTabOptions,
  mapClicked: (geometry: sharedTypes.PointClickGeometry) => void,
  selectedFeatureGeometry: any,
  areaType: sharedTypes.AreaTypeCategories,
  initialZoom: number | null,
  initialPoint: string | null,
  showMapWidgets: boolean
}

const Map: FC<MapProps> = (props: MapProps) => {

  const [view, setView] = useState<MapView>(
    new MapView({
      map: props.webmap,
      zoom: props.initialZoom ?? 5,
      popupEnabled: false,
      constraints: {
        minScale: 73957191
      }
    })
  );


  const viewContainer: MutableRefObject<any> = useRef<HTMLDivElement>();
  const firstRenderExecuted: React.MutableRefObject<boolean> = useRef<boolean>(false);
  const pointClickGraphicLayer: MutableRefObject<GraphicsLayer> = useRef<GraphicsLayer>(new GraphicsLayer({ title: props.appConfig.pointClickGraphicLayerTitle }));
  const selectedFeatureGraphicLayer: MutableRefObject<GraphicsLayer> = useRef<GraphicsLayer>(new GraphicsLayer({ title: props.appConfig.selectedFeatureLayerTitle }));
  const lastClickEvent: MutableRefObject<any> = useRef<any>();

  const conductHitTest = async (geometry?: sharedTypes.PointClickGeometry) => {
    // pass the click geometry and intersecting features back to Shell to disburse to the panel tabs
    // It should be noted that we use longitude and latitude with the spatial ref id of 4326...
    const clickPoint: sharedTypes.PointClickGeometry = {
      x: geometry?.x ?? lastClickEvent.current.mapPoint.longitude,
      y: geometry?.y ?? lastClickEvent.current.mapPoint.latitude,
      spatialReference: geometry?.spatialReference ?? 4326
    };

    props.mapClicked(clickPoint);
  }

  const setUrlZoomParam: (zoom: number) => void = (zoom: number) => {
    const urlParams: URLSearchParams = new URLSearchParams(window.location.hash.replace('#', '').replace('%23', ''));
    urlParams.set('zoom', zoom.toString());
    window.history.pushState({}, '', `#${urlParams.toString()}`)
  }

  const processSearchResults: (geometry: sharedTypes.PointClickGeometry) => void = (geometry: sharedTypes.PointClickGeometry) => {
    conductHitTest(geometry);
  }

  useEffect(() => {
    // give the view its container element
    if (viewContainer.current && !view.container) {
      view.container = viewContainer.current;
    }

    // initialize map click functionality once the view is loaded
    if (!firstRenderExecuted.current) {
      view.when(() => {
        view.popupEnabled = false;
        view.ui.remove('zoom');

        let zoomDiv = document.createElement('div');
        zoomDiv.className = styles.zoomWidgetContainer;

        if (props.initialPoint) {
          // check to see if we have a valid point string
          const commaIndex = props.initialPoint.indexOf(',');
          let hasComma = commaIndex && commaIndex > 0; // if there was a comma found in the string
          if (hasComma) {
            const longitude = props.initialPoint.substring(0, commaIndex);
            const latitude = props.initialPoint.substring(commaIndex + 1, props.initialPoint.length);

            // if both the parse longitude and latitude values are numbers, we can try and go to the point
            if (!isNaN(parseFloat(longitude)) && !isNaN(parseFloat(latitude))) { }
            view.center = new Point({
              x: parseFloat(longitude),
              y: parseFloat(latitude),
              spatialReference: { wkid: 4326 }
            });
          }
        }

        props.webmap.layers.add(pointClickGraphicLayer.current);
        props.webmap.layers.add(selectedFeatureGraphicLayer.current);

        // assign the click test
        view.on('click', async (event) => {
          lastClickEvent.current = event;
          conductHitTest(undefined);
        });
      });

      // update the extent url parameters when the view is done moving
      reactiveUtils.watch(() => view.stationary, () => {
        if (view.stationary) {
          // if (!firstRenderExecuted.current && props.initialZoom) view.zoom = props.initialZoom;
          setUrlZoomParam(view.zoom);
        }
      });

      firstRenderExecuted.current = true;
    }
  }, []);

  // adds the feature selection graphic
  useEffect(() => {
    if (props.selectedFeatureGeometry !== null) {
      selectedFeatureGraphicLayer.current.graphics.removeAll();

      const graphic: Graphic = new Graphic({
        geometry: new Polygon({
          rings: props.selectedFeatureGeometry.rings,
          spatialReference: new SpatialReference({ wkid: 4326 })
        }),
        symbol: new SimpleLineSymbol({
          width: '2px',
          color: 'white'
        })
      })
      selectedFeatureGraphicLayer.current.graphics.add(graphic)
    } else if (props.selectedFeatureGeometry === null) {
      selectedFeatureGraphicLayer.current.graphics.removeAll();
    }
  }, [props.selectedFeatureGeometry])

  return (
    <>
      <div ref={viewContainer} className={styles.view}></div>
      <div className={styles.searchAndZoomContainer}>
        <div className={styles.searchWidgetContainer} >
          <SearchWidget
            view={view}
            processSearchResult={(geometry: sharedTypes.PointClickGeometry) => { processSearchResults(geometry); }}
            showMapWidgets={props.showMapWidgets}
          ></SearchWidget>
        </div>
        <div className={styles.zoomWidgetContainer}>
          <ZoomWidget
            view={view}
            showMapWidgets={props.showMapWidgets}
          ></ZoomWidget>
        </div>
      </div>
    </>
  );
}

export default Map;