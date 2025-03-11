import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey, HasOne } from "sequelize-typescript";
import Asignacion from "./Asignacion";
import Poliza from "./Poliza";
import TarjetaCirculacion from "./TarjetaCirculacion";
import VeriAmbiental from "./VeriAmbiental";
import VeriFisico from "./VeriFisico";

@Table({
    tableName: 'unidades'
})

class Unidad extends Model {
    @Column({
        type: DataType.STRING(100)
    })
    declare no_unidad: string

    @Column({
        type: DataType.STRING(100)
    })
    declare tipo_unidad: string

    @Column({
        type: DataType.STRING(100)
    })
    declare u_placas: string

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
    declare veriFidico: VeriFisico

}

export default Unidad