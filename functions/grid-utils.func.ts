import {DataField} from "../models/dataField";
import {GridFilter, SequelizeQueryGenerator, SortingDirection} from "./grid.interfaces";
import {Sequelize} from "sequelize-typescript";
import {Op} from "sequelize";
import {DataSet} from "../models/dataSet";

export async function getQueryGenerator(sq: Sequelize): Promise<SequelizeQueryGenerator> {
    const queryInterface = await sq.getQueryInterface();
    // @see https://github.com/sequelize/sequelize/blob/main/lib/dialects/abstract/query-generator.js#L1125
    return (queryInterface as any).queryGenerator as SequelizeQueryGenerator;
}

export function buildArrayOfAvailableDataFieldsFromArrayOfFieldNames(availableFields: DataField[], requestedFields: string[]): DataField[] {
    if (requestedFields.length !== 0) {
        return availableFields.filter(f => requestedFields.includes(f.name));
    }
    return availableFields;
}

export function buildPagination(elementsPerPage: number = 100, page: number = 1): [number, number] {
    const offset = (elementsPerPage * page) - elementsPerPage;
    return [elementsPerPage, offset];
}

export function getFieldNames(fields: DataField[]): string[] {
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

export function buildFieldSelection(dataSet: DataSet, requestedFields: string[]): string[] {
    // todo filter by permission
    // always include id field, even if not requested
    if (requestedFields.length === 0) {
        requestedFields = getFieldNames(dataSet.dataFields);
    }
    if (!requestedFields.includes('id')) {
        requestedFields.push('id')
    }
    const selectedFields: DataField[] = buildArrayOfAvailableDataFieldsFromArrayOfFieldNames(dataSet.dataFields, requestedFields)
    return getFieldNames(selectedFields);
}

export function filterPayloadToContainOnlyNormalFields(payload: { [key: string]: unknown }, availableFields: DataField[]): { [key: string]: unknown } {
    const keys = Object.keys(payload);
    const payloadFields: string[] = [];
    keys.map(k => {
        const dataField = getDataFieldByNameFromArrayOfDataFields(availableFields, k);
        if (!dataField) {
            return;
        }
        if (dataField.system) {
            return;
        }
        payloadFields.push(dataField.name);
    });

    const actualPayload: { [key: string]: unknown } = {};
    payloadFields.map(name => actualPayload[name] = payload[name]);
    return actualPayload;
}

export function getDataFieldByNameFromArrayOfDataFields(df: DataField[], name: string): DataField | null {
    return df.find(field => field.name === name) || null;
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

export function splitRequestedSortingIntoFieldAndSortingDirection(field: string): [string, SortingDirection] {
    let direction: SortingDirection = 'ASC';
    if (field.charAt(0) === '-') {
        direction = 'DESC';
        field = field.substring(1);
    }
    return [sanitizeFieldNames(field), direction];
}
