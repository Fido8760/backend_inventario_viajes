import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, ForeignKey, Table, Model, BelongsTo } from "sequelize-typescript";
import InspenccionPatio from "./InspeccionPatio";

@Table({ tableName: 'imagenes_inspeccion' })
class ImagenesInspeccion extends Model<
    InferAttributes<ImagenesInspeccion>,
    InferCreationAttributes<ImagenesInspeccion>
> {
    @ForeignKey(() => InspenccionPatio)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare inspeccionId: number;

    @BelongsTo(() => InspenccionPatio)
    declare inspeccion: InspenccionPatio;

    @Column({ type: DataType.STRING(500), allowNull: false })
    declare urlImagen: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare publicId: string | null;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare fieldId: string;
}

export default ImagenesInspeccion;