import React, { FC, useEffect, useState, useRef } from 'react';
import styles from './InfoModal.module.css';
import { CalciteIcon } from '@esri/calcite-components-react';
import "@esri/calcite-components/dist/components/calcite-icon";

interface InfoModalProps {
    closeModal: (closeEvent?: any) => void
}

const InfoModal: FC<InfoModalProps> = (props?: InfoModalProps) => {

    const [modalContainer, setModalContainer] = useState<any>(window.innerWidth >= 1100 ? styles.modalContainer : styles.modalContainerMobile);
    const firstRenderExecuted = useRef<boolean>(false);


    useEffect(() => {
        if (!firstRenderExecuted.current) {
            window.addEventListener('resize', () => {
                if (window.innerWidth < 1100) {
                    setModalContainer(styles.modalContainerMobile);
                }
                else if (window.innerWidth >= 1100) {
                    setModalContainer(styles.modalContainer);
                }
            })
            firstRenderExecuted.current = true;
        }
    }, [])

    useEffect(() => { }, [modalContainer])

    return (

        <>


            <div className={styles.container}>

                <div className={modalContainer}>
                    <CalciteIcon icon={'x-circle'} scale={'l'} class={styles.close} onClick={() => { props?.closeModal(); }}></CalciteIcon>

                    <div className={styles.content}>
                        <h1>{`About this App`}</h1>
                        <span>{`The Drought Aware app provides information about drought-affected areas in the U.S. over various time intervals (from 2000 to the present) and across different drought intensities. It provides summaries of the affected population and the potential impacts on crops, agricultural labor, rivers, and reservoirs.`}</span>
                        <h1>{`Use this App`}</h1>
                        <span>{`Display drought maps for different weeks by clicking on the time-series chart (top bar) or by scrolling through time using the sector chart (top-left). Hover on each drought intensity level in the sector chart to highlight the areas on the map and display the area percentage. Click on the map to display a panel with summary information for the selected area. The panel includes three categories: population, water, and agriculture.`}</span>
                        <br></br>
                        <h1>{`App Categories`}</h1>
                        <span>{`The Drought Aware app summarizes three information categories that drought may impact.`}</span>
                        <ul>
                            <li>
                                <strong>{`Population:`}</strong>
                                {` Displays the estimated number of people and households affected by drought at each intensity level. It also describes some vulnerable populations and lists the related drought risk indexes. The data is available at the county and state levels.`}
                            </li>
                            <li>
                                <strong>{`Water:`}</strong>
                                {` Depicts major local rivers, including the average inter-annual river flow and the relevant local reservoirs. The data is available at the Subregion Hydrologic Units (HUC4).`}
                            </li>
                            <li>
                                <strong>{`Agriculture:`}</strong>
                                {` Displays the potential economic impact of drought on major crops, affected labor, and the agricultural exposure to droughts. The data is available at the county and state levels.`}
                            </li>
                        </ul>
                        <h1>{`Drought Definitions`}</h1>
                        <ul>
                            <li>
                                <strong>{`Abnormally Dry (D0)`}</strong>
                                <ul>
                                    <li>
                                        {`Going into drought there is short-term dryness slowing planting, growth of crops or pastures.`}
                                    </li>
                                    <li>
                                        {`Coming out of drought there are some lingering water deficits; pastures or crops not fully recovered.`}
                                    </li>
                                </ul>
                            </li>


                            <li>
                                <strong>{`Moderate Drought (D1)`}</strong>
                                <ul>
                                    <li>
                                        {`Some damage to crops and pastures.`}
                                    </li>
                                    <li>
                                        {`Streams, reservoirs, or wells low, some water shortages developing or imminent.`}
                                    </li>
                                    <li>
                                        {`Voluntary water-use restrictions requested.`}
                                    </li>
                                </ul>
                            </li>


                            <li>
                                <strong>{`Severe Drought (D2)`}</strong>
                                <ul>
                                    <li>
                                        {`Crop or pasture losses likely.`}
                                    </li>
                                    <li>
                                        {`Water shortages are common.`}
                                    </li>
                                    <li>
                                        {`Water restrictions imposed.`}
                                    </li>
                                </ul>
                            </li>


                            <li>
                                <strong>{`Extreme Drought (D3)`}</strong>
                                <ul>
                                    <li>
                                        {`Major crop/pasture losses.`}
                                    </li>
                                    <li>
                                        {`Widespread water shortages or restrictions.`}
                                    </li>
                                </ul>
                            </li>


                            <li>
                                <strong>{`Exceptional Drought (D4)`}</strong>
                                <ul>
                                    <li>
                                        {`Exceptional and widespread crop/pasture losses.`}
                                    </li>
                                    <li>
                                        {`Shortages of water in reservoirs, streams, and wells create water emergencies.`}
                                    </li>
                                </ul>
                            </li>
                        </ul>
                        <h1>{`Data Sources`}</h1>
                        <span>{`The data layers used in this app can be found in `}<a href='https://livingatlas.arcgis.com/' target='blank'>{`ArcGIS Living Atlas of the World`}</a>:</span>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://www.arcgis.com/home/item.html?id=9731f9062afd45f2be7b3bf2e050fbfa' target='blank'>
                                    {`U.S. Drought Monitor`}
                                </a>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://livingatlas.arcgis.com/en/browse/?q=ACS#q=ACS&d=2' target='blank'>
                                    {`American Community Service (ACS)`}
                                </a>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://livingatlas.arcgis.com/en/browse/?q=%22USDA%20Census%20of%20Agriculture%22#q=%22USDA+Census+of+Agriculture%22&d=2' target='blank'>
                                    {`USDA Census of Agriculture`}
                                </a>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://livingatlas.arcgis.com/en/browse/?q=owner:%22FEMA_NationalRiskIndex%22#q=owner%3A%22FEMA_NationalRiskIndex%22&d=2' target='blank'>
                                    {`FEMA National Risk Index`}
                                </a>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://livingatlas.arcgis.com/en/browse/?q=%22National%20Water%20Model%22#q=%22National+Water+Model%22&d=2' target='blank'>
                                    {`National Water Model (NWM)`}
                                </a>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://livingatlas.arcgis.com/en/browse/?q=%22National%20Hydrography%20Dataset%22#q=%22National+Hydrography+Dataset%22&d=2' target='blank'>
                                    {`National Hydrography Dataset (NHD)`}
                                </a>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://www.arcgis.com/home/item.html?id=a4c195b7a6b74f278ff43e5d60c6915d' target='blank'>
                                    {`National Inventory of Dams (NID)`}
                                </a>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <a className={styles.link} href='https://livingatlas.arcgis.com/en/browse/?q=%22Watershed%20Boundary%20Dataset%22#q=%22Watershed+Boundary+Dataset%22&d=2' target='blank'>
                                    {`National Boundary Dataset (WBD)`}
                                </a>
                            </li>
                        </ul>
                        <h1>{`Drought Update Frequency`}</h1>
                        <span>{`The Drought Aware app includes weekly updates to the drought data, in line with the latest `}<a href='https://www.arcgis.com/home/item.html?id=9731f9062afd45f2be7b3bf2e050fbfa' target='blank'>{`U.S. Drought Monitor`}</a>{` map. The update process is automated using the Esri `}<a href='https://www.arcgis.com/home/group.html?content=all&id=c42fd84aa35a4ab39806f6481b80c0a0#overview' target='blank'>{`Aggregated Live Feed Methodology`}</a>{`.`}</span>
                        <br />
                        <br />
                        <span>{`The update frequency for other app data layers varies depending on the type of layer and is detailed in the source descriptions above.`}</span>
                        <br />
                        <h1>{`License`}</h1>
                        <span>{`This app is provided for informational purposes and is not monitored 24/7 for accuracy and currency and is licensed under the Esri Master License Agreement.`}</span>
                        <br />
                        <span><a href='https://downloads2.esri.com/arcgisonline/docs/tou_summary.pdf' target='blank'>{`View Summary`}</a> | <a href='https://www.esri.com/en-us/legal/terms/full-master-agreement' target='blank'>{`View Terms of Use`}</a></span>
                        <h1>{`Contact`}</h1>
                        <span>{`For questions or comments about the Drought Aware app, please contact us at `}<a href='mailto:environment@esri.com' target='blank'>environment@esri.com</a></span>

                    </div>


                </div>


            </div>

            <div className={styles.backdrop} onClick={() => { props?.closeModal() }}></div>

        </>
    );
}

export default InfoModal;