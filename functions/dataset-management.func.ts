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

export async function getSingleDataset(req: Request, sq: Sequelize) {
    const dataSetId = req.params.id || null;
    if (!dataSetId) {
        return "Error";
    }
    return await DataSet.findByPk(dataSetId.toString(), {
        include: DataField
    });
}

export async function createDataset(req: Request, sq: Sequelize) {
    const datasetTableName = 'zz_' + generateRandomStr(36);
    return await sq.transaction(async (t) => {
        const rollbackOnFailure = {transaction: t};
        const queryInterface = await sq.getQueryInterface();
        const dataSet: DataSet = await DataSet.create({
            // todo check if name already exists in org
            name: req.body.name,
            table_name: datasetTableName,
            title: req.body.title,
            pluralTitle: req.body.pluralTitle,
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
        return
    })
        .then(() => {
            return "Creation Success"
        })
        .catch((e: Error) => {
            return "Creation Failed: " + e.message;
        });
}


export async function updateDataset(req: Request, sq: Sequelize) {
    const datasetId = req.params.id;

    return await sq.transaction(async (t) => {
            let dataSet: DataSet | null = await DataSet.findByPk(datasetId)
                .catch(e => {
                    return null;
                }).then(ds => ds);

            if (!dataSet) {
                throw "Error";
            }

            return await dataSet.update({
                name: req.body.name,
                pluralTitle: req.body.pluralTitle,
            }, {transaction: t});
        }
    )
        .then((dataSet) => {
            return dataSet;
        })
        .catch(() => {
            return "Deletion Failed"
        });

}

export async function deleteDataset(req: Request, sq: Sequelize) {
    const datasetId = req.params.id;
    return await sq.transaction(async (t) => {
            const rollbackOnFailure = {transaction: t};
            const queryInterface = await sq.getQueryInterface();

            const dataSet: DataSet | null = await DataSet.findByPk(datasetId)
                .catch(e => {
                    return null;
                }).then(ds => ds);

            if (!dataSet) {
                throw "Error";
            }
            const tableName = dataSet.table_name;

            await dataSet.destroy(rollbackOnFailure).catch(e => {
                throw e;
            }).then();

            await DataField.destroy({
                where: {
                    dataset_id: datasetId,
                },
                ...rollbackOnFailure
            }).catch(e => {
                throw e;
            }).then();

            await queryInterface.dropSchema(
                tableName,
                rollbackOnFailure
            ).catch(e => {
                console.log(e)
                throw e;
            })
        }
    )
        .then(() => {
            return "Deletion Success"
        })
        .catch(() => {
            return "Deletion Failed"
        });
}


export interface Dataset {
    name: string;
    title: string;
}

export function generateRandomStr(length = 5) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, length);
}
