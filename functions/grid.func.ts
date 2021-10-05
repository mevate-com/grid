import {Request} from "express";
import {Sequelize} from "sequelize-typescript";
import {DataSet} from "../models/dataSet";
import {DataField} from "../models/dataField";
import {Op, QueryTypes} from "sequelize";

export async function getGrid(sq: Sequelize, gridData: GridQueryParams) {
    const queryInterface = await sq.getQueryInterface();
    // @see https://github.com/sequelize/sequelize/blob/main/lib/dialects/abstract/query-generator.js#L1125
    const queryGenerator: SequelizeQueryGenerator = (queryInterface as any).queryGenerator as SequelizeQueryGenerator;

    let query: SequelizeQueryGeneratorOptions = {};

    const dataSet: DataSet | null = await DataSet.findByPk(gridData.dataSetId, {
        include: DataField
    });

    if (!dataSet) {
        return "Error 2";
    }

    /**
     * Field selection
     */
    // todo filter by permission
    // always include id field, even if not requested
    if (gridData.fields.length === 0) {
        gridData.fields = getFieldNames(dataSet.dataFields);
    }
    if (!gridData.fields.includes('id')) {
        gridData.fields.push('id')
    }
    const selectedFields: DataField[] = buildArrayOfAvailableDataFieldsFromArrayOfFieldNames(dataSet.dataFields, gridData.fields)
    query.attributes = getFieldNames(selectedFields);

    /**
     * Sorting / Ordering
     */
    if (gridData.order) {
        // ["title", "ASC"],["id", "ASC"] -> title ASC, id ASC
        // allow ordering only by allowed fields
        const allowedOrderFields = gridData.order.filter(fieldWithDirection => {
            return dataSet.dataFields.find(df => df.name === fieldWithDirection[0])
        });
        // if we still have fields left after permission check, add them to order
        if (allowedOrderFields.length !== 0) {
            query.order = allowedOrderFields;
        }
    }

    /**
     * Filtering
     */
    if (gridData.filter) {
        // todo validate json schema
        query.where = buildSequelizeFilter(gridData.filter, dataSet.dataFields);
    }

    /**
     * Pagination
     */
    if (!gridData.limit && gridData.page) {
        gridData.limit = 100;
    }
    if (!gridData.page) {
        gridData.page = 1;
    }

    const [limit, offset] = buildPagination(gridData.limit, gridData.page);
    query.limit = limit;
    query.offset = offset;


    const queryResult: unknown[] =
        await sq.query(queryGenerator.selectQuery(dataSet.table_name, query, null), {
            nest: true,
            type: QueryTypes.SELECT
        }).catch(e => ["Error"]); // todo error handling
    return {
        data: queryResult,
        meta: {
            count: (queryResult as []).length
        }
    };
}

export async function getGridRecord(req: Request, sq: Sequelize) {
}

export async function updateGridRecord(req: Request, sq: Sequelize) {
}

export async function createGridRecord(req: Request, sq: Sequelize) {
}

export async function deleteGridRecord(req: Request, sq: Sequelize) {
}

function buildArrayOfAvailableDataFieldsFromArrayOfFieldNames(availableFields: DataField[], requestedFields: string[]): DataField[] {
    if (requestedFields.length !== 0) {
        return availableFields.filter(f => requestedFields.includes(f.name));
    }
    return availableFields;
}

function buildPagination(elementsPerPage: number = 100, page: number = 1): [number, number] {
    const offset = (elementsPerPage * page) - elementsPerPage;
    return [elementsPerPage, offset];
}

function getFieldNames(fields: DataField[]): string[] {
    return fields.map(f => f.name);
}

export function sanitizeFieldNames(fields: string): string {
    return fields
        // just to be sure - should already be taken care of
        // todo sanitize input during DataField creation
        .split("-",).join('')
        .split('"').join('')
        .split("'").join('');
}

export function buildSequelizeFilter(filter: GridFilter, availableFields: DataField[]) {
    if (filter.type === 'group') {
        let operator = Op.and;
        switch (filter.mode) {
            case "OR":
                operator = Op.or;
                break;
            case "AND":
                operator = Op.and;
                break;
        }
        let x: any = {};
        x[operator] = [
            ...filter.children.map(child => buildSequelizeFilter(child, availableFields))
        ]
        return x;
    } else {
        let sub: { [k: string]: unknown } = {};
        // todo (later) check if field is subfield
        if (availableFields.map(f => f.name).includes(filter.field)) {
            sub[filter.field] = filter.value.toString();
            return sub;
        } else {
            return {}
        }
    }
}

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
    selectQuery: (tableName: string, options: SequelizeQueryGeneratorOptions, model: any) => string
}

export interface SequelizeQueryGeneratorOptions {
    attributes?: string[]; // -> An array of attributes (e.g. ['name', 'birthday']). Default: *
    where?: string | number | { [key: string]: string }; // -> A hash with conditions (e.g. {name: 'foo'}) OR an ID as integer
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
