import {Table, Column, Model, HasMany,} from 'sequelize-typescript';
import {DataField} from "./dataField";

@Table
export class DataSet extends Model {

    @Column
    name: string;

    @HasMany(() => DataField)
    dataFields: DataField[];

    @Column
    table_name: string;

    @Column
    title: string;

    @Column
    pluralTitle: string;

    @Column('JSON')
    settings: JSON;
}
