import {Sequelize} from "sequelize-typescript";
import {DataSet} from "../models/dataSet";
import {DataField} from "../models/dataField";
import {QueryTypes} from "sequelize";
import {
    buildFieldSelection,
    buildPagination,
    buildSequelizeFilter,
    filterPayloadToContainOnlyNormalFields,
    getQueryGenerator
} from "./grid-utils.func";
import {
    GridQueryParams,
    GridRecordCreateParams,
    GridRecordQueryParams,
    SequelizeSelectQueryOptions
} from "./grid.interfaces";
import { v4 } from 'uuid';

export async function getGrid(sq: Sequelize, gridData: GridQueryParams) {
    const queryGenerator = await getQueryGenerator(sq);

    let query: SequelizeSelectQueryOptions = {};

    const dataSet: DataSet | null = await DataSet.findByPk(gridData.dataSetId, {
        include: DataField
    });

    if (!dataSet) {
        return "Error 2";
    }

    /**
     * Field selection
     */
    query.attributes = buildFieldSelection(dataSet, gridData.fields);

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


export async function getGridRecord(sq: Sequelize, {dataSetId, recordId, fields}: GridRecordQueryParams) {
    const queryGenerator = await getQueryGenerator(sq);

    let query: SequelizeSelectQueryOptions = {};

    const dataSet: DataSet | null = await DataSet.findByPk(dataSetId, {
        include: DataField
    });

    if (!dataSet) {
        return "Error 2";
    }
    query.attributes = buildFieldSelection(dataSet, fields);
    // return exactly one item
    query.limit = 1;
    query.where = {
        id: recordId,
        trashed: false
    };

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

export async function createGridRecord(sq: Sequelize, {payload, dataSetId}: GridRecordCreateParams) {
    const queryGenerator = await getQueryGenerator(sq);

    const dataSet: DataSet | null = await DataSet.findByPk(dataSetId, {
        include: DataField
    });

    if (!dataSet) {
        return "Error 2";
    }

    // todo required values
    // todo validation

    const actualPayload = filterPayloadToContainOnlyNormalFields(payload, dataSet.dataFields)

    actualPayload.id = v4();
    actualPayload.trashed = false;
    actualPayload.createdAt = (new Date).toISOString();
    actualPayload.updatedAt = (new Date).toISOString();
    const queryResult: unknown[] =
        await sq.query(queryGenerator.insertQuery(
            dataSet.table_name,
            actualPayload,
            {id: "DEFAULT"}), {
            nest: true,
            type: QueryTypes.INSERT
        }).catch(e => ["Error", e]);
    return queryResult;
}

export async function updateGridRecord(sq: Sequelize) {
    const queryGenerator = await getQueryGenerator(sq);
}

export async function deleteGridRecord(sq: Sequelize, {dataSetId, recordId}: GridRecordQueryParams) {
    const queryGenerator = await getQueryGenerator(sq);

    let query: SequelizeSelectQueryOptions = {};

    const dataSet: DataSet | null = await DataSet.findByPk(dataSetId, {
        include: DataField
    });
    if (!dataSet) {
        return "Error 2";
    }

    // todo update only fields where user has permission

    // return exactly one item
    query.limit = 1;
    query.where = {
        id: recordId,
    };

    const queryResult: unknown[] =
        await sq.query(queryGenerator.updateQuery(dataSet.table_name, {trashed: true}, query.where, query), {
            nest: true,
            type: QueryTypes.UPDATE
        }).catch(e => ["Error", e]); // todo error handling
    console.log(queryResult)
    return {
        data: queryResult[0],
        meta: {
            count: (queryResult as []).length
        }
    };
}
