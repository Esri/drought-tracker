import { loadModules } from 'esri-loader';
import config from "../config.json";

export async function addLayer(params) {
    return await new Promise((resolve, reject) => {
        loadModules([
            "esri/layers/FeatureLayer",
        ]).then(([FeatureLayer]) => {
            const layer = new FeatureLayer({
                url: params.url,
                layerId: 2,
                timeExtent: {
                    start: params.start,
                    end: params.end
                },
                opacity: 0.65,
                title: params.title,
                useViewTime: false
            });
            params.view.map.add(layer, 1);
            params.view.popup = null;
        });
    });
}

export async function removeLayers(mapView) {
    let layersToRemove = mapView.map.layers.filter(lyr => {
        if (lyr.title === config.drought_layer_name) {
            return lyr;
        }
    });
    mapView.map.removeMany(layersToRemove.items);
}

export function toggleLayer(mapView, params) {
    let show = (params.mostRecentDate.getTime() === params.selectedDate.getTime());
    mapView.map.layers.forEach(lyr => {
        if (lyr.title === "TotalAgSales Centroids") {
            lyr.opacity = (show ? 0.23 : 0.0);
        }
    });
}
