import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const calcularScrypt = promisify(scrypt) as (
  contrasena: string,
  sal: Buffer,
  longitudClave: number,
) => Promise<Buffer>;

const ALGORITMO = 'scrypt';
const LONGITUD_SAL = 16;
const LONGITUD_CLAVE = 64;
const SEPARADOR = '$';

/** Genera "scrypt$sal$clave" (cabe sobradamente en VARCHAR(255)). */
export async function hashearContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(LONGITUD_SAL);
  const clave = await calcularScrypt(contrasena, sal, LONGITUD_CLAVE);
  return [ALGORITMO, sal.toString('hex'), clave.toString('hex')].join(SEPARADOR);
}

export async function verificarContrasena(contrasena: string, hashGuardado: string): Promise<boolean> {
  const [algoritmo, salHex, claveHex] = hashGuardado.split(SEPARADOR);
  if (algoritmo !== ALGORITMO || !salHex || !claveHex) return false;

  const claveEsperada = Buffer.from(claveHex, 'hex');
  const claveCalculada = await calcularScrypt(contrasena, Buffer.from(salHex, 'hex'), claveEsperada.length);
  return timingSafeEqual(claveEsperada, claveCalculada);
}
