Aquí tienes el archivo `README.md` completo, profesional, sin emojis, con secciones claras y placeholders para tu reporte y video de YouTube. Puedes copiarlo directamente y luego editar los enlaces y agregar tus imágenes.

---

```markdown
# Sistema de Reportes de Incidencias de Limpieza - FES Aragón

## 1. Descripción del Proyecto

El Sistema de Reportes de Incidencias de Limpieza es una aplicación web desarrollada para la Facultad de Estudios Superiores Aragón (UNAM) como proyecto de la asignatura de Ingeniería en Computación. Su objetivo es optimizar la comunicación entre la comunidad estudiantil y el personal de limpieza, permitiendo reportar problemas de salubridad en edificios y salones, dar seguimiento a los reportes y generar estadísticas para la toma de decisiones.

El sistema cuenta con tres roles de usuario:
- Usuario: Puede reportar incidencias seleccionando edificio y salón.
- Revisor (personal de limpieza): Visualiza las incidencias pendientes y en proceso, cambia el estado y agrega comentarios.
- Administrador: Gestiona edificios, salones, usuarios y visualiza estadísticas agrupadas por edificio y estado.

## 2. Tecnologías Utilizadas

- Backend: Node.js + Express.js (JavaScript nativo, sin TypeScript)
- Base de Datos: MariaDB (librería nativa 'mariadb' v2.5.6)
- Frontend: HTML5, CSS3, JavaScript (Fetch API para interactividad)
- Contenedores: Docker y Docker Compose (para entornos aislados y portabilidad)
- Control de versiones: Git + GitHub

## 3. Estructura del Proyecto

```
.
├── docker-compose.yml
├── Dockerfile
├── init.sql
├── package.json
├── server.js
├── .env
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── incidenciaController.js
│   │   └── authController.js
│   ├── models/
│   │   └── incidenciaModel.js
│   ├── routes/
│   │   ├── incidenciaRoutes.js
│   │   └── authRoutes.js
│   ├── public/
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       └── main.js
│   └── views/
│       ├── login.html
│       ├── admin.html
│       ├── revisor.html
│       └── usuario.html
```

## 4. Requisitos Previos

Para ejecutar el proyecto necesitas tener instalado:
- Docker Desktop (Windows, macOS o Linux)
- Git (opcional, para clonar el repositorio)

No se requiere instalar Node.js, MariaDB ni ninguna otra dependencia de forma local, ya que todo se ejecuta dentro de contenedores.

## 5. Instalación y Ejecución con Docker

Sigue estos pasos para levantar el sistema en tu computadora:

1. Clonar el repositorio (o descargar los archivos):
   ```bash
   git clone https://github.com/ArielHernandez17/ProyectoVinculacion.git
   cd ProyectoVinculacion
   ```

2. Asegurarse de que ningún otro servicio esté usando los puertos 3000 (aplicación) y 3307 (base de datos). Si es necesario, modificar el mapeo de puertos en `docker-compose.yml`.

3. Construir y levantar los contenedores:
   ```bash
   docker-compose down -v   # (opcional, para limpiar volúmenes anteriores)
   docker-compose up --build
   ```

4. Esperar a que aparezca el mensaje:
   ```
   Servidor corriendo en http://localhost:3000
   ```

5. Abrir el navegador en la dirección: http://localhost:3000

## 6. Credenciales de Prueba

El sistema ya incluye datos de prueba precargados. Puedes iniciar sesión con los siguientes perfiles:

| Rol      | Correo electrónico                  | Nombre         | Contraseña (no requerida) |
|----------|--------------------------------------|----------------|---------------------------|
| Admin    | admin@fes.aragon.unam.mx             | Administrador  | (cualquier valor)         |
| Revisor  | revisor@fes.aragon.unam.mx           | Juan Pérez     | (cualquier valor)         |
| Usuario  | usuario@ejemplo.com                  | María López    | (cualquier valor)         |

También puedes registrarte con cualquier correo nuevo; el sistema lo creará automáticamente con el rol seleccionado.

## 7. Manual de Uso Básico

### 7.1 Usuario
- Selecciona un edificio (A1 a A12 o Laboratorios).
- Elige un salón de la lista (los laboratorios no tienen salones).
- Escribe una descripción del problema.
- Haz clic en "Enviar Reporte".

### 7.2 Revisor
- Visualiza la tabla con incidencias en estado "Pendiente" o "En Proceso".
- Haz clic en "En Proceso" o "Resolver" según corresponda.
- Se abrirá un cuadro de diálogo para agregar un comentario (opcional pero recomendado).
- El comentario se guardará y se mostrará en la tabla.

### 7.3 Administrador
- Navega por las pestañas:
  - **Usuarios**: Lista de todos los usuarios registrados.
  - **Edificios**: CRUD completo de edificios.
  - **Salones**: CRUD de salones por edificio (con filtro).
  - **Estadísticas**: Tabla con cantidad de incidencias agrupadas por edificio y estado.
- Puedes agregar, editar o eliminar edificios y salones (si no tienen incidencias asociadas).

## 8. Evidencias del Proyecto

### 8.1 Reporte Técnico
El reporte completo en formato PDF puede consultarse en el siguiente enlace:
[Enlace al reporte técnico - por definir]

### 8.2 Video Demostrativo
Se ha elaborado un video donde se explica el funcionamiento del sistema, la arquitectura y se muestra una prueba de todos los roles. El video está disponible en YouTube:
[Enlace al video demostrativo - insertar URL]

## 9. Mejoras Implementadas (Versión Final)

- Diseño profesional con CSS moderno (gradientes, sombras, tarjetas, notificaciones).
- Validación en el backend para evitar modificar incidencias resueltas.
- Agregado de columna "comentario" en la tabla de incidencias.
- Gestión completa de salones desde el panel de administrador.
- Índices en la base de datos para mejorar el rendimiento de consultas.
- Reemplazo de alertas por notificaciones visuales no intrusivas.
- Uso de variables de entorno para configuración segura.

## 10. Posibles Mejoras Futuras

- Implementar autenticación con JWT y middleware por rol.
- Paginación en tablas de incidencias y salones.
- Exportación de reportes a CSV o PDF.
- Historial de cambios de estado con fecha y usuario.
- Subida de imágenes adjuntas a los reportes.
- Integración con el correo institucional para notificaciones.

## 11. Créditos

- **Desarrollador:** Ariel Hernández  
- **Institución:** Facultad de Estudios Superiores Aragón, UNAM  
- **Asignatura:** Proyecto de Ingeniería en Computación  
- **Año:** 2025

## 12. Licencia

Este proyecto es de uso académico y no tiene fines comerciales. Puede ser utilizado como referencia para otros trabajos escolares, citando la fuente original.
```

---
