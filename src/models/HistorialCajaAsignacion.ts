import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes } from "sequelize";
import Asignacion from "./Asignacion";
import Caja from "./Caja";
import UsuariosChecklist from "./UsuariosChecklist";

export enum MotivoCambioCaja {
    FALLA_MECANICA = 'FALLA_MECANICA',
    FILTRACION = 'FILTRACION',
    TRASPASO_PATIO = 'TRASPASO_PATIO',
    OTRO = 'OTRO'
}

@Table({
    tableName: 'historial_caja_asignacion',
    updatedAt: false
})
class HistorialCajaAsignacion extends Model<
    InferAttributes<HistorialCajaAsignacion>,
    InferCreationAttributes<HistorialCajaAsignacion>
> {
    @ForeignKey(() => Asignacion)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare asignacionId: number;

    @BelongsTo(() => Asignacion)
    declare asignacion: Asignacion;

    @ForeignKey(() => Caja)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare cajaAnteriorId: number | null;

    @BelongsTo(() => Caja, 'cajaAnteriorId')
    declare cajaAnterior: Caja;

    @ForeignKey(() => Caja)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare cajaNuevaId: number | null;

    @BelongsTo(() => Caja, 'cajaNuevaId')
    declare cajaNueva: Caja;

    @Column({ type: DataType.ENUM(...Object.values(MotivoCambioCaja)), allowNull: false })
    declare motivo: MotivoCambioCaja;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare observaciones: string | null;

    @ForeignKey(() => UsuariosChecklist)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare registradoPorId: number | null;
    
    @BelongsTo(() => UsuariosChecklist)
    declare registradoPor: UsuariosChecklist;
}

export default HistorialCajaAsignacion;