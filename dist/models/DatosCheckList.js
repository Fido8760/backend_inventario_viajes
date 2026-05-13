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
const ImagenesChecklist_1 = __importDefault(require("./ImagenesChecklist"));
let DatosCheckList = class DatosCheckList extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Asignacion_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        unique: true
    }),
    __metadata("design:type", Number)
], DatosCheckList.prototype, "asignacionId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Asignacion_1.default),
    __metadata("design:type", Asignacion_1.default)
], DatosCheckList.prototype, "asignacion", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: false }),
    __metadata("design:type", Object)
], DatosCheckList.prototype, "respuestas", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => ImagenesChecklist_1.default, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", Array)
], DatosCheckList.prototype, "imagenes", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], DatosCheckList.prototype, "completado", void 0);
DatosCheckList = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'checklist_data'
    })
], DatosCheckList);
exports.default = DatosCheckList;
//# sourceMappingURL=DatosCheckList.js.map