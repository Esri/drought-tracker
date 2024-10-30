import React, { FC, useState, useEffect, ReactElement } from 'react';
import styles from './Table.module.css';
import types from './types';

interface TableProps {
    useStripedRows?: boolean,
    columnHeaders?: Array<types.ColumnHeadCell>,
    headerHeight?: types.HeaderHeight,
    panelState?: 'standby' | 'loading' | 'loaded' | 'invalid' | 'initial',
    rows: any
};

/**
 * A table component that is reusable throughout the application.
 * @param props The component's props object
 * @returns Table
 */
const Table: FC<TableProps> = (props: TableProps) => {

    const [columnHeaderCells, setColumnHeaderCells] = useState<any>([]);
    const [rows, setRows] = useState<any>([]);
    const [showNoResultsUI, setShowNoResultsUI] = useState<boolean>(false);

    /**
     * Construct the column headers row
     */
    const createColumnHeaders: () => void = () => {

        const headerCellStyle = {
            width: `${(1 / props.columnHeaders?.length!) * 100}%`,
            marginTop: '5%'
        };
        // make the column headers
        const headerElements: Array<ReactElement> = [];
        props.columnHeaders?.forEach((headerConfig: any) => {
            headerElements.push(<div key={headerConfig.columnKey} style={headerCellStyle}>{headerConfig.element ?? <></>}</div>);
        });
        setColumnHeaderCells(headerElements);
    }


    /**
     * construct the rows of the table
     */
    const createRows: () => void = () => {
        /* each row config should have:
            - rowHeight: s m l
            - rowKey: string
            - cells: Array
            cells array should have objects like:
                - columnKey: string
                - rowKey: string
                - value: string | number | null
                - element?: ReactElement
        */
        const rowCellStyle = {
            width: `${(1 / Math.max(...props.rows.map((c: any) => c.cells.length))) * 100}%`,
            height: '100%',
            paddingRight: '1%',
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'end'
        }
        const tempRows: Array<ReactElement> = [];
        // looping each row
        let i = 1;
        props.rows?.forEach((rowConfig: any) => {
            // looping each cell array in row config
            const cellArray: Array<ReactElement> = [];
            rowConfig.cells?.forEach((cellConfig: any) => {
                cellArray.push(
                    <div style={rowCellStyle} key={cellConfig.rowKey + (cellConfig.ColumnKey ?? 'cell' + Math.random())}>
                        {cellConfig.element ?? <>{cellConfig.value}</>}
                    </div>
                );
            });
            // now cells have been made
            // make row
            const rowStyle = {
                height: rowConfig.rowHeight ? (rowConfig.rowHeight === 's' ? '25px' : (rowConfig.rowHeight == 'm' ? '50px' : '75px')) : undefined,
                backgroundColor: (i % 2 === 0 && props.useStripedRows) ? 'rgb(255,255,255,0.1)' : ''
            }
            tempRows.push(
                <div className={styles.rowContainer} style={rowStyle} key={rowConfig.rowKey + 'Row'}>
                    {cellArray}
                </div>
            );
            i++;
        });
        setRows(tempRows);
    }

    /**
     * construct the column header React Elements if a columnHeaders array was passed in
     */
    useEffect(() => {
        if (props.columnHeaders) {
            createColumnHeaders();
        }
    }, [props.columnHeaders]);

    /**
     * re-render when header cell element array updates
     */
    useEffect(() => { }, [columnHeaderCells, showNoResultsUI]);

    /**
     * construct the rows elements if there are rows to construct
     */
    useEffect(() => {
        if (props.rows) {
            createRows();
        }
    }, [props.rows]);


    /**
     * re-render when rows element array updates
     */
    useEffect(() => {
        if (rows.length === 0) setShowNoResultsUI(true);
        else setShowNoResultsUI(false);
    }, [rows]);



    return (
        <div className={styles.container}>

            <div hidden={showNoResultsUI}>
                <div id={"headerContainer"} className={styles.rowContainer}>
                    {columnHeaderCells}
                </div>
                <div id={'rowsContainer'} className={styles.rowsContainer}>
                    {rows}
                </div>
            </div>
            {showNoResultsUI && <div className={styles.noResultsUI}>No Data</div>}


        </div>
    );
}

export default Table;