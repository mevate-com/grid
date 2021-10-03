import {Request} from "express";
import {Sequelize} from "sequelize-typescript";
import {DataSet} from "../models/dataSet";
import {DataField} from "../models/dataField";
import {Op, QueryTypes} from "sequelize";

export async function getGrid(req: Request, sq: Sequelize) {
    const queryInterface = await sq.getQueryInterface();
    // @see https://github.com/sequelize/sequelize/blob/main/lib/dialects/abstract/query-generator.js#L1125
    const queryGenerator: SequelizeQueryGenerator = (queryInterface as any).queryGenerator as SequelizeQueryGenerator;

    let query: SequelizeQueryGeneratorOptions = {};

    const dataSetId = req.params.dataSetId || null;
    if (!dataSetId) {
        return "Error";
    }
    const dataSet: DataSet | null = await DataSet.findByPk(dataSetId, {
        include: DataField
    });

    if (!dataSet) {
        return "Error 2";
    }

    /**
     * Field selection
     */
        // todo filter by permission
    const dataFields: DataField[] = dataSet.dataFields;
    let requestedFields: string[] = [];
    if (req.query.fields) {
        requestedFields = req.query.fields.toString().split(',');
        if (!requestedFields.includes('id')) {
            requestedFields.push('id')
        }
    }
    const selectedFields: DataField[] = buildArrayOfAvailableDataFieldsFromArrayOfFieldNames(dataFields, requestedFields)
    query.attributes = selectedFields.map(f => sanitizeFieldNames(f.name));

    /**
     * Sorting / Ordering
     */
    let order = "";
    if (req.query.sort || req.query.order) {
        const requestedSorting = (req.query.sort || req.query.order)?.toString() || '';
        const requestedFieldsWithDirection: Array<[string, SortingDirection]> =
            requestedSorting
                .split(',')
                .map(field => splitRequestedSortingIntoFieldAndSortingDirection(field));
        // ["title", "ASC"],["id", "ASC"] -> title ASC, id ASC
        const allowedOrderFields = requestedFieldsWithDirection.filter(fieldWithDirection => {
            return dataFields.find(df => df.name === fieldWithDirection[0])
        });
        if (allowedOrderFields.length !== 0) {
            query.order = allowedOrderFields;
        }
    }

    /**
     * Filtering
     */
    let filter = "";
    if (req.query.filter) {
        // todo validate json schema
        const requestedFilter: GridFilter = JSON.parse(req.query.filter.toString());
        query.where = buildSequelizeFilter(requestedFilter, dataFields);
    }


    /**
     * Pagination
     */
    const requestedPage: number = req.query.page ? Number(req.query.page) || 1 : 1;
    const requestedElementCount: number = req.query.limit ? Number(req.query.limit) || 100 : 100;
    const [limit, offset] = buildPagination(requestedElementCount, requestedPage);
    query.limit = limit;
    query.offset = offset;

    const queryResult: unknown[] =
        await sq.query(queryGenerator.selectQuery('zz_qhpidth', query, null), {
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

function joinFieldNames(fields: DataField[]): string {
    const fieldNames = fields.map(f => f.name);
    return sanitizeFieldNames(fieldNames.join(', '));
}

function sanitizeFieldNames(fields: string): string {
    return fields
        // just to be sure - should already be taken care of
        // todo sanitize input during DataField creation
        .split("-",).join('')
        .split('"').join('')
        .split("'").join('');
}

function splitRequestedSortingIntoFieldAndSortingDirection(field: string): [string, SortingDirection] {
    let direction: SortingDirection = 'ASC';
    if (field.charAt(0) === '-') {
        direction = 'DESC';
        field = field.substring(1);
    }
    return [sanitizeFieldNames(field), direction];
}

function buildSequelizeFilter(filter: GridFilter, availableFields: DataField[]) {
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

export interface GridMetaData {
    rowCount: number;
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
    group?: string;//
    limit?: number;// -> The maximum count you want to get.
    offset?: number;//
}

