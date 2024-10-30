import React, { FC, useEffect, useState } from 'react';
import styles from './RegionalInformation.module.css';

interface RegionalInformationProps {
    primaryText: string,
    secondaryText: string,
}

const RegionalInformation: FC<RegionalInformationProps> = (props: RegionalInformationProps) => {

    const [formattedPrimaryText, setFormattedPrimaryText] = useState<string>('');
    const [formattedSecondaryText, setFormattedSecondaryText] = useState<string>('');

    useEffect(() => {
        setFormattedPrimaryText(props.primaryText.toUpperCase())
        setFormattedSecondaryText(props.secondaryText.toUpperCase())
    }, [props.primaryText, props.secondaryText])

    useEffect(() => { }, [formattedPrimaryText, formattedSecondaryText]);

    return (
        <div className={styles.container}>
            <div className={styles.textContainer}>
                <a className={styles.primaryText}>{formattedPrimaryText}</a>
                <a className={styles.secondaryText}>{formattedSecondaryText}</a>
            </div>
        </div>
    );
}

export default RegionalInformation;