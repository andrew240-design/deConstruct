import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Usuario } from './entities/Usuario';
import { Categoria } from './entities/Categoria';
import { Proveedor } from './entities/Proveedor';
import { Producto } from './entities/Producto';

const instancia = process.env.DB_INSTANCE?.trim();

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST ?? 'localhost',
  // Con instancia con nombre, SQL Server Browser resuelve el puerto
  ...(instancia ? {} : { port: Number(process.env.DB_PORT ?? 1433) }),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'DeConstruct',
  entities: [Usuario, Categoria, Proveedor, Producto],
  // La base ya existe (script de la Semana 7): TypeORM NO debe modificarla
  synchronize: false,
  options: {
    ...(instancia ? { instanceName: instancia } : {}),
    encrypt: true,
    trustServerCertificate: true, // aceptable en desarrollo local
  },
});
