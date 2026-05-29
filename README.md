
# Sistema de Reportes de Incidencias de Limpieza – FES Aragón

## Descripción
Aplicación web full-stack para reportar y dar seguimiento a problemas de limpieza en la FES Aragón.  
Permite a estudiantes reportar incidencias, al personal de limpieza cambiar estados y al administrador gestionar catálogos y estadísticas.

**Roles:**
- **Usuario** – reporta incidencias (edificio, salón, descripción).
- **Revisor** – visualiza y cambia estado (Pendiente → En Proceso → Resuelto), agrega comentarios.
- **Administrador** – CRUD de edificios/salones, lista de usuarios, estadísticas por edificio y estado.

## Tecnologías
- **Backend:** Node.js + Express.js
- **Base de datos:** MariaDB
- **Frontend:** HTML5, CSS3, JavaScript (Fetch API)
- **Contenedores:** Docker + Docker Compose
- **Control de versiones:** Git + GitHub

## Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.
- (Opcional) Git para clonar el repositorio.

## Instalación y ejecución con Docker

1. **Clonar el repositorio** (o descargar el ZIP):
   ```bash
   git clone https://github.com/ArielHernandez17/ProyectoVinculacion.git
   cd ProyectoVinculacion
   ```

2. **Construir y levantar los contenedores**:
   ```bash
   docker-compose up --build
   ```

3. **Abrir el navegador** en: [http://localhost:3000](http://localhost:3000)

> Los puertos utilizados son 3000 (aplicación) y 3307 (base de datos). Si están ocupados, cambia el mapeo en `docker-compose.yml`.

## Credenciales de prueba

| Rol        | Correo electrónico                  | Nombre         |
|------------|-------------------------------------|----------------|
| Admin      | admin@fes.aragon.unam.mx            | Administrador  |
| Revisor    | revisor@fes.aragon.unam.mx          | Juan Pérez     |
| Usuario    | usuario@ejemplo.com                 | María López    |

> El sistema no requiere contraseña. Puedes usar cualquier correo nuevo; se registrará automáticamente con el rol seleccionado.

## Manual rápido

### Usuario
- Selecciona edificio → salón → escribe descripción → **Enviar Reporte**.

### Revisor
- En la tabla, haz clic en **En Proceso** o **Resolver** según corresponda.
- Agrega un comentario (opcional). El estado se actualizará y se guardará el historial.

### Administrador
- Usa las pestañas: **Usuarios**, **Edificios**, **Salones**, **Estadísticas**.
- Puedes agregar, editar o eliminar edificios y salones (no se eliminan si tienen incidencias asociadas).

## Material adicional del proyecto

- **Reporte técnico en PDF** – Documento completo con análisis, diseño, requerimientos, arquitectura y modelo de datos.  

- **Video demostrativo (YouTube)** – Explicación del sistema, arquitectura, pruebas de todos los roles.  
  *(https://youtu.be/D6_L2BzXk4M)*
- **Código fuente del reporte (LaTeX)** – Archivo `.tex` y recursos gráficos empaquetados en un ZIP.  
  *(Disponible en el repositorio junto al resto de entregables)*

## Créditos
- **Desarrollador:** Ariel Hernández Velázquez (320259689)
- **Institución:** FES Aragón, UNAM
- **Asignatura:** Vinculación Empresarial
- **Año:** 2026

## Licencia
Uso académico. Se permite la consulta y referencia citando la fuente original.
