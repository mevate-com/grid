import {Request} from "express";
import {Sequelize} from "sequelize-typescript";
import {sequelize} from "../index";
import {GridQueryParams} from "./grid.interfaces";
import {createGridRecord, deleteGridRecord, getGrid, getGridRecord} from "./grid.func";
import {splitRequestedSortingIntoFieldAndSortingDirection} from "./grid-utils.func";

export async function getGridApi(req: Request, sq: Sequelize) {
    const {dataSetId} = req.params;
    const {filter, fields, page, limit} = req.query;
    const sort = req.query.order || req.query.sort;

    if (!dataSetId) {
        return "Error";
    }

    let gridRequest: GridQueryParams = {
        dataSetId,
        fields: [],
    };

    if (fields) {
        gridRequest.fields = fields.toString().split(',');
    }

    if (page) {
        gridRequest.page = req.query.page ? Number(req.query.page) || 1 : 1;
    }

    if (limit) {
        gridRequest.limit = req.query.limit ? Number(req.query.limit) || 1 : 1;
    }

    if (filter) {
        // todo verify schema
        gridRequest.filter = JSON.parse(filter.toString());
    }

    if (sort) {
        gridRequest.order = String(sort).split(',').map(field => splitRequestedSortingIntoFieldAndSortingDirection(field));
    }
    return getGrid(
        sq,
        gridRequest
    );

}

export async function getGridRecordApi(req: Request, sq: Sequelize) {
    const {dataSetId, recordId} = req.params;
    const {fields} = req.query;

    if (!dataSetId || !recordId) {
        return "Error";
    }

    let fieldArray: string[] = [];
    if (fields) {
        fieldArray = fields.toString().split(',');
    }

    return getGridRecord(sq, {dataSetId, recordId, fields: fieldArray})
}

export async function createGridRecordApi(req: Request, sq: Sequelize) {
    const body = req.body;
    const {dataSetId} = req.params;
    return await createGridRecord(sequelize, {
        dataSetId,
        payload: body
    });
}

export async function updateGridRecordApi(req: Request, sq: Sequelize) {
}

export async function deleteGridRecordApi(req: Request, sq: Sequelize) {
    const {dataSetId, recordId} = req.params;
    const {fields} = req.query;

    if (!dataSetId || !recordId) {
        return "Error";
    }

    let fieldArray: string[] = [];
    if (fields) {
        fieldArray = fields.toString().split(',');
    }

    return deleteGridRecord(sq, {dataSetId, recordId, fields: fieldArray})
}
