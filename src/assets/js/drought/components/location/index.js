import "./index.scss";
import config from "../../config.json";

export function updateSelectedLocationComponent(response) {
    const selectedFeature = response.features[0];
    let label = `${selectedFeature.attributes["name"]}, ${config.selected.state_name}`;
    if (config.selected.adminAreaId !== config.COUNTY_ADMIN) {
        label = `${config.selected.state_name}`;
    }

    let nodes = document.getElementsByClassName("selected-location");
    for (let node of nodes) {
        node.innerHTML = label.toUpperCase();
    }
}
