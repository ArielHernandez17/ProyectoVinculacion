// Variables globales
let usuarioActual = null;

// Al cargar la página, según la vista, ejecutar funciones
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) {
        document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    } else {
        // Verificar sesión
        const userStr = sessionStorage.getItem('usuario');
        if (!userStr) {
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

// ========== LOGIN ==========
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
        sessionStorage.setItem('usuario', JSON.stringify(data));
        // Redirigir según rol
        if (data.rol === 'Admin') window.location.href = '/views/admin.html';
        else if (data.rol === 'Revisor') window.location.href = '/views/revisor.html';
        else window.location.href = '/views/usuario.html';
    } catch (err) {
        alert('Error al iniciar sesión: ' + err.message);
    }
}

function mostrarInfoUsuario() {
    const divInfo = document.getElementById('userInfo');
    if (divInfo && usuarioActual) {
        divInfo.innerHTML = `<strong>${usuarioActual.nombre}</strong> (${usuarioActual.rol}) - ${usuarioActual.correo}`;
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('usuario');
    window.location.href = '/views/login.html';
}

// ========== USUARIO: cargar edificios y salones dinámicos ==========
async function cargarEdificios() {
    try {
        const res = await fetch('/api/edificios');
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
    } catch (err) {
        console.error(err);
    }
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
        const res = await fetch(`/api/salones?edificio_id=${edificioId}`);
        const salones = await res.json();
        selectSalon.innerHTML = '<option value="">Seleccione salón</option>';
        salones.forEach(salon => {
            const option = document.createElement('option');
            option.value = salon.id;
            option.textContent = salon.nombre;
            selectSalon.appendChild(option);
        });
        selectSalon.disabled = false;
    } catch (err) {
        console.error(err);
    }
}

async function enviarReporte(e) {
    e.preventDefault();
    const descripcion = document.getElementById('descripcion').value;
    const salon_id = document.getElementById('salon').value;
    if (!salon_id) {
        alert('Seleccione un salón');
        return;
    }
    const data = {
        descripcion,
        usuario_id: usuarioActual.id,
        salon_id
    };
    try {
        const res = await fetch('/api/incidencias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Reporte enviado con éxito');
            document.getElementById('reporteForm').reset();
            document.getElementById('salon').disabled = true;
        } else {
            alert('Error al enviar');
        }
    } catch (err) {
        alert('Error de conexión');
    }
}

// ========== REVISOR: incidencias y cambio de estado ==========
async function cargarIncidenciasRevisor() {
    try {
        const res = await fetch('/api/incidencias?estado=Pendiente');
        const pendientes = await res.json();
        const res2 = await fetch('/api/incidencias?estado=En Proceso');
        const enProceso = await res2.json();
        const todas = [...pendientes, ...enProceso];
        const tbody = document.querySelector('#incidenciasTable tbody');
        tbody.innerHTML = '';
        todas.forEach(inc => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = inc.id;
            row.insertCell(1).textContent = inc.edificio_nombre;
            row.insertCell(2).textContent = inc.salon_nombre;
            row.insertCell(3).textContent = inc.descripcion;
            row.insertCell(4).textContent = inc.estado;
            const cellAcciones = row.insertCell(5);
            if (inc.estado === 'Pendiente') {
                const btnProceso = document.createElement('button');
                btnProceso.textContent = 'En Proceso';
                btnProceso.className = 'accion';
                btnProceso.onclick = () => cambiarEstado(inc.id, 'En Proceso');
                cellAcciones.appendChild(btnProceso);
            } else if (inc.estado === 'En Proceso') {
                const btnResuelto = document.createElement('button');
                btnResuelto.textContent = 'Resolver';
                btnResuelto.className = 'accion';
                btnResuelto.onclick = () => cambiarEstado(inc.id, 'Resuelto');
                cellAcciones.appendChild(btnResuelto);
            } else {
                cellAcciones.textContent = '---';
            }
        });
    } catch (err) {
        console.error(err);
    }
}

async function cambiarEstado(id, nuevoEstado) {
    try {
        const res = await fetch(`/api/incidencias/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (res.ok) {
            alert('Estado actualizado');
            cargarIncidenciasRevisor();
        } else {
            alert('Error');
        }
    } catch (err) {
        alert('Error de red');
    }
}

// ========== ADMIN: pestañas, CRUD edificios, usuarios, estadísticas y salones ==========
function inicializarAdmin() {
    // Pestañas
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (tabId === 'usuarios') cargarUsuarios();
            if (tabId === 'edificios') cargarEdificiosAdmin();
            if (tabId === 'salones') {
                cargarEdificiosParaSalones();  // llena el select de filtro
                cargarTodosSalones();           // carga todos los salones
            }
            if (tabId === 'estadisticas') cargarEstadisticas();
        });
    });
    // Cargar datos iniciales
    cargarUsuarios();
    cargarEdificiosAdmin();
    cargarEstadisticas();
    // Formulario agregar edificio
    document.getElementById('edificioForm').addEventListener('submit', agregarEdificio);
    // Formulario agregar salón
    document.getElementById('salonForm').addEventListener('submit', agregarSalon);
    document.getElementById('btnCargarSalones').addEventListener('click', () => {
        const edificioId = document.getElementById('selectEdificioSalon').value;
        if (edificioId) cargarSalonesPorEdificio(edificioId);
        else cargarTodosSalones();
    });
}

async function cargarUsuarios() {
    try {
        const res = await fetch('/api/usuarios');
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
    } catch (err) {
        console.error(err);
    }
}

async function cargarEdificiosAdmin() {
    try {
        const res = await fetch('/api/edificios');
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
    } catch (err) {
        console.error(err);
    }
}

async function agregarEdificio(e) {
    e.preventDefault();
    const nombre = document.getElementById('edificioNombre').value;
    try {
        const res = await fetch('/api/edificios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
        if (res.ok) {
            alert('Edificio agregado');
            document.getElementById('edificioNombre').value = '';
            cargarEdificiosAdmin();
        } else {
            alert('Error');
        }
    } catch (err) {
        alert('Error de red');
    }
}

function editarEdificio(id, nombreActual) {
    const nuevoNombre = prompt('Nuevo nombre del edificio:', nombreActual);
    if (nuevoNombre && nuevoNombre !== nombreActual) {
        fetch(`/api/edificios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nuevoNombre })
        }).then(res => {
            if (res.ok) {
                alert('Actualizado');
                cargarEdificiosAdmin();
            } else alert('Error');
        }).catch(err => alert(err));
    }
}

async function eliminarEdificio(id) {
    if (confirm('¿Eliminar edificio? Se perderán sus salones e incidencias asociadas.')) {
        try {
            const res = await fetch(`/api/edificios/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Eliminado');
                cargarEdificiosAdmin();
            } else alert('Error');
        } catch (err) { alert(err); }
    }
}

async function cargarEstadisticas() {
    try {
        const res = await fetch('/api/estadisticas');
        const stats = await res.json();
        const tbody = document.querySelector('#statsTable tbody');
        tbody.innerHTML = '';
        stats.forEach(stat => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = stat.edificio;
            row.insertCell(1).textContent = stat.estado;
            row.insertCell(2).textContent = stat.total;
        });
    } catch (err) {
        console.error(err);
    }
}

// ========== FUNCIONES PARA GESTIÓN DE SALONES (ADMIN) ==========
async function cargarEdificiosParaSalones() {
    const res = await fetch('/api/edificios');
    const edificios = await res.json();
    const select = document.getElementById('selectEdificioSalon');
    select.innerHTML = '<option value="">-- Todos los edificios --</option>';
    edificios.forEach(ed => {
        const option = document.createElement('option');
        option.value = ed.id;
        option.textContent = ed.nombre;
        select.appendChild(option);
    });
}

async function cargarTodosSalones() {
    const res = await fetch('/api/salones/todos');
    const salones = await res.json();
    mostrarSalonesEnTabla(salones);
}

async function cargarSalonesPorEdificio(edificioId) {
    const res = await fetch(`/api/salones?edificio_id=${edificioId}`);
    const salones = await res.json();
    // Obtener nombre del edificio para mostrarlo en la tabla
    const edificioRes = await fetch('/api/edificios');
    const edificios = await edificioRes.json();
    const edificio = edificios.find(e => e.id == edificioId);
    const salonesConEdificio = salones.map(s => ({ ...s, edificio_nombre: edificio ? edificio.nombre : '' }));
    mostrarSalonesEnTabla(salonesConEdificio);
    document.getElementById('salonEdificioId').value = edificioId;
}

function mostrarSalonesEnTabla(salones) {
    const tbody = document.querySelector('#salonesTable tbody');
    tbody.innerHTML = '';
    salones.forEach(salon => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = salon.id;
        row.insertCell(1).textContent = salon.nombre;
        row.insertCell(2).textContent = salon.edificio_nombre || 'N/A';
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
}

async function agregarSalon(e) {
    e.preventDefault();
    const nombre = document.getElementById('salonNombre').value;
    let edificio_id = document.getElementById('salonEdificioId').value;
    if (!edificio_id) {
        edificio_id = prompt('ID del edificio al que pertenece el salón (1-12 para A1-A12):');
        if (!edificio_id) return;
    }
    try {
        const res = await fetch('/api/salones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, edificio_id })
        });
        if (res.ok) {
            alert('Salón agregado');
            document.getElementById('salonNombre').value = '';
            const selectEdificio = document.getElementById('selectEdificioSalon').value;
            if (selectEdificio) cargarSalonesPorEdificio(selectEdificio);
            else cargarTodosSalones();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        alert('Error de red');
    }
}

function editarSalon(id, nombreActual) {
    const nuevoNombre = prompt('Nuevo nombre del salón:', nombreActual);
    if (nuevoNombre && nuevoNombre !== nombreActual) {
        fetch(`/api/salones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nuevoNombre })
        }).then(res => {
            if (res.ok) {
                alert('Actualizado');
                const selectEdificio = document.getElementById('selectEdificioSalon').value;
                if (selectEdificio) cargarSalonesPorEdificio(selectEdificio);
                else cargarTodosSalones();
            } else alert('Error');
        }).catch(err => alert(err));
    }
}

async function eliminarSalon(id) {
    if (confirm('¿Eliminar salón? Se perderán las incidencias asociadas (si las hay).')) {
        try {
            const res = await fetch(`/api/salones/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Eliminado');
                const selectEdificio = document.getElementById('selectEdificioSalon').value;
                if (selectEdificio) cargarSalonesPorEdificio(selectEdificio);
                else cargarTodosSalones();
            } else {
                const err = await res.json();
                alert('Error: ' + err.error);
            }
        } catch (err) { alert(err); }
    }
}