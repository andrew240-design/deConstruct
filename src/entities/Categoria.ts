import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Producto } from './Producto';

@Entity({ name: 'CATEGORIA', schema: 'dbo' })
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria', type: 'int' })
  idCategoria: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50, unique: true })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 200, nullable: true })
  descripcion: string | null;

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];
}
