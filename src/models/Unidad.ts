import {
    Table,
    Model,
    Column,
    DataType,
    HasMany,
    HasOne
} from "sequelize-typescript";

import {
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";

import Asignacion from "./Asignacion";
import Poliza from "./Poliza";
import TarjetaCirculacion from "./TarjetaCirculacion";
import VeriAmbiental from "./VeriAmbiental";
import VeriFisico from "./VeriFisico";

@Table({
    tableName: 'unidades',
    timestamps: false
})

class Unidad extends Model<
    InferAttributes<Unidad>,
    InferCreationAttributes<Unidad>
> {

    declare id: CreationOptional<number>

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare no_unidad: string

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare tipo_unidad: string

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare u_placas: string

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare u_serie: string | null

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare u_marca: string | null

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare modelo: string | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare u_anio: number | null

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare no_motor: string | null

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

    @HasOne(() => Poliza)
    declare poliza: Poliza

    @HasOne(() => TarjetaCirculacion)
    declare tarjetaCirc: TarjetaCirculacion

    @HasOne(() => VeriAmbiental)
    declare veriAmbiental: VeriAmbiental

    @HasOne(() => VeriFisico)
    declare veriFisico: VeriFisico
}

export default Unidad