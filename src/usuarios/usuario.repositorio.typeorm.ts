import { FindOptionsWhere, Like, Not, QueryFailedError, Repository } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { ErrorCorreoDuplicado } from './usuario.errores';
import { RepositorioUsuarios } from './usuario.repositorio';
import {
  CambiosAlmacenables,
  FiltrosUsuarios,
  NuevoUsuario,
  PaginaAlmacenada,
  UsuarioAlmacenado,
} from './usuario.tipos';

// Números de error de SQL Server para llave única duplicada
const ERRORES_DE_UNICIDAD = [2601, 2627];

export class RepositorioUsuariosTypeorm implements RepositorioUsuarios {
  constructor(private readonly repositorio: Repository<Usuario>) {}

  existeCorreo(correo: string, excluirIdUsuario?: number): Promise<boolean> {
    return this.repositorio.exists({
      where: { correo, ...(excluirIdUsuario !== undefined && { idUsuario: Not(excluirIdUsuario) }) },
    });
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

  async actualizar(idUsuario: number, cambios: CambiosAlmacenables): Promise<UsuarioAlmacenado> {
    try {
      await this.repositorio.update({ idUsuario }, cambios);
      return await this.repositorio.findOneByOrFail({ idUsuario });
    } catch (error) {
      if (esViolacionDeUnicidad(error)) throw new ErrorCorreoDuplicado(cambios.correo ?? '');
      throw error;
    }
  }

  buscarPorId(idUsuario: number): Promise<UsuarioAlmacenado | null> {
    return this.repositorio.findOneBy({ idUsuario });
  }

  async listar(filtros: FiltrosUsuarios): Promise<PaginaAlmacenada> {
    const [usuarios, total] = await this.repositorio.findAndCount({
      where: construirCondiciones(filtros),
      order: { idUsuario: 'ASC' },
      skip: (filtros.pagina - 1) * filtros.tamano,
      take: filtros.tamano,
    });
    return { usuarios, total };
  }
}

/** El texto se busca en nombre O correo, por eso devuelve una lista de condiciones alternativas. */
function construirCondiciones(filtros: FiltrosUsuarios): FindOptionsWhere<Usuario>[] {
  const base: FindOptionsWhere<Usuario> = {
    ...(filtros.rol !== undefined && { rol: filtros.rol }),
    ...(filtros.activo !== undefined && { activo: filtros.activo }),
  };
  if (filtros.texto === undefined) return [base];

  const patron = Like(`%${escaparComodines(filtros.texto)}%`);
  return [
    { ...base, nombreCompleto: patron },
    { ...base, correo: patron },
  ];
}

/** En LIKE de SQL Server los caracteres [ % _ se escapan encerrándolos entre corchetes. */
function escaparComodines(texto: string): string {
  return texto.replace(/[[%_]/g, (caracter) => `[${caracter}]`);
}

function esViolacionDeUnicidad(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const numero = (error.driverError as { number?: number } | undefined)?.number;
  return numero !== undefined && ERRORES_DE_UNICIDAD.includes(numero);
}
