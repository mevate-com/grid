import express from 'express';

import {Sequelize} from 'sequelize-typescript';
import {createDataset, getDatasets} from "./functions/dataset-management.func";
import {DataSet} from "./models/dataSet";
import {DataField} from "./models/dataField";


export const sequelize = new Sequelize({
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_URL,
    port: 5432,
    dialect: 'postgres',
    models: [DataSet, DataField],
});

sequelize.authenticate().then(
    () => console.log('Connection has been established successfully.')
);

const app = express();
const PORT: string | number = process.env.PORT || 5000;
const router = express.Router();

app.use(router);
app.get('/datasets/', async (req, res) => {
    res.send(await getDatasets(sequelize));
});
app.get('/dataset/create', async (req, res) => {
    console.log(123)
    await createDataset(sequelize);
    console.log(123)
    res.send({});
});
app.get('/dataset/update', async (req, res) => {
    console.log(123)
    await createDataset(sequelize);
    console.log(123)
    res.send({});
});
app.get('/dataset/delete', async (req, res) => {
    console.log(123)
    await createDataset(sequelize);
    console.log(123)
    res.send({});
});


app.listen(PORT, () => console.log(`[Server] Starting on http://localhost:${PORT}`));
