export type RolUsuario = 'CLIENTE' | 'ADMIN' | 'ASESOR';

/** Lo que llega desde afuera (formulario o JSON): puede traer cualquier tipo de valor. */
export type EntradaRegistro = {
  [campo in 'nombreCompleto' | 'correo' | 'contrasena' | 'telefono']?: unknown;
};

/** Datos ya limpiados y listos para validar. */
export interface DatosRegistro {
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  telefono: string | null;
}

export interface NuevoUsuario {
  nombreCompleto: string;
  correo: string;
  contrasenaHash: string;
  telefono: string | null;
  rol: RolUsuario;
}

export interface UsuarioAlmacenado extends NuevoUsuario {
  idUsuario: number;
  activo: boolean;
  fechaRegistro: Date;
}

/** Lo único que se devuelve al exterior: nunca incluye la contraseña. */
export type UsuarioPublico = Omit<UsuarioAlmacenado, 'contrasenaHash'>;
