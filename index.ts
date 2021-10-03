import express from 'express';

import {Sequelize} from 'sequelize-typescript';
import {
    createDataset,
    deleteDataset,
    getDatasets,
    getSingleDataset,
    updateDataset
} from "./functions/dataset-management.func";
import {DataSet} from "./models/dataSet";
import {DataField} from "./models/dataField";
import bodyParser from 'body-parser';

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
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(router);
app.get('/datasets/', async (req, res) => {
    res.send(await getDatasets(sequelize));
});

app.get('/dataset/:id', async (req, res) => {
    res.send(await getSingleDataset(req, sequelize));
});
app.post('/dataset/', async (req, res) => {
    res.send(await createDataset(req, sequelize));
});
app.put('/dataset/:id', async (req, res) => {
    res.send(await updateDataset(req, sequelize));
});
app.delete('/dataset/:id', async (req, res) => {
    res.send(await deleteDataset(req, sequelize));
});


app.listen(PORT, () => console.log(`[Server] Starting on http://localhost:${PORT}`));
