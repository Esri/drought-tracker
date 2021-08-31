import "./index.scss";
import "./legend.scss";
import "./chart-tooltip.scss";
import * as d3 from "d3";
import config from "../../config.json";
import * as FormatUtils from './../../utils/FormatUtils';
import * as LayerUtils from './../../utils/LayerUtils';
import * as Scrim from "./../scrim";

let barChartMargin = null;
let barChartWidth = null;
let barChartHeight = null;
let barChartX = null;
let barChartSvg = null;
let barChartPath = null;
let gx_bar = null;
let barChartXAxis = null;
let barChartYAxis = null;
let scrubber = null;
let clickScrubber = null;
let selectedEvent = null;
let series = null;
let colors = null;
let mapView = null;

const keyColors = [
    config.drought_colors.d4.color,
    config.drought_colors.d3.color,
    config.drought_colors.d2.color,
    config.drought_colors.d1.color,
    config.drought_colors.d0.color,
    "rgb(255, 255, 255, 0.0)"
];
const keys = Object.keys(config.drought_colors);
let chartScrubbingTooltip = document.getElementById("areaChartScrubberContent");
let inputDataset = [];

/**
 *
 * @param params
 */
export function createChart(params) {
    inputDataset = params.data;
    mapView = params.view;

    barChartHeight = config.chart.height;
    barChartWidth = config.chart.width;
    barChartMargin = config.chart.margin;

    // TODO
    // Clear previous svg
    d3.select("#stackedBarchart").selectAll("svg").remove();
    // stack
    series = d3.stack().keys(keys)(inputDataset)
    // colors
    colors = d3.scaleOrdinal().domain(keys).range(keyColors);

    barChartX = d3.scaleBand()
        .domain(inputDataset.map(d => d.date))
        .range([barChartMargin.left, barChartWidth - barChartMargin.right])
        .padding(0.1);

    let barChartY = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .range([barChartHeight - barChartMargin.bottom, barChartMargin.top]);

    barChartXAxis = (g, x) => g
        .attr("transform", `translate(0,${barChartHeight - barChartMargin.bottom})`)
        .call(d3.axisBottom(x).tickValues(x.domain()
            .filter((e,i) => i % Math.round(barChartWidth/scaleAxis(barChartWidth)) === 0))
            .tickFormat(d3.timeFormat("%m/%Y")));

    barChartYAxis = (g, y) => g
        .attr("transform", `translate(${barChartMargin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(formatTick));

    let barChartExtent = [
        [barChartMargin.left, barChartMargin.top],
        [barChartWidth - barChartMargin.right, barChartHeight - barChartMargin.top]
    ];

    const barChartZooming = d3.zoom()
        .scaleExtent([1, 32])
        .translateExtent(barChartExtent)
        .extent(barChartExtent)
        .on("zoom", barChartZoomed);

    barChartSvg = d3.select("#stackedBarchart")
        .append("svg")
        .attr("width", barChartWidth)
        .attr("height", barChartHeight)
        .on("mouseover", chartMouseOverHandler)
        .on("mouseout", chartMouseOutHandler);

    barChartSvg.append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("x", barChartMargin.left)
        .attr("y", barChartMargin.top)
        .attr("width", barChartWidth - barChartMargin.left - barChartMargin.right)
        .attr("height", barChartHeight - barChartMargin.top - barChartMargin.bottom);

    barChartPath = barChartSvg.append("g")
        .attr("class", "bars")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("clip-path","url(#chart-clip)")
        .attr("fill", ({key}) => colors(key))
        .selectAll("rect")
        .data(d => {
            return d;
        })
        .enter().append("rect")
        .attr("x", d => {
            return barChartX(d.data.date);
        })
        .attr("y", d => {
            return barChartY(d[1]);
        })
        .attr("id", d => {
            return new Date(d.data.date).getTime();
        })
        .attr("height", d => {
            return barChartY(d[0]) - barChartY(d[1]);
        })
        .attr("width", 1)
        .on("mousemove", chartMouseMoveHandler)
        .on("click", chartMouseClickHandler);

    gx_bar = barChartSvg.append("g")
        .call(barChartXAxis, barChartX);

    barChartSvg.append("g")
        .call(barChartYAxis, barChartY);

    barChartSvg.call(barChartZooming);

    scrubber = barChartSvg.append("g")
        .attr("class", "scrubber")
        .style("display", "none");

    scrubber.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 110)
        .attr("stroke-width", .5)
        .attr("stroke", "#000000")
        .style("opacity", 1.0);

    clickScrubber = barChartSvg.append("g")
        .attr("class", "click-scrubber")
        .style("display", "none");

    clickScrubber.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 100)
        .attr("stroke-width", 1.0)
        .attr("stroke", "#000000")
        .style("opacity", 1.0);

    clickScrubber.append("rect")
        .attr("width", 100)
        .attr("height", 20)
        .attr("transform", "translate(-50, -20)")
        .attr("id", "click-scrubber-text-container")
        .style("fill", "#363636");

    clickScrubber.append("text")
        .attr("class", "click-scrubber-text")
        .attr("dy", "-5")
        .attr("text-anchor", "middle")
        .style("font-size", '.75rem')
        .style("fill", '#fff');

    d3.select("#click-scrubber-text-container").attr("transform", "translate(-" + 100 + ",-" + 20 + ")");
    d3.select(".click-scrubber-text").attr("transform", "translate(-" + 50 + ",0)");

    function formatTick(d) {
        return this.parentNode.nextSibling ? `\xa0${d}` : `${d}%`;
    }

    function scaleAxis(chartContainerElement) {
        if (chartContainerElement < 450) {
            return 2;
        } else if (chartContainerElement > 449 && chartContainerElement < 600) {
            return 4;
        } else if (chartContainerElement > 599 && chartContainerElement < 1000) {
            return 8;
        } else {
            return 10;
        }
    }

    return barChartSvg.node();
}


function chartMouseOverHandler(event) {
    scrubber.style("display", "block");
    chartScrubbingTooltip.style.display = "block";
}

function chartMouseOutHandler(event) {
    scrubber.style("display", "none");
    chartScrubbingTooltip.style.display = "none";
}

function chartMouseMoveHandler(event) {
    let d = d3.select(this).data()[0]
    let currentXPosition = d3.pointer(event)[0];
    let pageX = event.pageX;
    if (currentXPosition < 75) {
        pageX = 120;
    }
    let formattedDate = FormatUtils.getFormattedDate(d.data.date);
    d3.select("#areaChartScrubberContentDate").html(formattedDate);
    d3.select("#areaChartScrubberContent_d4").html(`${Math.round(d.data.d4).toString()} %`);
    d3.select("#areaChartScrubberContent_d3").html(`${Math.round(d.data.d3).toString()} %`);
    d3.select("#areaChartScrubberContent_d2").html(`${Math.round(d.data.d2).toString()} %`);
    d3.select("#areaChartScrubberContent_d1").html(`${Math.round(d.data.d1).toString()} %`);
    d3.select("#areaChartScrubberContent_d0").html(`${Math.round(d.data.d0).toString()} %`);

    scrubber.attr("transform", "translate(" + (currentXPosition - 2) + "," + 0 + ")");
    chartScrubbingTooltip.style.position = "absolute";
    chartScrubbingTooltip.style.left = (pageX - 75) + "px";
}

function chartMouseClickHandler(event) {
    selectedEvent = event;
    let d = d3.select(this).data()[0];
    d3.select(".click-scrubber-text").text(FormatUtils.getFormattedDate(d.data.date));

    let pageX = event.pageX;
    let chartContainerRect  = document.getElementsByClassName("historic-data-container")[0].getBoundingClientRect();
    if ((chartContainerRect.width - pageX) < 60) {
        d3.select("#click-scrubber-text-container").attr("transform", "translate(-" + 100 + ",-" + 20 + ")");
        d3.select(".click-scrubber-text").attr("transform", "translate(-" + 50 + ",0)");
    } else {
        d3.select("#click-scrubber-text-container").attr("transform", "translate(-" + 50 + ",-" + 20 + ")");
        d3.select(".click-scrubber-text").attr("transform", "translate(0,0)");
    }

    let currentXPosition = d3.pointer(event)[0];
    clickScrubber.attr("transform", "translate(" + currentXPosition + "," + 20 + ")");
    clickScrubber.style("display", null);
    clickScrubber.style("opacity", "1");

    let endDate = new Date(d.data.date);
    let startDate = new Date(endDate.getTime() - (60 * 60 * 24 * 7 * 1000));
    let urlSearchParams = new URLSearchParams(location.search);
    urlSearchParams.set("date", new Date(d.data.date).getTime().toString());
    window.history.replaceState({}, '', `${location.pathname}?${urlSearchParams}`);

    // update ag layer
    LayerUtils.toggleLayer(mapView, {
        "mostRecentDate": new Date(inputDataset[inputDataset.length - 1].date),
        "selectedDate": endDate
    });

    // update drought layer
    LayerUtils.removeLayers(mapView, true);
    LayerUtils.addLayer({
        "url": config.droughtURL,
        "start": startDate,
        "end": endDate,
        "title": config.drought_layer_name,
        "view": mapView
    });

    let currentDroughtStatusElement = document.getElementsByClassName("drought-percentage")[0];
    currentDroughtStatusElement.innerHTML = d.data.d1_d4.toFixed(0);

    Scrim.showScrim({
        "mostRecentDate": new Date(inputDataset[inputDataset.length - 1].date),
        "selectedDate": endDate
    });
}

function barChartZoomed(event) {
    barChartX.range([barChartMargin.left, barChartWidth - barChartMargin.right].map(d =>
        event.transform.applyX(d)
    ));
    let barWidth = (Math.round(barChartX.bandwidth()) === 0) ? 1.0 : Math.round(barChartX.bandwidth());
    barChartSvg.selectAll(".bars rect").attr("x", d => barChartX(d.data.date)).attr("width", barWidth);
    gx_bar.call(barChartXAxis, barChartX);

    if (selectedEvent !== null) {
        let tmp = 0;
        if (selectedEvent.target !== undefined ) {
            tmp = selectedEvent.target.getAttribute("x");
        } else {
            tmp = selectedEvent.attr("x");
        }
        d3.selectAll(".click-scrubber").attr("transform", "translate(" + tmp + "," + 20 + ")");
    }
}

export function setScrubberPosition(xPos) {
    clickScrubber.attr("transform", "translate(" + parseFloat(xPos) + "," + 20 + ")");
    clickScrubber.style("display", null);
    clickScrubber.style("opacity", "1");
}

export function setSelectedEvent(se) {
    selectedEvent = se;
}
