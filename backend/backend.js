"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const fs_1 = require("fs");
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const swagger_ui_express_1 = tslib_1.__importDefault(require("swagger-ui-express"));
const swagger_output_json_1 = tslib_1.__importDefault(require("../backend/swagger-output.json"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
// Swagger UI
const options = { swaggerOptions: { tryItOutEnabled: true } };
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_output_json_1.default, options));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.get("/api/ingatlan", async (req, res) => {
    // #swagger.tags = ['Ingatlan']
    // #swagger.summary = 'Az összes ingatlan lekérdezés'
    /* #swagger.responses[200] = {
            description: 'Sikeres lekérdezés',
            schema: [{
                id: 1,
                kategoriaId: 2,
                leiras: "Új építésű ház a Balaton partján",
                hirdetesDatuma: "2024-11-06T20:07:26.499Z",
                tehermentes: true,
                kepUrl: "https://example.com/kep.jpg",
                kategoriaNev: "Családi ház"
            }]
    } */
    /* #swagger.responses[404] = {
            description: 'Hiba az adatok olvasásakor',
            schema: { message: "Hiba az adatok olvasásakor!" }
    } */
    /* #swagger.responses[400] = {
            description: 'Hibás kérés',
            schema: { message: "Valamilyen hiba történt a kérés feldolgozása közben" }
    } */
    try {
        const ingatlanok = await readDataFromFile("ingatlan");
        const kategoriak = await readDataFromFile("kategoriak");
        if (ingatlanok && kategoriak) {
            const data = ingatlanok.map((ingatlan) => {
                const kategoria = kategoriak.find((kategoria) => kategoria.id === ingatlan.kategoriaId);
                return { ...ingatlan, kategoriaNev: kategoria.megnevezes };
            });
            res.send(data.sort((a, b) => a.id - b.id));
        }
        else {
            res.status(404).send({ message: "Hiba az adatok olvasásakor!" });
        }
    }
    catch (error) {
        res.status(400).send({ message: error.message });
    }
});
app.get("/api/kategoriak", async (req, res) => {
    // #swagger.tags = ['Kategóriák']
    // #swagger.summary = 'Ingatlan kategóriák lekérdezése'
    /* #swagger.responses[200] = {
            description: 'Sikeres lekérdezés',
            schema: [{ id: 1, megnevezes: "Családi ház" }]
    } */
    /* #swagger.responses[404] = {
            description: 'Hiba az adatok olvasásakor',
            schema: { message: "Hiba az adatok olvasásakor!" }
    } */
    /* #swagger.responses[400] = {
            description: 'Hibás kérés',
            schema: { message: "Valamilyen hiba történt a kérés feldolgozása közben" }
    } */
    try {
        const data = await readDataFromFile("kategoriak");
        if (data) {
            res.send(data.sort((a, b) => a.id - b.id));
        }
        else {
            res.status(404).send({ message: "Hiba az adatok olvasásakor!" });
        }
    }
    catch (error) {
        res.status(400).send({ message: error.message });
    }
});
app.post("/api/ujingatlan", async (req, res) => {
    // #swagger.tags = ['Ingatlan']
    // #swagger.summary = 'Új ingatlan hozzáadása'
    /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            kategoriaId: { type: "number" },
                            leiras: { type: "string" },
                            hirdetesDatuma: { type: "string" },
                            tehermentes: { type: "boolean" },
                            kepUrl: { type: "string" }
                        },
                        example: {
                            kategoriaId: 1,
                            leiras: "Új építésű ház eladó a Duna partján",
                            hirdetesDatuma: "2024-11-06T20:07:26.499Z",
                            tehermentes: true,
                            kepUrl: "https://nits68.github.io/static/ingatlan/ingatlan07.jpg"
                        }
                    }
                }
            }
        }
    */
    /* #swagger.responses[201] = {
        description: 'Új ingatlan sikeresen létrehozva',
        schema: {
            id: 10,
            kategoriaId: 1,
            leiras: "Új építésű ház eladó a Duna partján",
            hirdetesDatuma: "2024-11-06T20:07:26.499Z",
            tehermentes: true,
            kepUrl: "https://nits68.github.io/static/ingatlan/ingatlan07.jpg"
        }
    } */
    /* #swagger.responses[400] = {
        description: 'Hiányzó vagy érvénytelen mezők',
        schema: { message: "A kérés mezői nem megfelelők, vagy nem tartalmaznak értéket!" }
    } */
    /* #swagger.responses[409] = {
        description: 'Ütközés (pl. duplikált adat, hibás dátum vagy rövid leírás)',
        schema: { message: "Már létezik ilyen kép URL!" }
    } */
    /* #swagger.responses[500] = {
        description: 'Szerver hiba',
        schema: { message: "Belső szerverhiba történt" }
    } */
    try {
        const data = await readDataFromFile("ingatlan");
        if (data) {
            const newId = Math.max(...data.map(e => e.id)) + 1;
            const ujIngatlan = { id: newId, ...req.body };
            if (Object.keys(ujIngatlan).length != 6 || !ujIngatlan.kategoriaId || !ujIngatlan.leiras || !ujIngatlan.hirdetesDatuma || !ujIngatlan.tehermentes || !ujIngatlan.kepUrl) {
                const err = new Error("A kérés mezői nem megfelelők, vagy nem tartalmaznak értéket!");
                err.status = 400;
                throw err;
            }
            const currentDate = new Date().setHours(0, 0, 0, 0);
            const hirdetesDate = new Date(ujIngatlan.hirdetesDatuma).setHours(0, 0, 0, 0);
            if (hirdetesDate < currentDate) {
                const err = new Error("A hirdetés dátuma nem lehet korábbi az aktuális dátumnál!");
                err.status = 409;
                throw err;
            }
            if (ujIngatlan.leiras.length < 10) {
                const err = new Error("A leírás nem lehet 10 karakternél rövidebb.");
                err.status = 409;
                throw err;
            }
            if (data.find(item => item.kepUrl === ujIngatlan.kepUrl)) {
                const err = new Error("Már létezik ilyen kép URL!");
                err.status = 409;
                throw err;
            }
            if (data.find(item => item.leiras === ujIngatlan.leiras)) {
                const err = new Error("Már létezik ilyen leírás!");
                err.status = 409;
                throw err;
            }
            data.push(ujIngatlan);
            const response = await saveDataToFile("ingatlan", data);
            if (response == "OK") {
                res.status(201).send({ ...ujIngatlan });
            }
            else {
                res.status(400).send({ message: response });
            }
        }
    }
    catch (error) {
        res.status(error.status || 500).send({ message: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Jedlik Json-Backend-Server Swagger: http://localhost:${PORT}/docs`);
});
// Utility functions
async function readDataFromFile(table) {
    try {
        const data = await fs_1.promises.readFile(`db_${table}.json`, "utf8");
        return JSON.parse(data);
    }
    catch (error) {
        return [error.message];
    }
}
async function saveDataToFile(table, data) {
    try {
        await fs_1.promises.writeFile(`db_${table}.json`, JSON.stringify(data, null, 2), "utf8");
        return "OK";
    }
    catch (error) {
        return error.message;
    }
}
//# sourceMappingURL=backend.js.map