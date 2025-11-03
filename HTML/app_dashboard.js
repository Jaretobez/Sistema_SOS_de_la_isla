// Espera a que el HTML esté completamente cargado para empezar a trabajar
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Selectores del DOM (Tarjetas) ---
    // Guarda referencias a los elementos HTML donde mostraremos los números (KPIs)
    const countCotPendientes = document.getElementById("count-cot-pendientes");
    const countClientesActivos = document.getElementById("count-clientes-activos");
    const countPagosPendientes = document.getElementById("count-pagos-pendientes");

    // --- Selectores del DOM (Tabla) ---
    // Guarda la referencia al cuerpo de la tabla de "recientes"
    const tablaRecientesBody = document.getElementById("tabla-recientes-body");

    // --- Selectores del DOM (Botones) ---
    // Añade un 'listener' al botón para que redirija a otra página al hacer clic
    document.getElementById("btn-ir-a-empresas").addEventListener("click", () => {
        window.location.href = 'empresas.html'; // Redirige a la página de empresas
    });

    // --- Helpers de Formato ---
    // Funciones útiles para formatear números como dinero (MXN)
    const formatMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    // Funciones útiles para formatear fechas (ISO a dd/mm/aaaa)
    const formatFecha = (dateISO) => new Date(dateISO).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // --- 1. Carga Inicial ---
    // Función principal asíncrona que carga todos los datos del dashboard
    async function cargarDatosDashboard() {
        try {
            // Carga todos los JSONs que necesitamos al mismo tiempo (en paralelo)
            const [
                respCotizaciones,
                respServicios,
                respEmpresas
            ] = await Promise.all([
                //
                // =======================================================================
                // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (EN EL BACKEND)
                // =======================================================================
                //
                // Estas 3 líneas `fetch` están llamando a archivos .json estáticos.
                // En una aplicación real, estas líneas deben llamar a tus scripts de backend (PHP/API).
                //
                // Ejemplo:
                // fetch("api/get_cotizaciones.php"),
                // fetch("api/get_servicios.php"),
                // fetch("api/get_empresas.php")
                //
                // Esos 3 archivos .php (o como los llames) son los que DEBEN
                // tener la LÓGICA DE CONEXIÓN A LA BASE DE DATOS para hacer los
                // SELECT correspondientes y devolver los datos en formato JSON.
                //
                fetch("cotizaciones.json"),
                fetch("servicios_activos.json"),
                fetch("empresas.json")
            ]);

            // Convierte las respuestas de texto a objetos JSON usables
            const cotizaciones = await respCotizaciones.json();
            const servicios = await respServicios.json();
            const empresas = await respEmpresas.json();

            // Crea un "mapa" (diccionario) de empresas para buscar nombres
            // Esto es mucho más rápido que usar .find() dentro de un bucle
            const empresasMap = empresas.reduce((map, emp) => {
                map[emp.idempresa] = emp["nombre comercial"];
                return map;
            }, {});

            // --- 2. Calcular KPIs para las Tarjetas ---
            
            // Tarjeta 1: Filtra las cotizaciones por estado "Pendiente" y cuenta cuántas hay
            const cotPendientesCount = cotizaciones.filter(
                cot => cot.estado === "Pendiente"
            ).length;
            countCotPendientes.textContent = cotPendientesCount; // Actualiza el HTML

            // Tarjeta 2: Cuenta el total de servicios activos
            const clientesActivosCount = servicios.length;
            countClientesActivos.textContent = clientesActivosCount; // Actualiza el HTML

            // Tarjeta 3: Filtra los servicios por pago "Pendiente" y cuenta cuántos hay
            const pagosPendientesCount = servicios.filter(
                s => s["estado actual de pago"] === "Pendiente"
            ).length;
            countPagosPendientes.textContent = pagosPendientesCount; // Actualiza el HTML

            // --- 3. Renderizar Tabla de Cotizaciones Recientes ---
            // Llama a la función que dibuja la tabla, pasando los datos
            renderizarTablaRecientes(cotizaciones, empresasMap);

        } catch (error)
        {
            // Manejo de errores si falla alguna de las llamadas `fetch`
            console.error("Error al cargar el dashboard:", error);
            // Muestra un error en la UI (interfaz de usuario)
            tablaRecientesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar los datos.</td></tr>`;
            countCotPendientes.textContent = "Error";
            countClientesActivos.textContent = "Error";
            countPagosPendientes.textContent = "Error";
        }
    }

    // --- 4. Renderizar Tabla ---
    // Función dedicada a "dibujar" la tabla de cotizaciones recientes en el HTML
    function renderizarTablaRecientes(cotizaciones, empresasMap) {
        tablaRecientesBody.innerHTML = ""; // Limpiar el "Cargando..."

        // Ordena la lista de cotizaciones por fecha (la más nueva primero)
        const cotizacionesOrdenadas = cotizaciones.sort(
            (a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        );

        // Toma solo las 5 cotizaciones más nuevas
        const recientes = cotizacionesOrdenadas.slice(0, 5);

        // Si no hay cotizaciones, muestra un mensaje
        if (recientes.length === 0) {
            tablaRecientesBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay cotizaciones recientes.</td></tr>`;
            return;
        }

        // Itera sobre las 5 cotizaciones recientes
        recientes.forEach(cot => {
            const tr = document.createElement("tr"); // Crea una fila
            
            // Busca el nombre del cliente usando el "mapa" (rápido)
            const nombreCliente = empresasMap[cot.idEmpresa] || "Cliente Desconocido";
            // Genera una clase CSS basada en el estado (ej: "pendiente")
            const estadoClase = cot.estado.toLowerCase().replace(" ", "");

            // Rellena el HTML de la fila con los datos
            tr.innerHTML = `
                <td>${cot.idCotizacion.split('-')[0]}...</td>
                <td>${nombreCliente}</td>
                <td>${formatFecha(cot.fechaCreacion)}</td>
                <td>${formatMoneda(cot.total)}</td>
                <td><span class="badge ${estadoClase}">${cot.estado}</span></td>
            `;
            // Añade la fila completa a la tabla en el HTML
            tablaRecientesBody.appendChild(tr);
        });
    }

    // --- Carga Inicial ---
    // Llama a la función principal para que todo comience
    cargarDatosDashboard();
});