import "./index.scss";
import { loadModules } from 'esri-loader';

export async function init(params) {
    return await new Promise((resolve, reject) => {
        loadModules([
            "esri/widgets/Zoom"
        ]).then(([Zoom]) => {
            const widget = new Zoom({
                view: params.view
            });
            params.view.ui.add(widget, {
                position: params.position
            });
            widget.when(() => {
                resolve(widget)
            }, error => {
                resolve(error)
            });
        });
    });
}
