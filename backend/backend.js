"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const fs_1 = require("fs");
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const app = (0, express_1.default)();
const PORT = 3000;
// Middleware to parse request body
app.use(express_1.default.json());
// Enabled CORS (Cross-Origin Resource Sharing):
app.use((0, cors_1.default)());
// Logger middleware: log all requests to the console
app.use((0, morgan_1.default)("dev"));
app.get("/api/ingatlan", async (req, res) => {
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
        res.status(404).send({ message: "Error while reading data." });
    }
});
app.get("/api/kategoriak", async (req, res) => {
    try {
        const data = await readDataFromFile("kategoriak");
        if (data) {
            res.send(data.sort((a, b) => a.id - b.id));
        }
        else {
            res.status(404).send({ message: "Error while reading data." });
        }
    }
    catch (error) {
        res.status(400).send({ message: error.message });
    }
});
app.post("/api/ujingatlan", async (req, res) => {
    try {
        const data = await readDataFromFile("ingatlan");
        if (data) {
            const id = data.length + 1;
            const ujIngatlan = { id: id, ...req.body };
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
    console.log(`Jedlik Json-Backend-Server listening on port ${PORT}`);
});
// Utility functions to read/write data from/to file
async function readDataFromFile(table) {
    try {
        const data = await fs_1.promises.readFile(`db_${table}.json`, "utf8");
        return JSON.parse(data);
    }
    catch (error) {
        console.error(error);
        return [];
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