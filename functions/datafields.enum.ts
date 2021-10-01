export interface DataField {
    type: DataFieldType
}

export enum DataFieldType {
    String = 'STRING',
    Integer = 'INTEGER',
    Float = 'FLOAT',
    Boolean = 'BOOLEAN',
}
