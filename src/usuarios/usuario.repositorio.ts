import { NuevoUsuario, UsuarioAlmacenado } from './usuario.tipos';

/** Contrato que necesita el servicio; así se puede probar sin base de datos. */
export interface RepositorioUsuarios {
  existeCorreo(correo: string): Promise<boolean>;
  guardar(nuevo: NuevoUsuario): Promise<UsuarioAlmacenado>;
  buscarPorId(idUsuario: number): Promise<UsuarioAlmacenado | null>;
}
