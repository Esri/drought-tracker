import "./index.scss";
import {differenceInWeeks} from "date-fns";
import * as DataUtils from "../../utils/DataUtils";
import config from "../../config.json";

/**
 * Handle updates to the Drought Conditions component
 *
 * @param response
 * @param selectedDateObj
 */
export function droughtConditionsSuccessHandler(response, selectedDateObj) {
    const responseDate = response.features[0].attributes.ddate;
    const consecutiveWeeks = differenceInWeeks(new Date(selectedDateObj.selectedDate), new Date(responseDate)) - 1;
    let nodes = document.getElementsByClassName("consecutive-weeks");
    for (let node of nodes) {
        node.innerHTML = `${consecutiveWeeks.toString()}`;
    }
}

/**
 * Update the drought status label.
 *
 * @param response
 */
export function updateCurrentDroughtStatus(response) {
    let { attributes } = response.features[0];
    let drought = {
        d0 : attributes["d0"],
        d1 : attributes["d1"],
        d2 : attributes["d2"],
        d3 : attributes["d3"],
        d4 : attributes["d4"]
    };
    let condition = DataUtils.highestValueAndKey(drought);
    let key = condition["key"];
    let label = config.drought_colors[key].label;
    let color = config.drought_colors[key].color;
    if (attributes["nothing"] === 100) {
        label = config.drought_colors.nothing.label;
        color = config.drought_colors.nothing.color;
    } else if (key === "d0") {
        label = config.drought_colors[key].label;
        color = "#b19657";
    } else if (key === "d1") {
        label = config.drought_colors[key].label;
        color = "#cb9362";
    }

    let nodes = document.getElementsByClassName("drought-status");
    for (let node of nodes) {
        node.innerHTML = label;
        node.style.color = color;
    }
}
