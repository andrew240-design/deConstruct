import { hashearContrasena } from './contrasena';
import { ErrorCorreoDuplicado, ErrorDeValidacion, ErrorUsuarioNoEncontrado } from './usuario.errores';
import { interpretarFiltros } from './usuario.filtros';
import { RepositorioUsuarios } from './usuario.repositorio';
import {
  CambiosAlmacenables,
  CambiosUsuario,
  DatosRegistro,
  EntradaActualizacion,
  EntradaFiltros,
  EntradaRegistro,
  NuevoUsuario,
  PaginaDeUsuarios,
  UsuarioAlmacenado,
  UsuarioPublico,
} from './usuario.tipos';
import { validarCambios, validarRegistro } from './usuario.validaciones';

export class ServicioUsuarios {
  constructor(private readonly repositorio: RepositorioUsuarios) {}

  /** Alta de un usuario: limpia, valida, comprueba el correo, protege la contraseña y guarda. */
  async registrar(entrada: EntradaRegistro): Promise<UsuarioPublico> {
    exigirCamposDeTexto(entrada);
    const datos = limpiarEntrada(entrada);
    exigirDatosValidos(datos);
    await this.exigirCorreoDisponible(datos.correo);

    const usuario = await this.repositorio.guardar(await armarNuevoUsuario(datos));
    return aUsuarioPublico(usuario);
  }

  /** Actualización parcial: solo cambia los campos recibidos. El rol nunca se modifica desde aquí. */
  async actualizar(idUsuario: number, entrada: EntradaActualizacion): Promise<UsuarioPublico> {
    exigirCamposDeTexto(entrada);
    const cambios = limpiarCambios(entrada);
    exigirAlMenosUnCambio(cambios);
    exigirCambiosValidos(cambios);
    await this.obtenerUsuario(idUsuario);
    if (cambios.correo !== undefined) await this.exigirCorreoDisponible(cambios.correo, idUsuario);

    const actualizado = await this.repositorio.actualizar(idUsuario, await armarCambiosAlmacenables(cambios));
    return aUsuarioPublico(actualizado);
  }

  async consultarPorId(idUsuario: number): Promise<UsuarioPublico> {
    return aUsuarioPublico(await this.obtenerUsuario(idUsuario));
  }

  /** Listado paginado, con búsqueda por texto (nombre o correo) y filtros por rol y estado. */
  async listar(entrada: EntradaFiltros): Promise<PaginaDeUsuarios> {
    const filtros = interpretarFiltros(entrada);
    const { usuarios, total } = await this.repositorio.listar(filtros);
    return { datos: usuarios.map(aUsuarioPublico), total, pagina: filtros.pagina, tamano: filtros.tamano };
  }

  private async obtenerUsuario(idUsuario: number): Promise<UsuarioAlmacenado> {
    const usuario = await this.repositorio.buscarPorId(idUsuario);
    if (usuario === null) throw new ErrorUsuarioNoEncontrado(idUsuario);
    return usuario;
  }

  private async exigirCorreoDisponible(correo: string, excluirIdUsuario?: number): Promise<void> {
    if (await this.repositorio.existeCorreo(correo, excluirIdUsuario)) throw new ErrorCorreoDuplicado(correo);
  }
}

function limpiarEntrada(entrada: EntradaRegistro): DatosRegistro {
  return {
    nombreCompleto: textoLimpio(entrada.nombreCompleto),
    correo: correoNormalizado(entrada.correo),
    contrasena: contrasenaComoTexto(entrada.contrasena),
    telefono: telefonoONulo(entrada.telefono),
  };
}

/** Solo incluye los campos que llegaron; así se distingue "no cambiar" de "dejar vacío". */
function limpiarCambios(entrada: EntradaActualizacion): CambiosUsuario {
  const cambios: CambiosUsuario = {};
  if (entrada.nombreCompleto !== undefined) cambios.nombreCompleto = textoLimpio(entrada.nombreCompleto);
  if (entrada.correo !== undefined) cambios.correo = correoNormalizado(entrada.correo);
  if (entrada.contrasena !== undefined) cambios.contrasena = contrasenaComoTexto(entrada.contrasena);
  if (entrada.telefono !== undefined) cambios.telefono = telefonoONulo(entrada.telefono);
  return cambios;
}

function textoLimpio(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function correoNormalizado(valor: unknown): string {
  return textoLimpio(valor).toLowerCase();
}

// La contraseña no se recorta: los espacios pueden ser parte de ella
function contrasenaComoTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

function telefonoONulo(valor: unknown): string | null {
  const telefono = textoLimpio(valor);
  return telefono === '' ? null : telefono;
}

const CAMPOS_DE_TEXTO = ['nombreCompleto', 'correo', 'contrasena', 'telefono'] as const;

/** Un valor de otro tipo (número, booleano, objeto) se rechaza; antes se trataba como "campo vacío". */
function exigirCamposDeTexto(entrada: EntradaRegistro | EntradaActualizacion): void {
  const problemas = CAMPOS_DE_TEXTO.filter((campo) => !esTextoOAusente(entrada[campo])).map(
    (campo) => `El campo ${campo} debe enviarse como texto.`,
  );
  if (problemas.length > 0) throw new ErrorDeValidacion(problemas);
}

function esTextoOAusente(valor: unknown): boolean {
  return valor === undefined || valor === null || typeof valor === 'string';
}

function exigirDatosValidos(datos: DatosRegistro): void {
  const problemas = validarRegistro(datos);
  if (problemas.length > 0) throw new ErrorDeValidacion(problemas);
}

function exigirAlMenosUnCambio(cambios: CambiosUsuario): void {
  if (Object.keys(cambios).length === 0) {
    throw new ErrorDeValidacion(['Indica al menos un campo para actualizar: nombreCompleto, correo, contrasena o telefono.']);
  }
}

function exigirCambiosValidos(cambios: CambiosUsuario): void {
  const problemas = validarCambios(cambios);
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

async function armarCambiosAlmacenables(cambios: CambiosUsuario): Promise<CambiosAlmacenables> {
  const { contrasena, ...resto } = cambios;
  return contrasena === undefined ? resto : { ...resto, contrasenaHash: await hashearContrasena(contrasena) };
}

function aUsuarioPublico(usuario: UsuarioAlmacenado): UsuarioPublico {
  const { contrasenaHash: _oculto, ...publico } = usuario;
  return publico;
}
