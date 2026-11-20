/**
 * Hallazgo adicional: verificarContrasena frente a hashes guardados con formato incorrecto.
 * Partición de equivalencia sobre el formato "scrypt$<sal 16 bytes>$<clave 64 bytes>" y
 * valores límite en la longitud de la sal y de la clave.
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { hashearContrasena, verificarContrasena } from '../src/usuarios/contrasena';

const CONTRASENA = 'Clave12345';

describe('verificarContrasena con hashes de formato incorrecto', () => {
  let algoritmo: string;
  let sal: string;
  let clave: string;

  before(async () => {
    [algoritmo, sal, clave] = (await hashearContrasena(CONTRASENA)).split('$');
  });

  const armar = (a: string, s: string, c: string) => [a, s, c].join('$');

  it('V-01 [PE] hash válido y contraseña correcta -> true', async () => {
    assert.equal(await verificarContrasena(CONTRASENA, armar(algoritmo, sal, clave)), true);
  });

  it('V-02 [PE] hash válido y contraseña incorrecta -> false', async () => {
    assert.equal(await verificarContrasena('OtraClave99', armar(algoritmo, sal, clave)), false);
  });

  const hashesInvalidos: Array<[string, string, () => string]> = [
    ['V-03', 'clave no hexadecimal y corta ("zz")', () => armar(algoritmo, '00', 'zz')],
    ['V-04', 'clave no hexadecimal con la longitud correcta', () => armar(algoritmo, sal, 'zz'.repeat(64))],
    ['V-05', 'clave de 63 bytes (un byte menos)', () => armar(algoritmo, sal, clave.slice(0, 126))],
    ['V-06', 'clave de 65 bytes (un byte más)', () => armar(algoritmo, sal, `${clave}ab`)],
    ['V-07', 'sal de 15 bytes', () => armar(algoritmo, sal.slice(0, 30), clave)],
    ['V-08', 'sal de 17 bytes', () => armar(algoritmo, `${sal}00`, clave)],
    ['V-09', 'algoritmo distinto', () => armar('bcrypt', sal, clave)],
    ['V-10', 'parte sobrante al final', () => `${armar(algoritmo, sal, clave)}$extra`],
    ['V-11', 'sin separadores', () => 'scrypt'],
    ['V-12', 'cadena vacía', () => ''],
  ];

  for (const [id, descripcion, construir] of hashesInvalidos) {
    it(`${id} [VL/PE] ${descripcion} -> false aunque la contraseña sea la correcta`, async () => {
      assert.equal(await verificarContrasena(CONTRASENA, construir()), false);
    });
  }

  it('V-13 [PE] hash corrupto no debe aceptar una contraseña cualquiera', async () => {
    assert.equal(await verificarContrasena('cualquier-cosa', 'scrypt$00$zz'), false);
  });
});
