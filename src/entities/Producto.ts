import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Categoria } from './Categoria';
import { Proveedor } from './Proveedor';

// SQL Server devuelve DECIMAL como texto; se convierte a número en la app
const decimalANumero = {
  to: (valor?: number) => valor,
  from: (valor: string | null) => (valor === null ? null : parseFloat(valor)),
};

@Entity({ name: 'PRODUCTO', schema: 'dbo' })
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id_producto', type: 'int' })
  idProducto: number;

  @Column({ name: 'sku', type: 'varchar', length: 30, unique: true })
  sku: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 'MAX', nullable: true })
  descripcion: string | null;

  @Column({ name: 'precio', type: 'decimal', precision: 12, scale: 2, transformer: decimalANumero })
  precio: number;

  @Column({ name: 'existencia', type: 'int', default: 0 })
  existencia: number;

  @Column({ name: 'modelo_3d_url', type: 'varchar', length: 255, nullable: true })
  modelo3dUrl: string | null;

  @Column({ name: 'imagen_url', type: 'varchar', length: 255, nullable: true })
  imagenUrl: string | null;

  @Column({ name: 'activo', type: 'bit', default: true })
  activo: boolean;

  // La base la mantiene (DEFAULT + trigger); solo lectura
  @Column({ name: 'fecha_actualizacion', type: 'datetime2', precision: 0, insert: false, update: false })
  fechaActualizacion: Date;

  @ManyToOne(() => Categoria, (categoria) => categoria.productos, { nullable: false })
  @JoinColumn({ name: 'id_categoria' })
  categoria: Categoria;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, { nullable: false })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: Proveedor;
}
