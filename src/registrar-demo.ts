import { AppDataSource } from './data-source';
import { Usuario } from './entities/Usuario';
import { RepositorioUsuariosTypeorm } from './usuarios/usuario.repositorio.typeorm';
import { ServicioUsuarios } from './usuarios/usuario.servicio';

async function main() {
  await AppDataSource.initialize();
  const servicio = new ServicioUsuarios(new RepositorioUsuariosTypeorm(AppDataSource.getRepository(Usuario)));

  const registrado = await servicio.registrar({
    nombreCompleto: 'Usuario de Demostración',
    correo: `demo.${Date.now()}@mail.example`,
    contrasena: 'Clave12345',
    telefono: '6141234567',
  });
  console.log('✔ Usuario registrado:');
  console.table([registrado]);

  const consultado = await servicio.consultarPorId(registrado.idUsuario);
  console.log('✔ Consultado por id:', consultado.idUsuario, consultado.correo);

  await AppDataSource.destroy();
}

main().catch(async (error) => {
  console.error('✘ Error:', error.problemas ?? error.message ?? error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
