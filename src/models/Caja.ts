import { Table, Model, Column, DataType, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import Asignacion from "./Asignacion";
import Marca from "./Marca";

@Table({
    tableName: 'cajas',
    timestamps: false
})

class Caja extends Model<
    InferAttributes<Caja>,
    InferCreationAttributes<Caja>
> {

    declare id: CreationOptional<number>

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare numero_caja: string | null

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare c_placas: string | null

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare c_serie: string | null

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare capacidad: string | null

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare c_marca: string | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare c_anio: number | null

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
    })
    declare activo: CreationOptional<boolean>

    @HasMany(() => Asignacion, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare asignaciones: Asignacion[]

    @ForeignKey(() => Marca)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'marca_id'
    })
    declare marcaId: number | null

    @BelongsTo(() => Marca)
    declare marca: Marca

}

export default Caja