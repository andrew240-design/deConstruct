/**
 * Función 2: interpretación de los filtros de consulta paginada (interpretarFiltros).
 * Técnicas: partición de equivalencia (PE) y análisis de valores límite (VL).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ErrorDeValidacion } from '../src/usuarios/usuario.errores';
import { interpretarFiltros } from '../src/usuarios/usuario.filtros';
import { EntradaFiltros, FiltrosUsuarios } from '../src/usuarios/usuario.tipos';

type Tecnica = 'PE' | 'VL';

interface Caso {
  id: string;
  tecnica: Tecnica;
  descripcion: string;
  entrada: EntradaFiltros;
  /** undefined = debe rechazarse; si no, los campos que deben salir con ese valor. */
  esperado?: Partial<FiltrosUsuarios>;
}

const repetir = (texto: string, veces: number) => texto.repeat(veces);

function probarCasos(titulo: string, casos: Caso[]) {
  describe(titulo, () => {
    for (const caso of casos) {
      const resultado = caso.esperado ? 'acepta' : 'rechaza';
      it(`${caso.id} [${caso.tecnica}] ${caso.descripcion} -> ${resultado}`, () => {
        if (caso.esperado === undefined) {
          assert.throws(() => interpretarFiltros(caso.entrada), ErrorDeValidacion);
        } else {
          assert.deepEqual(pick(interpretarFiltros(caso.entrada), caso.esperado), caso.esperado);
        }
      });
    }
  });
}

function pick(filtros: FiltrosUsuarios, esperado: Partial<FiltrosUsuarios>) {
  return Object.fromEntries(Object.keys(esperado).map((clave) => [clave, filtros[clave as keyof FiltrosUsuarios]]));
}

probarCasos('Página (entero de 1 a 100000, por defecto 1)', [
  { id: 'G-01', tecnica: 'PE', descripcion: 'no se envía', entrada: {}, esperado: { pagina: 1 } },
  { id: 'G-02', tecnica: 'PE', descripcion: 'cadena vacía', entrada: { pagina: '' }, esperado: { pagina: 1 } },
  { id: 'G-03', tecnica: 'VL', descripcion: '0', entrada: { pagina: '0' } },
  { id: 'G-04', tecnica: 'VL', descripcion: '1 (mínimo)', entrada: { pagina: '1' }, esperado: { pagina: 1 } },
  { id: 'G-05', tecnica: 'PE', descripcion: 'valor intermedio 57', entrada: { pagina: '57' }, esperado: { pagina: 57 } },
  { id: 'G-06', tecnica: 'VL', descripcion: '100000 (máximo)', entrada: { pagina: '100000' }, esperado: { pagina: 100000 } },
  { id: 'G-07', tecnica: 'VL', descripcion: '100001', entrada: { pagina: '100001' } },
  { id: 'G-08', tecnica: 'PE', descripcion: 'negativo', entrada: { pagina: '-1' } },
  { id: 'G-09', tecnica: 'PE', descripcion: 'decimal 1.5', entrada: { pagina: '1.5' } },
  { id: 'G-10', tecnica: 'PE', descripcion: 'texto no numérico', entrada: { pagina: 'abc' } },
  { id: 'G-11', tecnica: 'PE', descripcion: 'notación científica 1e1', entrada: { pagina: '1e1' } },
  { id: 'G-12', tecnica: 'PE', descripcion: 'hexadecimal 0x10', entrada: { pagina: '0x10' } },
  { id: 'G-13', tecnica: 'PE', descripcion: 'con espacios " 5 "', entrada: { pagina: ' 5 ' } },
  { id: 'G-14', tecnica: 'PE', descripcion: 'con signo +5', entrada: { pagina: '+5' } },
  { id: 'G-15', tecnica: 'PE', descripcion: 'con parte decimal 5.0', entrada: { pagina: '5.0' } },
]);

probarCasos('Tamaño de página (entero de 1 a 50, por defecto 10)', [
  { id: 'H-01', tecnica: 'PE', descripcion: 'no se envía', entrada: {}, esperado: { tamano: 10 } },
  { id: 'H-02', tecnica: 'VL', descripcion: '0', entrada: { tamano: '0' } },
  { id: 'H-03', tecnica: 'VL', descripcion: '1 (mínimo)', entrada: { tamano: '1' }, esperado: { tamano: 1 } },
  { id: 'H-04', tecnica: 'PE', descripcion: 'valor intermedio 25', entrada: { tamano: '25' }, esperado: { tamano: 25 } },
  { id: 'H-05', tecnica: 'VL', descripcion: '50 (máximo)', entrada: { tamano: '50' }, esperado: { tamano: 50 } },
  { id: 'H-06', tecnica: 'VL', descripcion: '51', entrada: { tamano: '51' } },
  { id: 'H-07', tecnica: 'PE', descripcion: 'notación científica 1e1', entrada: { tamano: '1e1' } },
]);

probarCasos('Rol (CLIENTE, ADMIN o ASESOR, sin distinguir mayúsculas)', [
  { id: 'R-01', tecnica: 'PE', descripcion: 'ADMIN', entrada: { rol: 'ADMIN' }, esperado: { rol: 'ADMIN' } },
  { id: 'R-02', tecnica: 'PE', descripcion: 'minúsculas "cliente"', entrada: { rol: 'cliente' }, esperado: { rol: 'CLIENTE' } },
  { id: 'R-03', tecnica: 'PE', descripcion: 'rol inexistente', entrada: { rol: 'JEFE' } },
  { id: 'R-04', tecnica: 'PE', descripcion: 'cadena vacía (sin filtro)', entrada: { rol: '' }, esperado: { rol: undefined } },
]);

probarCasos('Activo (true o false)', [
  { id: 'A-01', tecnica: 'PE', descripcion: 'true', entrada: { activo: 'true' }, esperado: { activo: true } },
  { id: 'A-02', tecnica: 'PE', descripcion: 'false', entrada: { activo: 'false' }, esperado: { activo: false } },
  { id: 'A-03', tecnica: 'PE', descripcion: 'otro texto "si"', entrada: { activo: 'si' } },
  { id: 'A-04', tecnica: 'PE', descripcion: 'cadena vacía (sin filtro)', entrada: { activo: '' }, esperado: { activo: undefined } },
]);

probarCasos('Texto de búsqueda (máximo 100 caracteres tras limpiar)', [
  { id: 'X-01', tecnica: 'PE', descripcion: 'texto normal', entrada: { texto: 'ana' }, esperado: { texto: 'ana' } },
  { id: 'X-02', tecnica: 'PE', descripcion: 'con espacios alrededor (se limpian)', entrada: { texto: '  ana  ' }, esperado: { texto: 'ana' } },
  { id: 'X-03', tecnica: 'PE', descripcion: 'solo espacios (sin filtro)', entrada: { texto: '   ' }, esperado: { texto: undefined } },
  { id: 'X-04', tecnica: 'VL', descripcion: '100 caracteres (máximo)', entrada: { texto: repetir('a', 100) }, esperado: { texto: repetir('a', 100) } },
  { id: 'X-05', tecnica: 'VL', descripcion: '101 caracteres', entrada: { texto: repetir('a', 101) } },
]);

describe('Combinación de filtros', () => {
  it('M-01 [PE] varios filtros inválidos a la vez -> informa todos los problemas', () => {
    assert.throws(
      () => interpretarFiltros({ rol: 'JEFE', activo: 'quizá', pagina: '0', tamano: '51' }),
      (error: unknown) => error instanceof ErrorDeValidacion && error.problemas.length === 4,
    );
  });
});
