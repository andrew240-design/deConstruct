import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import {
  ErrorCorreoDuplicado,
  ErrorDeValidacion,
  ErrorSolicitudInvalida,
  ErrorUsuarioNoEncontrado,
} from '../usuarios/usuario.errores';
import { ServicioUsuarios } from '../usuarios/usuario.servicio';

const TAMANO_MAXIMO_CUERPO = 10_000; // bytes
const RUTA_USUARIOS = '/usuarios';
const PATRON_USUARIO_POR_ID = /^\/usuarios\/(\d+)$/;
const ID_MAXIMO = 2_147_483_647; // máximo de un INT de SQL Server

export function crearServidorHttp(servicio: ServicioUsuarios): Server {
  return createServer((solicitud, respuesta) => {
    void atender(solicitud, respuesta, servicio);
  });
}

async function atender(solicitud: IncomingMessage, respuesta: ServerResponse, servicio: ServicioUsuarios) {
  try {
    await enrutar(solicitud, respuesta, servicio);
  } catch (error) {
    responderError(respuesta, error);
  }
}

async function enrutar(solicitud: IncomingMessage, respuesta: ServerResponse, servicio: ServicioUsuarios) {
  const { pathname, searchParams } = new URL(solicitud.url ?? '/', 'http://localhost');
  const idUsuario = leerIdUsuario(pathname);

  if (pathname === RUTA_USUARIOS && solicitud.method === 'POST') {
    return registrarUsuario(solicitud, respuesta, servicio);
  }
  if (pathname === RUTA_USUARIOS && solicitud.method === 'GET') {
    return listarUsuarios(searchParams, respuesta, servicio);
  }
  if (idUsuario !== null && solicitud.method === 'GET') {
    return consultarUsuario(idUsuario, respuesta, servicio);
  }
  if (idUsuario !== null && solicitud.method === 'PATCH') {
    return actualizarUsuario(idUsuario, solicitud, respuesta, servicio);
  }
  responderJson(respuesta, 404, { error: 'Ruta no encontrada.' });
}

async function registrarUsuario(solicitud: IncomingMessage, respuesta: ServerResponse, servicio: ServicioUsuarios) {
  const usuario = await servicio.registrar(await leerCuerpoJson(solicitud));
  responderJson(respuesta, 201, { usuario });
}

async function listarUsuarios(parametros: URLSearchParams, respuesta: ServerResponse, servicio: ServicioUsuarios) {
  const pagina = await servicio.listar(Object.fromEntries(parametros));
  responderJson(respuesta, 200, pagina);
}

async function consultarUsuario(idUsuario: number, respuesta: ServerResponse, servicio: ServicioUsuarios) {
  const usuario = await servicio.consultarPorId(idUsuario);
  responderJson(respuesta, 200, { usuario });
}

async function actualizarUsuario(
  idUsuario: number,
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
  servicio: ServicioUsuarios,
) {
  const usuario = await servicio.actualizar(idUsuario, await leerCuerpoJson(solicitud));
  responderJson(respuesta, 200, { usuario });
}

/** Devuelve el id de rutas como /usuarios/7, o null si la ruta no es de ese tipo o el id no cabe en un INT. */
function leerIdUsuario(pathname: string): number | null {
  const coincidencia = PATRON_USUARIO_POR_ID.exec(pathname);
  if (!coincidencia) return null;
  const id = Number(coincidencia[1]);
  return id >= 1 && id <= ID_MAXIMO ? id : null;
}

async function leerCuerpoJson(solicitud: IncomingMessage): Promise<Record<string, unknown>> {
  const fragmentos: Buffer[] = [];
  let tamano = 0;
  for await (const fragmento of solicitud) {
    tamano += fragmento.length;
    if (tamano > TAMANO_MAXIMO_CUERPO) throw new ErrorSolicitudInvalida('El cuerpo es demasiado grande.');
    fragmentos.push(fragmento);
  }
  return interpretarJson(Buffer.concat(fragmentos).toString('utf-8'));
}

function interpretarJson(texto: string): Record<string, unknown> {
  try {
    const valor: unknown = JSON.parse(texto);
    if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
      return valor as Record<string, unknown>;
    }
  } catch {
    // se informa abajo con un mensaje claro
  }
  throw new ErrorSolicitudInvalida('El cuerpo debe ser un objeto JSON válido.');
}

function responderError(respuesta: ServerResponse, error: unknown) {
  if (error instanceof ErrorDeValidacion) {
    return responderJson(respuesta, 400, { error: error.message, problemas: error.problemas });
  }
  if (error instanceof ErrorSolicitudInvalida) return responderJson(respuesta, 400, { error: error.message });
  if (error instanceof ErrorUsuarioNoEncontrado) return responderJson(respuesta, 404, { error: error.message });
  if (error instanceof ErrorCorreoDuplicado) return responderJson(respuesta, 409, { error: error.message });

  console.error('Error no controlado:', error);
  responderJson(respuesta, 500, { error: 'Error interno del servidor.' });
}

function responderJson(respuesta: ServerResponse, estado: number, cuerpo: unknown) {
  respuesta.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
  respuesta.end(JSON.stringify(cuerpo));
}
