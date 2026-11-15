import { QueryFailedError, Repository } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { ErrorCorreoDuplicado } from './usuario.errores';
import { RepositorioUsuarios } from './usuario.repositorio';
import { NuevoUsuario, UsuarioAlmacenado } from './usuario.tipos';

// Números de error de SQL Server para llave única duplicada
const ERRORES_DE_UNICIDAD = [2601, 2627];

export class RepositorioUsuariosTypeorm implements RepositorioUsuarios {
  constructor(private readonly repositorio: Repository<Usuario>) {}

  existeCorreo(correo: string): Promise<boolean> {
    return this.repositorio.existsBy({ correo });
  }

  async guardar(nuevo: NuevoUsuario): Promise<UsuarioAlmacenado> {
    try {
      const guardado = await this.repositorio.save(this.repositorio.create(nuevo));
      // Se vuelve a leer porque fecha_registro la asigna la base de datos
      return await this.repositorio.findOneByOrFail({ idUsuario: guardado.idUsuario });
    } catch (error) {
      if (esViolacionDeUnicidad(error)) throw new ErrorCorreoDuplicado(nuevo.correo);
      throw error;
    }
  }

  buscarPorId(idUsuario: number): Promise<UsuarioAlmacenado | null> {
    return this.repositorio.findOneBy({ idUsuario });
  }
}

function esViolacionDeUnicidad(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const numero = (error.driverError as { number?: number } | undefined)?.number;
  return numero !== undefined && ERRORES_DE_UNICIDAD.includes(numero);
}
