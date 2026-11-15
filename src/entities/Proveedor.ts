import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Producto } from './Producto';

@Entity({ name: 'PROVEEDOR', schema: 'dbo' })
export class Proveedor {
  @PrimaryGeneratedColumn({ name: 'id_proveedor', type: 'int' })
  idProveedor: number;

  @Column({ name: 'razon_social', type: 'varchar', length: 120, unique: true })
  razonSocial: string;

  @Column({ name: 'correo_contacto', type: 'varchar', length: 120 })
  correoContacto: string;

  @Column({ name: 'telefono', type: 'varchar', length: 15, nullable: true })
  telefono: string | null;

  @Column({ name: 'activo', type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => Producto, (producto) => producto.proveedor)
  productos: Producto[];
}
