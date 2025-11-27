// Espera a que el HTML esté completamente cargado para empezar a trabajar
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Rutas ---
    // CLAVE: Desde 'app/', subimos un nivel (../) y entramos a 'api/dashboard_api.php'.
    const API_URL = '/sos/api/dashboard_api.php';
    
    // --- Selectores del DOM (Tarjetas) ---
    const countCotPendientes = document.getElementById("count-cot-pendientes");
    const countClientesActivos = document.getElementById("count-clientes-activos");
    const countPagosPendientes = document.getElementById("count-pagos-pendientes");

    // --- Selectores del DOM (Tabla) ---
    const tablaRecientesBody = document.getElementById("tabla-recientes-body");

    // --- Selectores del DOM (Botones) ---
    // NOTA: Si 'empresas.html' está en la carpeta 'html/', la ruta es solo 'empresas.html'
    // porque el navegador ya está en la carpeta 'html/'.
    document.getElementById("btn-ir-a-empresas").addEventListener("click", () => {
        window.location.href = '/sos/html/empresas.html'; 
    });

    // --- Helpers de Formato ---
    const formatMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatFecha = (dateISO) => {
        if (!dateISO) return '—';
        const date = new Date(dateISO);
        // Asegura que la fecha sea válida antes de formatear
        if (isNaN(date)) return 'Fecha inválida'; 
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };


    // --- 1. Carga Inicial ---
    async function cargarDatosDashboard() {
        try {
            // 🟢 OPTIMIZACIÓN: Una sola llamada al script PHP que devuelve todo.
            const response = await fetch(`${API_URL}?accion=leer_dashboard`);
            
            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
            }

            const resultado = await response.json();

            if (!resultado.success) {
                throw new Error(resultado.error || "Error desconocido al cargar el dashboard.");
            }
            
            const data = resultado.data;

            // --- 2. Renderizar KPIs para las Tarjetas ---
            
            // Tarjeta 1: Cotizaciones Pendientes
            countCotPendientes.textContent = data.kpi_cot_pendientes ?? 0;

            // Tarjeta 2: Clientes Activos (Servicios Activos)
            countClientesActivos.textContent = data.kpi_serv_activos ?? 0;

            // Tarjeta 3: Pagos Pendientes
            countPagosPendientes.textContent = data.kpi_pagos_pendientes ?? 0;

            // --- 3. Renderizar Tabla de Cotizaciones Recientes ---
            renderizarTablaRecientes(data.tabla_recientes || []);

        } catch (error)
        {
            // Manejo de errores si falla alguna de las llamadas `fetch`
            console.error("Error al cargar el dashboard:", error);
            
            // Muestra un error en la UI (interfaz de usuario)
            tablaRecientesBody.innerHTML = `<tr><td colspan="5" data-label="Error" style="text-align: center; color: red;">Error al cargar los datos: ${error.message}</td></tr>`;
            countCotPendientes.textContent = "Error";
            countClientesActivos.textContent = "Error";
            countPagosPendientes.textContent = "Error";
        }
    }

    // --- 4. Renderizar Tabla ---
    // Función dedicada a "dibujar" la tabla de cotizaciones recientes en el HTML
    function renderizarTablaRecientes(cotizaciones) {
        tablaRecientesBody.innerHTML = ""; 

        // Ya vienen ordenadas y limitadas desde el backend (dashboard_api.php)
        const recientes = cotizaciones; 

        // Si no hay cotizaciones, muestra un mensaje
        if (recientes.length === 0) {
            // Se añaden data-label a la celda que ocupa todas las columnas
            tablaRecientesBody.innerHTML = `<tr><td data-label="Mensaje" colspan="5" style="text-align: center;">No hay cotizaciones recientes.</td></tr>`;
            return;
        }

        // Itera sobre las cotizaciones recientes
        recientes.forEach(cot => {
            const tr = document.createElement("tr"); // Crea una fila
            
            // Genera una clase CSS basada en el estado (ej: "pendiente")
            const estadoClase = (cot.estado_cotizacion || 'Borrador').toLowerCase().replace(" ", "");

            // 🛑 CORRECCIÓN CLAVE: SE AÑADE EL data-label A CADA TD 🛑
            tr.innerHTML = `
                <td data-label="Folio">${cot.id_cotizacion}</td>
                <td data-label="Cliente" class="cliente-nombre">${cot.nombre_comercial || "Cliente Desconocido"}</td>
                <td data-label="Fecha Venc.">${formatFecha(cot.fecha_vencimiento)}</td>
                <td data-label="Total">${formatMoneda(cot.total)}</td>
                <td data-label="Estado"><span class="badge ${estadoClase}">${cot.estado_cotizacion}</span></td>
            `;
            // Añade la fila completa a la tabla en el HTML
            tablaRecientesBody.appendChild(tr);
        });
    }

    // --- Carga Inicial ---
    cargarDatosDashboard();
});