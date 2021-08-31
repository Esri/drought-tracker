import "./index.scss";
import config from "../../config.json";

export function monthlyDroughtOutlookDateResponseHandler(response) {
    const { attributes } = response.features[0];
    update(document.getElementsByClassName("monthlyOutlookDate"), attributes["Target"]);
}

export function monthlyDroughtOutlookResponseHandler(response) {
    const outlook = processOutlookResponse(response);
    update(document.getElementsByClassName("monthlyOutlookLabel"), outlook.label);
}

export function seasonalDroughtOutlookDateResponseHandler(response) {
    const { attributes } = response.features[0];
    update(document.getElementsByClassName("seasonalOutlookDate"), attributes["Target"]);
}

export function seasonalDroughtOutlookResponseHandler(response) {
    const outlook = processOutlookResponse(response);
    update(document.getElementsByClassName("seasonalOutlookLabel"), outlook.label);
}






function processOutlookResponse(response) {
    let outlook = {
        "date": config.drought_colors.nothing.label,
        "label": config.drought_colors.nothing.label
    };
    const { features } = response;
    if (features.length > 0) {
        const { attributes } = features[0];
        outlook.date = attributes["Target"];
        if (attributes["FID_improv"] === 1) {
            outlook.label = "Drought Improves";
        } else if (attributes["FID_persis"] === 1) {
            outlook.label = "Drought Persists";
        } else if (attributes["FID_remove"] === 1) {
            outlook.label = "Drought Removal Likely";
        } else if (attributes["FID_dev"] === 1) {
            outlook.label = "Drought Develops";
        }
    }
    return outlook;
}

function update(nodes, data) {
    for (let node of nodes) {
        node.innerHTML = data;
    }
}
