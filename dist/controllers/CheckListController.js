"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckListController = void 0;
const formidable_1 = __importDefault(require("formidable"));
const uuid_1 = require("uuid");
const DatosCheckList_1 = __importDefault(require("../models/DatosCheckList"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const ImagenesChecklist_1 = __importDefault(require("../models/ImagenesChecklist"));
class CheckListController {
    static create = async (req, res) => {
        try {
            const { checklist } = req.body;
            if (!checklist) {
                res.status(400).json({ error: "El checklist es requerido" });
                return;
            }
            const nuevoChecklist = await DatosCheckList_1.default.create({
                respuestas: checklist,
                asignacionId: req.asignacion.id,
            });
            res.status(201).json({
                message: 'Revisión Creada Correctamente',
                id: nuevoChecklist.id
            });
            return;
        }
        catch (error) {
            console.error("Error en ChecklistController:", error);
            res.status(500).json({ error: 'Hubo un error' });
            return;
        }
    };
    static uploadImage = async (req, res) => {
        const form = (0, formidable_1.default)({ multiples: false });
        const { checklistId } = req.params;
        try {
            const checklist = new DatosCheckList_1.default(req.body);
            checklist.asignacionId = req.asignacion.id;
            form.parse(req, (error, fields, files) => {
                if (!files.file || !files.file[0]) {
                    return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
                }
                const fieldId = fields.fieldId?.[0] || 'sin_nombre';
                cloudinary_1.default.uploader.upload(files.file[0].filepath, { public_id: `${fieldId}_${(0, uuid_1.v4)()}` }, async function (error, result) {
                    if (error) {
                        //console.log(error)
                        res.status(500).json({ error: 'Hubo un error al subir la imagen' });
                    }
                    if (result) {
                        const imagen = await ImagenesChecklist_1.default.create({
                            urlImagen: result.secure_url,
                            checklistId: checklistId
                        });
                        return res.status(201).json({
                            message: "Imagen subida con éxito",
                            imageUrl: result.secure_url
                        });
                    }
                });
            });
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static getById = async (req, res) => {
        res.json(req.checklist);
    };
    static updateById = async (req, res) => {
        const checklistAActualizar = req.checklist;
        const nuevosDatos = req.body.checklist;
        if (!nuevosDatos) {
            res.status(400).json({ error: "Faltan los datos del 'checklist' en el body." });
            return;
        }
        await checklistAActualizar.update({
            respuestas: nuevosDatos
        });
        res.json('Se actualizó correctamente');
    };
    static deleteById = async (req, res) => {
        await req.checklist.destroy();
        res.json('Checklist Eliminado');
    };
    static finalizarChecklist = async (req, res) => {
        const checklist = req.checklist;
        try {
            const imagenes = await ImagenesChecklist_1.default.count({
                where: { checklistId: checklist.id }
            });
            const MIN_IMAGES = 8;
            if (imagenes < MIN_IMAGES) {
                res.status(400).json({ error: `Se requieren al menos ${MIN_IMAGES} para finalizar el checklist` });
                return;
            }
            checklist.completado = true;
            await checklist.save();
            res.json({ message: 'Checklist Finalizado Correctamente' });
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Error al finalizar el checklist' });
        }
    };
}
exports.CheckListController = CheckListController;
//# sourceMappingURL=CheckListController.js.map