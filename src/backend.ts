import express, { Request, Response } from "express";
import cors from "cors";
import { promises as fs } from "fs";
import morgan from "morgan";
import swaggerUi, { SwaggerUiOptions } from "swagger-ui-express";
import swaggerDocument from "../backend/swagger-output.json";

const app = express();
const PORT = 3000;

app.use(express.json());

// Swagger UI
const options: SwaggerUiOptions = { swaggerOptions: { tryItOutEnabled: true } };
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

app.use(cors());
app.use(morgan("dev"));

app.get("/api/ingatlan", async (req: Request, res: Response) => {
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
            const data = ingatlanok.map((ingatlan: any) => {
                const kategoria = kategoriak.find((kategoria: any) => kategoria.id === ingatlan.kategoriaId);
                return { ...ingatlan, kategoriaNev: kategoria.megnevezes };
            });
            res.send(data.sort((a: any, b: any) => a.id - b.id));
        } else {
            res.status(404).send({ message: "Hiba az adatok olvasásakor!" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

app.get("/api/kategoriak", async (req: Request, res: Response) => {
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
            res.send(data.sort((a: any, b: any) => a.id - b.id));
        } else {
            res.status(404).send({ message: "Hiba az adatok olvasásakor!" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

app.post("/api/ujingatlan", async (req: Request, res: Response) => {
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
            const newId: number = Math.max(...data.map(e => e.id)) + 1;
            const ujIngatlan: any = { id: newId, ...req.body };
            if (Object.keys(ujIngatlan).length != 6 || !ujIngatlan.kategoriaId || !ujIngatlan.leiras || !ujIngatlan.hirdetesDatuma || !ujIngatlan.kepUrl || typeof ujIngatlan.tehermentes !== "boolean") {
                const err: Error = new Error("A kérés mezői nem megfelelők, vagy nem tartalmaznak értéket!");
                (err as any).status = 400;
                throw err;
            }

            const currentDate = new Date().setHours(0, 0, 0, 0);
            const hirdetesDate = new Date(ujIngatlan.hirdetesDatuma).setHours(0, 0, 0, 0);
            if (hirdetesDate < currentDate) {
                const err: Error = new Error("A hirdetés dátuma nem lehet korábbi az aktuális dátumnál!");
                (err as any).status = 409;
                throw err;
            }

            if (ujIngatlan.leiras.length < 10) {
                const err: Error = new Error("A leírás nem lehet 10 karakternél rövidebb.");
                (err as any).status = 409;
                throw err;
            }

            if (data.find(item => item.kepUrl === ujIngatlan.kepUrl)) {
                const err: Error = new Error("Már létezik ilyen kép URL!");
                (err as any).status = 409;
                throw err;
            }

            if (data.find(item => item.leiras === ujIngatlan.leiras)) {
                const err: Error = new Error("Már létezik ilyen leírás!");
                (err as any).status = 409;
                throw err;
            }

            data.push(ujIngatlan);
            const response = await saveDataToFile("ingatlan", data);
            if (response == "OK") {
                res.status(201).send({ ...ujIngatlan });
            } else {
                res.status(400).send({ message: response });
            }
        }
    } catch (error) {
        res.status((error as any).status || 500).send({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Jedlik Json-Backend-Server Swagger: http://localhost:${PORT}/docs`);
});

// Utility functions
async function readDataFromFile(table: string): Promise<any[]> {
    try {
        const data = await fs.readFile(`db_${table}.json`, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [error.message];
    }
}

async function saveDataToFile(table: string, data: any[]): Promise<string> {
    try {
        await fs.writeFile(`db_${table}.json`, JSON.stringify(data, null, 2), "utf8");
        return "OK";
    } catch (error) {
        return error.message;
    }
}
