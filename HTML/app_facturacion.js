document.addEventListener("DOMContentLoaded", () => {
    
    // --- Selectores del DOM ---
    const tablaBody = document.getElementById("tabla-body");
    const noResultados = document.getElementById("no-resultados");
    const formBusqueda = document.getElementById("form-busqueda");
    const inputBusqueda = document.getElementById("busqueda");
    const filtroPago = document.getElementById("filtro-pago");

    // --- Almacenes de Datos ---
    let datosFacturacion = []; // Guardará los servicios + nombre de empresa
    let empresasMap = {}; // Mapa para buscar nombres de empresa

    // --- Helpers de Formato ---
    const formatMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatFecha = (dateISO) => new Date(dateISO).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    // --- 1. Carga Inicial ---
    async function cargarDatosIniciales() {
        try {
            // Cargar los JSON de servicios y empresas
            const [respServicios, respEmpresas] = await Promise.all([
                fetch("servicios_activos.json"),
                fetch("empresas.json")
            ]);

            const servicios = await respServicios.json();
            const empresas = await respEmpresas.json();

            // Crear un mapa de empresas para buscar nombres fácilmente
            empresasMap = empresas.reduce((map, emp) => {
                map[emp.idempresa] = emp;
                return map;
            }, {});

            // Unir los datos
            datosFacturacion = servicios.map(servicio => ({
                ...servicio, // Copia todos los datos del servicio
                empresa: empresasMap[servicio.id_empresa] // Añade la info de la empresa
            }));

            renderizarTabla(datosFacturacion);

        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            noResultados.textContent = "Error al cargar los datos.";
            noResultados.style.display = "block";
        }
    }

    // --- 2. Renderizar Tabla ---
    function renderizarTabla(servicios) {
        tablaBody.innerHTML = "";
        noResultados.style.display = servicios.length === 0 ? "block" : "none";

        servicios.forEach(item => {
            const tr = document.createElement("tr");
            
            const nombreEmpresa = item.empresa ? item.empresa["nombre comercial"] : "Empresa Desconocida";
            const estado = item["estado actual de pago"];
            const estadoClase = estado.toLowerCase().replace(" ", ""); // "pendiente" o "pagado"

            let accionButton;
            if (estado === "Pagado") {
                accionButton = `
                    <button class="btn-pagar disabled" disabled>
                        <i class="fa fa-check"></i> Pagado
                    </button>
                `;
            } else { // "Pendiente"
                accionButton = `
                    <button class="btn-pagar" data-id="${item["id servicio"]}">
                        Marcar como Pagado
                    </button>
                `;
            }

            tr.innerHTML = `
                <td><strong>${nombreEmpresa}</strong></td>
                <td>${formatMoneda(item.monto_mensual)}</td>
                <td>${formatFecha(item["dia de facturacion"])}</td>
                <td><span class="badge ${estadoClase}">${estado}</span></td>
                <td>${accionButton}</td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    // --- 3. Filtrar Tabla ---
    function filtrarYRenderizar() {
        const termino = inputBusqueda.value.toLowerCase();
        const estadoFiltro = filtroPago.value;
        
        const filtrados = datosFacturacion.filter(item => {
            // 1. Filtrar por estado de pago
            const matchEstado = (estadoFiltro === "") || (item["estado actual de pago"] === estadoFiltro);
            
            // 2. Filtrar por término de búsqueda (nombre de empresa)
            const nombreEmpresa = item.empresa ? item.empresa["nombre comercial"].toLowerCase() : "";
            const matchTermino = nombreEmpresa.includes(termino);

            return matchEstado && matchTermino;
        });
        
        renderizarTabla(filtrados);
    }

    // --- 4. Acción de Pagar ---
    function marcarComoPagado(idServicio) {
        // Mostrar la confirmación
        if (confirm("¿Estás seguro de que deseas marcar este servicio como PAGADO?")) {
            // 1. Encontrar el servicio en nuestros datos locales
            const servicio = datosFacturacion.find(s => s["id servicio"] === idServicio);
            
            if (servicio) {
                // 2. Actualizar el estado localmente
                servicio["estado actual de pago"] = "Pagado";
                
                // 3. Simular el guardado
                console.log("SIMULACIÓN: Guardando pago para servicio:", idServicio, servicio);
                alert("Pago registrado (simulado).");

                // 4. Volver a renderizar la tabla para mostrar el cambio
                filtrarYRenderizar(); // Usamos filtrar para mantener los filtros actuales
            }
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