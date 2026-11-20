/**
 * Función 1: validación y limpieza de los datos de registro (ServicioUsuarios.registrar).
 * Técnicas: partición de equivalencia (PE) y análisis de valores límite (VL).
 * Cada caso tiene un ID que se documenta en el informe de pruebas.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ErrorDeValidacion } from '../src/usuarios/usuario.errores';
import { ServicioUsuarios } from '../src/usuarios/usuario.servicio';
import { RepositorioEnMemoria } from './repositorio-en-memoria';

type Tecnica = 'PE' | 'VL';

interface Caso {
  id: string;
  tecnica: Tecnica;
  descripcion: string;
  valor: unknown;
  valido: boolean;
}

const DATOS_VALIDOS = {
  nombreCompleto: 'Ana Ruiz',
  correo: 'ana@mail.example',
  contrasena: 'Clave12345',
  telefono: '6141112233',
};

const repetir = (texto: string, veces: number) => texto.repeat(veces);

/** Correo válido con exactamente `longitud` caracteres (válido entre 70 y 132). */
const correoConLongitud = (longitud: number) =>
  `${repetir('a', 64)}@${repetir('b', longitud - 64 - 1 - '.com'.length)}.com`;

/** Contraseña con letra y número, de exactamente `longitud` caracteres (mínimo 6). */
const contrasenaConLongitud = (longitud: number) => `Clave1${repetir('x', longitud - 6)}`;

async function registrarConCampo(campo: keyof typeof DATOS_VALIDOS, valor: unknown) {
  const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
  return servicio.registrar({ ...DATOS_VALIDOS, [campo]: valor });
}

function probarCasos(titulo: string, campo: keyof typeof DATOS_VALIDOS, casos: Caso[]) {
  describe(titulo, () => {
    for (const caso of casos) {
      it(`${caso.id} [${caso.tecnica}] ${caso.descripcion} -> ${caso.valido ? 'acepta' : 'rechaza'}`, async () => {
        if (caso.valido) {
          const usuario = await registrarConCampo(campo, caso.valor);
          assert.equal('contrasenaHash' in usuario, false);
        } else {
          await assert.rejects(() => registrarConCampo(campo, caso.valor), ErrorDeValidacion);
        }
      });
    }
  });
}

probarCasos('Nombre completo (1 a 100 caracteres tras limpiar)', 'nombreCompleto', [
  { id: 'N-01', tecnica: 'PE', descripcion: 'nombre normal', valor: 'Ana Ruiz', valido: true },
  { id: 'N-02', tecnica: 'VL', descripcion: '1 carácter (mínimo)', valor: 'A', valido: true },
  { id: 'N-03', tecnica: 'VL', descripcion: '0 caracteres (vacío)', valor: '', valido: false },
  { id: 'N-04', tecnica: 'PE', descripcion: 'solo espacios (queda vacío al limpiar)', valor: '   ', valido: false },
  { id: 'N-05', tecnica: 'VL', descripcion: '100 caracteres (máximo)', valor: repetir('a', 100), valido: true },
  { id: 'N-06', tecnica: 'VL', descripcion: '101 caracteres', valor: repetir('a', 101), valido: false },
  { id: 'N-07', tecnica: 'VL', descripcion: '100 caracteres con espacios alrededor (se limpian)', valor: ` ${repetir('a', 100)} `, valido: true },
  { id: 'N-08', tecnica: 'PE', descripcion: 'tipo incorrecto (número)', valor: 12345, valido: false },
]);

probarCasos('Correo (formato válido, máximo 120 caracteres)', 'correo', [
  { id: 'C-01', tecnica: 'PE', descripcion: 'correo normal', valor: 'ana@mail.example', valido: true },
  { id: 'C-02', tecnica: 'PE', descripcion: 'con mayúsculas (se normaliza)', valor: 'ANA@MAIL.EXAMPLE', valido: true },
  { id: 'C-03', tecnica: 'PE', descripcion: 'vacío', valor: '', valido: false },
  { id: 'C-04', tecnica: 'PE', descripcion: 'sin arroba', valor: 'anamail.example', valido: false },
  { id: 'C-05', tecnica: 'PE', descripcion: 'sin dominio', valor: 'ana@', valido: false },
  { id: 'C-06', tecnica: 'PE', descripcion: 'dos arrobas', valor: 'ana@@mail.example', valido: false },
  { id: 'C-07', tecnica: 'PE', descripcion: 'espacio dentro', valor: 'a na@mail.example', valido: false },
  { id: 'C-08', tecnica: 'PE', descripcion: 'dominio sin punto', valor: 'ana@mail', valido: false },
  { id: 'C-09', tecnica: 'PE', descripcion: 'puntos consecutivos en el dominio', valor: 'ana@mail..example', valido: false },
  { id: 'C-10', tecnica: 'PE', descripcion: 'termina en punto', valor: 'ana@mail.example.', valido: false },
  { id: 'C-11', tecnica: 'PE', descripcion: 'parte local que empieza con punto', valor: '.ana@mail.example', valido: false },
  { id: 'C-12', tecnica: 'PE', descripcion: 'puntos consecutivos en la parte local', valor: 'a..na@mail.example', valido: false },
  { id: 'C-13', tecnica: 'VL', descripcion: 'extensión de 1 letra', valor: 'ana@mail.e', valido: false },
  { id: 'C-14', tecnica: 'VL', descripcion: 'extensión de 2 letras', valor: 'ana@mail.mx', valido: true },
  { id: 'C-15', tecnica: 'VL', descripcion: '120 caracteres (máximo)', valor: correoConLongitud(120), valido: true },
  { id: 'C-16', tecnica: 'VL', descripcion: '121 caracteres', valor: correoConLongitud(121), valido: false },
  { id: 'C-17', tecnica: 'PE', descripcion: 'tipo incorrecto (número)', valor: 42, valido: false },
]);

probarCasos('Contraseña (8 a 128 caracteres, con letra y número)', 'contrasena', [
  { id: 'P-01', tecnica: 'PE', descripcion: 'contraseña normal', valor: 'Clave12345', valido: true },
  { id: 'P-02', tecnica: 'VL', descripcion: '7 caracteres', valor: contrasenaConLongitud(7), valido: false },
  { id: 'P-03', tecnica: 'VL', descripcion: '8 caracteres (mínimo)', valor: contrasenaConLongitud(8), valido: true },
  { id: 'P-04', tecnica: 'VL', descripcion: '128 caracteres (máximo)', valor: contrasenaConLongitud(128), valido: true },
  { id: 'P-05', tecnica: 'VL', descripcion: '129 caracteres', valor: contrasenaConLongitud(129), valido: false },
  { id: 'P-06', tecnica: 'PE', descripcion: 'solo letras', valor: 'ClaveSegura', valido: false },
  { id: 'P-07', tecnica: 'PE', descripcion: 'solo números', valor: '12345678', valido: false },
  { id: 'P-08', tecnica: 'PE', descripcion: 'vacía', valor: '', valido: false },
  { id: 'P-09', tecnica: 'PE', descripcion: '8 caracteres contando 2 espacios al inicio (no se recorta)', valor: '  Clave1', valido: true },
  { id: 'P-10', tecnica: 'PE', descripcion: 'tipo incorrecto (número)', valor: 12345678, valido: false },
]);

probarCasos('Teléfono (opcional; 10 a 14 dígitos, con + opcional)', 'telefono', [
  { id: 'T-01', tecnica: 'PE', descripcion: 'no se envía (opcional)', valor: undefined, valido: true },
  { id: 'T-02', tecnica: 'PE', descripcion: 'null', valor: null, valido: true },
  { id: 'T-03', tecnica: 'PE', descripcion: 'cadena de espacios (se interpreta como sin teléfono)', valor: '   ', valido: true },
  { id: 'T-04', tecnica: 'VL', descripcion: '9 dígitos', valor: '614111223', valido: false },
  { id: 'T-05', tecnica: 'VL', descripcion: '10 dígitos (mínimo)', valor: '6141112233', valido: true },
  { id: 'T-06', tecnica: 'VL', descripcion: '14 dígitos (máximo)', valor: '61411122334455', valido: true },
  { id: 'T-07', tecnica: 'VL', descripcion: '15 dígitos', valor: '614111223344556', valido: false },
  { id: 'T-08', tecnica: 'PE', descripcion: '+ y 10 dígitos', valor: '+6141112233', valido: true },
  { id: 'T-09', tecnica: 'VL', descripcion: '+ y 14 dígitos (15 caracteres, cabe en la columna)', valor: '+61411122334455', valido: true },
  { id: 'T-10', tecnica: 'VL', descripcion: '+ y 15 dígitos (16 caracteres, no cabe)', valor: '+614111223344556', valido: false },
  { id: 'T-11', tecnica: 'PE', descripcion: 'contiene una letra', valor: '614111223a', valido: false },
  { id: 'T-12', tecnica: 'PE', descripcion: 'contiene guiones', valor: '614-111-2233', valido: false },
  { id: 'T-13', tecnica: 'PE', descripcion: '+ en medio', valor: '61411+12233', valido: false },
  { id: 'T-14', tecnica: 'PE', descripcion: 'tipo incorrecto (número)', valor: 6141112233, valido: false },
  { id: 'T-15', tecnica: 'PE', descripcion: 'tipo incorrecto (booleano)', valor: true, valido: false },
]);

describe('Actualización: un teléfono con tipo incorrecto no debe borrar el existente', () => {
  it('T-16 [PE] actualizar con teléfono numérico -> rechaza y conserva el teléfono guardado', async () => {
    const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
    const usuario = await servicio.registrar(DATOS_VALIDOS);

    await assert.rejects(() => servicio.actualizar(usuario.idUsuario, { telefono: 6149998877 }), ErrorDeValidacion);
    assert.equal((await servicio.consultarPorId(usuario.idUsuario)).telefono, '6141112233');
  });
});
