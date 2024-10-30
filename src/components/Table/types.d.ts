export type ColumnHeadCell = {
    // fieldName: string,
    columnKey: string,
    cellValue: string | number | null,
    // rowKey: string,
    element?: HTMLElement | ReactElement,
};

export type HeaderHeight = 's' | 'm' | 'l';

export type RowCell = {
columnKey: string,
rowKey: string,
value: string | number | null,
element?: HTMLElement | ReactElement
}

export type Row = {
    rowKey: string,
    rowHeight: string,
    cells: Array<RowCell>
}