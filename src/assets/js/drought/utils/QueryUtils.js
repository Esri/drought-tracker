import { loadModules } from 'esri-loader';

/**
 *
 * @param params
 * @returns {Promise<unknown>}
 */
export async function fetchData(params) {
    return await new Promise((resolve, reject) => {
        loadModules([
            "esri/tasks/QueryTask",
            "esri/tasks/support/Query",
        ]).then(([QueryTask, Query]) => {
            let queryTask = new QueryTask({
                url: params.url
            });
            let query = new Query();
            query.returnGeometry = params.returnGeometry;
            query.outFields = params.outFields;
            query.orderByFields = params.orderByFields;
            query.geometry = params.geometry;
            query.inSR = 102003;
            query.where = params.q;
            queryTask.execute(query).then(response => {
                /*console.debug("PARAMS", params);
                console.debug(query);
                console.debug(response.features);
                console.debug("\n\n");*/
                resolve(response);
            }, error => {
                reject(error);
                //console.debug("\n\n");
            });
        });
    });
}
