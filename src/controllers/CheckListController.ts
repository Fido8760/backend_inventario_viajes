import { Request, Response } from "express"
import formidable from 'formidable'
import { v4 as uuid} from 'uuid'
import DatosCheckList, { ChecklistStatus } from "../models/DatosCheckList"
import cloudinary from '../config/cloudinary'
import ImagenesChecklist from "../models/ImagenesChecklist"
import sharp from "sharp"
import fs from 'fs/promises'
import { RecorridoStatus } from "../types/estados-asignacion"
import Respuesta from "../models/RespuestasChecklist"
import Pregunta from "../models/PreguntasChecklist"
import { getAplicaAPorCaja } from "../helpers/getAplicaA"

export class CheckListController {

    static getTemplate = async(req: Request, res: Response) => {
        try {

            const aplica_a = getAplicaAPorCaja(req.recorrido.cajaId)

            const preguntas = await Pregunta.findAll({
                where: { aplica_a },
                order: [['orden', 'ASC']]
            });

            const secciones = preguntas.reduce((acc, p) => {
                if(!acc[p.seccion]) acc[p.seccion] = [];
                acc[p.seccion].push(p);
                return acc;
            }, {} as Record<string, Pregunta[]>);

            res.json({ secciones })
        } catch (error) {
            res.status(500).json({ error: 'No se pudo cargar la plantilla'})
        }
    }

    static create = async (req: Request, res: Response) => {
        try {
            const nuevoChecklist = await DatosCheckList.create({
                recorridoId: req.recorrido.id,
                status: ChecklistStatus.EN_PROGRESO
            });

            await req.recorrido.update({ status: RecorridoStatus.CHECKLIST_PENDIENTE });

            res.status(201).json({
                message: 'Checklist Iniciado',
                id: nuevoChecklist.id
            })
        } catch (error) {
            console.error("Error en ChecklistController:", error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    
    static uploadImage = async (req: Request, res: Response) => {
        const form = formidable({multiples: false});
        const checklistId = +req.params.checklistId;
        const recorrido = req.recorrido;

        form.parse(req, async(error, fields, files) => {
            if(error) {
                res.status(500).json({ error: 'Error al procesar el formulario '})
                return
            }

            if(!files.file || !files.file[0]) {
                res.status(400).json({ error: 'No se ha subido ninguna imagen' })
                return
            }

            try {
                const file = files.file[0]
                const fieldId = fields.fieldId?.[0] || 'sin_nombre'

                const esFotoEntrada = fieldId.startsWith('entrada_')
                const enRuta = recorrido.status === RecorridoStatus.EN_RUTA

                 if (enRuta !== esFotoEntrada) {
                    await fs.unlink(file.filepath).catch(() => {})
                    res.status(400).json({
                        error: enRuta
                            ? 'Con la unidad en ruta solo se pueden subir fotos de entrada'
                            : 'Las fotos de entrada solo se pueden subir con la unidad en ruta'
                    })
                    return
                }
                const tempWebpPath = `${file.filepath}_converted.webp`
                const fecha = new Date().toISOString().split('T')[0];
                const noUnidad = recorrido.unidad?.no_unidad ?? `unidadId_${recorrido.unidadId}`;

                const imagenExistente = await ImagenesChecklist.findOne({
                    where: { checklistId, fieldId }
                });

                if (imagenExistente !== null && imagenExistente !== undefined && imagenExistente.publicId) {
                    await cloudinary.uploader.destroy(imagenExistente.publicId)
                }

                await sharp(file.filepath).webp({ quality: 85 }).toFile(tempWebpPath)

                const result = await cloudinary.uploader.upload(tempWebpPath, {
                    public_id: `${fieldId}_${uuid()}`,
                    resource_type: 'image',
                    folder: `checklist/${noUnidad}/${fecha}`
                })

                await Promise.all([
                    fs.unlink(file.filepath).catch(() => {}),
                    fs.unlink(tempWebpPath).catch(() => {})
                ])

                if (imagenExistente !== null && imagenExistente !== undefined) {
                    await imagenExistente.update({
                        urlImagen: result.secure_url,
                        publicId:  result.public_id,
                    })
                } else {
                    await ImagenesChecklist.create({
                        urlImagen: result.secure_url,
                        publicId:  result.public_id,
                        checklistId,
                        fieldId
                    })
                }

                res.status(201).json({
                    message: 'Imagen subida con exito',
                    imageUrl: result.secure_url
                })
                
            } catch (error) {
                console.log('Error al subir imagen:', error )
                res.status(500).json({ error: 'Hubo un error al subir la imagen '})
            }
        })
    }

    static getById = async (req: Request, res: Response) => {
        try {
            const checklist = req.checklist;

            const aplica_a = getAplicaAPorCaja(req.asignacion.cajaId);

            // Preguntas que aplican a esta unidad
            const preguntas = await Pregunta.findAll({
                where: { aplica_a },
                order: [['orden', 'ASC']]
            });

            // Respuestas ya guardadas
            const respuestas = await Respuesta.findAll({
                where: { checklistId: checklist.id },
                raw: true
            });

            // Mapa de respuestas para acceso rápido
            const mapaRespuestas = new Map(respuestas.map(r => [r.preguntaId, r.valor]));

            // Agrupar por sección y combinar con respuestas
            const secciones = preguntas.reduce((acc, p) => {
                if (!acc[p.seccion]) acc[p.seccion] = [];
                acc[p.seccion].push({
                    preguntaId:  p.id,
                    texto:       p.texto,
                    tipo:        p.tipo,
                    obligatorio: p.obligatorio,
                    aplica_a:    p.aplica_a,
                    valor:       mapaRespuestas.get(p.id) ?? null  // null si no tiene respuesta aún
                });
                return acc;
            }, {} as Record<string, any[]>);

            res.json({
                id:         checklist.id,
                status:     checklist.status,
                secciones,
            });

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updateById = async (req: Request, res: Response) => {
        try {
            const { respuestas } = req.body;

            await Respuesta.bulkCreate(
                respuestas.map((r: any) => ({
                    checklistId: req.checklist.id,
                    preguntaId: r.preguntaId,
                    valor: String(r.valor ?? '')
                })),
                { updateOnDuplicate: ['valor'] }
            );

            res.json({ message: 'Progreso guardado correctamente' });

        } catch (error) {
            console.error("Error en updateById:", error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static deleteById = async (req: Request, res: Response) => {
        try {
            const checklist = req.checklist;

            // 1. Eliminar imágenes en Cloudinary
            const imagenes = await ImagenesChecklist.findAll({
                where: { checklistId: checklist.id }
            })

            await Promise.all(
                imagenes
                    .filter(img => img.publicId !== null && img.publicId !== undefined)
                    .map(img => cloudinary.uploader.destroy(img.publicId))
            )

            // 2. Regresar la asignación a CREADA
            await req.recorrido.update({ status: RecorridoStatus.CREADA })

            // 3. Eliminar checklist (CASCADE elimina imágenes e BD automáticamente)
            await checklist.destroy()

            res.json({ message: 'Checklist eliminado, recorrido regresada a CREADA' })

        } catch (error) {
            console.error('Error al eliminar checklist:', error)
            res.status(500).json({ error: 'Hubo un error al eliminar el checklist' })
        }
    }

    static finalizarChecklist = async (req: Request, res: Response,) => {
        const checklist = req.checklist;
        const aplica_a = getAplicaAPorCaja(req.recorrido.cajaId);

        try {
            const obligatorias = await Pregunta.findAll({
                where:  { aplica_a, obligatorio: true },
                raw: true
            });

            const respuestas = await Respuesta.findAll({
                where: { checklistId: checklist.id },
                raw: true
            });

            const contestadas = new Set(respuestas.map( r => r.preguntaId));
            const faltantes = obligatorias
                .filter(p => !contestadas.has(p.id))
                .map(p => ({ id: p.id, texto: p.texto, seccion: p.seccion }));
            
            if(faltantes.length > 0) {
                res.status(400).json({
                    error: `Faltan ${faltantes.length} preguntas obligatorias`,
                    faltantes
                })
                return;
            }

            await checklist.update({ status: ChecklistStatus.COMPLETO });
            await req.recorrido.update({ status: RecorridoStatus.FOTOS_PENDIENTES });

            res.json({ message: 'Checklist finalizado, ahora sube las fotos' })
        } catch (error) {
            res.status(500).json({ error: 'Error al finalizar el checklist' });
        }
    }

    static finalizarFotos = async (req: Request, res: Response) => {
        const checklist = req.checklist;

        const FOTOS_OBLIGATORIAS = [
            'frontal',
            'lateral_derecho',
            'lateral_izquierdo',
            'trasera',
            'interior_cabina',
            'documentacion',
            'odometro',
            'firma'
        ]

        try {
            const imagenes = await ImagenesChecklist.findAll({
                where: { checklistId: checklist.id },
                attributes: ['fieldId']
            })

            const fieldsSubidos = imagenes.map(img => img.fieldId)
            const faltantes = FOTOS_OBLIGATORIAS.filter(f => !fieldsSubidos.includes(f))

            if (faltantes.length > 0) {
                res.status(400).json({ error: 'Faltan fotos obligatorias o firma', faltantes })
                return
            }

            const nuevoStatus = Boolean(req.recorrido.saleAViaje)
                ? RecorridoStatus.EN_RUTA  
                : RecorridoStatus.COMPLETA;


            await req.recorrido.update({ status: nuevoStatus });

            res.json({ 
                message: Boolean(req.recorrido.saleAViaje)
                    ? 'Fotos finalizadas con éxito. Unidad puesta EN RUTA.'
                    : 'Entrega finalizada con éxito. Unidad disponible en PATIO.',
                status: nuevoStatus
            });

        } catch (error) {
            res.status(500).json({ error: 'Error al finalizar el checklist' })
        }
    }

    static registrarEntrada = async (req: Request, res: Response) => {
        const checklist = req.checklist;
        const { observaciones, cierreSinFotos, motivoOmision } = req.body;
        const usuario = req.authenticatedUser;

        const FOTOS_ENTRADA_OBLIGATORIAS = [
            'entrada_frontal',
            'entrada_trasera',
            'entrada_izquierdo',
            'entrada_derecho',
        ];

        try {
            if (!cierreSinFotos) {
                const imagenes = await ImagenesChecklist.findAll({
                    where: { checklistId: checklist.id },
                    attributes: ['fieldId']
                });

                const fieldsSubidos = imagenes.map(img => img.fieldId);
                const faltantes = FOTOS_ENTRADA_OBLIGATORIAS.filter(f => !fieldsSubidos.includes(f));

                if (faltantes.length > 0) {
                    res.status(400).json({ 
                        error: 'Faltan fotos de entrada obligatorias para el cierre normal', 
                        faltantes 
                    });
                    return;
                }
            } else {
                if (!observaciones?.trim()) {
                    res.status(400).json({ 
                        error: 'Para cerrar el viaje sin fotos, las observaciones/motivo son obligatorios' 
                    });
                    return;
                }
            }

            // Construir la nota de entrada con auditoría
            const notaEntrada = cierreSinFotos
                ? `[CIERRE SIN FOTOS - ${motivoOmision ?? 'OMISION_VIGILANCIA'} por ${usuario.name} ${usuario.lastname}]: ${observaciones}`
                : (observaciones || 'Entrada normal con fotografías');

            await req.recorrido.update({
                status: RecorridoStatus.COMPLETA,
                observaciones_entrada: notaEntrada
            });

            res.json({ 
                message: cierreSinFotos 
                    ? 'Viaje cerrado administrativamente sin fotos. Unidad libre en patio.' 
                    : 'Entrada registrada y viaje completado con éxito' 
            });

        } catch (error) {
            console.error("Error al registrar entrada:", error);
            res.status(500).json({ error: 'Error al registrar la entrada de la unidad' });
        }
    };
}