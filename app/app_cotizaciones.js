// Este script ya NO usa document.addEventListener("DOMContentLoaded", ...)
// Su ejecución es iniciada por main.js (llamando a initCotizacionesApp) después de que el DOM esté listo.

const API_URL = '../api/cotizaciones_api.php';
const COSTO_POR_KG = 1.5;

// --- Almacenes de Datos (Globales) ---
let datosCombinados = []; 
let listaProductos = [];
let listaCotizaciones = [];
let modalHTML = ""; 
let modalViewHTML = ""; // Nueva variable para el HTML del modal de ver
let datosCotizacionActual = null; // Para guardar datos al generar PDF

// --- Selectores del DOM (Declarados globalmente, inicializados en init) ---
let tabButtons;
let tabContents;
let modalPlaceholder;
let modalViewPlaceholder;
let formBusquedaClientes;
let inputBusquedaClientes;
let tablaClientesBody;
let noResultadosClientes;
let formBusquedaCotizaciones;
let inputBusquedaCotizaciones;
let filtroEstadoCotizacion;
let tablaCotizacionesBody; 
let noResultadosCotizaciones;


/**
 * 🟢 FUNCIÓN DE INICIALIZACIÓN PRINCIPAL 🟢
 */
function initCotizacionesApp() {
    
    // --- 1. Inicialización de Selectores del DOM ---
    // 🟢 ESTOS YA NO DEBEN SER NULL GRACIAS A LA CORRECCIÓN EN EL HTML 🟢
    tabButtons = document.querySelectorAll(".tab-button");
    tabContents = document.querySelectorAll(".tab-content");
    modalPlaceholder = document.getElementById("modal-placeholder"); 
    modalViewPlaceholder = document.getElementById("modal-view-placeholder");
    formBusquedaClientes = document.getElementById("form-busqueda-clientes");
    inputBusquedaClientes = document.getElementById("busqueda-clientes");
    tablaClientesBody = document.getElementById("tabla-clientes-body");
    noResultadosClientes = document.getElementById("no-resultados-clientes");
    formBusquedaCotizaciones = document.getElementById("form-busqueda-cotizaciones");
    inputBusquedaCotizaciones = document.getElementById("busqueda-cotizaciones");
    filtroEstadoCotizacion = document.getElementById("filtro-estado-cotizacion");
    tablaCotizacionesBody = document.getElementById("tabla-cotizaciones-body"); 
    noResultadosCotizaciones = document.getElementById("no-resultados-cotizaciones");
    
    // --- 2. Llamada a la Carga Inicial de Datos ---
    cargarDatosIniciales();
    
    // --- 3. Inicialización de Listeners ---
    
    // Lógica de Pestañas
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(button.dataset.tab).classList.add("active");
        });
    });

    // Lógica de Clientes
    formBusquedaClientes.addEventListener("submit", (e) => e.preventDefault());
    inputBusquedaClientes.addEventListener("keyup", filtrarYRenderizarClientes);
    
    tablaClientesBody.addEventListener("click", (e) => {
        const cotizarBtn = e.target.closest(".btn-cotizar");
        if (cotizarBtn) {
            abrirModal(cotizarBtn.dataset.id);
        }
    });

    // Lógica de Cotizaciones Guardadas
    formBusquedaCotizaciones.addEventListener("submit", (e) => e.preventDefault());
    inputBusquedaCotizaciones.addEventListener("keyup", filtrarYRenderizarCotizaciones);
    filtroEstadoCotizacion.addEventListener("change", filtrarYRenderizarCotizaciones);

    // Listener de Acciones de Cotizaciones
    tablaCotizacionesBody.addEventListener("click", (e) => {
        const btn = e.target.closest("button.btn-accion-cot");
        if (!btn) return; 

        const id = btn.dataset.id; 

        if (btn.classList.contains("ver")) {
            abrirModalVerCotizacion(id);
        } 
        else if (btn.classList.contains("aceptar")) {
            aceptarCotizacion(id);
        } 
        else if (btn.classList.contains("rechazar")) {
            cambiarEstadoCotizacion(id, "Rechazada");
        } 
        else if (btn.classList.contains("eliminar")) {
            eliminarCotizacion(id);
        }
    });
}


// --- FUNCIONES DE LÓGICA ---

async function cargarDatosIniciales() {
    try {
        const [
            respModalHTML,
            respModalViewHTML, // <--- NUEVO
            respClientes,
            respProductos,
            respCotizaciones
        ] = await Promise.all([
            fetch("../html/modal_formulario.html"), 
            fetch("../html/modal_ver_cotizacion.html"), // <--- NUEVO: Cargar el nuevo archivo
            fetch(`${API_URL}?accion=leer_clientes`),
            fetch(`${API_URL}?accion=leer_productos`),
            fetch(`${API_URL}?accion=leer_cotizaciones`)
        ]);

        modalHTML = await respModalHTML.text();
        modalViewHTML = await respModalViewHTML.text(); // <--- Guardamos el texto
        
        datosCombinados = await respClientes.json();
        listaProductos = await respProductos.json();
        listaCotizaciones = await respCotizaciones.json();

        renderizarTablaClientes(datosCombinados);
        renderizarTablaCotizaciones(listaCotizaciones);

    } catch (error) {
        console.error("Error fatal al cargar datos iniciales:", error); 
        // ... manejo de error existente ...
    }
}

// --------------------------------------------------------------------------------------
// --- Renderizado de Clientes (Corregido para mostrar Teléfono) ---
// --------------------------------------------------------------------------------------

function renderizarTablaClientes(empresas) {
    tablaClientesBody.innerHTML = "";
    noResultadosClientes.style.display = empresas.length === 0 ? "block" : "none";

    empresas.forEach(item => {
        const tr = document.createElement("tr");
        
        const celdaEmpresa = `<td class="info-empresa" data-label="Empresa"><strong>${item.nombre_comercial}</strong><div class="razon-social">${item.razon_social || ''}</div></td>`;
        
        let celdaContacto = '<td data-label="Contacto">—</td>';
        let celdaEmail = '<td data-label="Email">—</td>';

        
        if (item.contacto_nombre) {
            celdaContacto = `<td class="info-contacto" data-label="Contacto"><strong>${item.contacto_nombre}</strong></td>`;
            celdaEmail = `<td data-label="Email">${item.contacto_email || '—'}</td>`;
        }


        const celdaAcciones = `
            <td data-label="Acciones">
                <button type="button" class="btn-cotizar" data-id="${item.id_empresa}">
                    <i class="fa fa-file-signature"></i> Realizar cotización
                </button>
            </td>`;
        
        tr.innerHTML = celdaEmpresa + celdaContacto + celdaEmail + celdaAcciones;
        tablaClientesBody.appendChild(tr);
    });
}

function filtrarYRenderizarClientes() {
    const termino = inputBusquedaClientes.value.toLowerCase();
    const filtrados = datosCombinados.filter(item => {
        return (item.nombre_comercial.toLowerCase().includes(termino) ||
               (item.razon_social && item.razon_social.toLowerCase().includes(termino)) ||
               (item.contacto_nombre && item.contacto_nombre.toLowerCase().includes(termino)));
    });
    renderizarTablaClientes(filtrados);
}

function renderizarTablaCotizaciones(cotizaciones) {
    if (!tablaCotizacionesBody) return; 

    tablaCotizacionesBody.innerHTML = "";
    noResultadosCotizaciones.style.display = cotizaciones.length === 0 ? "block" : "none";

    cotizaciones.forEach(cot => {
        const tr = document.createElement("tr");
        const estadoTexto = cot.estado_cotizacion || 'Borrador';
        const estadoClase = estadoTexto.toLowerCase().replace(" ", "");

        tr.innerHTML = `
            <td data-label="Folio">${cot.id_cotizacion}</td>
            <td data-label="Cliente">${cot.nombre_comercial || 'Cliente no encontrado'}</td>
            <td data-label="Total">${formatearMoneda(cot.total)}</td>
            <td data-label="Estado"><span class="badge ${estadoClase}">${estadoTexto}</span></td>
            <td data-label="Acciones">
                <button class="btn-accion-cot ver" data-id="${cot.id_cotizacion}" title="Ver Detalles">
                    <i class="fa fa-eye"></i>
                </button>
                ${cot.estado_cotizacion === 'Pendiente' ? `
                <button class="btn-accion-cot aceptar" data-id="${cot.id_cotizacion}" title="Aceptar Cotización">
                    <i class="fa fa-check"></i>
                </button>
                <button class="btn-accion-cot rechazar" data-id="${cot.id_cotizacion}" title="Rechazar Cotización">
                    <i class="fa fa-times"></i>
                </button>
                ` : ''}
                
                <button class="btn-accion-cot eliminar" data-id="${cot.id_cotizacion}" title="Eliminar Cotización">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        `;
        tablaCotizacionesBody.appendChild(tr);
    });
}

function filtrarYRenderizarCotizaciones() {
    const termino = inputBusquedaCotizaciones.value.toLowerCase();
    const estado = filtroEstadoCotizacion.value;

    const filtrados = listaCotizaciones.filter(cot => {
        const matchTermino = (cot.id_cotizacion.toString().toLowerCase().includes(termino) || 
                              (cot.nombre_comercial || '').toLowerCase().includes(termino));
        const matchEstado = (estado === "") || (cot.estado_cotizacion === estado);
        return matchTermino && matchEstado;
    });
    renderizarTablaCotizaciones(filtrados);
}

function abrirModal(idEmpresa) {
    const empresa = datosCombinados.find(e => e.id_empresa == idEmpresa);
    if (!empresa) return;
    
    // 🟢 LÍNEA 232 CORREGIDA: modalPlaceholder ya no es null
    modalPlaceholder.innerHTML = modalHTML; 
    
    document.getElementById("modal-empresa-id").value = empresa.id_empresa;
    document.getElementById("modal-empresa-nombre").textContent = empresa.nombre_comercial;
    const selectContacto = document.createElement('select');
    selectContacto.id = "modal-contacto-select";
    selectContacto.style.cssText = "width:100%; padding:0.5rem;";
    if (empresa.id_contacto) {
        const opt = document.createElement('option');
        opt.value = empresa.id_contacto;
        opt.textContent = `${empresa.contacto_nombre} (${empresa.contacto_email})`;
        selectContacto.appendChild(opt);
    } else {
        selectContacto.innerHTML = "<option value=''>Sin contactos</option>";
    }
    document.getElementById("modal-contacto-nombre").replaceWith(selectContacto);
    const selectTolva = document.getElementById("select-tolva");
    const productosTolva = listaProductos.filter(p => p.unidad === "renta");
    productosTolva.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_producto;
        option.textContent = `${p.descripcion} (${formatearMoneda(p.precio_unitario)})`;
        option.dataset.precio = p.precio_unitario;
        selectTolva.appendChild(option);
    });
    document.getElementById("modal-close-btn").addEventListener("click", cerrarModal);
    document.getElementById("form-cotizacion").addEventListener("submit", manejarSubmitCotizacion);
    document.getElementById("check-recoleccion").addEventListener("change", function() {
        const estaMarcado = this.checked;
        document.getElementById("dias-recoleccion").classList.toggle('hidden', !estaMarcado);
        document.getElementById("tipo-residuo-group").classList.toggle('hidden', !estaMarcado);
        document.getElementById("bolsas-peso-group").classList.toggle('hidden', !estaMarcado);
        if (!estaMarcado) {
            document.querySelectorAll('.dia-check').forEach(check => check.checked = false);
        }
        actualizarCalculoTotal();
    });
    document.querySelectorAll(".dia-check").forEach(check => check.addEventListener("change", actualizarCalculoTotal));
    document.getElementById("bolsas-dia").addEventListener("input", actualizarCalculoTotal);
    document.getElementById("peso-bolsa").addEventListener("input", actualizarCalculoTotal);
    document.getElementById("btn-add-tolva").addEventListener("click", agregarLineaTolva);
    document.getElementById("tolvas-tbody").addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-borrar-linea")) {
            e.target.closest("tr").remove();
            actualizarCalculoTotal();
        }
    });
}

function cerrarModal() {
    modalPlaceholder.innerHTML = "";
}

function agregarLineaTolva() {
    const select = document.getElementById('select-tolva');
    const opcion = select.options[select.selectedIndex];
    if (!opcion.value) return; 
    const qty = document.getElementById('input-tolva-qty').value;
    const precio = parseFloat(opcion.dataset.precio);
    const subtotal = qty * precio;
    const idProducto = opcion.value;
    const descripcion = opcion.textContent.split(' ($')[0]; 
    const tbody = document.getElementById('tolvas-tbody');
    const tr = document.createElement('tr');
    tr.dataset.idProducto = idProducto; 
    tr.dataset.precio = precio;
    tr.dataset.qty = qty;
    tr.innerHTML = `
        <td>${descripcion}</td><td>${qty}</td>
        <td>${formatearMoneda(precio)}</td>
        <td class="subtotal-linea">${formatearMoneda(subtotal)}</td>
        <td><button type="button" class="btn-borrar-linea">&times;</button></td>
    `;
    tbody.appendChild(tr);
    actualizarCalculoTotal();
}

function actualizarCalculoTotal() {
    let total = 0;
    const checkRecoleccion = document.getElementById('check-recoleccion');
    if (checkRecoleccion.checked) {
        let costo_servicio_mensual = parseFloat(checkRecoleccion.dataset.precio || 0);
        let costo_dias_semanal = 0;
        const diasChecks = document.querySelectorAll('.dia-check:checked');
        diasChecks.forEach(check => {
            costo_dias_semanal += parseFloat(check.dataset.precio || 0);
        });
        costo_servicio_mensual += (costo_dias_semanal * 4);
        total += costo_servicio_mensual;
        const bolsas_por_dia = parseFloat(document.getElementById('bolsas-dia').value) || 0;
        const peso_por_bolsa = parseFloat(document.getElementById('peso-bolsa').value) || 0;
        const dias_seleccionados = diasChecks.length;
        const bolsas_por_semana = bolsas_por_dia * dias_seleccionados;
        const bolsas_por_mes = bolsas_por_semana * 4;
        const peso_total_mes = bolsas_por_mes * peso_por_bolsa;
        const costo_extra_peso = peso_total_mes * COSTO_POR_KG;
        total += costo_extra_peso;
    }
    document.querySelectorAll('#tolvas-tbody tr').forEach(tr => {
        total += parseFloat(tr.dataset.qty) * parseFloat(tr.dataset.precio);
    });
    document.getElementById('total-cotizacion').textContent = formatearMoneda(total);
}

async function manejarSubmitCotizacion(e) {
    e.preventDefault();
    const btnGuardar = e.target.querySelector('button[type="submit"]');
    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    const cotizacionData = { 
        id_contacto: document.getElementById("modal-contacto-select").value,
        forma_de_pago: document.getElementById("forma-pago").value,
        total: parseFloat(document.getElementById("total-cotizacion").textContent.replace(/[^0-9.-]+/g,"")),
        estado_cotizacion: "Pendiente", 
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const detallesData = [];
    const checkRecoleccion = document.getElementById("check-recoleccion");
    if (checkRecoleccion.checked) {
        let costo_base_servicio = parseFloat(checkRecoleccion.dataset.precio || 0);
        let costo_dias_semanal = 0;
        const diasChecks = document.querySelectorAll('.dia-check:checked');
        diasChecks.forEach(check => {
            costo_dias_semanal += parseFloat(check.dataset.precio || 0);
        });
        const costo_servicio_mensual = costo_base_servicio + (costo_dias_semanal * 4);
        const bolsas_por_dia = parseFloat(document.getElementById('bolsas-dia').value) || 0;
        const peso_por_bolsa = parseFloat(document.getElementById('peso-bolsa').value) || 0;
        const dias_seleccionados = diasChecks.length;
        const bolsas_por_mes = (bolsas_por_dia * dias_seleccionados) * 4;
        const peso_total_mes = bolsas_por_mes * peso_por_bolsa;
        const costo_extra_peso = peso_total_mes * COSTO_POR_KG;
        const productoServicio = listaProductos.find(p => p.sku === 'P-001');
        const idProductoServicio = productoServicio ? productoServicio.id_producto : 1; 
        detallesData.push({
            id_producto: idProductoServicio,
            cantidad: 1,
            precio_unitario: (costo_servicio_mensual + costo_extra_peso), 
            lunes: !!document.querySelector('.dia-check[data-dia="lunes"]:checked'),
            martes: !!document.querySelector('.dia-check[data-dia="martes"]:checked'),
            miercoles: !!document.querySelector('.dia-check[data-dia="miercoles"]:checked'),
            jueves: !!document.querySelector('.dia-check[data-dia="jueves"]:checked'),
            viernes: !!document.querySelector('.dia-check[data-dia="viernes"]:checked'),
            tipo_residuo: document.getElementById('tipo-urbano').checked ? 'Urbano' : 'Especial',
            bolsas_por_dia: bolsas_por_dia,
            peso_por_bolsa_kg: peso_por_bolsa
        });
    }
    document.querySelectorAll("#tolvas-tbody tr").forEach(tr => {
        detallesData.push({
            id_producto: tr.dataset.idProducto,
            cantidad: parseInt(tr.dataset.qty, 10),
            precio_unitario: parseFloat(tr.dataset.precio),
        });
    });
    if (detallesData.length === 0) {
        // Usamos un modal o mensaje en lugar de alert()
        console.warn("No se puede crear una cotización vacía.");
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar Cotización";
        return;
    }

    try {
        const body = {
            modo: "crear_cotizacion", 
            cotizacion: cotizacionData,
            detalles: detallesData
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
            // Usamos un mensaje en lugar de alert()
            console.log(resultado.message || "¡Cotización guardada!");
            const nombreEmpresa = document.getElementById("modal-empresa-nombre").textContent;
            cerrarModal();
            const nuevaCotizacion = {
                ...cotizacionData,
                id_cotizacion: resultado.id_cotizacion_nueva,
                nombre_comercial: nombreEmpresa 
            };
            listaCotizaciones.unshift(nuevaCotizacion); 
            filtrarYRenderizarCotizaciones(); 
            document.querySelector('.tab-button[data-tab="tab-guardadas"]').click();
        } else {
            throw new Error(resultado.error || "Error desconocido al guardar.");
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        // Usamos un mensaje en lugar de alert()
        noResultadosClientes.textContent = "Error al guardar: " + error.message; 
        noResultadosClientes.style.display = "block";
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar Cotización";
    }
}

async function cambiarEstadoCotizacion(id, nuevoEstado) {
    // Usamos console.log/custom modal en lugar de confirm()
    if (false) { // Lógica para un modal de confirmación
        return;
    }

    try {
        const body = {
            modo: "cambiar_estado",
            id_cotizacion: id,
            nuevo_estado: nuevoEstado
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
            console.log(resultado.message || "Estado actualizado");
            const cotizacionLocal = listaCotizaciones.find(c => c.id_cotizacion == id);
            if (cotizacionLocal) {
                cotizacionLocal.estado_cotizacion = nuevoEstado;
            }
            filtrarYRenderizarCotizaciones();
        } else {
            throw new Error(resultado.error || "Error desconocido al actualizar.");
        }

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        // Usamos un mensaje en lugar de alert()
        noResultadosCotizaciones.textContent = "Error: " + error.message;
        noResultadosCotizaciones.style.display = "block";
    }
}

async function aceptarCotizacion(id) {
    // Usamos console.log/custom modal en lugar de confirm()
    if (false) { // Lógica para un modal de confirmación
        return;
    }

    try {
        const body = {
            modo: "aceptar_cotizacion", 
            id_cotizacion: id
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
            console.log(resultado.message || "¡Cotización aceptada! Nuevo servicio creado.");
            const cotizacionLocal = listaCotizaciones.find(c => c.id_cotizacion == id);
            if (cotizacionLocal) {
                cotizacionLocal.estado_cotizacion = "Aceptada";
            }
            filtrarYRenderizarCotizaciones();
        } else {
            throw new Error(resultado.error || "Error desconocido al aceptar.");
        }

    } catch (error) {
        console.error("Error al aceptar cotización:", error);
        // Usamos un mensaje en lugar de alert()
        noResultadosCotizaciones.textContent = "Error: " + error.message;
        noResultadosCotizaciones.style.display = "block";
    }
}

async function eliminarCotizacion(id) {
    // Usamos console.log/custom modal en lugar de confirm()
    if (false) { // Lógica para un modal de confirmación
        return;
    }

    try {
        const body = {
            modo: "eliminar_cotizacion",
            id_cotizacion: id
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
            console.log(resultado.message || "Cotización eliminada");
            listaCotizaciones = listaCotizaciones.filter(c => c.id_cotizacion != id);
            filtrarYRenderizarCotizaciones();
        } else {
            throw new Error(resultado.error || "Error desconocido al eliminar.");
        }

    } catch (error) {
        console.error("Error al eliminar:", error);
        // Usamos un mensaje en lugar de alert()
        noResultadosCotizaciones.textContent = "Error: " + error.message;
        noResultadosCotizaciones.style.display = "block";
    }
}

async function abrirModalVerCotizacion(id) {
    try {
        // 1. Mostrar estado de carga (opcional, o simplemente esperar)
        console.log("Cargando detalles de cotización " + id + "...");

        // 2. Pedir datos completos a la API
        const resp = await fetch(`${API_URL}?accion=leer_detalle_cotizacion&id=${id}`);
        const data = await resp.json();

        if (!data.success) {
            alert("Error: " + (data.error || "No se pudo cargar la cotización"));
            return;
        }

        const cabecera = data.cotizacion;
        const productos = data.detalles;
        datosCotizacionActual = { cabecera, productos }; // Guardar para el PDF

        // 3. Inyectar el HTML en el placeholder correcto
        modalViewPlaceholder.innerHTML = modalViewHTML;

        // 4. Llenar los campos visuales generales
        document.getElementById('view-folio').textContent = `#${cabecera.id_cotizacion}`;
        
        const badge = document.getElementById('view-estado');
        badge.textContent = cabecera.estado_cotizacion;
        badge.className = 'badge ' + cabecera.estado_cotizacion.toLowerCase().replace(" ", "");

        document.getElementById('view-cliente').textContent = cabecera.nombre_comercial;
        document.getElementById('view-contacto').textContent = `${cabecera.contacto_nombre} (${cabecera.contacto_email})`;
        document.getElementById('view-fecha').textContent = cabecera.fecha_vencimiento || 'N/A';
        document.getElementById('view-pago').textContent = cabecera.forma_de_pago || 'N/A';
        document.getElementById('view-total').textContent = formatearMoneda(cabecera.total);

        // --- 5. LÓGICA DE SEPARACIÓN (SERVICIO vs RENTAS) ---
        
        // Elementos del DOM
        const containerServicio = document.getElementById('view-servicio-container');
        const txtServicioNombre = document.getElementById('view-servicio-nombre');
        const txtServicioTotal = document.getElementById('view-servicio-total');
        const txtServicioDetalle = document.getElementById('view-servicio-detalle');
        
        const tbody = document.getElementById('view-tabla-productos');
        const msgNoProductos = document.getElementById('view-no-productos');
        
        // Resetear visualización
        tbody.innerHTML = '';
        containerServicio.style.display = 'none';
        msgNoProductos.style.display = 'none';
        let hayProductosExtra = false;

        productos.forEach(prod => {
            const cantidad = parseFloat(prod.cantidad);
            const precio = parseFloat(prod.precio_unitario);
            const subtotal = cantidad * precio;

            // ¿Es el Servicio de Recolección? (Identificamos porque tiene 'tipo_residuo')
            if (prod.tipo_residuo) { // Si no es null o vacío
                containerServicio.style.display = 'block'; // Mostramos el bloque azul
                
                // Formateamos el texto: "RSU (Urbano)" o "RME (Especial)"
                const tipoTexto = (prod.tipo_residuo === 'Urbano') 
                    ? 'Recolección de Residuos Sólidos Urbanos (RSU)' 
                    : 'Recolección de Manejo Especial (RME)';
                
                txtServicioNombre.textContent = tipoTexto;
                txtServicioTotal.textContent = formatearMoneda(subtotal); // Total del servicio
                
                // Detalles pequeños abajo
                txtServicioDetalle.textContent = `${prod.bolsas_por_dia} bolsas/día`;

            } else {
                // Es una Renta (Tolva) u otro producto -> A LA TABLA
                hayProductosExtra = true;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${prod.nombre_producto}</td>
                    <td style="text-align:center;">${cantidad}</td>
                    <td style="text-align:right;">${formatearMoneda(precio)}</td>
                    <td style="text-align:right;">${formatearMoneda(subtotal)}</td>
                `;
                tbody.appendChild(tr);
            }
        });

        // Si solo hay servicio y no hay tolvas extra, mostramos mensaje en la tabla
        if (!hayProductosExtra) {
            msgNoProductos.style.display = 'block';
            document.querySelector('.modal-table').style.display = 'none'; // Ocultar cabecera tabla
        } else {
            document.querySelector('.modal-table').style.display = 'table'; // Mostrar tabla
            // Ajuste para móvil (si usaste el CSS que te di antes, esto asegura que se vea)
            if(window.innerWidth <= 600) document.querySelector('.modal-table').style.display = 'block';
        }

        // 6. Configurar botones
        document.getElementById('modal-view-close-btn').onclick = cerrarModalVer;
        document.getElementById('btn-cerrar-view').onclick = cerrarModalVer;
        
        document.getElementById('btn-descargar-pdf').onclick = generarPDFCotizacion;

        // Mostrar el modal (asumiendo que el CSS ya maneja .modal-overlay igual que el anterior)
        // NOTA: Asegúrate que el HTML inyectado tenga style="display:flex" o que la clase lo maneje.
        // Como 'modal-overlay' en tu CSS actual necesita 'display:flex', pero al inyectarlo está oculto?
        // Vamos a forzar el display block/flex en el contenedor hijo:
        const overlay = modalViewPlaceholder.querySelector('.modal-overlay');
        overlay.style.display = 'flex'; // Forzar visualización

    } catch (e) {
        console.error("Error al abrir modal detalle:", e);
    }
}

function cerrarModalVer() {
    modalViewPlaceholder.innerHTML = "";
    datosCotizacionActual = null;
}

// --- FUNCIÓN PARA GENERAR PDF (Usando pdfMake) ---
function generarPDFCotizacion() {
    if (!datosCotizacionActual) return;

    const { cabecera, productos } = datosCotizacionActual;

    // Construir filas para la tabla del PDF
    const bodyTable = [
        [ { text: 'Descripción', style: 'tableHeader' }, { text: 'Cant.', style: 'tableHeader' }, { text: 'P. Unitario', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' } ]
    ];

    productos.forEach(p => {
        const subtotal = p.cantidad * p.precio_unitario;
        bodyTable.push([
            p.nombre_producto,
            p.cantidad,
            { text: formatearMoneda(p.precio_unitario), alignment: 'right' },
            { text: formatearMoneda(subtotal), alignment: 'right' }
        ]);
    });

    // Definición del documento
    const docDefinition = {
        content: [
            { text: 'COTIZACIÓN', style: 'header' },
            {
                columns: [
                    {
                        width: 'auto',
                        text: [
                            { text: 'Folio: ', bold: true }, `#${cabecera.id_cotizacion}\n`,
                            { text: 'Fecha: ', bold: true }, `${cabecera.fecha_creacion || new Date().toLocaleDateString()}\n`,
                            { text: 'Vencimiento: ', bold: true }, `${cabecera.fecha_vencimiento}\n`,
                            { text: 'Estado: ', bold: true }, `${cabecera.estado_cotizacion}`
                        ]
                    },
                    {
                        width: '*',
                        alignment: 'right',
                        text: [
                            { text: 'Cliente:\n', bold: true },
                            `${cabecera.nombre_comercial}\n`,
                            `${cabecera.contacto_nombre}\n`,
                            `${cabecera.contacto_email}`
                        ]
                    }
                ]
            },
            { text: ' ', margin: [0, 10] }, // Espacio
            {
                table: {
                    headerRows: 1,
                    widths: [ '*', 'auto', 'auto', 'auto' ],
                    body: bodyTable
                },
                layout: 'lightHorizontalLines'
            },
            { text: ' ', margin: [0, 10] },
            {
                text: `TOTAL: ${formatearMoneda(cabecera.total)}`,
                style: 'total',
                alignment: 'right'
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10],
                color: '#2563eb'
            },
            tableHeader: {
                bold: true,
                fontSize: 12,
                color: 'black'
            },
            total: {
                fontSize: 16,
                bold: true,
                color: '#059669'
            }
        }
    };

    // Descargar
    pdfMake.createPdf(docDefinition).download(`Cotizacion_${cabecera.id_cotizacion}.pdf`);
}

const formatearMoneda = (numero) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numero);
};