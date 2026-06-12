import { InferAttributes, InferCreationAttributes } from "sequelize";
import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Table, Model } from "sequelize-typescript";
import Unidad from "./Unidad";
import Caja from "./Caja";
import UsuariosChecklist from "./UsuariosChecklist";
import ImagenesInspeccion from "./ImagenesInspeccion";
import RespuestaInspeccion from "./RespuestasInspeccion";

export enum TipoInspeccion {
    UNIDAD = 'UNIDAD',
    REMOLQUE = 'REMOLQUE'
}

export enum InspeccionStatus {
    EN_PROGRESO = 'EN_PROGRESO',
    FOTOS_PENDIENTES = 'FOTOS_PENDIENTES',
    COMPLETA = "COMPLETA"
}

@Table({ tableName: 'inspecciones_patio'})
class InspeccionPatio extends Model<
    InferAttributes<InspeccionPatio>,
    InferCreationAttributes<InspeccionPatio>
> {
    @Column({
        type: DataType.ENUM(...Object.values(TipoInspeccion)),
        allowNull: false
    })
    declare tipo: TipoInspeccion;

    @ForeignKey(() => Unidad)
    @Column({ type: DataType.INTEGER, allowNull: true})
    declare unidadId: number | null;

    @BelongsTo(() => Unidad, { onDelete: 'SET NULL', hooks: true })
    declare unidad: Unidad;

    @ForeignKey(() => Caja)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare cajaId: number | null;

    @BelongsTo(() => Caja, { onDelete: 'SET NULL', hooks: true })
    declare caja: Caja;

    @ForeignKey(() => UsuariosChecklist)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare userId: number;

    @BelongsTo(() => UsuariosChecklist)
    declare usuario: UsuariosChecklist;

    @Default(InspeccionStatus.EN_PROGRESO)
    @Column({
        type: DataType.ENUM(...Object.values(InspeccionStatus)),
        allowNull: false
    })
    declare status: InspeccionStatus;

    @HasMany(() => ImagenesInspeccion, { onDelete: 'CASCADE', hooks: true })
    declare imagenes: ImagenesInspeccion[];

    @HasMany(() => RespuestaInspeccion, { onDelete: 'CASCADE', hooks: true })
    declare respuestas: RespuestaInspeccion[];
}

export default InspeccionPatio;