# Cantoral Coral — Sistema de Gestión de Cantos Litúrgicos (Versión 1.0)

Plataforma web cerrada bajo autenticación para la gestión, clasificación litúrgica y búsqueda libre de cantos con letras y acordes interactivos para coros.

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
