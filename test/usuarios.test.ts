import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { Server } from 'node:http';
import { crearServidorHttp } from '../src/http/servidor-http';
import { hashearContrasena, verificarContrasena } from '../src/usuarios/contrasena';
import { ErrorCorreoDuplicado, ErrorDeValidacion, ErrorUsuarioNoEncontrado } from '../src/usuarios/usuario.errores';
import { ServicioUsuarios } from '../src/usuarios/usuario.servicio';
import { RepositorioEnMemoria } from './repositorio-en-memoria';

const REGISTRO_VALIDO = {
  nombreCompleto: '  Ana Ruiz ',
  correo: ' ANA@Mail.Example ',
  contrasena: 'Clave12345',
  telefono: '6141112233',
};

describe('contraseña', () => {
  it('no se guarda en texto plano y se puede verificar', async () => {
    const hash = await hashearContrasena('Clave12345');
    assert.notEqual(hash, 'Clave12345');
    assert.ok(hash.length <= 255);
    assert.equal(await verificarContrasena('Clave12345', hash), true);
    assert.equal(await verificarContrasena('otraClave1', hash), false);
  });

  it('dos hashes de la misma contraseña son distintos (sal aleatoria)', async () => {
    assert.notEqual(await hashearContrasena('Clave12345'), await hashearContrasena('Clave12345'));
  });
});

describe('registro de usuarios', () => {
  it('registra, normaliza los datos y no devuelve la contraseña', async () => {
    const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
    const usuario = await servicio.registrar(REGISTRO_VALIDO);

    assert.equal(usuario.nombreCompleto, 'Ana Ruiz');
    assert.equal(usuario.correo, 'ana@mail.example');
    assert.equal('contrasenaHash' in usuario, false);
  });

  it('guarda la contraseña como hash', async () => {
    const repositorio = new RepositorioEnMemoria();
    await new ServicioUsuarios(repositorio).registrar(REGISTRO_VALIDO);
    assert.match(repositorio.guardados[0].contrasenaHash, /^scrypt\$/);
  });

  it('siempre asigna el rol CLIENTE, aunque la entrada pida ADMIN', async () => {
    const repositorio = new RepositorioEnMemoria();
    await new ServicioUsuarios(repositorio).registrar({ ...REGISTRO_VALIDO, rol: 'ADMIN' } as never);
    assert.equal(repositorio.guardados[0].rol, 'CLIENTE');
  });

  it('rechaza un correo repetido aunque cambien mayúsculas', async () => {
    const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
    await servicio.registrar(REGISTRO_VALIDO);
    await assert.rejects(
      () => servicio.registrar({ ...REGISTRO_VALIDO, correo: 'ANA@MAIL.EXAMPLE' }),
      ErrorCorreoDuplicado,
    );
  });

  it('informa todos los problemas de validación a la vez', async () => {
    const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
    await assert.rejects(
      () => servicio.registrar({ nombreCompleto: '', correo: 'sin-arroba', contrasena: 'corta', telefono: '123' }),
      (error: unknown) => {
        assert.ok(error instanceof ErrorDeValidacion);
        assert.equal(error.problemas.length, 4);
        return true;
      },
    );
  });

  it('trata los valores que no son texto como datos faltantes', async () => {
    const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
    await assert.rejects(() => servicio.registrar({ nombreCompleto: 42, correo: null, contrasena: {} }), ErrorDeValidacion);
  });

  it('acepta el teléfono como opcional', async () => {
    const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
    const usuario = await servicio.registrar({ ...REGISTRO_VALIDO, telefono: undefined });
    assert.equal(usuario.telefono, null);
  });

  it('avisa cuando el usuario consultado no existe', async () => {
    const servicio = new ServicioUsuarios(new RepositorioEnMemoria());
    await assert.rejects(() => servicio.consultarPorId(99), ErrorUsuarioNoEncontrado);
  });
});

describe('API HTTP', () => {
  let servidor: Server;
  let base: string;

  before(async () => {
    servidor = crearServidorHttp(new ServicioUsuarios(new RepositorioEnMemoria()));
    await new Promise<void>((listo) => servidor.listen(0, listo));
    base = `http://localhost:${(servidor.address() as AddressInfo).port}`;
  });
  after(() => servidor.close());

  const enviar = (cuerpo: string) =>
    fetch(`${base}/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo });

  it('POST /usuarios responde 201 y GET /usuarios/:id lo recupera', async () => {
    const creado = await enviar(JSON.stringify(REGISTRO_VALIDO));
    assert.equal(creado.status, 201);
    const { usuario } = (await creado.json()) as { usuario: { idUsuario: number; contrasenaHash?: string } };
    assert.equal(usuario.contrasenaHash, undefined);

    const consultado = await fetch(`${base}/usuarios/${usuario.idUsuario}`);
    assert.equal(consultado.status, 200);
  });

  it('responde 400 con los problemas cuando los datos son inválidos', async () => {
    const respuesta = await enviar(JSON.stringify({ correo: 'x' }));
    assert.equal(respuesta.status, 400);
    assert.ok(((await respuesta.json()) as { problemas: string[] }).problemas.length > 0);
  });

  it('responde 400 si el cuerpo no es JSON', async () => {
    assert.equal((await enviar('esto no es json')).status, 400);
  });

  it('responde 409 con un correo repetido', async () => {
    const datos = { ...REGISTRO_VALIDO, correo: 'repetido@mail.example' };
    await enviar(JSON.stringify(datos));
    assert.equal((await enviar(JSON.stringify(datos))).status, 409);
  });

  it('responde 404 si el usuario no existe', async () => {
    assert.equal((await fetch(`${base}/usuarios/9999`)).status, 404);
  });
});
