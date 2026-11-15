export class ErrorDeValidacion extends Error {
  constructor(readonly problemas: string[]) {
    super('Los datos de registro no son válidos.');
    this.name = 'ErrorDeValidacion';
  }
}

export class ErrorCorreoDuplicado extends Error {
  constructor(correo: string) {
    super(`Ya existe una cuenta con el correo ${correo}.`);
    this.name = 'ErrorCorreoDuplicado';
  }
}

export class ErrorUsuarioNoEncontrado extends Error {
  constructor(idUsuario: number) {
    super(`No existe un usuario con id ${idUsuario}.`);
    this.name = 'ErrorUsuarioNoEncontrado';
  }
}

export class ErrorSolicitudInvalida extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorSolicitudInvalida';
  }
}
