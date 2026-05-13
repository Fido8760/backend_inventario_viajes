"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const Asignacion_1 = __importDefault(require("./Asignacion"));
const Poliza_1 = __importDefault(require("./Poliza"));
const TarjetaCirculacion_1 = __importDefault(require("./TarjetaCirculacion"));
const VeriAmbiental_1 = __importDefault(require("./VeriAmbiental"));
const VeriFisico_1 = __importDefault(require("./VeriFisico"));
let Unidad = class Unidad extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100)
    }),
    __metadata("design:type", String)
], Unidad.prototype, "no_unidad", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100)
    }),
    __metadata("design:type", String)
], Unidad.prototype, "tipo_unidad", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100)
    }),
    __metadata("design:type", String)
], Unidad.prototype, "u_placas", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Asignacion_1.default, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", Array)
], Unidad.prototype, "asignaciones", void 0);
__decorate([
    (0, sequelize_typescript_1.HasOne)(() => Poliza_1.default),
    __metadata("design:type", Poliza_1.default)
], Unidad.prototype, "poliza", void 0);
__decorate([
    (0, sequelize_typescript_1.HasOne)(() => TarjetaCirculacion_1.default),
    __metadata("design:type", TarjetaCirculacion_1.default)
], Unidad.prototype, "tarjetaCirc", void 0);
__decorate([
    (0, sequelize_typescript_1.HasOne)(() => VeriAmbiental_1.default),
    __metadata("design:type", VeriAmbiental_1.default)
], Unidad.prototype, "veriAmbiental", void 0);
__decorate([
    (0, sequelize_typescript_1.HasOne)(() => VeriFisico_1.default),
    __metadata("design:type", VeriFisico_1.default)
], Unidad.prototype, "veriFidico", void 0);
Unidad = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'unidades',
        timestamps: false
    })
], Unidad);
exports.default = Unidad;
//# sourceMappingURL=Unidad.js.map