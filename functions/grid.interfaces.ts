export interface GridFilterOperation {
    type: "operation"
    field: string,
    value: string | number;
}

export interface GridFilterGroup {
    type: "group"
    mode: SupportedFilterModes,
    children: GridFilterOperation[];
}

export type GridFilter = GridFilterGroup | GridFilterOperation;

export type SupportedFilterModes = 'AND' | 'OR';

export type SortingDirection = 'ASC' | 'DESC';

export interface SequelizeQueryGenerator {
    selectQuery: (tableName: string, options: SequelizeSelectQueryOptions, model: any) => string;
    updateQuery: (tableName: string,
                  attrValueHash: { [key: string]: unknown },
                  where: string | number | { [key: string]: unknown }, // A hash with conditions (e.g. {name: 'foo'}) OR an ID as integer
                  options?: object,
                  attributes?: object) => string;
    insertQuery: (
        tableName: string,
        attrValueHash: { [key: string]: unknown }, // attribute value pairs
        attributes?: object,
        options?: object
    ) => string;
}

export interface SequelizeSelectQueryOptions {
    attributes?: string[]; // -> An array of attributes (e.g. ['name', 'birthday']). Default: *
    where?: string | number | { [key: string]: unknown }; // -> A hash with conditions (e.g. {name: 'foo'}) OR an ID as integer
    order?: Array<[string, SortingDirection]>;// -> e.g. 'id DESC'
    group?: string | string[];//
    limit?: number;// -> The maximum count you want to get.
    offset?: number;//
}

export interface GridQueryParams {
    dataSetId: string;
    fields: string[];
    filter?: GridFilter;
    order?: Array<[string, SortingDirection]>;
    page?: number;
    limit?: number;
}

export interface GridRecordQueryParams {
    dataSetId: string;
    recordId: string;
    fields: string[];
}

export interface GridRecordCreateParams {
    dataSetId: string;
    payload: { [key: string]: unknown };
}

export interface GridRecordUpdateParams {
    dataSetId: string;
    recordId: string;
    payload: { [key: string]: unknown };
}

export interface GridRecordDeleteParams {
    dataSetId: string;
    recordId: string;
    force: boolean;
}
