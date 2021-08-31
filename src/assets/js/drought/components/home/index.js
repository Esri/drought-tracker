import "./index.scss";
import { loadModules } from 'esri-loader';

export async function init(params) {
    return await new Promise((resolve, reject) => {
        loadModules([
            "esri/widgets/Home"
        ]).then(([Home]) => {
            const widget = new Home({
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
