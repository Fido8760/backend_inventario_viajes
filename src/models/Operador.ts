import {
    Table,
    Model,
    Column,
    DataType,
    HasMany
} from "sequelize-typescript";

import {
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";

import Asignacion from "./Asignacion";

@Table({
    tableName: 'operadores',
    timestamps: false
})

class Operador extends Model<
    InferAttributes<Operador>,
    InferCreationAttributes<Operador>
> {

    declare id: CreationOptional<number>

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare nombre: string

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare apellido_p: string

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare apellido_m: string

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare curp: string | null

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare rfc: string | null

    @Column({
        type: DataType.DATEONLY,
        allowNull: true
    })
    declare fe_ingreso: string | null

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare subir_archivo_licencia: string | null

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare subir_archivo_apto: string | null

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare subir_archivo_ine: string | null

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare subir_archivo_control: string | null

    @Column({
        type: DataType.DATEONLY,
        allowNull: true
    })
    declare vigencia_lic: string | null

    @Column({
        type: DataType.DATEONLY,
        allowNull: true
    })
    declare vigencia_apto: string | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare id_puesto: number | null

    @Column({
        type: DataType.BIGINT,
        allowNull: true
    })
    declare nss: number | null

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
    })
    declare activo: CreationOptional<boolean>

    @HasMany(() => Asignacion, {
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    })
    declare asignaciones: Asignacion[]

}

export default Operador