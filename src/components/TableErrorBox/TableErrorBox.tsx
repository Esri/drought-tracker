import React, { FC, useEffect, useState } from 'react';
import styles from './TableErrorBox.module.css';

interface TableErrorBoxProps {
messageType: 'standby' | 'invalid'
}

const TableErrorBox: FC<TableErrorBoxProps> = (props: TableErrorBoxProps) => {
    const [errorMessage, setErrorMessage] = useState<string>('Information not provided for given area and/or time');

    useEffect(() => {
        if (props.messageType === 'standby') setErrorMessage('Select an area within the U.S. to view data');
        if (props.messageType === 'invalid') setErrorMessage('Information not provided for given area and/or time');
    }, [props.messageType])

    useEffect(() => {}, [errorMessage])

    return (
        <div className={styles.container}>
            <span className={styles.message}>{errorMessage}</span>
        </div>
    );

}

export default TableErrorBox;
