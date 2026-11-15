# DeConstruct: usuarios (registro, consulta y actualización)

Procesos de la entidad principal (Usuario): alta, consulta y actualización, con TypeScript, Node.js, TypeORM y SQL Server.

## Contenido del zip
- `src/`: código fuente (módulo `usuarios`, API HTTP, conexión y entidades).
- `test/`: pruebas automáticas (37 pruebas).
- `.github/workflows/ci.yml`: pipeline de integración continua (tipos + pruebas).
- `docs/Backlog_Sprint1.docx`: backlog del producto y backlog priorizado del sprint.
- `docs/Retrospectiva_Sprint1.docx`: retrospectiva escrita.

## Cómo ejecutarlo
1. `npm install`
2. Copia `.env.example` como `.env` y escribe tus datos de SQL Server.
3. `npm run verificar-tipos`: comprueba que el código compila.
4. `npm test`: ejecuta las pruebas (no necesitan la base de datos). Es lo mismo que ejecuta el CI.
5. Registro contra la base, de dos maneras:
   - **Demostración directa:** `npm run registrar-demo`
   - **API:** `npm run servidor` y, en otra terminal de PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/usuarios -ContentType 'application/json' `
  -Body '{"nombreCompleto":"Ana Ruiz","correo":"ana.ruiz@mail.example","contrasena":"Clave12345","telefono":"6141112233"}'
```

6. Comprueba en SSMS: `SELECT * FROM DeConstruct.dbo.USUARIO;`

## Endpoints
| Método y ruta | Qué hace |
|---|---|
| `POST /usuarios` | Registra un usuario (rol siempre `CLIENTE`) |
| `GET /usuarios/{id}` | Consulta un usuario por id |
| `GET /usuarios?texto=&rol=&activo=&pagina=&tamano=` | Lista paginada; `texto` busca en nombre y correo |
| `PATCH /usuarios/{id}` | Actualiza solo los campos enviados: `nombreCompleto`, `correo`, `contrasena`, `telefono` |

Ejemplos (PowerShell):

```powershell
Invoke-RestMethod 'http://localhost:3000/usuarios?texto=ana&pagina=1&tamano=5'
Invoke-RestMethod -Method Patch -Uri http://localhost:3000/usuarios/3 -ContentType 'application/json' `
  -Body '{"nombreCompleto":"Ana María Ruiz","telefono":"6141119999"}'
```

Notas: el listado pagina de 10 en 10 por defecto (máximo 50); el rol no se puede cambiar desde `PATCH`
(la autorización llegará con el inicio de sesión); enviar `"telefono": null` borra el teléfono.

## Respuestas de la API
| Caso | Código |
|---|---|
| Usuario creado | 201 |
| Consulta o actualización correcta | 200 |
| Datos o filtros inválidos (incluye la lista de problemas) o JSON mal formado | 400 |
| Usuario inexistente | 404 |
| Correo ya usado por otra cuenta | 409 |

## Principios de código limpio aplicados
| Principio | Dónde se ve |
|---|---|
| Nombres claros | `exigirCorreoDisponible`, `armarNuevoUsuario`, `aUsuarioPublico`, `LONGITUD_MINIMA_CONTRASENA` |
| Funciones pequeñas | Cada validación (`validarNombre`, `validarCorreo`…) hace una sola cosa; `registrar` se lee como una receta de 4 pasos |
| Evitar duplicación | `textoLimpio` y `responderJson` se reutilizan; los límites y patrones son constantes únicas |
| Sin números mágicos | Longitudes, códigos de error de SQL Server y tamaño máximo del cuerpo son constantes con nombre |
| Una responsabilidad por módulo | Validación, contraseña, repositorio, servicio y HTTP están en archivos separados |
| Depender de contratos | El servicio usa la interfaz `RepositorioUsuarios`, por eso se prueba sin base de datos |

## Decisiones de seguridad
- La contraseña se guarda como hash `scrypt` con sal aleatoria; nunca se devuelve.
- El rol se asigna siempre como `CLIENTE`; no se acepta desde la entrada.
- El correo se normaliza a minúsculas y es único (también se controla la unicidad en la base).
