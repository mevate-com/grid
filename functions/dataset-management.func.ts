import {Sequelize} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {DataSet} from "../models/dataSet";

export async function getDatasets(sq: Sequelize) {
    return await DataSet.findAll();
}

export async function createDataset(sq: Sequelize) {
    const database = await sq.define('zz_abc', {
        // Model attributes are defined here
        firstName: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    }, {

    });
    await database.sync()


}

export function updateDataset() {

}

export function deleteDataset() {

}

export interface Dataset {
    name: string;
    title: string;
}
