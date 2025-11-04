// Espera a que todo el contenido HTML se haya cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {

    const API_URL = 'api/cotizaciones_api.php';
    const COSTO_POR_KG = 1.5;

    // --- Almacenes de Datos ---
    let datosCombinados = []; 
    let listaProductos = [];
    let listaCotizaciones = [];
    let modalHTML = ""; 

    // --- Selectores del DOM (Generales) ---
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const modalPlaceholder = document.getElementById("modal-placeholder");
    const modalViewPlaceholder = document.getElementById("modal-view-placeholder");
    const formBusquedaClientes = document.getElementById("form-busqueda-clientes");
    const inputBusquedaClientes = document.getElementById("busqueda-clientes");
    const tablaClientesBody = document.getElementById("tabla-clientes-body");
    const noResultadosClientes = document.getElementById("no-resultados-clientes");
    const formBusquedaCotizaciones = document.getElementById("form-busqueda-cotizaciones");
    const inputBusquedaCotizaciones = document.getElementById("busqueda-cotizaciones");
    const filtroEstadoCotizacion = document.getElementById("filtro-estado-cotizacion");
    const tablaCotizacionesBody = document.getElementById("tabla-cotizaciones-body");
    const noResultadosCotizaciones = document.getElementById("no-resultados-cotizaciones");


    // --- 1. Carga Inicial de TODOS los datos ---
    async function cargarDatosIniciales() {
        try {
            const [
                respModalHTML,
                respClientes,
                respProductos,
                respCotizaciones
            ] = await Promise.all([
                fetch("modal_formulario.html"),
                fetch(`${API_URL}?accion=leer_clientes`),
                fetch(`${API_URL}?accion=leer_productos`),
                fetch(`${API_URL}?accion=leer_cotizaciones`)
            ]);

            modalHTML = await respModalHTML.text();
            datosCombinados = await respClientes.json();
            listaProductos = await respProductos.json();
            listaCotizaciones = await respCotizaciones.json();

            renderizarTablaClientes(datosCombinados);
            renderizarTablaCotizaciones(listaCotizaciones);

        } catch (error) {
            console.error("Error fatal al cargar datos iniciales:", error);
            noResultadosClientes.textContent = "Error al cargar datos. Revisa la consola (F12) y el log de errores de XAMPP.";
            noResultadosClientes.style.display = "block";
        }
    }

    // --- 2. Lógica de Pestañas ---
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(button.dataset.tab).classList.add("active");
        });
    });

    // --- 3. Lógica Pestaña 1: CREAR (Clientes) ---
    function renderizarTablaClientes(empresas) {
        tablaClientesBody.innerHTML = "";
        noResultadosClientes.style.display = empresas.length === 0 ? "block" : "none";

        empresas.forEach(item => {
            const tr = document.createElement("tr");
            const celdaEmpresa = `<td class="info-empresa"><strong>${item.nombre_comercial}</strong><div class="razon-social">${item.razon_social || ''}</div></td>`;
            
            let celdaContacto = '<td>—</td>';
            if (item.contacto_nombre) {
                celdaContacto = `<td class="info-contacto"><strong>${item.contacto_nombre}</strong><div class="email">${item.contacto_email || ''}</div></td>`;
            }

            const celdaAcciones = `
                <td>
                    <button type="button" class="btn-cotizar" data-id="${item.id_empresa}">
                        <i class="fa fa-file-signature"></i> Realizar cotización
                    </button>
                </td>`;
            
            tr.innerHTML = celdaEmpresa + celdaContacto + celdaAcciones;
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

    // --- 4. Lógica Pestaña 2: GUARDADAS (Cotizaciones) ---
    function renderizarTablaCotizaciones(cotizaciones) {
        tablaCotizacionesBody.innerHTML = "";
        noResultadosCotizaciones.style.display = cotizaciones.length === 0 ? "block" : "none";

        cotizaciones.forEach(cot => {
            const tr = document.createElement("tr");
            const estadoClase = (cot.estado_cotizacion || 'Borrador').toLowerCase().replace(" ", "");

            // Añadimos los botones de Aceptar, Rechazar y Eliminar
            tr.innerHTML = `
                <td>${cot.id_cotizacion}</td>
                <td>${cot.nombre_comercial || 'Cliente no encontrado'}</td>
                <td>${formatearMoneda(cot.total)}</td>
                <td><span class="badge ${estadoClase}">${cot.estado_cotizacion}</span></td>
                <td>
                    <button class="btn-accion-cot ver" data-id="${cot.id_cotizacion}" title="Ver Detalles">
                        <i class="fa fa-eye"></i>
                    </button>
                    <!-- Solo muestra Aceptar/Rechazar si está Pendiente -->
                    ${cot.estado_cotizacion === 'Pendiente' ? `
                    <button class="btn-accion-cot aceptar" data-id="${cot.id_cotizacion}" title="Aceptar Cotización">
                        <i class="fa fa-check"></i>
                    </button>
                    <button class="btn-accion-cot rechazar" data-id="${cot.id_cotizacion}" title="Rechazar Cotización">
                        <i class="fa fa-times"></i>
                    </button>
                    ` : ''}
                    
                    <!-- Botón para Eliminar (siempre visible, o puedes ocultarlo si ya está Aceptada) -->
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

    // --- 5. Lógica de Modales (Crear Cotización) ---
    function abrirModal(idEmpresa) {
        // ... (Esta función no cambia) ...
        const empresa = datosCombinados.find(e => e.id_empresa == idEmpresa);
        if (!empresa) return;
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
        // ... (Esta función no cambia) ...
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

    // --- 6. Lógica de Cálculo (Mensual x4 y Peso) ---
    function actualizarCalculoTotal() {
        // ... (Esta función no cambia) ...
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
    
    // --- 7. Guardar Cotización (Ahora envía un 'modo') ---
    async function manejarSubmitCotizacion(e) {
        e.preventDefault();
        const btnGuardar = e.target.querySelector('button[type="submit"]');
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        const cotizacionData = { /* ... (datos de cotizacion) ... */
            id_contacto: document.getElementById("modal-contacto-select").value,
            forma_de_pago: document.getElementById("forma-pago").value,
            total: parseFloat(document.getElementById("total-cotizacion").textContent.replace(/[^0-9.-]+/g,"")),
            estado_cotizacion: "Pendiente", 
            fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        const detallesData = [];
        const checkRecoleccion = document.getElementById("check-recoleccion");
        if (checkRecoleccion.checked) {
            // ... (lógica para calcular costos y datos del servicio) ...
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
            alert("No se puede crear una cotización vacía.");
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Cotización";
            return;
        }

        try {
            const body = {
                modo: "crear_cotizacion", // <-- Se envía el modo
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
                alert(resultado.message || "¡Cotización guardada!");
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
            alert("Error al guardar: " + error.message);
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Cotización";
        }
    }

    
    // --- 8. FUNCIONES DE ACCIÓN (ACTUALIZADAS) ---
    
    /**
     * Cambia el estado a "Rechazada"
     */
    async function cambiarEstadoCotizacion(id, nuevoEstado) {
        if (!confirm(`¿Estás seguro de que deseas marcar esta cotización como "${nuevoEstado}"?`)) {
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
                alert(resultado.message || "Estado actualizado");
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
            alert("Error: " + error.message);
        }
    }

    /**
     * ¡NUEVA FUNCIÓN! Acepta la cotización y crea el servicio activo
     */
    async function aceptarCotizacion(id) {
        if (!confirm(`¿Estás seguro de que deseas ACEPTAR esta cotización?\n\nEsto creará un nuevo servicio activo y facturación recurrente.`)) {
            return;
        }

        try {
            const body = {
                modo: "aceptar_cotizacion", // <-- Nuevo modo para el API
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
                alert(resultado.message || "¡Cotización aceptada! Nuevo servicio creado.");
                // Actualizar la lista local
                const cotizacionLocal = listaCotizaciones.find(c => c.id_cotizacion == id);
                if (cotizacionLocal) {
                    cotizacionLocal.estado_cotizacion = "Aceptada";
                }
                // Re-renderizar la tabla (los botones de aceptar/rechazar desaparecerán)
                filtrarYRenderizarCotizaciones();
            } else {
                throw new Error(resultado.error || "Error desconocido al aceptar.");
            }

        } catch (error) {
            console.error("Error al aceptar cotización:", error);
            alert("Error: " + error.message);
        }
    }

    /**
     * Elimina una cotización de la base de datos
     */
    async function eliminarCotizacion(id) {
        if (!confirm(`¿Estás seguro de que deseas ELIMINAR la cotización ${id}? Esta acción no se puede deshacer.`)) {
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
                alert(resultado.message || "Cotización eliminada");
                listaCotizaciones = listaCotizaciones.filter(c => c.id_cotizacion != id);
                filtrarYRenderizarCotizaciones();
            } else {
                throw new Error(resultado.error || "Error desconocido al eliminar.");
            }

        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error: " + error.message);
        }
    }

    function abrirModalVerCotizacion(id) {
        alert("Función 'Ver Detalles' aún no implementada.");
    }
    
    // --- Helpers de Formato ---
    const formatearMoneda = (numero) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numero);
    };

    // --- 9. ¡EVENT LISTENER ACTUALIZADO! ---
    formBusquedaClientes.addEventListener("submit", (e) => e.preventDefault());
    inputBusquedaClientes.addEventListener("keyup", filtrarYRenderizarClientes);
    
    tablaClientesBody.addEventListener("click", (e) => {
        const cotizarBtn = e.target.closest(".btn-cotizar");
        if (cotizarBtn) {
            abrirModal(cotizarBtn.dataset.id);
        }
    });

    formBusquedaCotizaciones.addEventListener("submit", (e) => e.preventDefault());
    inputBusquedaCotizaciones.addEventListener("keyup", filtrarYRenderizarCotizaciones);
    filtroEstadoCotizacion.addEventListener("change", filtrarYRenderizarCotizaciones);

    // Listener de la tabla de Cotizaciones
    tablaCotizacionesBody.addEventListener("click", (e) => {
        const btn = e.target.closest("button.btn-accion-cot");
        if (!btn) return; 

        const id = btn.dataset.id; 

        if (btn.classList.contains("ver")) {
            abrirModalVerCotizacion(id);
        } 
        else if (btn.classList.contains("aceptar")) {
            // --- ¡CAMBIO! ---
            aceptarCotizacion(id); // Llama a la nueva función
        } 
        else if (btn.classList.contains("rechazar")) {
            // --- (Sin cambio) ---
            cambiarEstadoCotizacion(id, "Rechazada"); // Llama a la función simple
        } 
        else if (btn.classList.contains("eliminar")) {
            eliminarCotizacion(id);
        }
    });

    // --- Carga Inicial ---
    cargarDatosIniciales();
});

