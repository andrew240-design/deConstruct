import {
  CambiosAlmacenables,
  FiltrosUsuarios,
  NuevoUsuario,
  PaginaAlmacenada,
  UsuarioAlmacenado,
} from './usuario.tipos';

/** Contrato que necesita el servicio; así se puede probar sin base de datos. */
export interface RepositorioUsuarios {
  /** Con `excluirIdUsuario` se ignora a ese usuario (para que pueda conservar su propio correo). */
  existeCorreo(correo: string, excluirIdUsuario?: number): Promise<boolean>;
  guardar(nuevo: NuevoUsuario): Promise<UsuarioAlmacenado>;
  actualizar(idUsuario: number, cambios: CambiosAlmacenables): Promise<UsuarioAlmacenado>;
  buscarPorId(idUsuario: number): Promise<UsuarioAlmacenado | null>;
  listar(filtros: FiltrosUsuarios): Promise<PaginaAlmacenada>;
}
