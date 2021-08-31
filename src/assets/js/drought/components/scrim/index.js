import "./index.scss";
import * as calcite from "calcite-web";

export function showScrim(params) {
    let maskFontColorCSS_key = "mask-font-color";
    let maskElementOpacityCSS_key = "mask-font-opacity";
    let droughtStatusComponentEle = document.getElementsByClassName("drought-status-component")[0];
    let droughtStatusEle = document.getElementsByClassName("drought-status")[0];
    let agrComponentEle = document.getElementsByClassName("agricultural-impacts-container")[0];
    let jobs = document.getElementsByClassName("jobs");
    let totalSales = document.getElementsByClassName("total-sales");
    let legendWidgetEle = document.getElementsByClassName("map-legend-container")[0];
    let overlayMessageContainer = document.getElementsByClassName("overlay-message")[0];

    let show = (params.mostRecentDate.getTime() === params.selectedDate.getTime());
    if (!show) {
        calcite.addClass(droughtStatusComponentEle, maskFontColorCSS_key);
        calcite.addClass(agrComponentEle, maskFontColorCSS_key);
        calcite.addClass(droughtStatusEle, maskFontColorCSS_key);
        for (let i = 0, max = jobs.length; i < max; i++) {
            calcite.addClass(jobs[i], maskFontColorCSS_key);
        }
        for (let i = 0, max = totalSales.length; i < max; i++) {
            calcite.addClass(totalSales[i], maskFontColorCSS_key);
        }
        calcite.addClass(legendWidgetEle, maskElementOpacityCSS_key);
        calcite.removeClass(overlayMessageContainer, "hide");
    } else {
        calcite.removeClass(droughtStatusComponentEle, maskFontColorCSS_key);
        calcite.removeClass(agrComponentEle, maskFontColorCSS_key);
        calcite.removeClass(droughtStatusEle, maskFontColorCSS_key);
        for (let i = 0, max = jobs.length; i < max; i++) {
            calcite.removeClass(jobs[i], maskFontColorCSS_key);
        }
        for (let i = 0, max = totalSales.length; i < max; i++) {
            calcite.removeClass(totalSales[i], maskFontColorCSS_key);
        }
        calcite.removeClass(legendWidgetEle, maskElementOpacityCSS_key);
        calcite.addClass(overlayMessageContainer, "hide");
    }
}
