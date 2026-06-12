import { Request, Response } from 'express';
import formidable from 'formidable';
import { v4 as uuid } from "uuid";
import fs from "fs/promises";
import { Op, where } from 'sequelize';
import InspeccionPatio, { InspeccionStatus, TipoInspeccion } from '../models/InspeccionPatio';
import Unidad from '../models/Unidad';
import Caja from '../models/Caja';
import UsuariosChecklist from '../models/UsuariosChecklist';
import ImagenesInspeccion from '../models/ImagenesInspeccion';
import RespuestaInspeccion from '../models/RespuestasInspeccion';
import Pregunta from '../models/PreguntasChecklist';
import cloudinary from '../config/cloudinary';
import sharp from 'sharp';
import { getAplicaAPorTipoInspeccion } from '../helpers/getAplicaA';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';

export class InspeccionController {

    static getAll = async (req: Request, res: Response) => {

        

        try {
            const take = req.query.take ? parseInt(req.query.take as string) : 10;
            const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
            const tipo = req.query.tipo as string | undefined;
            const search = req.query.search as string | undefined;
            const fecha = req.query.fecha as string | undefined;

            const where: any = {};
            if (tipo && Object.values(TipoInspeccion).includes(tipo as TipoInspeccion)) {
                where.tipo = tipo;
            }

            if(fecha) {
                const date = parseISO(fecha);
                if(!isValid(date)) {
                    res.status(400).json({ error: 'Fecha no válida'});
                    return;
                }

                where.createdAt = {
                    [Op.between]: [startOfDay(date), endOfDay(date)]
                }
            }

            const searchTerm = search?.trim().replace(/[%_]/g, '\\$&');

            const unidadWhere: any = {};
            const cajaWhere: any   = {};



            if (searchTerm) {
                unidadWhere[Op.or] = [
                    { no_unidad: { [Op.like]: `%${searchTerm}%` } },
                    { u_placas:  { [Op.like]: `%${searchTerm}%` } },
                    { tipo_unidad: { [Op.like]: `%${searchTerm}%` } },
                ];
                cajaWhere[Op.or] = [
                    { numero_caja: { [Op.like]: `%${searchTerm}%` } },
                    { c_placas:    { [Op.like]: `%${searchTerm}%` } },
                ];
            }

            const { count, rows } = await InspeccionPatio.findAndCountAll({
                where,
                limit: take,
                offset: skip,
                order: [['createdAt', 'DESC']],
                distinct: true,
                col: 'id',
                include: [
                    {
                        model: Unidad,
                        attributes: ['id', 'no_unidad', 'tipo_unidad', 'u_placas'],
                        where: searchTerm && (!tipo || tipo === TipoInspeccion.UNIDAD) ? unidadWhere : undefined,
                        required: searchTerm && (!tipo || tipo === TipoInspeccion.UNIDAD) ? true : false,
                    },
                    {
                        model: Caja,
                        attributes: ['id', 'numero_caja', 'c_placas', 'c_marca'],
                        where: searchTerm && tipo === TipoInspeccion.REMOLQUE ? cajaWhere : undefined,
                        required: searchTerm && tipo === TipoInspeccion.REMOLQUE ? true : false,
                    },
                    { model: UsuariosChecklist, attributes: ['id', 'name', 'lastname'] },
                    { model: ImagenesInspeccion, attributes: ['id', 'fieldId'] },
                ],
                subQuery: false,
            });

            res.json({ count, rows });

        } catch (error) {
            console.error('[InspeccionController.getAll]', error);
            res.status(500).json({ error: 'Error al obtener inspecciones' });
        }
    }

    static getById = async (req: Request, res: Response) => {
        try {
            const inspeccion = await req.inspeccion!.reload({
                include: [
                    { model: Unidad, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                    { model: Caja, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                    { model: UsuariosChecklist, attributes: ['id', 'name', 'lastname', 'rol'] },
                    { model: ImagenesInspeccion },
                    { model: RespuestaInspeccion, include: [Pregunta] }
                ]
            });

            res.json(inspeccion);

        } catch (error) {
            console.error('[InspeccionController.getById]', error);
            res.status(500).json({ error: 'Error al obtener inspección' });
        }
    }

    static getTemplate = async (req: Request, res: Response) => {
        try {
            const { tipo } = req.inspeccion!;
            const aplica_a = getAplicaAPorTipoInspeccion(tipo);  // ← usa el helper

            const preguntas = await Pregunta.findAll({
                where: { aplica_a },
                order: [['orden', 'ASC']]
            });

            const secciones = preguntas.reduce((acc, p) => {
                if (!acc[p.seccion]) acc[p.seccion] = [];
                acc[p.seccion].push(p);
                return acc;
            }, {} as Record<string, Pregunta[]>);

            res.json({ secciones });

        } catch (error) {
            console.error('[InspeccionController.getTemplate]', error);
            res.status(500).json({ error: 'Error al obtener template' });
        }
    }

    static create = async (req: Request, res: Response) => {
        try {
            const { tipo, unidadId, cajaId } = req.body;

            const inspeccion = await InspeccionPatio.create({
                tipo,
                unidadId: tipo === TipoInspeccion.UNIDAD ? +unidadId : null,
                cajaId: tipo === TipoInspeccion.REMOLQUE ? +cajaId : null,
                userId: req.authenticatedUser.id,
                status: InspeccionStatus.EN_PROGRESO
            });

            res.status(201).json({ message: 'Inspección creada', id: inspeccion.id });

        } catch (error) {
            console.error('[InspeccionController.create]', error);
            res.status(500).json({ error: 'Error al crear inspección' });
        }
    }

    static updateRespuestas = async (req: Request, res: Response) => {
        try {
            const { inspeccionId } = req.params;
            const { respuestas } = req.body;

            await RespuestaInspeccion.bulkCreate(
                respuestas.map((r: any) => ({
                    inspeccionId: +inspeccionId,
                    preguntaId: r.preguntaId,
                    valor: String(r.valor ?? '')
                })),
                { updateOnDuplicate: ['valor'] }
            );

            res.json({ message: 'Respuestas guardadas correctamente' });

        } catch (error) {
            console.error('[InspeccionController.updateRespuestas]', error);
            res.status(500).json({ error: 'Error al guardar respuestas' });
        }
    }

    static finalizarChecklist = async (req: Request, res: Response) => {
        try {
            const inspeccion = req.inspeccion!;
            const aplica_a = getAplicaAPorTipoInspeccion(inspeccion.tipo);

            const obligatorias = await Pregunta.findAll({
                where: { aplica_a, obligatorio: true },
                attributes: ['id', 'texto', 'seccion'],
                raw: true
            });

            const contestadas = new Set(inspeccion.respuestas.map(r => r.preguntaId));
            const faltantes = obligatorias.filter(p => !contestadas.has(p.id));

            if (faltantes.length > 0) {
                res.status(400).json({
                    error: `Faltan ${faltantes.length} preguntas obligatorias`,
                    faltantes
                });
                return;
            }

            await inspeccion.update({ status: InspeccionStatus.FOTOS_PENDIENTES });
            res.json({ message: 'Checklist finalizado, ahora sube las fotos' });

        } catch (error) {
            console.error('[InspeccionController.finalizarChecklist]', error);
            res.status(500).json({ error: 'Error al finalizar checklist' });
        }
    }

    static uploadImage = async (req: Request, res: Response) => {
        const form = formidable({ multiples: false });
        const inspeccion = req.inspeccion!;

        form.parse(req, async (error, fields, files) => {
            if (error) {
                res.status(500).json({ error: 'Error al procesar el formulario' });
                return;
            }

            if (!files.file || !files.file[0]) {
                res.status(400).json({ error: 'No se ha subido ninguna imagen' });
                return;
            }

            try {
                // Cargar relaciones necesarias para el folder de cloudinary
                await inspeccion.reload({
                    include: [
                        { model: Unidad, attributes: ['no_unidad'] },
                        { model: Caja, attributes: ['numero_caja'] }
                    ]
                });

                const file = files.file[0];
                const fieldId = fields.fieldId?.[0] || 'sin_nombre';
                const fecha = new Date().toISOString().split('T')[0];
                const identifier = inspeccion.tipo === TipoInspeccion.UNIDAD
                    ? `unidad_${inspeccion.unidad?.no_unidad ?? inspeccion.id}`
                    : `remolque_${inspeccion.caja?.numero_caja ?? inspeccion.id}`;

                const tempWebpPath = `${file.filepath}_converted.webp`;

                const imagenExistente = inspeccion.imagenes.find(i => i.fieldId === fieldId);

                if (imagenExistente?.publicId) {
                    await cloudinary.uploader.destroy(imagenExistente.publicId);
                }

                await sharp(file.filepath).webp({ quality: 85 }).toFile(tempWebpPath);

                const result = await cloudinary.uploader.upload(tempWebpPath, {
                    public_id: `${fieldId}_${uuid()}`,
                    resource_type: 'image',
                    folder: `inspecciones_patio/${identifier}/${fecha}`
                });

                await Promise.all([
                    fs.unlink(file.filepath).catch(() => {}),
                    fs.unlink(tempWebpPath).catch(() => {})
                ]);

                if (imagenExistente) {
                    await imagenExistente.update({
                        urlImagen: result.secure_url,
                        publicId: result.public_id
                    });
                } else {
                    await ImagenesInspeccion.create({
                        inspeccionId: inspeccion.id,
                        urlImagen: result.secure_url,
                        publicId: result.public_id,
                        fieldId
                    });
                }

                res.status(201).json({ message: 'Imagen subida con éxito', imageUrl: result.secure_url });

            } catch (error) {
                console.error('[InspeccionController.uploadImage]', error);
                res.status(500).json({ error: 'Error al subir la imagen' });
            }
        });
    }

    static finalizarFotos = async (req: Request, res: Response) => {
        const FOTOS_OBLIGATORIAS_UNIDAD = [
            'frontal', 'lateral_derecho', 'lateral_izquierdo',
            'trasera', 'interior_cabina', 'documentacion', 'odometro', 'motor'
        ]

        const FOTOS_OBLIGATORIAS_REMOLQUE = [
            'frontal', 'trasera', 'lateral_derecho', 'lateral_izquierdo'
        ]
        try {
            const inspeccion = req.inspeccion!;
            const fotosObligatorias = inspeccion.tipo === TipoInspeccion.REMOLQUE
                ? FOTOS_OBLIGATORIAS_REMOLQUE
                : FOTOS_OBLIGATORIAS_UNIDAD;

            const fieldsSubidos = inspeccion.imagenes.map(i => i.fieldId);
            const faltantes = fotosObligatorias.filter(f => !fieldsSubidos.includes(f));

            if (faltantes.length > 0) {
                res.status(400).json({ error: 'Faltan fotos obligatorias', faltantes });
                return;
            }

            await inspeccion.update({ status: InspeccionStatus.COMPLETA });
            res.json({ message: 'Inspección completada correctamente' });

        } catch (error) {
            console.error('[InspeccionController.finalizarFotos]', error);
            res.status(500).json({ error: 'Error al finalizar fotos' });
        }
    }

    static deleteById = async (req: Request, res: Response) => {
        try {
            const inspeccion = req.inspeccion!;

            await Promise.all(
                inspeccion.imagenes
                    .filter(img => img.publicId)
                    .map(img => cloudinary.uploader.destroy(img.publicId!))
            );

            await inspeccion.destroy();
            res.json({ message: 'Inspección eliminada correctamente' });

        } catch (error) {
            console.error('[InspeccionController.deleteById]', error);
            res.status(500).json({ error: 'Error al eliminar inspección' });
        }
    }

    static getKpis = async (req: Request, res: Response) => {
        try {
            const [total, enProgreso, fotosPendientes, completas] = await Promise.all([
                InspeccionPatio.count(),
                InspeccionPatio.count({ where: { status: InspeccionStatus.EN_PROGRESO } }),
                InspeccionPatio.count({ where: { status: InspeccionStatus.FOTOS_PENDIENTES } }),
                InspeccionPatio.count({ where: { status: InspeccionStatus.COMPLETA } }),
            ]);

            const porTipo = await Promise.all(
                Object.values(TipoInspeccion).map(async tipo => ({
                    tipo,
                    total: await InspeccionPatio.count({ where: { tipo } }),
                    completas: await InspeccionPatio.count({ where: { tipo, status: InspeccionStatus.COMPLETA } })
                }))
            );

            res.json({ total, enProgreso, fotosPendientes, completas, porTipo });

        } catch (error) {
            console.error('[InspeccionController.getKpis]', error);
            res.status(500).json({ error: 'Error al obtener KPIs' });
        }
    }
}