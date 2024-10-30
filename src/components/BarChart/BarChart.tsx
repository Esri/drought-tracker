import React, { FC, useEffect, useRef, useState, MutableRefObject } from 'react';
import componentConfig from './BarChartConfig.json';
import styles from './BarChart.module.css';
import sharedTypes from '../../assets/sharedTypes';
import WebMap from "@arcgis/core/WebMap.js";
import * as d3 from 'd3';

interface BarChartProps {
    webmap: WebMap,
    panelTab: sharedTypes.PanelTabOptions,
    currentCumulativeDroughtLevels: Array<any>,
    todaysPeriod: any,
    selectedPeriod: any,
    signalPeriodChanged: number,
    setNewPeriod: (newPeriod: string) => void,
    setSignalPeriodChanged: () => void,
    activeArc: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | null
}

type BarObject = {
    field: string,
    relatedField: string,
    barsObj: d3.Selection<SVGElement, {}, HTMLElement, any>
}
type BarsObjects = Array<BarObject>

const BarChart: FC<BarChartProps> = (props: BarChartProps) => {

    const chartRef: MutableRefObject<any> = useRef<any>();
    const barsObjects: MutableRefObject<BarsObjects> = useRef<BarsObjects>([]);
    const resizeObserver: MutableRefObject<ResizeObserver> = useRef<ResizeObserver>(new ResizeObserver(() => {
        setChartWidth(window.innerWidth - 420);
    }));

    const selectedPeriodX: MutableRefObject<number> = useRef<number>(-1);
    const [dateTooltip, setDateTooltip] = useState<any>(null);

    const getPeriodAsDate: (period: string) => Date = (period: string) => {
        return new Date(
            parseInt(period.substring(0, 4)),
            parseInt(period.substring(4, 6)) - 1,
            parseInt(period.substring(6, 8)),
        )
    }

    const getFormattedDateLabel: (period: string) => string = (period: string) => {
        return `${(period.substring(4, 6))}/${period.substring(6, 8)}/${period.substring(0, 4)}`;
    }

    const [chartWidth, setChartWidth] = useState<number>(0);

    useEffect(() => {
        if (chartRef.current && props.currentCumulativeDroughtLevels.length > 0) {
            resizeObserver.current.disconnect();
            resizeObserver.current.observe(chartRef.current);

            d3.select(chartRef.current).select('svg').remove();

            // set the dimensions and margins of the graph
            let margin = { left: 10, right: 5, top: 0, bottom: 20 },
                width = window.innerWidth - 420,
                height = 75;

            // make the svg
            let svg = d3.select(chartRef.current)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform',
                    'translate(' + margin.left + ',' + margin.top + ')');

            let latestPeriodDate: Date = getPeriodAsDate(props.currentCumulativeDroughtLevels[0].period)
            const x = d3.scaleTime()
                .domain([
                    getPeriodAsDate(props.currentCumulativeDroughtLevels[props.currentCumulativeDroughtLevels.length - 1].period),
                    latestPeriodDate
                ])
                .range([0, width]);


            // Generate tick values for every 5 years from 2000 to now
            const startYear = parseInt(props.currentCumulativeDroughtLevels[props.currentCumulativeDroughtLevels.length - 1].period.substring(0, 4));
            const currentYear = new Date().getFullYear();


            // array of ticks to label the x axis with
            // want one for the start, one for the end, and 5 year periods in between
            let tickValues: Array<Date> = [];

            for (let i: number = startYear; i <= currentYear; i += (chartWidth > 1000 ? 1 : 5)) {
                tickValues.push(new Date(i, 0));
            }
            // tickValues.push(latestPeriodDate);

            // add the x scale to the chart
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x)
                    .tickValues(tickValues)
                    .tickFormat((d: any) => {
                        if (d === latestPeriodDate) {
                            return 'now';
                        }
                        return d.getFullYear();
                    }))
                .selectAll("path")
                .attr("stroke-opacity", 0); // Make tick lines invisible

            svg.selectAll('.tick line')
                .attr('stroke-opacity', 0);

            // should be fine
            const yScale = d3.scaleLinear()
                .domain([0, 100])
                .range([height, 0]);

            const barConfig = componentConfig.barConfig;

            const bars: Array<any> = [];
            let hoverLine: any;
            let dateSelectionLine: any;
            let dateFlag: any;
            let periodText: any;

            selectedPeriodX.current = x(getPeriodAsDate(props.selectedPeriod));

            barConfig.forEach((config: any) => {
                const barsGraphic = svg.append('g');
                const barsObj = barsGraphic.selectAll('rect').data(props.currentCumulativeDroughtLevels, (d: any) => d);
                // add drop shadow to bars
                barsGraphic
                    .style('filter',
                        () => {
                            if (props.activeArc === config.relatedField) return 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 1))';
                            else return '';
                        }
                    )

                barsObj.enter()
                    .append('rect')
                    .attr('class', `.${config.field}`)
                    .attr('id', (d) => `${d.period}`)
                    .attr('x', (d) => {
                        return x(
                            getPeriodAsDate(d.period)
                        );
                    })
                    .attr('y', (d) => yScale(config.field !== 'backLayer' ? d.cumulativeLevels[config.field] : 100))
                    .attr('height', (d) => config.field !== 'backLayer' ? (height - yScale(d.cumulativeLevels[config.field])) : 100)
                    .attr('width', width >= props.currentCumulativeDroughtLevels.length ? Math.ceil(width / props.currentCumulativeDroughtLevels.length) : width / props.currentCumulativeDroughtLevels.length)
                    .attr('fill', config.color)
                    .style('fill-opacity',
                        () => {
                            if (config.field === 'backLayer') return 0;
                            else if (props.activeArc === null || props.activeArc === config.relatedField) return 1;
                            else return .1;
                        }
                    )
                    .on('click', (event: any, data: any) => {
                        selectedPeriodX.current = d3.pointer(event)[0];
                        props.setNewPeriod(data.period);
                    })
                    .on('mouseover', (event: any, data: any) => {
                        if (getPeriodAsDate(data.period) <= getPeriodAsDate(props.currentCumulativeDroughtLevels[0].period)) {

                            if (hoverLine) hoverLine.remove();
                            if (dateFlag) dateFlag.remove();
                            if (periodText) periodText.remove();

                            hoverLine = svg.append('line')
                                .attr('stroke-width', 1)
                                .attr('stroke', '#FFFFFF')
                                .attr("x1", d3.pointer(event)[0])
                                .attr("y1", 0)
                                .attr("x2", d3.pointer(event)[0])
                                .attr("y2", 100)
                                .style('pointer-events', 'none')
                                .style('filter', 'drop-shadow(0px 0px 6px #000000)')
                                .style('filter', 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 1))')

                            setDateTooltip(
                                <div className={styles.tooltipContent} style={{ left: `${window.innerWidth - event.clientX < 100 ? (event.clientX - 65) : event.clientX - 35}px`, top: `${event.clientY - 35}px` }}>
                                    <strong>{getFormattedDateLabel(data.period)}</strong>
                                </div>
                            )
                        }
                    })

                bars.push({
                    level: config.field,
                    relatedField: config.relatedField,
                    barsObj: barsObj
                });
            });

            if (dateSelectionLine) dateSelectionLine.remove();
            dateSelectionLine = svg.append('line')
                .attr('stroke-width', 1)
                .attr('stroke', '#FFFFFF')
                .attr("x1", selectedPeriodX.current)
                .attr("y1", 0)
                .attr("x2", selectedPeriodX.current)
                .attr("y2", 100)
                .style('pointer-events', 'none')

            // make sure the hover line does not show when the mouse is not on the chart at all
            svg.on('mouseleave', (event: any, data: any) => {
                if (hoverLine) hoverLine.remove();
                if (dateFlag) dateFlag.remove();
                if (periodText) periodText.remove();
                setDateTooltip(null);
            })
            barsObjects.current = bars;
        }
    }, [props.signalPeriodChanged, props.currentCumulativeDroughtLevels, props.activeArc, chartWidth]);

    useEffect(() => {
    }, [dateTooltip])

    useEffect(() => {
        if (barsObjects.current.length > 0 && props.activeArc !== null && chartRef.current) {
        }
    }, [props.activeArc])

    return (
        <>
            {dateTooltip}
            <div ref={chartRef} className={styles.container}></div>
        </>
    );
}

export default BarChart;