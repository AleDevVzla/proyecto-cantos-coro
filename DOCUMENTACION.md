# Documentación Técnica y Funcional — Sistema de Gestión de Cantos para Coros (Versión 1.0)

## 1. Descripción General del Sistema
El **Sistema de Gestión de Cantos Litúrgicos** es una aplicación web moderna, responsiva e intuitiva diseñada para organizar, clasificar y compartir el repertorio musical de coros parroquiales y comunitarios dentro de un entorno **100% cerrado bajo autenticación**.

El sistema implementa dos módulos nucleares:
1. **Módulo de Autenticación Cerrada y Control de Acceso Basado en Roles (`Director` y `Miembro`)**.
2. **Módulo de Gestión, Clasificación Litúrgica y Búsqueda Libre de Cantos con Acordes Interactivos**.

---

## 2. Objetivos del Sistema
- **Seguridad y Privacidad**: Garantizar que el acceso al sistema requiera inicio de sesión obligatorio (Login), estableciendo a los miembros autenticados de los coros como el nivel base de acceso ("público interno").
- **Gestión por parte del Director**: Proveer un apartado exclusivo para que el Director del coro pueda registrar y administrar cantos (letra, acordes y clasificación), decidiendo si cada canto permanece **Privado** para su coro o **Público** para los demás coros registrados.
- **Clasificación Litúrgica Estandarizada**: Organizar el repertorio según el **Tiempo en el Año** (*Ordinario, Cuaresma, Pascua, Adviento, Navidad*) y su **Apropiación para la Misa** (*Litúrgico, No litúrgico*).
- **Búsqueda Libre e Intuitiva**: Permitir a directores y miembros buscar cantos de cualquier tipo de forma rápida y visualizar su letra y acordes con transposición de tono en tiempo real.

---

## 3. Modelo de Roles y Seguridad (Sistema Cerrado)

El sistema no permite el acceso a visitantes anónimos. Toda interacción requiere una sesión activa validada mediante tokens firmados (JWT).

| Rol en el Sistema | Nivel de Acceso | Permisos y Capacidades |
| :--- | :--- | :--- |
| **Director (`DIRECTOR`)** | Administración de Coro | - Iniciar sesión en la plataforma.<br>- Acceder al apartado de **Subida y Edición de Cantos**.<br>- Clasificar cada canto por Tiempo en el Año y por categoría Litúrgico / No litúrgico.<br>- Definir si un canto de su coro es **Privado** (solo visible para su coro) o **Público** (visible para los demás coros autenticados).<br>- Utilizar el buscador libre y el visor interactivo de cantos. |
| **Miembro (`MEMBER`)** | Base ("Público Autenticado") | - Iniciar sesión en la plataforma.<br>- Buscar y consultar libremente todos los cantos privados de su propio coro.<br>- Buscar y consultar todos los cantos que directores de otros coros hayan marcado como **Públicos**.<br>- Visualizar la letra y acordes de los cantos y ajustar el tono de lectura en su pantalla. |

---

## 4. Especificación Funcional de Módulos

### 4.1. Módulo de Autenticación (Login y Registro)
- **Inicio de Sesión**: Validación de credenciales (correo electrónico y contraseña encriptada con `bcrypt`).
- **Registro por Rol**: Permite crear un nuevo coro como `DIRECTOR` o unirse a un coro existente mediante su código de invitación como `MEMBER`.
- **Protección de Rutas**: Bloqueo automático de cualquier vista o endpoint si el usuario no cuenta con una sesión activa.

### 4.2. Apartado de Subida de Cantos (Exclusivo Director)
Formulario intuitivo con previsualización en tiempo real que permite al Director registrar:
- **Datos generales**: Título del canto, Autor / Comunidad y Tonalidad base (ej. `Do`, `Sol`, `Lam`).
- **Letra y Acordes**: Editor en formato estructurado (*ChordPro* `[Do]Letra`), que alinea automáticamente cada acorde sobre la sílaba correspondiente.
- **División por Tiempo en el Año** *(presentada estrictamente en este orden)*:
  1. **Ordinario**
  2. **Cuaresma**
  3. **Pascua**
  4. **Adviento**
  5. **Navidad**
- **División por Apropiación para una Misa**:
  - **Litúrgico**
  - **No litúrgico**
- **Control de Visibilidad Entre Coros**:
  - **Privado**: Visible únicamente para el director y los miembros de su propio coro.
  - **Público**: Visible para los directores y miembros de todos los coros registrados en el sistema.

### 4.3. Buscador Libre y Visor de Cantos
- **Búsqueda por texto libre**: Filtra instantáneamente por coincidencias en el título, autor o contenido de la letra.
- **Filtros combinables**:
  - **Por Tiempo en el Año**: Botones en el orden estricto *Ordinario → Cuaresma → Pascua → Adviento → Navidad*.
  - **Por Apropiación para Misa**: *Todos | Litúrgico | No litúrgico*.
  - **Por Alcance**: *Todos | Mi Coro | Otros Coros (Públicos)*.
- **Visor Interactivo de Letra y Acordes**:
  - Muestra la letra clara con los acordes posicionados en la parte superior de cada sílaba.
  - Incluye botones de **Transposición de Tono (`-1` / `+1` semitono)**, cambio entre notación Latina (`Do, Re, Mi`) y Americana (`C, D, E`), ajuste de tamaño de fuente y **Modo Atril Oscuro**.

---

## 5. Arquitectura y Stack Tecnológico

### 5.1. Tecnologías Utilizadas
- **Infraestructura**: **Docker & Docker Compose** (Contenedores aislados para Base de Datos, Backend API y Frontend Web)
- **Runtime & Gestor de Paquetes**: **Bun**
- **Frontend**: **React 19 + TypeScript + Vite + Tailwind CSS**
- **Backend (API REST)**: **ElysiaJS** sobre Bun (con validación estricta de esquemas y Swagger/OpenAPI)
- **ORM y Base de Datos**: **Prisma ORM** conectado a **PostgreSQL 16**
- **Autenticación**: **JWT (HMAC-SHA256) + Bcrypt Password Hashing**

### 5.2. Estructura del Monorepo
```text
cantos/
├── docker-compose.yml              # Orquestación Full Docker (db + api + web)
├── apps/
│   ├── web/                        # Aplicación Cliente (React + TypeScript + Tailwind)
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── components/         # ChordSheetViewer, LoginView, SongFormModal
│   │       ├── lib/                # Cliente HTTP tipado y gestión de sesión
│   │       └── App.tsx             # Buscador libre, filtros litúrgicos y visor
│   │
│   └── api/                        # Servidor Backend (Bun + Elysia + Prisma)
│       ├── Dockerfile
│       ├── prisma/
│       │   ├── schema.prisma       # Esquema relacional PostgreSQL
│       │   └── seed.ts             # Datos iniciales de demostración
│       └── src/
│           ├── auth.ts             # Firma y verificación de tokens JWT
│           └── index.ts            # Endpoints REST y reglas de negocio
│
└── packages/
    └── shared/                     # Constantes litúrgicas y motor de acordes ChordPro
```

---

## 6. Modelo de Base de Datos (Esquema Relacional)

```mermaid
erDiagram
    User ||--o{ ChoirMember : "pertenece a"
    Choir ||--o{ ChoirMember : "integra"
    Choir ||--o{ Song : "posee repertorio"
    User ||--o{ Song : "registra (Director)"

    User {
        uuid id PK
        string email UK
        string passwordHash
        string name
        datetime createdAt
    }

    Choir {
        uuid id PK
        string name
        string parish
        string inviteCode UK
        datetime createdAt
    }

    ChoirMember {
        uuid id PK
        uuid userId FK
        uuid choirId FK
        enum role "DIRECTOR | MEMBER"
        string instrument
    }

    Song {
        uuid id PK
        uuid choirId FK
        uuid createdById FK
        string title
        string author
        string baseKey
        text lyricsAndChords
        enum[] liturgicalSeasons "ORDINARIO | CUARESMA | PASCUA | ADVIENTO | NAVIDAD"
        enum massSuitability "LITURGICO | NO_LITURGICO"
        boolean isPublic "true = Publico para otros coros | false = Privado"
        datetime createdAt
        datetime updatedAt
    }
```

---

## 7. Endpoints de la API REST

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Credenciales | Autentica al usuario y devuelve su JWT, coro y rol (`DIRECTOR` o `MEMBER`). |
| `POST` | `/api/auth/register` | Registro | Crea un usuario y su coro (`DIRECTOR`) o lo une por código (`MEMBER`). |
| `GET` | `/api/auth/me` | `DIRECTOR` o `MEMBER` | Devuelve el perfil del usuario autenticado y datos de su coro. |
| `GET` | `/api/songs` | `DIRECTOR` o `MEMBER` | Buscador libre de cantos (`q`, `season`, `suitability`, `scope`). Aplica filtro estricto de visibilidad por coro. |
| `GET` | `/api/songs/:id` | `DIRECTOR` o `MEMBER` | Obtiene el detalle de un canto verificando que pertenezca al coro o sea público. |
| `POST` | `/api/songs` | **Solo `DIRECTOR`** | Registra un nuevo canto en el coro del director definiendo `isPublic`. |
| `PUT` | `/api/songs/:id` | **Solo `DIRECTOR` (Dueño)** | Actualiza los datos, acordes o visibilidad (`isPublic`) de un canto de su coro. |
| `DELETE` | `/api/songs/:id` | **Solo `DIRECTOR` (Dueño)** | Elimina un canto perteneciente al coro del director. |
