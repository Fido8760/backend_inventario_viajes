"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_2 = require("./config/cors");
const colors_1 = __importDefault(require("colors"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = require("./config/db");
const asignacionRouter_1 = __importDefault(require("./routes/asignacionRouter"));
const authRouter_1 = __importDefault(require("./routes/authRouter"));
async function connectDB() {
    try {
        await db_1.db.authenticate();
        db_1.db.sync();
        console.log(colors_1.default.blue.bold('Conexión exitosa a BD'));
    }
    catch (error) {
        console.log(error);
        console.log(colors_1.default.red.bold('Falló la Conexión a la BD'));
    }
}
connectDB();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, cors_1.default)(cors_2.corsConfig));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use('/api/v1/assignments', asignacionRouter_1.default);
app.use('/api/v1/auth', authRouter_1.default);
exports.default = app;
//# sourceMappingURL=server.js.map