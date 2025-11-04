document.addEventListener("DOMContentLoaded", () => {
    
    // --- NUEVO: URL de la API ---
    const API_URL = 'api/facturacion_api.php';

    // --- Selectores del DOM ---
    const tablaBody = document.getElementById("tabla-body");
    const noResultados = document.getElementById("no-resultados");
    const formBusqueda = document.getElementById("form-busqueda");
    const inputBusqueda = document.getElementById("busqueda");
    const filtroPago = document.getElementById("filtro-pago");

    // --- Almacenes de Datos ---
    let datosFacturacion = []; // Guardará los servicios + nombre de empresa

    // --- Helpers de Formato ---
    const formatMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatFecha = (dateISO) => {
        if (!dateISO) return 'N/A';
        return new Date(dateISO.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // --- 1. Carga Inicial (ACTUALIZADO) ---
    async function cargarDatosIniciales() {
        try {
            // --- CAMBIO BD ---
            // Cargar los datos desde nuestra nueva API
            const resp = await fetch(`${API_URL}?accion=leer_servicios`);
            
            if (!resp.ok) {
                throw new Error(`Error del servidor: ${resp.statusText}`);
            }
            
            datosFacturacion = await resp.json();
            
            renderizarTabla(datosFacturacion);

        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            noResultados.textContent = "Error al cargar los datos. Revisa la consola (F12) o el log de Apache.";
            noResultados.style.display = "block";
        }
    }

    // --- 2. Renderizar Tabla (ACTUALIZADO) ---
    function renderizarTabla(servicios) {
        tablaBody.innerHTML = "";
        noResultados.style.display = servicios.length === 0 ? "block" : "none";

        servicios.forEach(item => {
            const tr = document.createElement("tr");
            
            // --- CAMBIO BD ---
            // Usamos los nombres de columna de la BD (ej: 'nombre_comercial')
            const nombreEmpresa = item.nombre_comercial || "Empresa Desconocida";
            const estado = item.estado_actual_pago;
            const estadoClase = estado.toLowerCase().replace(" ", "");

            let accionButton;
            if (estado === "Pagado") {
                accionButton = `
                    <button class="btn-pagar disabled" disabled>
                        <i class="fa fa-check"></i> Pagado
                    </button>
                `;
            } else { // "Pendiente"
                accionButton = `
                    <button class="btn-pagar" data-id="${item.id_servicio}">
                        Marcar como Pagado
                    </button>
                `;
            }

            tr.innerHTML = `
                <td><strong>${nombreEmpresa}</strong></td>
                <td>${formatMoneda(item.monto_mensual)}</td>
                <td>${formatFecha(item.fecha_proximo_vencimiento)}</td>
                <td><span class="badge ${estadoClase}">${estado}</span></td>
                <td>${accionButton}</td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    // --- 3. Filtrar Tabla (ACTUALIZADO) ---
    function filtrarYRenderizar() {
        const termino = inputBusqueda.value.toLowerCase();
        const estadoFiltro = filtroPago.value;
        
        const filtrados = datosFacturacion.filter(item => {
            // --- CAMBIO BD ---
            // 1. Filtrar por estado de pago
            const matchEstado = (estadoFiltro === "") || (item.estado_actual_pago === estadoFiltro);
            
            // 2. Filtrar por término de búsqueda (nombre de empresa)
            const nombreEmpresa = item.nombre_comercial ? item.nombre_comercial.toLowerCase() : "";
            const matchTermino = nombreEmpresa.includes(termino);

            return matchEstado && matchTermino;
        });
        
        renderizarTabla(filtrados);
    }

    // --- 4. Acción de Pagar (ACTUALIZADO) ---
    async function marcarComoPagado(idServicio) {
        // Mostrar la confirmación
        if (!confirm("¿Estás seguro de que deseas marcar este servicio como PAGADO?")) {
            return;
        }

        try {
            // --- CAMBIO BD ---
            // 1. Enviar la orden a la API
            const body = {
                modo: "marcar_pagado",
                id_servicio: idServicio
            };

            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                throw new Error(errorText || `Error del servidor: ${resp.statusText}`);
            }

            const resultado = await resp.json();

            if (resultado.success) {
                // 2. Si la API tuvo éxito, actualizar el estado localmente
                const servicio = datosFacturacion.find(s => s.id_servicio == idServicio);
                if (servicio) {
                    servicio.estado_actual_pago = "Pagado";
                }
                
                alert("Pago registrado con éxito.");

                // 3. Volver a renderizar la tabla para mostrar el cambio
                filtrarYRenderizar(); // Usamos filtrar para mantener los filtros actuales
            } else {
                throw new Error(resultado.error || "Error desconocido al guardar.");
            }
        
        } catch (error) {
            console.error("Error al marcar como pagado:", error);
            alert("Error: " + error.message);
        }
    }

    // --- 5. Event Listeners ---
    formBusqueda.addEventListener("submit", (e) => e.preventDefault());
    inputBusqueda.addEventListener("keyup", filtrarYRenderizar);
    filtroPago.addEventListener("change", filtrarYRenderizar);

    // Delegación de eventos para los botones "Pagar"
    tablaBody.addEventListener("click", (e) => {
        // Si el clic fue en un botón con la clase 'btn-pagar' Y no está deshabilitado
        if (e.target.classList.contains("btn-pagar") && !e.target.disabled) {
            const id = e.target.dataset.id;
            marcarComoPagado(id);
        }
    });

    // --- Carga Inicial ---
    cargarDatosIniciales();
});