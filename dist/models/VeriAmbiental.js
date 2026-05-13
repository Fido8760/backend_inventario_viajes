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
const Unidad_1 = __importDefault(require("./Unidad"));
let VeriAmbiental = class VeriAmbiental extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100)
    }),
    __metadata("design:type", String)
], VeriAmbiental.prototype, "folio_amb", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE
    }),
    __metadata("design:type", String)
], VeriAmbiental.prototype, "fecha_semestre_actual", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Unidad_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100)
    }),
    __metadata("design:type", String)
], VeriAmbiental.prototype, "id_unidad", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Unidad_1.default),
    __metadata("design:type", Unidad_1.default)
], VeriAmbiental.prototype, "unidad", void 0);
VeriAmbiental = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'verificacion_ambiental'
    })
], VeriAmbiental);
exports.default = VeriAmbiental;
//# sourceMappingURL=VeriAmbiental.js.map