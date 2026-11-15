import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { crearServidorHttp } from '../src/http/servidor-http';
import { ErrorDeValidacion } from '../src/usuarios/usuario.errores';
import { ServicioUsuarios } from '../src/usuarios/usuario.servicio';
import { PaginaDeUsuarios } from '../src/usuarios/usuario.tipos';
import { RepositorioEnMemoria } from './repositorio-en-memoria';

async function crearServicioConUsuarios(cantidad: number) {
  const repositorio = new RepositorioEnMemoria();
  const servicio = new ServicioUsuarios(repositorio);
  for (let i = 1; i <= cantidad; i++) {
    await servicio.registrar({ nombreCompleto: `Usuario ${i}`, correo: `usuario${i}@mail.example`, contrasena: 'Clave12345' });
  }
  return { repositorio, servicio };
}

describe('consulta de usuarios', () => {
  it('pagina los resultados e informa el total', async () => {
    const { servicio } = await crearServicioConUsuarios(25);
    const primera = await servicio.listar({ pagina: '1', tamano: '10' });
    const ultima = await servicio.listar({ pagina: '3', tamano: '10' });

    assert.equal(primera.datos.length, 10);
    assert.equal(primera.total, 25);
    assert.equal(ultima.datos.length, 5);
  });

  it('usa valores por defecto cuando no hay parámetros', async () => {
    const { servicio } = await crearServicioConUsuarios(12);
    const pagina = await servicio.listar({});
    assert.deepEqual([pagina.pagina, pagina.tamano, pagina.datos.length], [1, 10, 10]);
  });

  it('busca por texto en nombre o correo, sin distinguir mayúsculas', async () => {
    const { servicio } = await crearServicioConUsuarios(15);
    assert.equal((await servicio.listar({ texto: 'USUARIO 7' })).total, 1);
    assert.equal((await servicio.listar({ texto: 'usuario1' })).total, 7); // usuario1 y usuario10 a 15
  });

  it('filtra por rol y por estado', async () => {
    const { repositorio, servicio } = await crearServicioConUsuarios(4);
    repositorio.guardados[0].rol = 'ADMIN';
    repositorio.guardados[1].activo = false;

    assert.equal((await servicio.listar({ rol: 'admin' })).total, 1);
    assert.equal((await servicio.listar({ activo: 'false' })).total, 1);
    assert.equal((await servicio.listar({ activo: 'true' })).total, 3);
  });

  it('nunca incluye la contraseña en el listado', async () => {
    const { servicio } = await crearServicioConUsuarios(2);
    const pagina = await servicio.listar({});
    assert.ok(pagina.datos.every((usuario) => !('contrasenaHash' in usuario)));
  });

  it('rechaza filtros inválidos informando todos los problemas', async () => {
    const { servicio } = await crearServicioConUsuarios(1);
    await assert.rejects(
      () => servicio.listar({ rol: 'JEFE', activo: 'quizá', pagina: '0', tamano: '500' }),
      (error: unknown) => {
        assert.ok(error instanceof ErrorDeValidacion);
        assert.equal(error.problemas.length, 4);
        return true;
      },
    );
  });
});

describe('API HTTP: actualización y consulta', () => {
  let servidor: Server;
  let base: string;

  before(async () => {
    const { servicio } = await crearServicioConUsuarios(3);
    servidor = crearServidorHttp(servicio);
    await new Promise<void>((listo) => servidor.listen(0, listo));
    base = `http://localhost:${(servidor.address() as AddressInfo).port}`;
  });
  after(() => servidor.close());

  const modificar = (id: number | string, cuerpo: unknown) =>
    fetch(`${base}/usuarios/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });

  it('PATCH /usuarios/:id responde 200 con el usuario actualizado', async () => {
    const respuesta = await modificar(1, { nombreCompleto: 'Nombre Nuevo' });
    assert.equal(respuesta.status, 200);
    const { usuario } = (await respuesta.json()) as { usuario: { nombreCompleto: string } };
    assert.equal(usuario.nombreCompleto, 'Nombre Nuevo');
  });

  it('PATCH responde 400 sin campos o con datos inválidos', async () => {
    assert.equal((await modificar(1, {})).status, 400);
    assert.equal((await modificar(1, { correo: 'x' })).status, 400);
  });

  it('PATCH responde 409 con un correo ya usado y 404 si el usuario no existe', async () => {
    assert.equal((await modificar(1, { correo: 'usuario2@mail.example' })).status, 409);
    assert.equal((await modificar(999, { nombreCompleto: 'Nadie' })).status, 404);
  });

  it('un id fuera del rango de un INT responde 404', async () => {
    assert.equal((await modificar('99999999999', { nombreCompleto: 'Nadie' })).status, 404);
    assert.equal((await fetch(`${base}/usuarios/0`)).status, 404);
  });

  it('GET /usuarios devuelve una página con filtros', async () => {
    const respuesta = await fetch(`${base}/usuarios?texto=usuario&tamano=2&pagina=2`);
    assert.equal(respuesta.status, 200);
    const pagina = (await respuesta.json()) as PaginaDeUsuarios;
    assert.deepEqual([pagina.total, pagina.pagina, pagina.tamano, pagina.datos.length], [3, 2, 2, 1]);
  });

  it('GET /usuarios responde 400 con parámetros inválidos', async () => {
    assert.equal((await fetch(`${base}/usuarios?tamano=abc`)).status, 400);
  });
});
