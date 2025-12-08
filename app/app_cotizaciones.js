// Este script ya NO usa document.addEventListener("DOMContentLoaded", ...)
// Su ejecución es iniciada por main.js (llamando a initCotizacionesApp) después de que el DOM esté listo.

const API_URL = '../api/cotizaciones_api.php';
const COSTO_POR_KG = 1.5;

// --- Almacenes de Datos (Globales) ---
let datosCombinados = []; 
let listaProductos = [];
let listaCotizaciones = [];
let modalHTML = ""; 
let modalViewHTML = ""; 
let datosCotizacionActual = null; 

// --- Selectores del DOM ---
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
                    // 🟢 VALIDACIÓN NUEVA: Si el botón no es una pestaña real (como Cotización Rápida), ignorar.
                    if (!button.dataset.tab) return; 

                    // Quitar clase active a todos los botones que sean tabs
                    tabButtons.forEach(btn => {
                        if(btn.dataset.tab) btn.classList.remove("active");
                    });

                    // Ocultar todos los contenidos
                    tabContents.forEach(content => content.classList.remove("active"));
                    
                    // Activar el botón clickeado
                    button.classList.add("active");
                    
                    // Mostrar el contenido correspondiente (Validando que exista)
                    const tabDestino = document.getElementById(button.dataset.tab);
                    if (tabDestino) {
                        tabDestino.classList.add("active");
                    }
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

// 🟢 NUEVO LISTENER PARA COTIZACIÓN RÁPIDA 🟢
    const btnRapida = document.getElementById("btn-cotizacion-rapida");
    if (btnRapida) {
        btnRapida.addEventListener("click", abrirModalRapida);
    }

// --- FUNCIONES DE LÓGICA ---

async function cargarDatosIniciales() {
    try {
        const [
            respModalHTML,
            respModalViewHTML, 
            respClientes,
            respProductos,
            respCotizaciones
        ] = await Promise.all([
            fetch("../html/modal_formulario.html"), 
            fetch("../html/modal_ver_cotizacion.html"), 
            fetch(`${API_URL}?accion=leer_clientes`),
            fetch(`${API_URL}?accion=leer_productos`),
            fetch(`${API_URL}?accion=leer_cotizaciones`)
        ]);

        modalHTML = await respModalHTML.text();
        modalViewHTML = await respModalViewHTML.text(); 
        
        datosCombinados = await respClientes.json();
        listaProductos = await respProductos.json();
        listaCotizaciones = await respCotizaciones.json();

        renderizarTablaClientes(datosCombinados);
        renderizarTablaCotizaciones(listaCotizaciones);

    } catch (error) {
        console.error("Error fatal al cargar datos iniciales:", error); 
    }
}

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
            <td data-label="Folio">${formatearFolio(cot.id_cotizacion)}</td>
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

function abrirModal(idEmpresa) {
    const empresa = datosCombinados.find(e => e.id_empresa == idEmpresa);
    if (!empresa) return;
    
    // Inyectar HTML
    modalPlaceholder.innerHTML = modalHTML; 
    
    document.getElementById("modal-empresa-id").value = empresa.id_empresa;
    document.getElementById("modal-empresa-nombre").textContent = empresa.nombre_comercial;
    
    // Llenar Contactos
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
    
    // Llenar Tolvas
    const selectTolva = document.getElementById("select-tolva");
    const productosTolva = listaProductos.filter(p => p.unidad === "renta");
    productosTolva.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_producto;
        option.textContent = `${p.descripcion} (${formatearMoneda(p.precio_unitario)})`;
        option.dataset.precio = p.precio_unitario;
        selectTolva.appendChild(option);
    });

    // LISTENERS
    document.getElementById("modal-close-btn").addEventListener("click", cerrarModal);
    document.getElementById("form-cotizacion").addEventListener("submit", manejarSubmitCotizacion);
    
    // --- CAMBIO: Ocultar selector y forzar despliegue ---
    const checkRecoleccion = document.getElementById("check-recoleccion");
    if(checkRecoleccion) {
        checkRecoleccion.checked = true; // Forzamos marcado
        // Ocultamos el contenedor padre (donde suele estar el Label y el Check)
        // Asumiendo que tiene un contenedor .recoleccion-header o similar:
        if(checkRecoleccion.closest('.recoleccion-header')) {
            checkRecoleccion.closest('.recoleccion-header').style.display = 'none';
        } else {
            // Si no encuentra la clase, oculta el check directamente
            checkRecoleccion.style.display = 'none';
        }
    }

    // Forzar visualización de los contenedores
    document.getElementById("dias-recoleccion").classList.remove('hidden');
    document.getElementById("tipo-residuo-group").classList.remove('hidden');
    document.getElementById("bolsas-peso-group").classList.remove('hidden');

    // Listeners de cálculo
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

    const selectPago = document.getElementById("forma-pago");
    if (selectPago) {
        selectPago.addEventListener("change", actualizarCalculoTotal);
    }
    
    actualizarCalculoTotal();
}

function actualizarCalculoTotal() {
    let subtotal = 0;

    // --- CAMBIO: La recolección ahora es obligatoria ---
    // 1. Calcular Recolección (Sin if checkRecoleccion.checked)
    
    // CAMBIO: Costo base ahora es 0 (eliminamos los 1200)
    let costo_base = 0; 
    
    let costo_dias_semanal = 0;
    
    // Sumamos los días seleccionados (mantiene los 130 por día si están configurados en el HTML)
    document.querySelectorAll('.dia-check:checked').forEach(check => {
        costo_dias_semanal += parseFloat(check.dataset.precio || 0);
    });

    // Sumar mensualidad (Base 0 + Días * 4 semanas)
    subtotal += costo_base + (costo_dias_semanal * 4);

    // Sumar Peso Extra
    const bolsas_por_dia = parseFloat(document.getElementById('bolsas-dia').value) || 0;
    const peso_por_bolsa = parseFloat(document.getElementById('peso-bolsa').value) || 0;
    const dias_seleccionados = document.querySelectorAll('.dia-check:checked').length;
    
    const costo_extra_peso = (bolsas_por_dia * dias_seleccionados * 4) * peso_por_bolsa * COSTO_POR_KG;
    subtotal += costo_extra_peso;

    // 2. Calcular Tolvas
    document.querySelectorAll('#tolvas-tbody tr').forEach(tr => {
        subtotal += parseFloat(tr.dataset.qty) * parseFloat(tr.dataset.precio);
    });

    // 3. IVA y Totales
    const selectPago = document.getElementById("forma-pago");
    const formaPago = selectPago ? selectPago.value.trim().toLowerCase() : "";
    const tasaIVA = (formaPago === "efectivo") ? 0 : 0.16;
    
    const iva = subtotal * tasaIVA;
    const total = subtotal + iva;

    // 4. Mostrar en pantalla
    if(document.getElementById('subtotal-cotizacion')) {
        document.getElementById('subtotal-cotizacion').textContent = formatearMoneda(subtotal);
    }
    if(document.getElementById('iva-cotizacion')) {
        document.getElementById('iva-cotizacion').textContent = formatearMoneda(iva);
        if (tasaIVA === 0) {
            document.getElementById('iva-cotizacion').style.color = "#999"; 
        } else {
            document.getElementById('iva-cotizacion').style.color = "#333"; 
        }
    }
    
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

    // --- CAMBIO: Siempre procesamos la sección de recolección ---
    
    // CAMBIO: Costo base forzado a 0
    let costo_base_servicio = 0; 
    
    let costo_dias_semanal = 0;
    const diasChecks = document.querySelectorAll('.dia-check:checked');
    diasChecks.forEach(check => {
        costo_dias_semanal += parseFloat(check.dataset.precio || 0);
    });

    // Calculamos el costo mensual solo con los días
    const costo_servicio_mensual = costo_base_servicio + (costo_dias_semanal * 4);
    
    const bolsas_por_dia = parseFloat(document.getElementById('bolsas-dia').value) || 0;
    const peso_por_bolsa = parseFloat(document.getElementById('peso-bolsa').value) || 0;
    const dias_seleccionados = diasChecks.length;
    
    const bolsas_por_mes = (bolsas_por_dia * dias_seleccionados) * 4;
    const peso_total_mes = bolsas_por_mes * peso_por_bolsa;
    const costo_extra_peso = peso_total_mes * COSTO_POR_KG;

    const productoServicio = listaProductos.find(p => p.sku === 'P-001');
    const idProductoServicio = productoServicio ? productoServicio.id_producto : 1; 

    // Agregamos el detalle de recolección siempre
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

    // Agregamos Tolvas si las hay
    document.querySelectorAll("#tolvas-tbody tr").forEach(tr => {
        detallesData.push({
            id_producto: tr.dataset.idProducto,
            cantidad: parseInt(tr.dataset.qty, 10),
            precio_unitario: parseFloat(tr.dataset.precio),
        });
    });

    if (detallesData.length === 0) {
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
        noResultadosClientes.textContent = "Error al guardar: " + error.message; 
        noResultadosClientes.style.display = "block";
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar Cotización";
    }
}

async function cambiarEstadoCotizacion(id, nuevoEstado) {
    if (false) { return; } // Placeholder para confirmación

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
        noResultadosCotizaciones.textContent = "Error: " + error.message;
        noResultadosCotizaciones.style.display = "block";
    }
}

async function aceptarCotizacion(id) {
    if (false) { return; }

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
        noResultadosCotizaciones.textContent = "Error: " + error.message;
        noResultadosCotizaciones.style.display = "block";
    }
}

async function eliminarCotizacion(id) {
    if (false) { return; }

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
        noResultadosCotizaciones.textContent = "Error: " + error.message;
        noResultadosCotizaciones.style.display = "block";
    }
}

async function abrirModalVerCotizacion(id) {
    try {
        console.log("Cargando detalles de cotización " + id + "...");
        const resp = await fetch(`${API_URL}?accion=leer_detalle_cotizacion&id=${id}`);
        const data = await resp.json();

        if (!data.success) {
            alert("Error: " + (data.error || "No se pudo cargar la cotización"));
            return;
        }

        const cabecera = data.cotizacion;
        const productos = data.detalles;
        datosCotizacionActual = { cabecera, productos }; 

        modalViewPlaceholder.innerHTML = modalViewHTML;

        document.getElementById('view-folio').textContent = formatearFolio(cabecera.id_cotizacion);
        
        const badge = document.getElementById('view-estado');
        badge.textContent = cabecera.estado_cotizacion;
        badge.className = 'badge ' + cabecera.estado_cotizacion.toLowerCase().replace(" ", "");

        document.getElementById('view-cliente').textContent = cabecera.nombre_comercial;
        document.getElementById('view-contacto').textContent = `${cabecera.contacto_nombre} (${cabecera.contacto_email})`;
        document.getElementById('view-fecha').textContent = cabecera.fecha_vencimiento || 'N/A';
        document.getElementById('view-pago').textContent = cabecera.forma_de_pago || 'N/A';
        document.getElementById('view-total').textContent = formatearMoneda(cabecera.total);

        // --- SEPARACIÓN SERVICIO vs RENTAS ---
        const containerServicio = document.getElementById('view-servicio-container');
        const txtServicioNombre = document.getElementById('view-servicio-nombre');
        const txtServicioTotal = document.getElementById('view-servicio-total');
        const txtServicioDetalle = document.getElementById('view-servicio-detalle');
        const tbody = document.getElementById('view-tabla-productos');
        const msgNoProductos = document.getElementById('view-no-productos');
        
        tbody.innerHTML = '';
        containerServicio.style.display = 'none';
        msgNoProductos.style.display = 'none';
        let hayProductosExtra = false;

        productos.forEach(prod => {
            const cantidad = parseFloat(prod.cantidad);
            const precio = parseFloat(prod.precio_unitario);
            const subtotal = cantidad * precio;

            if (prod.tipo_residuo) { 
                containerServicio.style.display = 'block'; 
                const tipoTexto = (prod.tipo_residuo === 'Urbano') 
                    ? 'Recolección de Residuos Sólidos Urbanos (RSU)' 
                    : 'Recolección de Manejo Especial (RME)';
                txtServicioNombre.textContent = tipoTexto;
                txtServicioTotal.textContent = formatearMoneda(subtotal);
                txtServicioDetalle.textContent = `${prod.bolsas_por_dia} bolsas/día`;
            } else {
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

        if (!hayProductosExtra) {
            msgNoProductos.style.display = 'block';
            document.querySelector('.modal-table').style.display = 'none';
        } else {
            document.querySelector('.modal-table').style.display = 'table';
            if(window.innerWidth <= 600) document.querySelector('.modal-table').style.display = 'block';
        }

        document.getElementById('modal-view-close-btn').onclick = cerrarModalVer;
        document.getElementById('btn-cerrar-view').onclick = cerrarModalVer;
        document.getElementById('btn-descargar-pdf').onclick = generarPDFProfesional;

        const overlay = modalViewPlaceholder.querySelector('.modal-overlay');
        overlay.style.display = 'flex'; 

    } catch (e) {
        console.error("Error al abrir modal detalle:", e);
    }
}

function cerrarModalVer() {
    modalViewPlaceholder.innerHTML = "";
    datosCotizacionActual = null;
}

const formatearMoneda = (numero) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numero);
};

// ... PDF Logic remains the same as previously provided ...
// (Incluye aquí las funciones getBase64ImageFromURL, numeroALetras y generarPDFProfesional que ya tenías)
// Para no hacer el mensaje demasiado largo, asumo que esas ya las tienes integradas o si las necesitas pídelas.
// =====================================================
// AYUDANTES PARA PDF PROFESIONAL (VERSIÓN CORREGIDA)
// =====================================================

// 1. Cargar Logo
// Función para convertir imagen a Base64 manteniendo la TRANSPARENCIA
async function getBase64ImageFromURL(url) {
    return new Promise((resolve) => {
        const img = new Image();
        // Importante para poder manipular imágenes de otros dominios/servidores local
        img.setAttribute("crossOrigin", "anonymous");
        
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            // 1. LIMPIEZA CLAVE: Asegura que el fondo del canvas sea transparente antes de dibujar
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 2. Dibujar la imagen sobre el fondo limpio
            ctx.drawImage(img, 0, 0);

            // 3. OBLIGATORIO: Usar 'image/png'. 
            // Si usaras 'image/jpeg', la transparencia se convertiría en negro automáticamente.
            try {
                const dataURL = canvas.toDataURL("image/png");
                resolve(dataURL);
            } catch (e) {
                // Si hay error de seguridad (CORS), retornamos null para no romper el PDF
                console.warn("No se pudo convertir la imagen (Posible bloqueo CORS):", e);
                resolve(null);
            }
        };

        img.onerror = () => {
            console.warn(`No se pudo cargar la imagen desde: ${url}`);
            resolve(null);
        };

        img.src = url;
    });
}

// 2. Función Número a Letras (CORREGIDA - Sin duplicados)
function numeroALetras(cantidad) {
    const numero = parseFloat(cantidad);
    const partes = numero.toFixed(2).split('.');
    const entero = parseInt(partes[0]);
    const centavos = partes[1];

    if (entero === 0) return `(CERO PESOS ${centavos}/100 M.N.)`;

    const Unidades = num => ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"][num];
    const Decenas = num => {
        const n = Math.floor(num / 10);
        const u = num % 10;
        if (n === 0) return Unidades(u);
        if (n === 1) return ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"][u];
        if (n === 2) return u === 0 ? "VEINTE" : "VEINTI" + Unidades(u);
        return ["TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"][n - 3] + (u > 0 ? " Y " + Unidades(u) : "");
    };
    const Centenas = num => {
        const c = Math.floor(num / 100);
        const r = num % 100;
        if (c === 0) return Decenas(r);
        if (c === 1) return r === 0 ? "CIEN" : "CIENTO " + Decenas(r);
        return ["DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"][c - 2] + (r > 0 ? " " + Decenas(r) : "");
    };
    const Miles = num => {
        const m = Math.floor(num / 1000);
        const r = num % 1000;
        if (m === 0) return Centenas(r);
        const strMiles = (m === 1 ? "UN" : Centenas(m)) + " MIL";
        return strMiles + (r > 0 ? " " + Centenas(r) : "");
    };

    // Soporte hasta millones básico
    let letras = "";
    if (entero < 1000000) letras = Miles(entero);
    else letras = "CONSULTAR SOPORTE PARA MILLONES"; // Simple safe-guard

    return `(${letras.trim()} PESOS ${centavos}/100 M.N.)`;
}

// --- FUNCIÓN DEFINITIVA: PDF PROFESIONAL (COLORES VERDES Y LÓGICA FIXED) ---
// --- FUNCIÓN DEFINITIVA: PDF PROFESIONAL (ENCABEZADO CORREGIDO) ---
async function generarPDFProfesional() {
    if (!datosCotizacionActual) return;

    const { cabecera, productos } = datosCotizacionActual;
    const btnPdf = document.getElementById('btn-descargar-pdf');
    const textoOriginal = btnPdf.innerHTML;
    btnPdf.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    btnPdf.disabled = true;

    try {
        // Colores Corporativos
        const COLOR_PRIMARIO = '#92D050'; // Verde Fuerte
        const COLOR_SECUNDARIO = '#ACD593'; // Verde Claro
        const COLOR_TEXTO = '#333333';

        // 1. Cargar Logo
        const logoBase64 = await getBase64ImageFromURL('../assets/logotipo.png');

        // 2. Preparar Datos
        const fechaHoy = new Date().toLocaleDateString('es-MX');
        let subtotal = 0;
        const fmt = (num) => `$${parseFloat(num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;

        // --- LÓGICA DE SEPARACIÓN Y LIMPIEZA DE NOMBRES ---
        const servicios = [];
        const rentas = [];

        productos.forEach(prod => {
            if (prod.tipo_residuo) {
                // ES UN SERVICIO
                const tipo = prod.tipo_residuo === 'Urbano' ? 'RSU' : 'RME';
                const nombreLimpio = `SERVICIO DE RECOLECCIÓN (${tipo})`; 
                servicios.push({
                    ...prod,
                    descripcion_final: `${nombreLimpio}\nDetalle: ${prod.bolsas_por_dia} bolsas/día`
                });
            } else {
                // ES UNA RENTA U OTRO
                rentas.push({
                    ...prod,
                    descripcion_final: prod.nombre_producto
                });
            }
        });

        const tableBody = [
            [
                { text: 'DESCRIPCIÓN', style: 'tableHeader' },
                { text: 'UNIDAD', style: 'tableHeader', alignment: 'center' },
                { text: 'CANT.', style: 'tableHeader', alignment: 'center' },
                { text: 'P. UNITARIO', style: 'tableHeader', alignment: 'right' },
                { text: 'IMPORTE', style: 'tableHeader', alignment: 'right' }
            ]
        ];

        // A. Insertar Servicios
        servicios.forEach(prod => {
            const importe = parseFloat(prod.cantidad) * parseFloat(prod.precio_unitario);
            subtotal += importe;
            tableBody.push([
                { text: prod.descripcion_final, bold: true, color: '#333' },
                { text: 'Servicio', alignment: 'center' },
                { text: parseFloat(prod.cantidad), alignment: 'center' },
                { text: fmt(prod.precio_unitario), alignment: 'right' },
                { text: fmt(importe), alignment: 'right', bold: true }
            ]);
        });

        // B. Insertar Rentas
        rentas.forEach(prod => {
            const importe = parseFloat(prod.cantidad) * parseFloat(prod.precio_unitario);
            subtotal += importe;
            
            let unidad = prod.unidad || 'Pza';
            if (prod.nombre_producto.toLowerCase().includes('tolva')) unidad = 'Renta';

            tableBody.push([
                { text: prod.descripcion_final },
                { text: unidad, alignment: 'center' },
                { text: parseFloat(prod.cantidad), alignment: 'center' },
                { text: fmt(prod.precio_unitario), alignment: 'right' },
                { text: fmt(importe), alignment: 'right' }
            ]);
        });

        // Filas de relleno estéticas
        const filasMinimas = 8;
        if ((tableBody.length - 1) < filasMinimas) {
            for (let i = 0; i < (filasMinimas - (tableBody.length - 1)); i++) {
                tableBody.push([' ', ' ', ' ', ' ', ' ']);
            }
        }

        // Totales
        const iva = subtotal * 0.16;
        const totalFinal = subtotal + iva;
        const totalEnLetras = numeroALetras(totalFinal);

        // --- DEFINICIÓN DEL PDF ---
        const docDefinition = {
            pageMargins: [40, 30, 40, 30],
            content: [
                // 1. ENCABEZADO (COLUMNAS: Logo Izq | Texto Centro)
                {
                    columns: [
                        {
                            // Columna 1: Logo
                            width: 100,
                            stack: [
                                logoBase64 ? { image: logoBase64, width: 80 } : {} 
                            ]
                        },
                        {
                            // Columna 2: Títulos Centrados
                            width: '*',
                            stack: [
                                { text: 'EMPRESA SOCIALMENTE RESPONSABLE', style: 'headerSubtitle', alignment: 'center' },
                                { text: 'SERVICIOS, OPERACIONES Y SUMINISTROS DE LA ISLA S.A. DE C.V.', style: 'headerTitle', alignment: 'center' }
                            ],
                            margin: [0, 10, 0, 0] // Ajuste vertical para centrar con el logo
                        },
                        {
                            // Columna 3: Espacio vacío para equilibrar el centro (Opcional, misma anchura que el logo)
                            width: 100,
                            text: ''
                        }
                    ],
                    margin: [0, 0, 0, 10]
                },

                // 2. CONTACTO EMPRESA (Centrado debajo)
                {
                    text: [
                        'Fraccionamiento Holkan No. 9 Colonia aviación, C.P. 24170\n',
                        'Cd. Del Carmen, Campeche\n',
                        { text: '938 164 0963', bold: true }, '\n',
                        { text: 'ventas@sosdelaisla.com', color: COLOR_PRIMARIO }
                    ],
                    style: 'companyContact',
                    margin: [0, 0, 0, 10]
                },
                
                // Línea separadora verde
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: COLOR_PRIMARIO }], margin: [0, 0, 0, 15] },

                // 3. TABLAS DE CLIENTE (Verde Claro)
                {
                    style: 'infoTable',
                    table: {
                        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'CLIENTE (RAZÓN SOCIAL)', style: 'tableHeaderSm' },
                                { text: 'FORMA DE PAGO', style: 'tableHeaderSm' },
                                { text: 'DIRECCIÓN', style: 'tableHeaderSm' },
                                { text: 'FECHA', style: 'tableHeaderSm' },
                                { text: 'NO. COTIZACIÓN', style: 'tableHeaderSm', alignment: 'right' }
                            ],
                            [
                                { text: cabecera.razon_social || cabecera.nombre_comercial, bold: true },
                                { text: cabecera.forma_de_pago || 'No especificado' },
                                { text: cabecera.direccion || 'Sin dirección', fontSize: 8 },
                                { text: fechaHoy },
                                { text: formatearFolio(cabecera.id_cotizacion), bold: true, alignment: 'right', color: COLOR_PRIMARIO }
                            ]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },
                // Segunda tabla (Contacto)
                {
                    style: 'infoTable',
                    margin: [0, 5, 0, 20],
                    table: {
                        widths: ['*', 'auto', '*'],
                        body: [
                            [
                                { text: 'NOMBRE CONTACTO', style: 'tableHeaderSm' },
                                { text: 'TELÉFONO', style: 'tableHeaderSm' },
                                { text: 'CORREO ELECTRÓNICO', style: 'tableHeaderSm' }
                            ],
                            [
                                { text: cabecera.contacto_nombre || '--' },
                                { text: cabecera.contacto_telefono || cabecera.telefono || '--' },
                                { text: cabecera.contacto_email || '--' }
                            ]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },

                // 4. TABLA PRODUCTOS
                {
                    table: {
                        widths: ['*', 50, 40, 70, 70],
                        headerRows: 1,
                        body: tableBody
                    },
                    layout: {
                        fillColor: function (rowIndex) {
                            return (rowIndex === 0) ? COLOR_PRIMARIO : null;
                        },
                        hLineWidth: function(i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
                        vLineWidth: function() { return 0; },
                        hLineColor: function(i) { return (i === 0) ? COLOR_PRIMARIO : '#e5e7eb'; }
                    }
                },

                // 5. TOTALES
                {
                    margin: [0, 15, 0, 0],
                    columns: [
                        {
                            width: '*',
                            text: [
                                { text: 'CANTIDAD EN LETRAS:\n', bold: true, fontSize: 9 },
                                { text: totalEnLetras, fontSize: 10, italics: true }
                            ]
                        },
                        {
                            width: 'auto',
                            table: {
                                widths: [80, 70],
                                body: [
                                    [{ text: 'SUBTOTAL:', alignment: 'right', bold: true, fontSize: 9 }, { text: fmt(subtotal), alignment: 'right', fontSize: 9 }],
                                    [{ text: 'IVA (16%):', alignment: 'right', bold: true, fontSize: 9 }, { text: fmt(iva), alignment: 'right', fontSize: 9 }],
                                    [{ text: 'TOTAL:', alignment: 'right', bold: true, color: 'white', fillColor: COLOR_PRIMARIO }, { text: fmt(totalFinal), alignment: 'right', bold: true, color: 'white', fillColor: COLOR_PRIMARIO }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                },

                // 6. CONDICIONES
                {
                    margin: [0, 30, 0, 0],
                    text: 'CONDICIONES COMERCIALES',
                    style: 'sectionHeader',
                    color: COLOR_PRIMARIO
                },
                { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 200, y2: 2, lineWidth: 1, lineColor: COLOR_PRIMARIO }], margin: [0, 0, 0, 5] },
                {
                    style: 'termsText',
                    ul: [
                        `Esta cotización tiene una vigencia de ${cabecera.fecha_vencimiento || '15 días'}.`,
                        'Este servicio no incluye contenedores.',
                        'El servicio de RSU consta de 1 visita en la semana los días sábados con un máximo de 0.30ton (5 bolsas a la semana), en caso de requerir otro servicio de recolección de basura, se cotiza nuevamente.',
                        'Los servicios de RSU se realizan en horarios de 8:30 a 16:00 horas de Lunes a Sábado.',
                        { text: 'Condiciones de pago: ', bold: true } + (cabecera.forma_de_pago || '10 días a partir de la recepción de la factura mensual.')
                    ]
                }
            ],
            styles: {
                headerSubtitle: { fontSize: 9, color: '#555', bold: true, margin: [0, 0, 0, 2] },
                headerTitle: { fontSize: 13, color: COLOR_PRIMARIO, bold: true, margin: [0, 0, 0, 5] },
                companyContact: { fontSize: 9, color: '#333', alignment: 'center', lineHeight: 1.2 },
                tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: COLOR_PRIMARIO, alignment: 'left', margin: [0, 2] },
                tableHeaderSm: { bold: true, fontSize: 8, color: '#555', fillColor: COLOR_SECUNDARIO },
                infoTable: { fontSize: 9, margin: [0, 5] },
                sectionHeader: { fontSize: 10, bold: true },
                termsText: { fontSize: 8, color: '#444', lineHeight: 1.3, margin: [0, 5, 0, 0] }
            },
            defaultStyle: { fontSize: 10, font: 'Roboto' }
        };

        pdfMake.createPdf(docDefinition).download(`Cotizacion_${cabecera.id_cotizacion}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Error al generar PDF: " + error.message);
    } finally {
        btnPdf.innerHTML = textoOriginal;
        btnPdf.disabled = false;
    }
}


// Función para dar formato al Folio: COM_ID_AÑO
function formatearFolio(id) {
    const year = new Date().getFullYear(); // Usa el año actual
    return `COM_${id}_${year}`;
}



function abrirModalRapida() {
    const empresa = datosCombinados.find(e => e.id_empresa == idEmpresa);
    if (!empresa) return;
    
    // Inyectar HTML
    modalPlaceholder.innerHTML = modalHTML; 
    
    document.getElementById("modal-empresa-id").value = empresa.id_empresa;
    document.getElementById("modal-empresa-nombre").textContent = empresa.nombre_comercial;
    
    // Llenar Contactos
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
    
    // Llenar Tolvas
    const selectTolva = document.getElementById("select-tolva");
    const productosTolva = listaProductos.filter(p => p.unidad === "renta");
    productosTolva.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_producto;
        option.textContent = `${p.descripcion} (${formatearMoneda(p.precio_unitario)})`;
        option.dataset.precio = p.precio_unitario;
        selectTolva.appendChild(option);
    });

    // LISTENERS
    document.getElementById("modal-close-btn").addEventListener("click", cerrarModal);
    document.getElementById("form-cotizacion").addEventListener("submit", manejarSubmitCotizacion);
    
    // --- CAMBIO: Ocultar selector y forzar despliegue ---
    const checkRecoleccion = document.getElementById("check-recoleccion");
    if(checkRecoleccion) {
        checkRecoleccion.checked = true; // Forzamos marcado
        // Ocultamos el contenedor padre (donde suele estar el Label y el Check)
        // Asumiendo que tiene un contenedor .recoleccion-header o similar:
        if(checkRecoleccion.closest('.recoleccion-header')) {
            checkRecoleccion.closest('.recoleccion-header').style.display = 'none';
        } else {
            // Si no encuentra la clase, oculta el check directamente
            checkRecoleccion.style.display = 'none';
        }
    }

    // Forzar visualización de los contenedores
    document.getElementById("dias-recoleccion").classList.remove('hidden');
    document.getElementById("tipo-residuo-group").classList.remove('hidden');
    document.getElementById("bolsas-peso-group").classList.remove('hidden');

    // Listeners de cálculo
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

    const selectPago = document.getElementById("forma-pago");
    if (selectPago) {
        selectPago.addEventListener("change", actualizarCalculoTotal);
    }
    
    actualizarCalculoTotal();
}