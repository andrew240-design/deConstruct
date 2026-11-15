import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'USUARIO', schema: 'dbo' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario', type: 'int' })
  idUsuario: number;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 100 })
  nombreCompleto: string;

  @Column({ name: 'correo', type: 'varchar', length: 120, unique: true })
  correo: string;

  @Column({ name: 'contrasena_hash', type: 'varchar', length: 255 })
  contrasenaHash: string;

  @Column({ name: 'telefono', type: 'varchar', length: 15, nullable: true })
  telefono: string | null;

  @Column({ name: 'rol', type: 'varchar', length: 15, default: 'CLIENTE' })
  rol: 'CLIENTE' | 'ADMIN' | 'ASESOR';

  @Column({ name: 'activo', type: 'bit', default: true })
  activo: boolean;

  // Valor asignado por la base (DEFAULT SYSDATETIME()); solo lectura
  @Column({ name: 'fecha_registro', type: 'datetime2', precision: 0, insert: false, update: false })
  fechaRegistro: Date;
}
