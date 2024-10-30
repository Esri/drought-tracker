import React, { useEffect, useState, useRef, MutableRefObject } from 'react';
import styles from './App.module.css';
import Shell from './components/Shell/Shell';
import sharedTypes from './assets/sharedTypes';
import appConfig from './AppConfig.json';

function App() {

    /*
    * Esri Living Atlas Drought Aware Application 
    * 
    * Managed by Ken Baloun
    * Designed by John Nelson
    * Data supported by Gonzalo Davalos-Espinoza
    * Developed by Nathan Traylor
    * 
    * Produced in 2024
    * 
    */



    /**
     * This is the "start" of the application.
     * Before we render more components, we check for URL parameters to configure the app with.
     * The functions that process the URL and create the parameter data object to pass to the Shell component are found here.
     */


    const firstRenderExecuted: MutableRefObject<boolean> = useRef<boolean>(false);
    const [uponLoadParameters, setUponLoadParameters] = useState<sharedTypes.UrlParameters | null>(null);
    const config: sharedTypes.AppConfig = appConfig;



    /**
     * Checks the URL to see if there are any valid parameters to configure the initial loadout of the application
     */
    const checkForParameters: () => void = () => {
        const urlParams: URLSearchParams = new URLSearchParams(window.location.hash.replace('#', '').replace('%23', ''));
        // start with a null parameter object. we will add properties as we find and validate them
        let paramObject: sharedTypes.UrlParameters = config.nullUrlParamObject;
        // if the url had no params, pass the null object
        if (urlParams.toString() === '') {
            setUponLoadParameters(paramObject);
        }

        if (urlParams.toString() !== '') {
            paramObject = getAreaAndTabParameters(paramObject);
            // next handle point param
            if (urlParams.get('point')) paramObject.point = urlParams.get('point');
            // then handle zoom param
            if (urlParams.get('zoom') && !isNaN(parseInt(urlParams.get('zoom') ?? ''))) paramObject.zoom = parseInt(urlParams.get('zoom')!);
            // maybe handle period param? later...
            if (urlParams.get('period') && !isNaN(parseInt(urlParams.get('period') ?? '')) && (urlParams.get('period') ?? '').length === 8) paramObject.period = urlParams.get('period')!;
            setUponLoadParameters(paramObject);
        }
    }



    /*
    * This function searches for the areaType and panelTab parameters, checks if there are valid values, and passes any valid values to the inital parameter object
    */
    const getAreaAndTabParameters: (params: sharedTypes.UrlParameters) => sharedTypes.UrlParameters = (params: sharedTypes.UrlParameters) => {
        const urlParams: URLSearchParams = new URLSearchParams(window.location.hash.replace('#', '').replace('%23', ''));

        if (urlParams.get('panelTab')) {
            switch (urlParams.get('panelTab')) {
                // if the panelTab parameter is pop
                case ('pop'):
                    // if there is a valid associated areaType parameter, assign it
                    if (['county', 'state'].some((value: string) => value === urlParams.get('areaType'))) {
                        params.areaType = urlParams.get('areaType') as sharedTypes.AreaTypeParameters; // the area type parameter was either county or state, which is a valid area type parameter
                    } else params.areaType = 'state'; // otherwise, default opening to state
                    // now assign the panel tab parameter to 'pop'
                    params.panelTab = 'pop';
                    break;
                case ('water'):
                    params.areaType = 'huc4';
                    params.panelTab = 'water';
                    break;
                case ('ag'):
                    // same thing as what pop does
                    if (['county', 'state'].some((value: string) => value === urlParams.get('areaType'))) {
                        params.areaType = urlParams.get('areaType') as sharedTypes.AreaTypeParameters; // the area type parameter was either county or state, which is a valid area type parameter
                    } else params.areaType = 'state'; // otherwise, default opening to state
                    params.panelTab = 'ag';
            }
        } else {
            // dont assign the areaType or panelTab params if panelTab is null
        }
        return params;
    }


    useEffect(() => {
        // if we have not gone through the initial render, check to see if there are any parameters in the URL
        if (!firstRenderExecuted.current) {
            checkForParameters();
            firstRenderExecuted.current = true;
        }
    }, [])

    useEffect(() => { }, [uponLoadParameters])

    return (
        uponLoadParameters && firstRenderExecuted.current &&
        <div className={styles.appContainer}>
            <Shell
                uponLoadParameters={uponLoadParameters}
            ></Shell>
        </div>
    )
}

export default App;