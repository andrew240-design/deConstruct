import { AppDataSource } from './data-source';
import { Usuario } from './entities/Usuario';
import { crearServidorHttp } from './http/servidor-http';
import { RepositorioUsuariosTypeorm } from './usuarios/usuario.repositorio.typeorm';
import { ServicioUsuarios } from './usuarios/usuario.servicio';

const PUERTO = Number(process.env.PUERTO ?? 3000);

async function main() {
  await AppDataSource.initialize();
  console.log('✔ Conectado a SQL Server');

  const repositorio = new RepositorioUsuariosTypeorm(AppDataSource.getRepository(Usuario));
  const servidor = crearServidorHttp(new ServicioUsuarios(repositorio));

  servidor.listen(PUERTO, () => console.log(`✔ API escuchando en http://localhost:${PUERTO}`));
}

main().catch((error) => {
  console.error('✘ No se pudo iniciar:', error.message ?? error);
  process.exit(1);
});
