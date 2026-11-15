import { ErrorDeValidacion } from './usuario.errores';
import { EntradaFiltros, FiltrosUsuarios, ROLES_VALIDOS, RolUsuario } from './usuario.tipos';

const PAGINA_INICIAL = 1;
const PAGINA_MAXIMA = 100_000;
const TAMANO_POR_DEFECTO = 10;
const TAMANO_MAXIMO = 50;
const LONGITUD_MAXIMA_TEXTO = 100;

/** Convierte los parámetros de la URL en filtros tipados; si alguno es inválido, informa todos. */
export function interpretarFiltros(entrada: EntradaFiltros): FiltrosUsuarios {
  const problemas: string[] = [];
  const filtros: FiltrosUsuarios = {
    texto: leerTexto(entrada.texto, problemas),
    rol: leerRol(entrada.rol, problemas),
    activo: leerBooleano(entrada.activo, 'activo', problemas),
    pagina: leerEnteroPositivo(entrada.pagina, 'pagina', PAGINA_INICIAL, PAGINA_MAXIMA, problemas),
    tamano: leerEnteroPositivo(entrada.tamano, 'tamano', TAMANO_POR_DEFECTO, TAMANO_MAXIMO, problemas),
  };
  if (problemas.length > 0) throw new ErrorDeValidacion(problemas);
  return filtros;
}

function leerTexto(valor: string | undefined, problemas: string[]): string | undefined {
  const texto = valor?.trim();
  if (!texto) return undefined;
  if (texto.length > LONGITUD_MAXIMA_TEXTO) {
    problemas.push(`El texto de búsqueda no puede superar ${LONGITUD_MAXIMA_TEXTO} caracteres.`);
    return undefined;
  }
  return texto;
}

function leerRol(valor: string | undefined, problemas: string[]): RolUsuario | undefined {
  if (valor === undefined || valor === '') return undefined;
  const rol = valor.toUpperCase();
  if (ROLES_VALIDOS.includes(rol as RolUsuario)) return rol as RolUsuario;
  problemas.push(`El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.`);
  return undefined;
}

function leerBooleano(valor: string | undefined, nombre: string, problemas: string[]): boolean | undefined {
  if (valor === undefined || valor === '') return undefined;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  problemas.push(`El parámetro ${nombre} debe ser true o false.`);
  return undefined;
}

function leerEnteroPositivo(
  valor: string | undefined,
  nombre: string,
  porDefecto: number,
  maximo: number,
  problemas: string[],
): number {
  if (valor === undefined || valor === '') return porDefecto;
  const numero = Number(valor);
  if (Number.isInteger(numero) && numero >= 1 && numero <= maximo) return numero;
  problemas.push(`El parámetro ${nombre} debe ser un entero entre 1 y ${maximo}.`);
  return porDefecto;
}
