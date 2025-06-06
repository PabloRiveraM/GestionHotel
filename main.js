// Función para mostrar secciones
function showSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('[id$="-section"]').forEach(s => s.style.display = 'none');

    // Mostrar la sección seleccionada
    document.getElementById(section + '-section').style.display = 'block';

    // Actualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'reservaciones': 'Nueva Reservación',
        'huespedes': 'Gestión de Huéspedes',
        'habitaciones': 'Gestión de Habitaciones',
        'reportes': 'Reportes y Estadísticas'
    };
    document.getElementById('page-title').textContent = titles[section];

    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    // Usar event.target solo si existe el evento
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    // Ocultar menú en móvil
    const sidebarCollapse = document.getElementById('sidebarMenu');
    if (sidebarCollapse.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(sidebarCollapse, { toggle: false });
        bsCollapse.hide();
    }

    // Cargar datos específicos de la sección
    switch(section) {
        case 'dashboard':
            actualizarDashboard();
            break;
        case 'reservaciones':
            cargarHabitacionesSelect();
            break;
        case 'huespedes':
            cargarTablaHuespedes();
            break;
        case 'habitaciones':
            cargarHabitaciones();
            break;
        case 'reportes':
            actualizarEstadisticas();
            break;
    }
}

        // Cargar habitaciones en select
function cargarHabitacionesSelect() {
    const select = document.getElementById('habitacion');
    select.innerHTML = '<option value="">Seleccionar habitación...</option>';
    fetch('http://localhost:3000/api/habitaciones')
        .then(res => res.json())
        .then(habitaciones => {
            habitaciones.filter(h => h.estado === 'Disponible').forEach(habitacion => {
                const option = document.createElement('option');
                option.value = habitacion.id;
                option.textContent = `${habitacion.numero} - ${habitacion.tipo} (Q${habitacion.precio}/noche)`;
                option.dataset.precio = habitacion.precio;
                select.appendChild(option);
            });
        });
}

// Calcular total de reservación
function calcularTotal() {
    const adultos = parseInt(document.getElementById('adultos').value) || 0;
    const ninos = parseInt(document.getElementById('ninos').value) || 0;
    const checkinDate = new Date(document.getElementById('checkin').value);
    const checkoutDate = new Date(document.getElementById('checkout').value);
    const habitacionSelect = document.getElementById('habitacion');
    
    if (!checkinDate || !checkoutDate || !habitacionSelect.value) return;
    
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const precioHabitacion = parseFloat(habitacionSelect.selectedOptions[0].dataset.precio) || 0;
    
    const subtotal = nights * precioHabitacion * adultos;
    const descuentoNinos = nights * precioHabitacion * ninos * DESCUENTO_NINOS;
    const total = subtotal + descuentoNinos;
    const anticipo = total * 0.5;
    
    document.getElementById('subtotal').textContent = `Q${subtotal.toFixed(2)}`;
    document.getElementById('descuento').textContent = `Q${descuentoNinos.toFixed(2)}`;
    document.getElementById('total').textContent = `Q${total.toFixed(2)}`;
    document.getElementById('anticipo').textContent = `Q${anticipo.toFixed(2)}`;
}

        // Manejar envío de formulario de reservación
       document.getElementById('reservacion-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = {
        nombre: document.getElementById('nombre').value,
        dpi: document.getElementById('dpi').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        adultos: parseInt(document.getElementById('adultos').value),
        ninos: parseInt(document.getElementById('ninos').value),
        checkin: document.getElementById('checkin').value,
        checkout: document.getElementById('checkout').value,
        habitacionId: parseInt(document.getElementById('habitacion').value),
        observaciones: document.getElementById('observaciones').value,
        anticipoPagado: document.getElementById('anticipo-pagado').checked,
        estado: document.getElementById('anticipo-pagado').checked ? 'Confirmada' : 'Pendiente',
        fechaCreacion: new Date().toISOString(),
        total: parseFloat(document.getElementById('total').textContent.replace('Q', '')),
        anticipo: parseFloat(document.getElementById('anticipo').textContent.replace('Q', ''))
    };
    fetch('http://localhost:3000/api/reservaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
        alert('Reservación guardada exitosamente');
        limpiarFormulario();
        cargarHabitacionesSelect();
    })
    .catch(() => alert('Error al guardar la reservación'));
});
        // Limpiar formulario
        function limpiarFormulario() {
            document.getElementById('reservacion-form').reset();
            document.getElementById('subtotal').textContent = 'Q0.00';
            document.getElementById('descuento').textContent = 'Q0.00';
            document.getElementById('total').textContent = 'Q0.00';
            document.getElementById('anticipo').textContent = 'Q0.00';
        }

        // Actualizar Dashboard
        function actualizarDashboard() {
            const hoy = new Date().toISOString().split('T')[0];
            fetch('http://localhost:3000/api/reservaciones')
                .then(res => res.json())
                .then(reservaciones => {
                    fetch('http://localhost:3000/api/habitaciones')
                        .then(res => res.json())
                        .then(habitaciones => {
                            const reservacionesHoy = reservaciones.filter(r => r.checkin === hoy).length;
                            const habitacionesOcupadas = habitaciones.filter(h => h.estado === 'Ocupada').length;
                            const huespedesActivos = reservaciones.filter(r => r.estado === 'Check-in').length;

                            // Calcular ingresos del mes
                            const mesActual = new Date().getMonth();
                            const anoActual = new Date().getFullYear();
                            const ingresosMes = reservaciones
                                .filter(r => {
                                    const fecha = new Date(r.fechaCreacion);
                                    return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual;
                                })
                                .reduce((sum, r) => sum + (r.total || 0), 0);

                            document.getElementById('reservaciones-hoy').textContent = reservacionesHoy;
                            document.getElementById('habitaciones-ocupadas').textContent = habitacionesOcupadas;
                            document.getElementById('huespedes-activos').textContent = huespedesActivos;
                            document.getElementById('ingresos-mes').textContent = `Q${ingresosMes.toFixed(2)}`;

                            // Cargar reservaciones recientes y estado habitaciones
                            cargarReservacionesRecientes(reservaciones, habitaciones);
                            cargarEstadoHabitaciones(habitaciones);
                        });
                });
        }

        // Cargar reservaciones recientes
        function cargarReservacionesRecientes(reservaciones, habitaciones) {
            const tbody = document.querySelector('#reservaciones-recientes tbody');
            tbody.innerHTML = '';

            const reservacionesRecientes = reservaciones
                .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
                .slice(0, 5);

            reservacionesRecientes.forEach(reservacion => {
                const habitacion = habitaciones.find(h => h.id === reservacion.habitacionId);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reservacion.nombre}</td>
                    <td>${habitacion ? habitacion.numero : 'N/A'}</td>
                    <td>${formatearFecha(reservacion.checkin)}</td>
                    <td><span class="badge status-${reservacion.estado.toLowerCase()}">${reservacion.estado}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Cargar estado de habitaciones (dashboard)
        function cargarEstadoHabitaciones(habitaciones) {
            const container = document.getElementById('estado-habitaciones');
            container.innerHTML = '';

            habitaciones.forEach(habitacion => {
                const div = document.createElement('div');
                div.className = `p-2 mb-2 rounded room-${habitacion.estado.toLowerCase()}`;
                div.innerHTML = `
                    <strong>${habitacion.numero}</strong> - ${habitacion.tipo}<br>
                    <small>${habitacion.estado}</small>
                `;
                container.appendChild(div);
            });
        }

        // Cargar tabla de huéspedes
        function cargarTablaHuespedes() {
            fetch('http://localhost:3000/api/reservaciones')
        .then(res => res.json())
        .then(reservaciones => {
            fetch('http://localhost:3000/api/habitaciones')
                .then(res => res.json())
                .then(habitaciones => {
                    const tbody = document.querySelector('#tabla-huespedes tbody');
                    tbody.innerHTML = '';

                    reservaciones.forEach(reservacion => {
                        const habitacion = habitaciones.find(h => h.id === reservacion.habitacionId);
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${reservacion.nombre}</td>
                            <td>${reservacion.dpi}</td>
                            <td>${reservacion.telefono}</td>
                            <td>${habitacion ? habitacion.numero : 'N/A'}</td>
                            <td>${formatearFecha(reservacion.checkin)}</td>
                            <td>${formatearFecha(reservacion.checkout)}</td>
                            <td><span class="badge status-${reservacion.estado.toLowerCase()}">${reservacion.estado}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editarReservacion(${reservacion.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="cambiarEstado(${reservacion.id}, 'Check-in')">
                                    <i class="fas fa-sign-in-alt"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="cambiarEstado(${reservacion.id}, 'Check-out')">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="cancelarReservacion(${reservacion.id})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                });
        });
        }

        // Cargar gestión de habitaciones
        function cargarHabitaciones() {
            fetch('http://localhost:3000/api/habitaciones')
        .then(res => res.json())
        .then(habitaciones => {
            const grid = document.getElementById('habitaciones-grid');
            grid.innerHTML = '';

            habitaciones.forEach(habitacion => {
                const div = document.createElement('div');
                div.className = 'col-md-4 mb-3';
                div.innerHTML = `
                    <div class="card room-${habitacion.estado.toLowerCase()}">
                        <div class="card-body">
                            <h5 class="card-title">${habitacion.numero}</h5>
                            <p class="card-text">
                                <strong>Tipo:</strong> ${habitacion.tipo}<br>
                                <strong>Capacidad:</strong> ${habitacion.capacidad} personas<br>
                                <strong>Precio:</strong> Q${habitacion.precio}/noche<br>
                                <strong>Estado:</strong> ${habitacion.estado}
                            </p>
                            <button class="btn btn-sm btn-primary" onclick="editarHabitacion(${habitacion.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            ${habitacion.estado === 'Ocupada' ? 
                                `<button class="btn btn-sm btn-success" onclick="liberarHabitacion(${habitacion.id})">
                                    <i class="fas fa-unlock"></i> Liberar
                                </button>` : ''
                            }
                        </div>
                    </div>
                `;
                grid.appendChild(div);
            });
        });
        }

        // Manejar formulario de habitaciones (insertar en la base de datos)
        document.getElementById('habitacion-form').addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                numero: document.getElementById('numero-habitacion').value,
                tipo: document.getElementById('tipo-habitacion').value,
                precio: parseFloat(document.getElementById('precio-habitacion').value),
                capacidad: parseInt(document.getElementById('capacidad-habitacion').value),
                estado: document.getElementById('estado-habitacion').value
            };

            fetch('http://localhost:3000/api/habitaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(data => {
                document.getElementById('habitacion-form').reset();
                cargarHabitaciones();
                cargarHabitacionesSelect();
                alert('Habitación guardada exitosamente');
            })
            .catch(() => alert('Error al guardar la habitación'));
        });

function editarReservacion(id, datosEditados) {
    fetch(`http://localhost:3000/api/reservaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEditados)
    })
    .then(res => res.json())
    .then(data => {
        alert('Reservación actualizada');
        cargarTablaHuespedes(); // O la función que refresque tu tabla/lista
    })
    .catch(() => alert('Error al actualizar la reservación'));
}

        function cambiarEstado(id, nuevoEstado) {
            fetch(`http://localhost:3000/api/reservaciones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            })
            .then(res => res.json())
            .then(data => {
                // Si el nuevo estado es 'Check-out', también liberar la habitación
                if (nuevoEstado === 'Check-out') {
                    fetch(`http://localhost:3000/api/habitaciones`, {
                        method: 'GET'
                    })
                    .then(res => res.json())
                    .then(habitaciones => {
                        // Buscar la habitación asociada a la reservación
                        fetch(`http://localhost:3000/api/reservaciones/${id}`)
                        .then(res => res.json())
                        .then(reservacion => {
                            const habitacionId = reservacion.habitacionId;
                            fetch(`http://localhost:3000/api/habitaciones/${habitacionId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ estado: 'Disponible' })
                            })
                            .then(() => {
                                cargarTablaHuespedes();
                                actualizarDashboard();
                                alert(`Estado cambiado a: ${nuevoEstado}`);
                            });
                        });
                    });
                } else {
                    cargarTablaHuespedes();
                    actualizarDashboard();
                    alert(`Estado cambiado a: ${nuevoEstado}`);
                }
            })
            .catch(() => alert('Error al cambiar el estado'));
        }

        function cancelarReservacion(id) {
            if (confirm('¿Está seguro de cancelar esta reservación?')) {
                fetch(`http://localhost:3000/api/reservaciones/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'Cancelada' })
                })
                .then(res => res.json())
                .then(() => {
                    // Obtener la reservación para saber la habitación
                    fetch(`http://localhost:3000/api/reservaciones/${id}`)
                    .then(res => res.json())
                    .then(reservacion => {
                        const habitacionId = reservacion.habitacionId;
                        fetch(`http://localhost:3000/api/habitaciones/${habitacionId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ estado: 'Disponible' })
                        })
                        .then(() => {
                            cargarTablaHuespedes();
                            actualizarDashboard();
                            alert('Reservación cancelada');
                        });
                    });
                })
                .catch(() => alert('Error al cancelar la reservación'));
            }
        }

function editarHabitacion(id, datosEditados) {
    fetch(`http://localhost:3000/api/habitaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEditados)
    })
    .then(res => res.json())
    .then(data => {
        alert('Habitación actualizada');
        cargarHabitaciones();
    })
    .catch(() => alert('Error al actualizar la habitación'));
}

        function liberarHabitacion(id) {
            if (confirm('¿Liberar esta habitación?')) {
                fetch(`http://localhost:3000/api/habitaciones/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'Disponible' })
                })
                .then(res => res.json())
                .then(() => {
                    cargarHabitaciones();
                    actualizarDashboard();
                })
                .catch(() => alert('Error al liberar la habitación'));
            }
        }

        // Actualizar estadísticas
        function actualizarEstadisticas() {
            Promise.all([
                fetch('http://localhost:3000/api/reservaciones').then(res => res.json()),
                fetch('http://localhost:3000/api/habitaciones').then(res => res.json())
            ]).then(([reservaciones, habitaciones]) => {
                const totalReservaciones = reservaciones.length;
                const ingresosTotales = reservaciones.reduce((sum, r) => sum + (r.total || 0), 0);
                const ocupadas = habitaciones.filter(h => h.estado === 'Ocupada').length;
                const ocupacionPromedio = habitaciones.length > 0 ? (ocupadas / habitaciones.length * 100) : 0;

                document.getElementById('stat-reservaciones').textContent = totalReservaciones;
                document.getElementById('stat-ingresos').textContent = `Q${ingresosTotales.toFixed(2)}`;
                document.getElementById('stat-ocupacion').textContent = `${ocupacionPromedio.toFixed(1)}%`;
            });
        }

        // Generar reporte
        function generarReporte() {
            const fechaInicio = document.getElementById('fecha-inicio').value;
            const fechaFin = document.getElementById('fecha-fin').value;
            const tipoReporte = document.getElementById('tipo-reporte').value;

            if (!fechaInicio || !fechaFin) {
                alert('Por favor seleccione las fechas del reporte');
                return;
            }

            // Obtener datos de la API
            Promise.all([
                fetch('http://localhost:3000/api/reservaciones').then(res => res.json()),
                fetch('http://localhost:3000/api/habitaciones').then(res => res.json())
            ]).then(([reservaciones, habitaciones]) => {
                let datos = [];
                let headers = [];

                switch (tipoReporte) {
                    case 'reservaciones':
                        headers = ['Nombre', 'DPI', 'Teléfono', 'Habitación', 'Check-in', 'Check-out', 'Estado', 'Total'];
                        datos = reservaciones
                            .filter(r => r.checkin >= fechaInicio && r.checkin <= fechaFin)
                            .map(r => {
                                const habitacion = habitaciones.find(h => h.id === r.habitacionId);
                                return [
                                    r.nombre, r.dpi, r.telefono,
                                    habitacion ? habitacion.numero : 'N/A',
                                    r.checkin, r.checkout, r.estado, r.total || 0
                                ];
                            });
                        break;

                    case 'huespedes':
                        headers = ['Nombre', 'DPI', 'Teléfono', 'Email', 'Adultos', 'Niños'];
                        datos = reservaciones
                            .filter(r => r.checkin >= fechaInicio && r.checkin <= fechaFin)
                            .map(r => [r.nombre, r.dpi, r.telefono, r.email || '', r.adultos, r.ninos]);
                        break;

                    case 'ingresos':
                        headers = ['Fecha', 'Huésped', 'Habitación', 'Total', 'Anticipo', 'Estado'];
                        datos = reservaciones
                            .filter(r => r.checkin >= fechaInicio && r.checkin <= fechaFin)
                            .map(r => {
                                const habitacion = habitaciones.find(h => h.id === r.habitacionId);
                                return [
                                    r.checkin, r.nombre,
                                    habitacion ? habitacion.numero : 'N/A',
                                    r.total || 0, r.anticipo || 0, r.estado
                                ];
                            });
                        break;
                }

                exportarAExcel(datos, headers, `Reporte_${tipoReporte}_${fechaInicio}_${fechaFin}`);
            });
        }

        // Exportar datos a Excel (simulado con CSV)
        function exportarAExcel(datos, headers, filename) {
            let csvContent = headers.join(',') + '\n';
            datos.forEach(row => {
                csvContent += row.map(field => `"${field}"`).join(',') + '\n';
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Exportar todos los datos
        function exportData() {
            const fechaActual = new Date().toISOString().split('T')[0];
            Promise.all([
                fetch('http://localhost:3000/api/reservaciones').then(res => res.json()),
                fetch('http://localhost:3000/api/habitaciones').then(res => res.json())
            ]).then(([reservaciones, habitaciones]) => {
                const datos = reservaciones.map(r => {
                    const habitacion = habitaciones.find(h => h.id === r.habitacionId);
                    return [
                        r.nombre, r.dpi, r.telefono, r.email || '',
                        r.adultos, r.ninos, r.checkin, r.checkout,
                        habitacion ? habitacion.numero : 'N/A',
                        r.estado, r.total || 0, r.anticipo || 0,
                        r.observaciones || ''
                    ];
                });

                const headers = [
                    'Nombre', 'DPI', 'Teléfono', 'Email', 'Adultos', 'Niños',
                    'Check-in', 'Check-out', 'Habitación', 'Estado', 'Total',
                    'Anticipo', 'Observaciones'
                ];

                exportarAExcel(datos, headers, `Reservaciones_${fechaActual}`);
            });
        }

        // Funciones auxiliares
        function formatearFecha(fecha) {
            return new Date(fecha).toLocaleDateString('es-GT');
        }

        // Búsqueda de huéspedes
        document.getElementById('buscar-huesped').addEventListener('input', function(e) {
            const termino = e.target.value.toLowerCase();
            const filas = document.querySelectorAll('#tabla-huespedes tbody tr');
            
            filas.forEach(fila => {
                const texto = fila.textContent.toLowerCase();
                fila.style.display = texto.includes(termino) ? '' : 'none';
            });
        });

        // Configurar fechas mínimas
        document.addEventListener('DOMContentLoaded', function() {
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('checkin').min = hoy;
            document.getElementById('checkout').min = hoy;
            
            // Establecer fechas por defecto para reportes
            document.getElementById('fecha-inicio').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            document.getElementById('fecha-fin').value = hoy;
            
            // Cargar dashboard inicial
            actualizarDashboard();
        });

        // Validar que check-out sea después de check-in
        document.getElementById('checkin').addEventListener('change', function() {
            const checkinDate = this.value;
            const checkoutInput = document.getElementById('checkout');
            checkoutInput.min = checkinDate;
            
            if (checkoutInput.value && checkoutInput.value <= checkinDate) {
                const nextDay = new Date(checkinDate);
                nextDay.setDate(nextDay.getDate() + 1);
                checkoutInput.value = nextDay.toISOString().split('T')[0];
            }
            calcularTotal();
        });
    