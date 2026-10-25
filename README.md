# Cantoral Coral — Sistema Integral de Gestión de Coros, Cantos, Misas y Ensayos (Versión 2.0 Completa)

Plataforma web integral, cerrada bajo autenticación, para la gestión del repertorio litúrgico, calendario manipulable de eventos, estructuración de cronogramas de misa (con vista de letra y acordes en orden) y planificación detallada de ensayos para coros.

---

## 🌟 Módulos Incluidos en el Sistema Completo
1. **Autenticación Cerrada y Control de Roles (`Director` y `Miembro`)**.
2. **Buscador Libre y Gestión de Cantos**:
   - Subida exclusiva por el Director con decisión de visibilidad **Público (para otros coros)** o **Privado (solo mi coro)**.
   - División por Tiempo en el Año en el orden exacto: **Ordinario - Cuaresma - Pascua - Adviento - Navidad**.
   - División por Apropiación para Misa: **Litúrgico - No litúrgico**.
   - Visor interactivo de letra y acordes con transposición de tono (`-1` / `+1`) y Modo Atril.
3. **Calendario Manipulable del Coro**:
   - Cuadrícula mensual interactiva + Agenda.
   - Reprogramación de eventos mediante **Drag & Drop** (arrastrar y soltar) o controles rápidos.
   - Vinculación en 1 clic a Cronogramas de Misa y Cronogramas de Ensayo.
4. **Cronogramas de Misa + Modo Atril en Vivo**:
   - Estructuración del orden litúrgico de los cantos de una Misa, con definición de tono específico para esa celebración y notas del director.
   - Vista de lectura paso a paso o continua de la letra y acordes de toda la Misa en orden.
5. **Cronogramas de Ensayo ("Saber qué se hará a cabalidad")**:
   - Planificación exhaustiva por bloques de actividad y duración, objetivo general, checklist de avance en tiempo real y cantos vinculados con acceso directo a letra y acordes.
6. **Gestión de Mi Coro**:
   - Listado de miembros, instrumentos/voces y código de invitación.

---

## 🚀 Despliegue Rápido con Docker (Full Docker: Base de Datos + API + Web)

El sistema está completamente contenedorizado (PostgreSQL 16 + API Bun/Elysia/Prisma + Frontend React/TypeScript/Tailwind).

### 1. Levantar todo el sistema
```bash
docker compose up --build -d
```

Al iniciar, el contenedor `cantos-api` sincroniza automáticamente el esquema de Prisma con PostgreSQL y ejecuta el *seed* inicial con coros, directores, miembros y repertorio litúrgico de prueba.

### 2. Accesos locales
- **Aplicación Web (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **Servidor API REST (ElysiaJS)**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **Documentación Swagger / OpenAPI**: [http://localhost:4000/swagger](http://localhost:4000/swagger)
- **Base de Datos PostgreSQL**: `localhost:5435` (`cantos_user` / `cantos_password` / `cantos_db`)

---

## 🔐 Cuentas de Demostración Pre-cargadas (Contraseña: `123456`)

| Rol | Correo | Coro | Permisos |
| :--- | :--- | :--- | :--- |
| **Director** | `director@santacecilia.org` | Coro Santa Cecilia | Subir/editar cantos de su coro y decidir si son Públicos o Privados. |
| **Miembro** | `miembro@santacecilia.org` | Coro Santa Cecilia | Buscar y leer cantos privados de su coro + públicos de otros coros. |
| **Director** | `director@sanmiguel.org` | Coro San Miguel Arcángel | Administrar repertorio de su coro y compartir cantos públicos. |
| **Miembro** | `miembro@sanmiguel.org` | Coro San Miguel Arcángel | Consultar cantos de su coro + los públicos de Coro Santa Cecilia. |

---

## 📚 Documentación del Proyecto
- [DOCUMENTACION.md](DOCUMENTACION.md): Especificación funcional, arquitectura, modelo entidad-relación y endpoints de la Versión 1.
- [GUIA_DEFENSA.md](GUIA_DEFENSA.md): Guía de estudio completa para la defensa del sistema (funcionalidad, diseño, estructura e implementación).
