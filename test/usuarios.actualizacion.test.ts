import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { verificarContrasena } from '../src/usuarios/contrasena';
import { ErrorCorreoDuplicado, ErrorDeValidacion, ErrorUsuarioNoEncontrado } from '../src/usuarios/usuario.errores';
import { ServicioUsuarios } from '../src/usuarios/usuario.servicio';
import { RepositorioEnMemoria } from './repositorio-en-memoria';

async function crearEscenario() {
  const repositorio = new RepositorioEnMemoria();
  const servicio = new ServicioUsuarios(repositorio);
  const ana = await servicio.registrar({
    nombreCompleto: 'Ana Ruiz',
    correo: 'ana@mail.example',
    contrasena: 'Clave12345',
    telefono: '6141112233',
  });
  const luis = await servicio.registrar({
    nombreCompleto: 'Luis Pérez',
    correo: 'luis@mail.example',
    contrasena: 'Clave12345',
  });
  return { repositorio, servicio, ana, luis };
}

describe('actualización de usuarios', () => {
  it('cambia solo los campos recibidos y limpia los datos', async () => {
    const { servicio, ana } = await crearEscenario();
    const actualizado = await servicio.actualizar(ana.idUsuario, { nombreCompleto: '  Ana María Ruiz ' });

    assert.equal(actualizado.nombreCompleto, 'Ana María Ruiz');
    assert.equal(actualizado.correo, 'ana@mail.example');
    assert.equal(actualizado.telefono, '6141112233');
  });

  it('permite cambiar el correo y lo normaliza', async () => {
    const { servicio, ana } = await crearEscenario();
    const actualizado = await servicio.actualizar(ana.idUsuario, { correo: ' NUEVO@Mail.Example ' });
    assert.equal(actualizado.correo, 'nuevo@mail.example');
  });

  it('permite conservar el propio correo', async () => {
    const { servicio, ana } = await crearEscenario();
    const actualizado = await servicio.actualizar(ana.idUsuario, { correo: 'ANA@mail.example', telefono: '6149998877' });
    assert.equal(actualizado.telefono, '6149998877');
  });

  it('rechaza un correo que ya usa otra cuenta', async () => {
    const { servicio, ana } = await crearEscenario();
    await assert.rejects(() => servicio.actualizar(ana.idUsuario, { correo: 'luis@mail.example' }), ErrorCorreoDuplicado);
  });

  it('borra el teléfono cuando se envía null o vacío', async () => {
    const { servicio, ana } = await crearEscenario();
    assert.equal((await servicio.actualizar(ana.idUsuario, { telefono: null })).telefono, null);
    await servicio.actualizar(ana.idUsuario, { telefono: '6141112233' });
    assert.equal((await servicio.actualizar(ana.idUsuario, { telefono: '  ' })).telefono, null);
  });

  it('guarda la nueva contraseña como hash y no la devuelve', async () => {
    const { repositorio, servicio, ana } = await crearEscenario();
    const actualizado = await servicio.actualizar(ana.idUsuario, { contrasena: 'NuevaClave99' });

    assert.equal('contrasenaHash' in actualizado, false);
    assert.equal(await verificarContrasena('NuevaClave99', repositorio.guardados[0].contrasenaHash), true);
  });

  it('ignora el rol y cualquier campo no permitido', async () => {
    const { repositorio, servicio, ana } = await crearEscenario();
    await servicio.actualizar(ana.idUsuario, { nombreCompleto: 'Ana R.', rol: 'ADMIN' } as never);
    assert.equal(repositorio.guardados[0].rol, 'CLIENTE');
  });

  it('exige al menos un campo para actualizar', async () => {
    const { servicio, ana } = await crearEscenario();
    await assert.rejects(() => servicio.actualizar(ana.idUsuario, {}), ErrorDeValidacion);
    await assert.rejects(() => servicio.actualizar(ana.idUsuario, { rol: 'ADMIN' } as never), ErrorDeValidacion);
  });

  it('valida solo los campos enviados e informa todos los problemas', async () => {
    const { servicio, ana } = await crearEscenario();
    await assert.rejects(
      () => servicio.actualizar(ana.idUsuario, { nombreCompleto: '', correo: 'sin-arroba', contrasena: 'corta' }),
      (error: unknown) => {
        assert.ok(error instanceof ErrorDeValidacion);
        assert.equal(error.problemas.length, 3);
        return true;
      },
    );
  });

  it('avisa si el usuario no existe', async () => {
    const { servicio } = await crearEscenario();
    await assert.rejects(() => servicio.actualizar(99, { nombreCompleto: 'Nadie' }), ErrorUsuarioNoEncontrado);
  });
});
