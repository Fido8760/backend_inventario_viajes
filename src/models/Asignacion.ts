import { Table, Model, Column, DataType, HasOne, BelongsTo, ForeignKey, Default } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes } from "sequelize";
import Unidad from "./Unidad";
import Operador from "./Operador";
import Caja from "./Caja";
import DatosCheckList from "./DatosCheckList";
import UsuariosChecklist from "./UsuariosChecklist";
import { AsignacionStatus } from "../types/estados-asignacion";

@Table({
    tableName: 'asignaciones'
})

class Asignacion extends Model<
    InferAttributes<Asignacion>,
    InferCreationAttributes<Asignacion>
> {

    @ForeignKey(() => Unidad)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare unidadId: number | null 
    @BelongsTo(() => Unidad, { onDelete: "SET NULL", hooks: true })
    declare unidad: Unidad
    
    @ForeignKey(() => Caja)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare cajaId: number | null
    @BelongsTo(() => Caja, { onDelete: "SET NULL", hooks: true })
    declare caja: Caja

    @Default(AsignacionStatus.CREADA)
    @Column({
        type: DataType.ENUM(...Object.values(AsignacionStatus))
    })
    declare status: AsignacionStatus

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare observaciones_entrada: string | null;

    @ForeignKey(() => Operador)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare operadorId: number
    @BelongsTo(() => Operador, { onDelete: "RESTRICT", hooks: true })
    declare operador: Operador

    @HasOne(() => DatosCheckList, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare checklist: DatosCheckList

    @ForeignKey(() => UsuariosChecklist)
    @Column(DataType.INTEGER)
    declare userId: number

    @BelongsTo(() => UsuariosChecklist)
    declare usuario: UsuariosChecklist
    
}

export default Asignacion
