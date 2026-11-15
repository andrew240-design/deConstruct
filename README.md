# DeConstruct: Sprint 1 (registro de usuarios)

Proceso de alta de la entidad principal (Usuario) con TypeScript, Node.js, TypeORM y SQL Server.

## Contenido del zip
- `src/`: código fuente (módulo `usuarios`, API HTTP, conexión y entidades).
- `test/`: pruebas automáticas (15 pruebas).
- `docs/Backlog_Sprint1.docx`: backlog del producto y backlog priorizado del sprint.
- `docs/Retrospectiva_Sprint1.docx`: retrospectiva escrita.

## Cómo ejecutarlo
1. `npm install`
2. Copia `.env.example` como `.env` y escribe tus datos de SQL Server.
3. `npm run verificar-tipos`: comprueba que el código compila.
4. `npm test`: ejecuta las pruebas (no necesitan la base de datos).
5. Registro contra la base, de dos maneras:
   - **Demostración directa:** `npm run registrar-demo`
   - **API:** `npm run servidor` y, en otra terminal de PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/usuarios -ContentType 'application/json' `
  -Body '{"nombreCompleto":"Ana Ruiz","correo":"ana.ruiz@mail.example","contrasena":"Clave12345","telefono":"6141112233"}'
```

6. Comprueba en SSMS: `SELECT * FROM DeConstruct.dbo.USUARIO;`

## Respuestas de la API
| Caso | Código |
|---|---|
| Usuario creado | 201 |
| Datos inválidos (incluye la lista de problemas) o JSON mal formado | 400 |
| Usuario inexistente | 404 |
| Correo ya registrado | 409 |

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
