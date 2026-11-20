import { CambiosUsuario, DatosRegistro } from './usuario.tipos';

const LONGITUD_MAXIMA_NOMBRE = 100;
const LONGITUD_MAXIMA_CORREO = 120;
const LONGITUD_MINIMA_CONTRASENA = 8;
const LONGITUD_MAXIMA_CONTRASENA = 128;

// Parte local: bloques de caracteres permitidos separados por UN punto (sin puntos al inicio, al final ni seguidos).
const BLOQUE_LOCAL = "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+";
// Dominio: etiquetas de hasta 63 caracteres que no empiezan ni terminan con guion, y extensión de 2 o más letras.
const ETIQUETA_DOMINIO = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?';
const PATRON_CORREO = new RegExp(`^${BLOQUE_LOCAL}(?:\\.${BLOQUE_LOCAL})*@(?:${ETIQUETA_DOMINIO}\\.)+[A-Za-z]{2,}$`);
const PATRON_TELEFONO = /^\+?[0-9]{10,14}$/;
const PATRON_LETRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const PATRON_DIGITO = /[0-9]/;

/** Devuelve la lista de problemas; si está vacía, los datos son válidos. */
export function validarRegistro(datos: DatosRegistro): string[] {
  return [
    ...validarNombre(datos.nombreCompleto),
    ...validarCorreo(datos.correo),
    ...validarContrasena(datos.contrasena),
    ...validarTelefono(datos.telefono),
  ];
}

export function validarNombre(nombre: string): string[] {
  if (nombre === '') return ['El nombre es obligatorio.'];
  if (nombre.length > LONGITUD_MAXIMA_NOMBRE) {
    return [`El nombre no puede superar ${LONGITUD_MAXIMA_NOMBRE} caracteres.`];
  }
  return [];
}

export function validarCorreo(correo: string): string[] {
  if (correo === '') return ['El correo es obligatorio.'];
  if (correo.length > LONGITUD_MAXIMA_CORREO) {
    return [`El correo no puede superar ${LONGITUD_MAXIMA_CORREO} caracteres.`];
  }
  if (!PATRON_CORREO.test(correo)) return ['El correo no tiene un formato válido.'];
  return [];
}

export function validarContrasena(contrasena: string): string[] {
  if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    return [`La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`];
  }
  if (contrasena.length > LONGITUD_MAXIMA_CONTRASENA) {
    return [`La contraseña no puede superar ${LONGITUD_MAXIMA_CONTRASENA} caracteres.`];
  }
  if (!PATRON_LETRA.test(contrasena) || !PATRON_DIGITO.test(contrasena)) {
    return ['La contraseña debe incluir al menos una letra y un número.'];
  }
  return [];
}

export function validarTelefono(telefono: string | null): string[] {
  if (telefono === null) return [];
  if (!PATRON_TELEFONO.test(telefono)) {
    return ['El teléfono debe tener entre 10 y 14 dígitos, con + opcional al inicio.'];
  }
  return [];
}

/** Valida solo los campos presentes: en una actualización parcial los demás no se tocan. */
export function validarCambios(cambios: CambiosUsuario): string[] {
  return [
    ...validarSiExiste(cambios.nombreCompleto, validarNombre),
    ...validarSiExiste(cambios.correo, validarCorreo),
    ...validarSiExiste(cambios.contrasena, validarContrasena),
    ...validarSiExiste(cambios.telefono, validarTelefono),
  ];
}

function validarSiExiste<T>(valor: T | undefined, validar: (valor: T) => string[]): string[] {
  return valor === undefined ? [] : validar(valor);
}
