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

export const ROLES_VALIDOS: readonly RolUsuario[] = ['CLIENTE', 'ADMIN', 'ASESOR'];

/** Cambios aceptados al actualizar: solo vienen los campos que se quieren modificar. */
export interface CambiosUsuario {
  nombreCompleto?: string;
  correo?: string;
  contrasena?: string;
  telefono?: string | null; // null borra el teléfono
}

export type EntradaActualizacion = { [campo in keyof CambiosUsuario]?: unknown };

/** Cambios listos para guardar: la contraseña ya viene protegida. */
export interface CambiosAlmacenables {
  nombreCompleto?: string;
  correo?: string;
  contrasenaHash?: string;
  telefono?: string | null;
}

/** Parámetros de consulta tal como llegan de la URL. */
export type EntradaFiltros = Record<string, string | undefined>;

export interface FiltrosUsuarios {
  texto?: string; // se busca en nombre y correo
  rol?: RolUsuario;
  activo?: boolean;
  pagina: number;
  tamano: number;
}

export interface PaginaAlmacenada {
  usuarios: UsuarioAlmacenado[];
  total: number;
}

export interface PaginaDeUsuarios {
  datos: UsuarioPublico[];
  total: number;
  pagina: number;
  tamano: number;
}
