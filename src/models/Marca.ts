import { Table, Model, Column, DataType, HasMany, Default } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes } from "sequelize";
import Unidad from "./Unidad";
import Caja from "./Caja";

@Table({
    tableName: 'marcas',
    timestamps: false
})

class Marca extends Model<
    InferAttributes<Marca>,
    InferCreationAttributes<Marca>
> {
    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare nombre: string

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    declare activo: boolean

    @HasMany(() => Unidad)
    declare unidades: Unidad[]

    @HasMany(() => Caja)
    declare cajas: Caja[]
}

export default Marca