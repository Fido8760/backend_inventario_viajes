import { Table, Model, Column, DataType, HasMany } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes } from "sequelize";
import Respuesta from "./RespuestasChecklist";


export enum TipoPregunta {
    SI_NO    = 'si_no',
    OPCIONES = 'opciones',
    NUMERO   = 'numero',
    TEXTO    = 'texto',
}

export enum AplicaA {
    TODOS        = 'todos',
    TRACTOCAMION = 'tractocamion',
}

@Table({
    tableName: 'preguntas',
    timestamps: false
})

class Pregunta extends Model<
    InferAttributes<Pregunta>,
    InferCreationAttributes<Pregunta>
> {
    @Column({
        type: DataType.STRING(80),
        allowNull: false
    })
    declare seccion: string

    @Column({
        type: DataType.STRING(255),
        allowNull: false
    })
    declare texto: string

    @Column({
        type: DataType.ENUM(...Object.values(TipoPregunta)),
        allowNull: false
    })
    declare tipo: TipoPregunta

    @Column({
        type: DataType.ENUM(...Object.values(AplicaA)),
        defaultValue: AplicaA.TODOS
    })
    declare aplica_a: AplicaA

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    declare obligatorio: boolean

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare orden: number

    @HasMany(() => Respuesta)
    declare respuestas: Respuesta[]
}

export default Pregunta