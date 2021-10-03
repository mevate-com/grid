import {Request} from "express";
import {Sequelize} from "sequelize-typescript";
import {DataSet} from "../models/dataSet";
import {DataField} from "../models/dataField";
import {QueryTypes} from "sequelize";

export async function getGrid(req: Request, sq: Sequelize) {
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

    /**
     * Sorting / Ordering
     */
    let order = "";
    if (req.query.sort || req.query.order) {
        let requestedSortingFields: string[] = [];
        const requestedSorting = (req.query.sort || req.query.order)?.toString() || '';
        const requestedFieldsWithDirection: Array<[string, SortingDirection]> =
            requestedSorting.split(',').map(field => splitRequestedSortingIntoFieldAndSortingDirection(field));
        // ["title", "ASC"],["id", "ASC"] -> title ASC, id ASC
        const allowedFields = requestedFieldsWithDirection.filter(fieldWithDirection => {
            return dataFields.find(df => df.name === fieldWithDirection[0])
        });
        if (allowedFields.length !== 0) {
            console.log(allowedFields)
            order = `ORDER BY ` + allowedFields.map(f => f.join(' ')).join(', ');
        }
    }

    /**
     * Pagination
     */
    const requestedPage: number = req.query.page ? Number(req.query.page) || 1 : 1;
    const requestedElementCount: number = req.query.limit ? Number(req.query.limit) || 100 : 100;
    const [limit, offset] = buildPagination(requestedElementCount, requestedPage);


    const queryResult: unknown[] =
        await sq.query(`
            SELECT ${joinFieldNames(selectedFields)}
            FROM zz_qhpidth
            WHERE 1 = 1 
            ${order}
            LIMIT ${limit} OFFSET ${offset}
        `, {
            nest: true,
            type: QueryTypes.SELECT
        });
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
    let direction: SortingDirection = 'DESC';
    if (field.charAt(0) === '-') {
        direction = 'ASC';
        field = field.substring(1);
    }
    return [field, direction];
}

export interface GridMetaData {
    rowCount: number;
}

export type SortingDirection = 'ASC' | 'DESC';
