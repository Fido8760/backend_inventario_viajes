import { Table, Model, Column, DataType, HasOne, BelongsTo, ForeignKey, Default } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes } from "sequelize";
import Unidad from "./Unidad";
import Operador from "./Operador";
import Caja from "./Caja";
import DatosCheckList from "./DatosCheckList";
import UsuariosChecklist from "./UsuariosChecklist";
import Asignacion from "./Asignacion";
import { RecorridoStatus } from "../types/estados-asignacion";

@Table({
    tableName: 'recorridos'
})
class Recorrido extends Model<
    InferAttributes<Recorrido>,
    InferCreationAttributes<Recorrido>
> {
    @ForeignKey(() => Asignacion)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare asignacionId: number;

    @BelongsTo(() => Asignacion)
    declare asignacion: Asignacion;

    @ForeignKey(() => Unidad)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare unidadId: number | null;

    @BelongsTo(() => Unidad, { onDelete: "SET NULL", hooks: true })
    declare unidad: Unidad;
    
    @ForeignKey(() => Caja)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare cajaId: number | null;

    @BelongsTo(() => Caja, { onDelete: "SET NULL", hooks: true })
    declare caja: Caja;

    @Default(false)
    @Column({ type: DataType.BOOLEAN, allowNull: false })
    declare caja_externa: boolean;

    @Default(RecorridoStatus.CREADA)
    @Column({ type: DataType.ENUM(...Object.values(RecorridoStatus)) })
    declare status: RecorridoStatus;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare observaciones_entrada: string | null;

    @Default(true)
    @Column({ type: DataType.BOOLEAN, allowNull: false })
    declare saleAViaje: boolean;

    @Default(false)
    @Column({ type: DataType.BOOLEAN, allowNull: false })
    declare entregaInicial: boolean;

    @ForeignKey(() => Operador)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare operadorId: number;

    @BelongsTo(() => Operador, { onDelete: "RESTRICT", hooks: true })
    declare operador: Operador;

    @HasOne(() => DatosCheckList, {
        foreignKey: 'recorridoId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare checklist: DatosCheckList;

    @ForeignKey(() => UsuariosChecklist)
    @Column(DataType.INTEGER)
    declare userId: number;
    
    @BelongsTo(() => UsuariosChecklist)
    declare usuario: UsuariosChecklist
}

export default Recorrido