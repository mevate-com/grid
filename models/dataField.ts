import {BelongsTo, Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import {DataSet} from "./dataSet";

@Table
export class DataField extends Model {

    @ForeignKey(() => DataSet)
    @Column
    dataset_id: number;

    @BelongsTo(() => DataSet)
    dataSet: DataSet;

    @Column
    name: string;

    @Column
    type: string;

    @Column
    title: string;

    @Column
    system: boolean = false;

    @Column('JSON')
    settings: JSON;
}
