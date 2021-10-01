import {Table, Column, Model, HasMany,} from 'sequelize-typescript';
import {DataField} from "./dataField";

@Table
export class DataSet extends Model {

    @Column
    name: string;

    @HasMany(() => DataField)
    users: DataField[];
}
