import express, { Request, Response } from "express";
import cors from "cors";
import { promises as fs } from "fs";
import morgan from "morgan";
import swaggerUi, { SwaggerUiOptions } from "swagger-ui-express";
import swaggerDocument from "../backend/swagger-output.json";

const app = express();
const PORT = 3000;

// Middleware to parse request body
app.use(express.json());

// Add Swagger UI to the app
const options: SwaggerUiOptions = { swaggerOptions: { tryItOutEnabled: true } };
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

// Enabled CORS (Cross-Origin Resource Sharing):
app.use(cors());

// Logger middleware: log all requests to the console
app.use(morgan("dev"));

app.get("/api/ingatlan", async (req: Request, res: Response) => {
    // #swagger.tags = ['Ingatlan']
    // #swagger.summary = 'Az összes ingatlan lekérdezés'
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
    try {
        const data = await readDataFromFile("ingatlan");
        if (data) {
            const newId: number = Math.max(...data.map(e => e.id)) + 1;
            const ujIngatlan: any = { id: newId, ...req.body };
            if (Object.keys(ujIngatlan).length != 6 || !ujIngatlan.kategoriaId || !ujIngatlan.leiras || !ujIngatlan.hirdetesDatuma || !ujIngatlan.tehermentes || !ujIngatlan.kepUrl) {
                throw new Error("A kérés mezői nem megfelelők, vagy nem tartalmaznak értéket");
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
        res.status(400).send({ message: error.message });
    }
});
// Read operation
// app.get("/read/:id", (req: Request, res: Response) => {
//     const data = readDataFromFile();
//     const item = data.find(item => item.id === parseInt(req.params.id));
//     if (item) {
//         res.send(item);
//     } else {
//         res.status(404).send("Item not found.");
//     }
// });

// Update operation
// app.put("/update/:id", (req: Request, res: Response) => {
//     const data = readDataFromFile();
//     const index = data.findIndex(item => item.id === parseInt(req.params.id));
//     if (index !== -1) {
//         data[index] = req.body;
//         saveDataToFile(data);
//         res.send("Item updated successfully.");
//     } else {
//         res.status(404).send("Item not found.");
//     }
// });

// Delete operation
// app.delete("/delete/:id", (req: Request, res: Response) => {
//     const data = readDataFromFile();
//     const index = data.findIndex(item => item.id === parseInt(req.params.id));
//     if (index !== -1) {
//         data.splice(index, 1);
//         saveDataToFile(data);
//         res.send("Item deleted successfully.");
//     } else {
//         res.status(404).send("Item not found.");
//     }
// });

app.listen(PORT, () => {
    console.log(`Jedlik Json-Backend-Server Swagger: http://localhost:${PORT}/docs`);
});

// Utility functions to read/write data from/to file
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
