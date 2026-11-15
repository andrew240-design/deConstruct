import { hashearContrasena } from './contrasena';
import { ErrorCorreoDuplicado, ErrorDeValidacion, ErrorUsuarioNoEncontrado } from './usuario.errores';
import { RepositorioUsuarios } from './usuario.repositorio';
import {
  DatosRegistro,
  EntradaRegistro,
  NuevoUsuario,
  UsuarioAlmacenado,
  UsuarioPublico,
} from './usuario.tipos';
import { validarRegistro } from './usuario.validaciones';

export class ServicioUsuarios {
  constructor(private readonly repositorio: RepositorioUsuarios) {}

  /** Alta de un usuario: limpia, valida, comprueba el correo, protege la contraseña y guarda. */
  async registrar(entrada: EntradaRegistro): Promise<UsuarioPublico> {
    const datos = limpiarEntrada(entrada);
    exigirDatosValidos(datos);
    await this.exigirCorreoDisponible(datos.correo);

    const usuario = await this.repositorio.guardar(await armarNuevoUsuario(datos));
    return aUsuarioPublico(usuario);
  }

  async consultarPorId(idUsuario: number): Promise<UsuarioPublico> {
    const usuario = await this.repositorio.buscarPorId(idUsuario);
    if (usuario === null) throw new ErrorUsuarioNoEncontrado(idUsuario);
    return aUsuarioPublico(usuario);
  }

  private async exigirCorreoDisponible(correo: string): Promise<void> {
    if (await this.repositorio.existeCorreo(correo)) throw new ErrorCorreoDuplicado(correo);
  }
}

function limpiarEntrada(entrada: EntradaRegistro): DatosRegistro {
  const telefono = textoLimpio(entrada.telefono);
  return {
    nombreCompleto: textoLimpio(entrada.nombreCompleto),
    correo: textoLimpio(entrada.correo).toLowerCase(),
    // La contraseña no se recorta: los espacios pueden ser parte de ella
    contrasena: typeof entrada.contrasena === 'string' ? entrada.contrasena : '',
    telefono: telefono === '' ? null : telefono,
  };
}

function textoLimpio(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function exigirDatosValidos(datos: DatosRegistro): void {
  const problemas = validarRegistro(datos);
  if (problemas.length > 0) throw new ErrorDeValidacion(problemas);
}

async function armarNuevoUsuario(datos: DatosRegistro): Promise<NuevoUsuario> {
  return {
    nombreCompleto: datos.nombreCompleto,
    correo: datos.correo,
    contrasenaHash: await hashearContrasena(datos.contrasena),
    telefono: datos.telefono,
    rol: 'CLIENTE', // el rol nunca se toma de la entrada: evita que alguien se registre como ADMIN
  };
}

function aUsuarioPublico(usuario: UsuarioAlmacenado): UsuarioPublico {
  const { contrasenaHash: _oculto, ...publico } = usuario;
  return publico;
}
