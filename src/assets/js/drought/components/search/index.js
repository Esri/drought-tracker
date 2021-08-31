import "./index.scss";
import { loadModules } from 'esri-loader';

export async function init(params) {
    return await new Promise((resolve, reject) => {
        loadModules([
            "esri/widgets/Search"
        ]).then(([Search]) => {
            const searchWidget = new Search({
                view: params.view,
                resultGraphicEnabled: false,
                popupEnabled: false
            });
            params.view.ui.add(searchWidget, {
                position: params.position
            });
            searchWidget.when(() => {
                resolve(searchWidget)
            }, error => {
                resolve(error);
            });
        });
    });
}
