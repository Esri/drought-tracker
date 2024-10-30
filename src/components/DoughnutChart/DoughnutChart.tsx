import React, { FC, useEffect, useRef, MutableRefObject } from 'react';
import * as d3 from 'd3';
import applicationConfig from '../../AppConfig.json';
import styles from './DoughnutChart.module.css'
import sharedTypes from '../../assets/sharedTypes';
import GroupLayer from "@arcgis/core/layers/GroupLayer.js";
import Layer from "@arcgis/core/layers/Layer.js";
import WebMap from "@arcgis/core/WebMap.js";
import DateSelector from '../DateSelector/DateSelector';

interface DoughnutChartProps {
    webmap: WebMap,
    currentDroughtLevels: sharedTypes.DroughtLevelData,
    selectedPeriod: string,
    setNewPeriod: (newPeriod: string | null, weekChangeCount?: number) => void,
    setSignalPeriodChanged: () => void,
    signalPeriodChanged: number,
    setActiveArc: (arc: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | null) => void,
    areaType: sharedTypes.AreaTypeCategories,
    areaTypeChanged: number,
    signalPanelTabChanged: number,
    panelTab: sharedTypes.PanelTabOptions,
    earliestPeriod: string,
    todaysPeriod: string,
}

const DoughnutChart: FC<DoughnutChartProps> = (props: DoughnutChartProps) => {

    const appConfig: MutableRefObject<sharedTypes.AppConfig> = useRef<sharedTypes.AppConfig>(applicationConfig);
    const droughtLayers: MutableRefObject<Array<{ layer: Layer, originalOpacity: number }>> = useRef<Array<{ layer: Layer, originalOpacity: number }>>([]);
    const chartRef = useRef<any>();


    const onHover: (level: "d0" | "d1" | "d2" | "d3" | "d4" | "nothing") => void = (level: "d0" | "d1" | "d2" | "d3" | "d4" | "nothing") => {
        if (level === 'nothing') {
            onRelease(level);
            return;
        }
        // toggle layer visibilities
        let layerTitle: string = '';
        if (level === 'd4') {
            layerTitle = appConfig.current.exceptionalDroughtLayerTitle;
        } else if (level === 'd3') {
            layerTitle = appConfig.current.extremeDroughtLayerTitle;
        } else if (level === 'd2') {
            layerTitle = appConfig.current.severeDroughtLayerTitle;
        } else if (level === 'd1') {
            layerTitle = appConfig.current.moderateDroughtLayerTitle;
        } else if (level === 'd0') {
            layerTitle = appConfig.current.abnormalDroughtLayerTitle;
        }

        droughtLayers.current.forEach((layerConfig: { layer: Layer, originalOpacity: number }) => {
            if (layerConfig.layer.title === layerTitle) {
                layerConfig.layer.opacity = layerConfig.originalOpacity;
            }
            else layerConfig.layer.opacity = .2;
        });
        props.setActiveArc(level);
    }

    const onRelease: (level: string) => void = (level: string) => {
        // document.getElementById(level)!.style.boxShadow = '';
        droughtLayers.current.forEach((layerConfig: { layer: Layer, originalOpacity: number }) => {
            layerConfig.layer.opacity = layerConfig.originalOpacity;
        });
        props.setActiveArc(null);
    }


    useEffect(() => {
        if (droughtLayers.current.length === 0) {
            props.webmap.when(() => {
                const droughtGroup: GroupLayer = props.webmap.layers.find((layer: Layer) => layer.title === appConfig.current.droughtLayerTitle) as GroupLayer;
                droughtGroup.layers.forEach((layer: Layer) => { droughtLayers.current.push({ layer: layer, originalOpacity: layer.opacity }) });
            })
        }
    }, []);

    // doughnut chart stuff
    useEffect(() => {
        if (chartRef.current) {

            const colors = [
                '#95864a',
                '#FEA25A',
                '#E0522C',
                '#982943',
                '#570A3C',
                'rgba(0,0,0,1)',
            ];

            const width = 170;
            const height = 170;
            const innerRadius = 75;
            const outerRadius = Math.min(width, height) / 2;

            let levels = [
                'd0',
                'd1',
                'd2',
                'd3',
                'd4',
                'nothing'
            ];

            const data: any = [];
            levels.forEach((level: string) => {
                data.push({
                    value: Math.ceil(props.currentDroughtLevels[level as ('d1' | 'd2' | 'd3' | 'd4' | 'nothing')]), key: level
                })
            })

            d3.select(chartRef.current).select("svg").remove(); // Remove the old svg

            // Create new svg
            const svg = d3
                .select(chartRef.current)
                .append("svg")
                .style('overflow-clip-margin', 'unset')
                .style('overflow', 'visible')
                .attr("height", width)
                .attr("width", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
                .style('filter', 'drop-shadow(3px 3px 2px rgba(255, 255, 255, .1))')

            const arcGenerator: any = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

            const pie = d3.pie();

            const pieGenerator = pie.value((d: any) => d.value);
            pie.sort(null);

            const arcs = svg.selectAll().data(pieGenerator(data)).enter();

            const arcGroups = arcs.append("g");

            arcGroups
                .append("path")
                .attr("d", arcGenerator)
                .style("fill", (d: any, i: any) => {
                    if (d.data.key === 'd0') {
                        // Apply the pattern to the arc with 'd0' key
                        return 'url(#diagonalPattern)';
                    } else {
                        return colors[i % data.length];
                    }
                })
                .style('fill-opacity', (d: any, i: any) => {
                    // give the nothing arc a default opacity of .5
                    if (d.data.key === 'nothing') {
                        return .5;
                    }
                    else return 1;
                })
                .on('mouseover', (event: any, info: any) => {
                    // Select the parent element
                    const hoveredArc = d3.select(event.currentTarget.parentNode);
                    // set box shadow style, and toggle its opacity
                    // if it is not the nothing arc, set the opacity of the remaining arcs to .5
                    if (info.data.key !== 'nothing') {
                        hoveredArc
                            .style("fill-opacity", 1)
                            .style('filter', 'drop-shadow(0px 0px 4px rgba(0, 0, 0, 1))');

                        svg.selectAll("g")
                            .filter((d, i) => i !== info.index) // Exclude the hovered arc
                            .selectAll("path")
                            .style("fill-opacity", 0.5);
                    }

                    onHover(info.data.key);
                })
                .on('mouseout', (event: any, info: any) => {
                    // user is unhovering from an arc
                    const hoveredArc = d3.select(event.currentTarget.parentNode);
                    // reset styles
                    hoveredArc
                        .style("fill-opacity", 1)
                        .style('filter', '');

                    svg.selectAll("g")
                        .filter((d: any, i: any) => i !== info.index && d.data.key !== 'nothing') // Exclude the hovered arc and the 'nothing' arc
                        .selectAll("path")
                        .style("fill-opacity", 1) // Restore the fill opacity of other arcs to 1
                        .style('filter', '');

                    onRelease(info.data.key); // Call the onRelease() function with the key of the hovered arc
                });

            // Create the diagonal pattern
            svg
                .append("pattern")
                .attr("id", "diagonalPattern")
                .attr("patternUnits", "userSpaceOnUse")
                .attr("width", 10)
                .attr("height", 10)
                .append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", "#95864a");

            svg
                .select("#diagonalPattern")
                .append("path")
                .attr("d", "M-1,1 l1,-1 M0,10 l10,-10 M9,11 l1,-1")
                .style("stroke", "black")
                .style("stroke-width", 0.25)
                .style("fill", "none");


        }
    }, [props.currentDroughtLevels, props.signalPeriodChanged]);

    return (
        <div className={styles.container}>
            <div className={styles.dateSelectorContainer}>
                <DateSelector
                    selectedPeriod={props.selectedPeriod}
                    signalPeriodChanged={props.signalPeriodChanged}
                    setNewPeriod={(newPeriod: string | null, weekChangeCount?: number) => { props.setNewPeriod(newPeriod, weekChangeCount) }}
                    setSignalPeriodChanged={() => { props.setSignalPeriodChanged() }}
                    areaType={props.areaType}
                    areaTypeChanged={props.areaTypeChanged}
                    signalPanelTabChanged={props.signalPanelTabChanged}
                    panelTab={props.panelTab}
                    earliestPeriod={props.earliestPeriod}
                    todaysPeriod={props.todaysPeriod}
                ></DateSelector>
            </div>
            <div ref={chartRef} className={styles.chartContainer}></div>
        </div>
    );
}

export default DoughnutChart;