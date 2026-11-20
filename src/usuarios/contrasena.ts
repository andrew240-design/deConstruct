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
const PATRON_HEXADECIMAL = /^[0-9a-f]+$/i;

/** Genera "scrypt$sal$clave" (cabe sobradamente en VARCHAR(255)). */
export async function hashearContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(LONGITUD_SAL);
  const clave = await calcularScrypt(contrasena, sal, LONGITUD_CLAVE);
  return [ALGORITMO, sal.toString('hex'), clave.toString('hex')].join(SEPARADOR);
}

export async function verificarContrasena(contrasena: string, hashGuardado: string): Promise<boolean> {
  const partes = hashGuardado.split(SEPARADOR);
  if (!tieneFormatoValido(partes)) return false; // un hash dañado nunca debe aceptar una contraseña

  const [, salHex, claveHex] = partes;
  const claveEsperada = Buffer.from(claveHex, 'hex');
  const claveCalculada = await calcularScrypt(contrasena, Buffer.from(salHex, 'hex'), LONGITUD_CLAVE);
  return timingSafeEqual(claveEsperada, claveCalculada);
}

function tieneFormatoValido(partes: string[]): boolean {
  const [algoritmo, salHex, claveHex] = partes;
  return (
    partes.length === 3 &&
    algoritmo === ALGORITMO &&
    esHexadecimalDeBytes(salHex, LONGITUD_SAL) &&
    esHexadecimalDeBytes(claveHex, LONGITUD_CLAVE)
  );
}

function esHexadecimalDeBytes(texto: string, bytes: number): boolean {
  return texto.length === bytes * 2 && PATRON_HEXADECIMAL.test(texto);
}
