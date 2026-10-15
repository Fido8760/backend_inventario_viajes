import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey, Default } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes } from "sequelize";
import Unidad from "./Unidad";
import Operador from "./Operador";
import Caja from "./Caja";
import Recorrido from "./Recorrido";
import UsuariosChecklist from "./UsuariosChecklist";
import { MotivoDevolucion } from "../types/motivo-devolucion";

@Table({
    tableName: 'asignaciones'
})
class Asignacion extends Model<
    InferAttributes<Asignacion>,
    InferCreationAttributes<Asignacion>
> {
    @ForeignKey(() => Unidad)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare unidadId: number | null;

    @BelongsTo(() => Unidad, { onDelete: "SET NULL", hooks: true })
    declare unidad: Unidad;

    @ForeignKey(() => Operador)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare operadorId: number | null;

    @BelongsTo(() => Operador)
    declare operador: Operador;

    @ForeignKey(() => Caja)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare cajaId: number | null;

    @BelongsTo(() => Caja, { onDelete: "SET NULL", hooks: true })
    declare caja: Caja;

    @Column({ type: DataType.DATE, allowNull: false })
    declare fechaEntrega: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare fechaDevolucion: Date | null;

    @Column({ type: DataType.ENUM(...Object.values(MotivoDevolucion)), allowNull: true })
    declare motivoDevolucion: MotivoDevolucion | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare observacionesDevolucion: string | null;

    @ForeignKey(() => UsuariosChecklist)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare userId: number | null;

    @BelongsTo(() => UsuariosChecklist)
    declare usuario: UsuariosChecklist;

    @HasMany(() => Recorrido)
    declare recorridos: Recorrido[];
}

export default Asignacion