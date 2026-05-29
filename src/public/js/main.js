// =========================================================================
// Variables globales y configuración inicial
// =========================================================================
let usuarioActual = null;
let token = null;

// Configuración de paginación para incidencias (revisor y admin)
let paginaActualIncidencias = 1;
let totalPaginasIncidencias = 1;
let filtroEstadoActual = null;

let paginaActualSalones = 1;
let totalPaginasSalones = 1;
let edificioFiltroSalones = null;

let paginaActualAdminIncidencias = 1;
let totalPaginasAdminIncidencias = 1;
let filtroEstadoAdmin = '';

// =========================================================================
// Notificaciones flotantes
// =========================================================================
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${tipo}`;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// =========================================================================
// Funciones auxiliares para fetch con token
// =========================================================================
async function fetchWithAuth(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;
    options.headers['Content-Type'] = 'application/json';
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        mostrarNotificacion('Sesión expirada, vuelva a iniciar sesión', 'error');
        sessionStorage.clear();
        window.location.href = '/views/login.html';
        throw new Error('No autorizado');
    }
    return response;
}

// =========================================================================
// Carga inicial según la vista
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) {
        document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    } else {
        const userStr = sessionStorage.getItem('usuario');
        token = sessionStorage.getItem('token');
        if (!userStr || !token) {
            window.location.href = '/views/login.html';
            return;
        }
        usuarioActual = JSON.parse(userStr);
        mostrarInfoUsuario();
        if (path.includes('usuario.html')) {
            cargarEdificios();
            document.getElementById('reporteForm')?.addEventListener('submit', enviarReporte);
        } else if (path.includes('revisor.html')) {
            cargarIncidenciasRevisor();
        } else if (path.includes('admin.html')) {
            inicializarAdmin();
        }
        document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    }
});

// =========================================================================
// Login con JWT
// =========================================================================
async function handleLogin(e) {
    e.preventDefault();
    const correo = document.getElementById('correo').value;
    const nombre = document.getElementById('nombre').value;
    const rol = document.getElementById('rol').value;
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, nombre, rol })
        });
        if (!res.ok) throw new Error('Error en login');
        const data = await res.json();
        sessionStorage.setItem('usuario', JSON.stringify({ id: data.id, nombre: data.nombre, correo: data.correo, rol: data.rol }));
        sessionStorage.setItem('token', data.token);
        token = data.token;
        usuarioActual = { id: data.id, nombre: data.nombre, correo: data.correo, rol: data.rol };
        if (data.rol === 'Admin') window.location.href = '/views/admin.html';
        else if (data.rol === 'Revisor') window.location.href = '/views/revisor.html';
        else window.location.href = '/views/usuario.html';
    } catch (err) {
        mostrarNotificacion('Error al iniciar sesión: ' + err.message, 'error');
    }
}

function mostrarInfoUsuario() {
    const divInfo = document.getElementById('userInfo');
    if (divInfo && usuarioActual) {
        divInfo.innerHTML = `<strong>${usuarioActual.nombre}</strong> (${usuarioActual.rol}) - ${usuarioActual.correo}`;
    }
}

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = '/views/login.html';
}

// =========================================================================
// VISTA USUARIO
// =========================================================================
async function cargarEdificios() {
    try {
        const res = await fetchWithAuth('/api/edificios');
        const edificios = await res.json();
        const selectEdificio = document.getElementById('edificio');
        selectEdificio.innerHTML = '<option value="">Seleccione edificio</option>';
        edificios.forEach(ed => {
            const option = document.createElement('option');
            option.value = ed.id;
            option.textContent = ed.nombre;
            selectEdificio.appendChild(option);
        });
        selectEdificio.addEventListener('change', cargarSalones);
    } catch (err) { console.error(err); }
}

async function cargarSalones() {
    const edificioId = document.getElementById('edificio').value;
    const selectSalon = document.getElementById('salon');
    if (!edificioId) {
        selectSalon.innerHTML = '<option value="">Primero seleccione edificio</option>';
        selectSalon.disabled = true;
        return;
    }
    try {
        const res = await fetchWithAuth(`/api/salones?edificio_id=${edificioId}`);
        const salones = await res.json();
        selectSalon.innerHTML = '<option value="">Seleccione salón</option>';
        salones.forEach(salon => {
            const option = document.createElement('option');
            option.value = salon.id;
            option.textContent = salon.nombre;
            selectSalon.appendChild(option);
        });
        selectSalon.disabled = false;
    } catch (err) { console.error(err); }
}

async function enviarReporte(e) {
    e.preventDefault();
    const descripcion = document.getElementById('descripcion').value;
    const salon_id = document.getElementById('salon').value;
    if (!salon_id) {
        mostrarNotificacion('Seleccione un salón', 'error');
        return;
    }
    const data = { descripcion, usuario_id: usuarioActual.id, salon_id };
    try {
        const res = await fetchWithAuth('/api/incidencias', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (res.ok) {
            mostrarNotificacion('Reporte enviado con éxito', 'success');
            document.getElementById('reporteForm').reset();
            document.getElementById('salon').disabled = true;
        } else {
            mostrarNotificacion('Error al enviar', 'error');
        }
    } catch (err) { mostrarNotificacion('Error de conexión', 'error'); }
}

// =========================================================================
// VISTA REVISOR (sin historial)
// =========================================================================
async function cargarIncidenciasRevisor(pagina = 1) {
    paginaActualIncidencias = pagina;
    try {
        const estadoParam = filtroEstadoActual ? `&estado=${filtroEstadoActual}` : '';
        const res = await fetchWithAuth(`/api/incidencias?pagina=${pagina}&limite=5${estadoParam}`);
        const data = await res.json();
        totalPaginasIncidencias = data.totalPaginas;
        const tbody = document.querySelector('#incidenciasTable tbody');
        tbody.innerHTML = '';
        data.data.forEach(inc => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = inc.id;
            row.insertCell(1).textContent = inc.edificio_nombre;
            row.insertCell(2).textContent = inc.salon_nombre;
            row.insertCell(3).textContent = inc.descripcion;
            row.insertCell(4).textContent = inc.estado;
            row.insertCell(5).textContent = inc.comentario || '---';
            const cellAcciones = row.insertCell(6);
            if (inc.estado === 'Pendiente') {
                const btnProceso = document.createElement('button');
                btnProceso.textContent = 'En Proceso';
                btnProceso.className = 'accion';
                btnProceso.onclick = () => cambiarEstadoConComentario(inc.id, 'En Proceso');
                cellAcciones.appendChild(btnProceso);
            } else if (inc.estado === 'En Proceso') {
                const btnResuelto = document.createElement('button');
                btnResuelto.textContent = 'Resolver';
                btnResuelto.className = 'accion';
                btnResuelto.onclick = () => cambiarEstadoConComentario(inc.id, 'Resuelto');
                cellAcciones.appendChild(btnResuelto);
            }
            const btnImagen = document.createElement('button');
            btnImagen.textContent = 'Subir foto';
            btnImagen.className = 'accion';
            btnImagen.onclick = () => subirImagen(inc.id);
            cellAcciones.appendChild(btnImagen);
            if (inc.imagen_path) {
                const verImg = document.createElement('button');
                verImg.textContent = 'Ver foto';
                verImg.className = 'accion';
                verImg.onclick = () => window.open(inc.imagen_path, '_blank');
                cellAcciones.appendChild(verImg);
            }
        });
        document.getElementById('pagina-actual').textContent = pagina;
        document.getElementById('total-paginas').textContent = totalPaginasIncidencias;
        document.getElementById('btn-anterior').disabled = (pagina === 1);
        document.getElementById('btn-siguiente').disabled = (pagina === totalPaginasIncidencias);
    } catch (err) { console.error(err); }
}

function cambiarPaginaIncidencias(delta) {
    let nueva = paginaActualIncidencias + delta;
    if (nueva < 1) nueva = 1;
    if (nueva > totalPaginasIncidencias) nueva = totalPaginasIncidencias;
    cargarIncidenciasRevisor(nueva);
}

function filtrarPorEstado(estado) {
    filtroEstadoActual = estado;
    cargarIncidenciasRevisor(1);
}

async function cambiarEstadoConComentario(id, nuevoEstado) {
    let comentario = prompt(`Ingrese un comentario para cambiar a "${nuevoEstado}":`);
    if (comentario === null) return;
    try {
        const res = await fetchWithAuth(`/api/incidencias/${id}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado, comentario })
        });
        if (res.ok) {
            mostrarNotificacion('Estado actualizado', 'success');
            cargarIncidenciasRevisor(paginaActualIncidencias);
        } else {
            const err = await res.json();
            mostrarNotificacion('Error: ' + err.error, 'error');
        }
    } catch (err) { mostrarNotificacion('Error de red', 'error'); }
}

async function subirImagen(id) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('imagen', file);
        try {
            const res = await fetch(`/api/incidencias/${id}/imagen`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                mostrarNotificacion('Imagen subida', 'success');
                cargarIncidenciasRevisor(paginaActualIncidencias);
            } else {
                mostrarNotificacion('Error al subir imagen', 'error');
            }
        } catch (err) { mostrarNotificacion('Error de red', 'error'); }
    };
    input.click();
}

// =========================================================================
// VISTA ADMIN (incluye nueva pestaña Incidencias)
// =========================================================================
function inicializarAdmin() {
    // Pestañas
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (tabId === 'incidencias') cargarIncidenciasAdmin();
            if (tabId === 'usuarios') cargarUsuarios();
            if (tabId === 'edificios') cargarEdificiosAdmin();
            if (tabId === 'salones') cargarSalonesAdmin(1);
            if (tabId === 'estadisticas') cargarEstadisticas();
        });
    });

    // Cargar pestaña incidencias por defecto
    cargarIncidenciasAdmin();
    cargarUsuarios();
    cargarEdificiosAdmin();
    cargarSalonesAdmin(1);
    cargarEstadisticas();

    // Eventos
    document.getElementById('edificioForm').addEventListener('submit', agregarEdificio);
    document.getElementById('salonForm').addEventListener('submit', agregarSalon);
    document.getElementById('exportarCSV')?.addEventListener('click', () => exportarCSV('estadisticas'));
    document.getElementById('exportarCSVIncidencias')?.addEventListener('click', () => exportarCSV('incidencias'));
    document.getElementById('btn-anterior-admin')?.addEventListener('click', () => cambiarPaginaAdminIncidencias(-1));
    document.getElementById('btn-siguiente-admin')?.addEventListener('click', () => cambiarPaginaAdminIncidencias(1));
    document.getElementById('filtroEstadoAdmin')?.addEventListener('change', (e) => {
        filtroEstadoAdmin = e.target.value;
        cargarIncidenciasAdmin(1);
    });
    document.getElementById('btn-anterior-salones')?.addEventListener('click', () => cambiarPaginaSalones(-1));
    document.getElementById('btn-siguiente-salones')?.addEventListener('click', () => cambiarPaginaSalones(1));
    document.getElementById('selectEdificioSalon')?.addEventListener('change', (e) => {
        edificioFiltroSalones = e.target.value || null;
        cargarSalonesAdmin(1);
    });
}

// ========== INCIDENCIAS PARA ADMIN (con historial) ==========
async function cargarIncidenciasAdmin(pagina = 1) {
    paginaActualAdminIncidencias = pagina;
    try {
        const estadoParam = filtroEstadoAdmin ? `&estado=${filtroEstadoAdmin}` : '';
        const res = await fetchWithAuth(`/api/incidencias?pagina=${pagina}&limite=10${estadoParam}`);
        const data = await res.json();
        totalPaginasAdminIncidencias = data.totalPaginas;
        const tbody = document.querySelector('#incidenciasAdminTable tbody');
        tbody.innerHTML = '';
        data.data.forEach(inc => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = inc.id;
            row.insertCell(1).textContent = inc.edificio_nombre;
            row.insertCell(2).textContent = inc.salon_nombre;
            row.insertCell(3).textContent = inc.descripcion;
            row.insertCell(4).textContent = inc.estado;
            row.insertCell(5).textContent = inc.comentario || '---';
            const cellAcciones = row.insertCell(6);
            const btnHistorial = document.createElement('button');
            btnHistorial.textContent = 'Ver historial';
            btnHistorial.className = 'accion';
            btnHistorial.onclick = () => verHistorial(inc.id);
            cellAcciones.appendChild(btnHistorial);
            if (inc.imagen_path) {
                const verImg = document.createElement('button');
                verImg.textContent = 'Ver foto';
                verImg.className = 'accion';
                verImg.onclick = () => window.open(inc.imagen_path, '_blank');
                cellAcciones.appendChild(verImg);
            }
        });
        document.getElementById('pagina-actual-admin').textContent = pagina;
        document.getElementById('total-paginas-admin').textContent = totalPaginasAdminIncidencias;
        document.getElementById('btn-anterior-admin').disabled = (pagina === 1);
        document.getElementById('btn-siguiente-admin').disabled = (pagina === totalPaginasAdminIncidencias);
    } catch (err) { console.error(err); }
}

function cambiarPaginaAdminIncidencias(delta) {
    let nueva = paginaActualAdminIncidencias + delta;
    if (nueva < 1) nueva = 1;
    if (nueva > totalPaginasAdminIncidencias) nueva = totalPaginasAdminIncidencias;
    cargarIncidenciasAdmin(nueva);
}

// ========== HISTORIAL (modal) ==========
async function verHistorial(id) {
    try {
        const res = await fetchWithAuth(`/api/incidencias/${id}/historial`);
        const historial = await res.json();
        if (!historial.length) {
            mostrarNotificacion('No hay historial de cambios para esta incidencia', 'info');
            return;
        }
        let html = '<div style="max-height: 400px; overflow-y: auto;"><h3>Historial de cambios</h3><ul>';
        historial.forEach(h => {
            html += `<li><strong>${new Date(h.fecha_cambio).toLocaleString()}</strong> - ${h.usuario_nombre} cambió de ${h.estado_anterior} a ${h.estado_nuevo}<br>Comentario: ${h.comentario || 'Ninguno'}</li>`;
        });
        html += '</ul></div><button onclick="this.parentElement.remove()">Cerrar</button>';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '2000';
        const content = document.createElement('div');
        content.style.backgroundColor = 'white';
        content.style.padding = '20px';
        content.style.borderRadius = '12px';
        content.style.maxWidth = '500px';
        content.style.width = '90%';
        content.innerHTML = html;
        modal.appendChild(content);
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (err) { mostrarNotificacion('Error al obtener historial', 'error'); }
}

// ========== EXPORTAR CSV (para admin) ==========
async function exportarCSV(tipo) {
    try {
        let url = '/api/exportar/csv';
        if (tipo === 'incidencias' && filtroEstadoAdmin) url += `?estado=${filtroEstadoAdmin}`;
        const res = await fetchWithAuth(url);
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `incidencias_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        mostrarNotificacion('Exportación completada', 'success');
    } catch (err) { mostrarNotificacion('Error al exportar', 'error'); }
}

// ========== CRUD USUARIOS, EDIFICIOS, SALONES, ESTADÍSTICAS ==========
async function cargarUsuarios() {
    try {
        const res = await fetchWithAuth('/api/usuarios');
        const usuarios = await res.json();
        const tbody = document.querySelector('#usuariosTable tbody');
        tbody.innerHTML = '';
        usuarios.forEach(u => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = u.id;
            row.insertCell(1).textContent = u.correo;
            row.insertCell(2).textContent = u.nombre;
            row.insertCell(3).textContent = u.rol;
        });
    } catch (err) { console.error(err); }
}

async function cargarEdificiosAdmin() {
    try {
        const res = await fetchWithAuth('/api/edificios');
        const edificios = await res.json();
        const tbody = document.querySelector('#edificiosTable tbody');
        tbody.innerHTML = '';
        edificios.forEach(ed => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = ed.id;
            row.insertCell(1).textContent = ed.nombre;
            const cellAcciones = row.insertCell(2);
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'accion';
            btnEditar.onclick = () => editarEdificio(ed.id, ed.nombre);
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.className = 'accion eliminar';
            btnEliminar.onclick = () => eliminarEdificio(ed.id);
            cellAcciones.appendChild(btnEditar);
            cellAcciones.appendChild(btnEliminar);
        });
    } catch (err) { console.error(err); }
}

async function agregarEdificio(e) {
    e.preventDefault();
    const nombre = document.getElementById('edificioNombre').value;
    try {
        const res = await fetchWithAuth('/api/edificios', {
            method: 'POST',
            body: JSON.stringify({ nombre })
        });
        if (res.ok) {
            mostrarNotificacion('Edificio agregado', 'success');
            document.getElementById('edificioNombre').value = '';
            cargarEdificiosAdmin();
        } else mostrarNotificacion('Error', 'error');
    } catch (err) { mostrarNotificacion('Error de red', 'error'); }
}

function editarEdificio(id, nombreActual) {
    const nuevoNombre = prompt('Nuevo nombre:', nombreActual);
    if (nuevoNombre && nuevoNombre !== nombreActual) {
        fetchWithAuth(`/api/edificios/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre: nuevoNombre })
        }).then(res => {
            if (res.ok) { mostrarNotificacion('Actualizado', 'success'); cargarEdificiosAdmin(); }
            else mostrarNotificacion('Error', 'error');
        }).catch(() => mostrarNotificacion('Error de red', 'error'));
    }
}

async function eliminarEdificio(id) {
    if (confirm('¿Eliminar edificio? Se perderán sus salones e incidencias.')) {
        try {
            const res = await fetchWithAuth(`/api/edificios/${id}`, { method: 'DELETE' });
            if (res.ok) { mostrarNotificacion('Eliminado', 'success'); cargarEdificiosAdmin(); }
            else mostrarNotificacion('Error', 'error');
        } catch (err) { mostrarNotificacion('Error de red', 'error'); }
    }
}

async function cargarEstadisticas() {
    try {
        const res = await fetchWithAuth('/api/estadisticas');
        const stats = await res.json();
        const tbody = document.querySelector('#statsTable tbody');
        tbody.innerHTML = '';
        stats.forEach(stat => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = stat.edificio;
            row.insertCell(1).textContent = stat.estado;
            row.insertCell(2).textContent = stat.total;
        });
    } catch (err) { console.error(err); }
}

// ========== SALONES (con paginación) ==========
async function cargarSalonesAdmin(pagina = 1) {
    paginaActualSalones = pagina;
    try {
        let url = `/api/salones/todos?pagina=${pagina}&limite=10`;
        if (edificioFiltroSalones) url += `&edificio_id=${edificioFiltroSalones}`;
        const res = await fetchWithAuth(url);
        const data = await res.json();
        totalPaginasSalones = data.totalPaginas;
        const tbody = document.querySelector('#salonesTable tbody');
        tbody.innerHTML = '';
        data.data.forEach(salon => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = salon.id;
            row.insertCell(1).textContent = salon.nombre;
            row.insertCell(2).textContent = salon.edificio_nombre;
            const cellAcciones = row.insertCell(3);
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'accion';
            btnEditar.onclick = () => editarSalon(salon.id, salon.nombre);
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.className = 'accion eliminar';
            btnEliminar.onclick = () => eliminarSalon(salon.id);
            cellAcciones.appendChild(btnEditar);
            cellAcciones.appendChild(btnEliminar);
        });
        document.getElementById('pagina-actual-salones').textContent = pagina;
        document.getElementById('total-paginas-salones').textContent = totalPaginasSalones;
        document.getElementById('btn-anterior-salones').disabled = (pagina === 1);
        document.getElementById('btn-siguiente-salones').disabled = (pagina === totalPaginasSalones);
    } catch (err) { console.error(err); }
}

function cambiarPaginaSalones(delta) {
    let nueva = paginaActualSalones + delta;
    if (nueva < 1) nueva = 1;
    if (nueva > totalPaginasSalones) nueva = totalPaginasSalones;
    cargarSalonesAdmin(nueva);
}

async function agregarSalon(e) {
    e.preventDefault();
    const nombre = document.getElementById('salonNombre').value;
    let edificio_id = document.getElementById('salonEdificioId').value;
    if (!edificio_id) {
        edificio_id = prompt('ID del edificio (1-12 para A1-A12):');
        if (!edificio_id) return;
    }
    try {
        const res = await fetchWithAuth('/api/salones', {
            method: 'POST',
            body: JSON.stringify({ nombre, edificio_id })
        });
        if (res.ok) {
            mostrarNotificacion('Salón agregado', 'success');
            document.getElementById('salonNombre').value = '';
            cargarSalonesAdmin(1);
        } else {
            const err = await res.json();
            mostrarNotificacion('Error: ' + err.error, 'error');
        }
    } catch (err) { mostrarNotificacion('Error de red', 'error'); }
}

function editarSalon(id, nombreActual) {
    const nuevoNombre = prompt('Nuevo nombre del salón:', nombreActual);
    if (nuevoNombre && nuevoNombre !== nombreActual) {
        fetchWithAuth(`/api/salones/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre: nuevoNombre })
        }).then(res => {
            if (res.ok) { mostrarNotificacion('Actualizado', 'success'); cargarSalonesAdmin(paginaActualSalones); }
            else mostrarNotificacion('Error', 'error');
        }).catch(() => mostrarNotificacion('Error de red', 'error'));
    }
}

async function eliminarSalon(id) {
    if (confirm('¿Eliminar salón? Si tiene incidencias no se podrá.')) {
        try {
            const res = await fetchWithAuth(`/api/salones/${id}`, { method: 'DELETE' });
            if (res.ok) { mostrarNotificacion('Eliminado', 'success'); cargarSalonesAdmin(paginaActualSalones); }
            else {
                const err = await res.json();
                mostrarNotificacion('Error: ' + err.error, 'error');
            }
        } catch (err) { mostrarNotificacion('Error de red', 'error'); }
    }
}