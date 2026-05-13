import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Asignacion from "./Asignacion";

@Table({
    tableName: 'operadores',
    timestamps: false
})

class Operador extends Model {
    @Column({ type: DataType.STRING(100) })
    declare nombre: string

    @Column({ type: DataType.STRING(100) })
    declare apellido_p: string

    @Column({ type: DataType.STRING(100) })
    declare apellido_m: string

    @Column({ type: DataType.DATE })
    declare vigencia_lic: string

    @Column({ type: DataType.DATE })
    declare vigencia_apto: string

    @Column({ type: DataType.BOOLEAN, defaultValue: true })
    declare activo: boolean;

    @HasMany(() => Asignacion, {
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    })
    declare asignaciones: Asignacion[]

}

export default Operador
