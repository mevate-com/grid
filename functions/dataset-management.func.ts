import {Sequelize} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {DataSet} from "../models/dataSet";
import {Request} from "express";
import {DataField} from "../models/dataField";
import {DataFieldType} from "./datafields.enum";

export async function getDatasets(sq: Sequelize) {
    return await DataSet.findAll({
        include: DataField
    });
}

export async function createDataset(req: Request, sq: Sequelize) {
    const datasetTableName = 'zz_' + generateRandomStr(36);
    return await sq.transaction(async (t) => {
        const rollbackOnFailure = {transaction: t};
        const queryInterface = await sq.getQueryInterface();

        console.log(req.query)
        const dataSet: DataSet = await DataSet.create({
            // todo check if name already exists in org
            name: req.query.name,
            table_name: datasetTableName,
            title: req.query.title,
            pluralTitle: req.query.pluralTitle,
            settings: '{}'
        }, rollbackOnFailure).catch(e => {
            console.log(e)
            throw e;
        }).then(dataSet => {
            return dataSet;
        })

        await DataField.bulkCreate([{
            dataset_id: dataSet.id,
            name: 'id',
            type: DataFieldType.String,
            title: 'Identifier',
            system: true,
            settings: '{}',
        }, {
            dataset_id: dataSet.id,
            name: 'title',
            // todo change to uuid
            type: DataFieldType.Integer,
            title: 'Title',
            settings: '{}',
        }
        ], rollbackOnFailure).catch(e => {
            console.log(e)
            throw e;
        })

        await queryInterface.createTable(
            datasetTableName, {
                title: {
                    type: DataTypes.STRING,
                },
                id: {
                    primaryKey: true,
                    allowNull: false,
                    type: DataTypes.INTEGER,
                    defaultValue: DataTypes.UUIDV4
                },
            }, rollbackOnFailure).catch(e => {
            console.log(e)
            throw e;
        })

    })
        .then(() => {
            return "Creation Success"
        })
        .catch(() => {
            return "Creation Failed"
        });
}


export function updateDataset() {

}

export function deleteDataset() {

}

export interface Dataset {
    name: string;
    title: string;
}

export function generateRandomStr(length = 5) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, length);
}
