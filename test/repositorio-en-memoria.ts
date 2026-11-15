import { RepositorioUsuarios } from '../src/usuarios/usuario.repositorio';
import {
  CambiosAlmacenables,
  FiltrosUsuarios,
  NuevoUsuario,
  PaginaAlmacenada,
  UsuarioAlmacenado,
} from '../src/usuarios/usuario.tipos';

/** Repositorio en memoria: permite probar la lógica sin SQL Server. */
export class RepositorioEnMemoria implements RepositorioUsuarios {
  readonly guardados: UsuarioAlmacenado[] = [];

  async existeCorreo(correo: string, excluirIdUsuario?: number) {
    return this.guardados.some((u) => u.correo === correo && u.idUsuario !== excluirIdUsuario);
  }

  async guardar(nuevo: NuevoUsuario) {
    const usuario: UsuarioAlmacenado = {
      ...nuevo,
      idUsuario: this.guardados.length + 1,
      activo: true,
      fechaRegistro: new Date(),
    };
    this.guardados.push(usuario);
    return usuario;
  }

  async actualizar(idUsuario: number, cambios: CambiosAlmacenables) {
    const usuario = this.guardados.find((u) => u.idUsuario === idUsuario)!;
    Object.assign(usuario, cambios);
    return usuario;
  }

  async buscarPorId(idUsuario: number) {
    return this.guardados.find((u) => u.idUsuario === idUsuario) ?? null;
  }

  async listar(filtros: FiltrosUsuarios): Promise<PaginaAlmacenada> {
    const texto = filtros.texto?.toLowerCase();
    const coinciden = this.guardados.filter(
      (u) =>
        (texto === undefined || u.nombreCompleto.toLowerCase().includes(texto) || u.correo.includes(texto)) &&
        (filtros.rol === undefined || u.rol === filtros.rol) &&
        (filtros.activo === undefined || u.activo === filtros.activo),
    );
    const desde = (filtros.pagina - 1) * filtros.tamano;
    return { usuarios: coinciden.slice(desde, desde + filtros.tamano), total: coinciden.length };
  }
}
