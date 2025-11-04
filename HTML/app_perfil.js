// Espera a que la página HTML esté completamente cargada.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- URLs de las APIs ---
    const API_URL_PERFIL = 'api/perfil_api.php';
    const API_URL_EMPRESAS = 'api/empresas_api.php';
    const API_URL_COTIZACIONES = 'api/cotizaciones_api.php';
    const COSTO_POR_KG = 1.5; // Constante de negocio

    // --- Selectores del DOM (Principales) ---
    const nombreComercial = document.getElementById("perfil-nombre-comercial");
    const razonSocial = document.getElementById("perfil-razon-social");
    const fechaCreacion = document.getElementById("perfil-fecha-creacion");
    const listaContactos = document.getElementById("perfil-lista-contactos");
    const listaDocumentos = document.getElementById("perfil-lista-documentos");
    const horarioContainer = document.getElementById("perfil-horario-container");
    const estadoServicio = document.getElementById("perfil-estado-servicio");
    const paymentInfo = document.getElementById("perfil-payment-info");
    const perfilMonto = document.getElementById("perfil-monto");
    const perfilFechaPago = document.getElementById("perfil-fecha-pago");
    const btnCotizar = document.getElementById("perfil-btn-cotizar");
    const btnCancelarServicio = document.getElementById("perfil-btn-cancelar");

    // --- Selectores de Modales ---
    const modalFormPlaceholder = document.getElementById("modal-form-placeholder"); 
    const modalCotizarPlaceholder = document.getElementById("modal-cotizar-placeholder");

    // --- Almacenes de Datos ---
    let empresaData = null; 
    let contactosData = []; 
    let servicioData = null; 
    let listaProductos = []; 
    let modalEmpresaFormHTML = ""; 
    let modalCotizarHTML = ""; 

    // --- Helpers de Formato ---
    const formatearMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatFecha = (dateISO) => {
        if (!dateISO) return 'N/A';
        // Reemplaza '-' por '/' para compatibilidad universal con constructores de Fecha
        return new Date(dateISO.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };


    /**
     * 1. Función Principal: Cargar todo
     */
    async function cargarDatosPerfil() {
        const params = new URLSearchParams(window.location.search);
        const idEmpresa = params.get('id');

        if (!idEmpresa) {
            document.body.innerHTML = "<h1>Error: No se proporcionó un ID de empresa.</h1>";
            return;
        }

        try {
            // --- Carga de recursos en paralelo ---
            const [
                respModalFormEmpresa,
                respModalFormCotizar,
                respProductos,
                respPerfil // ¡La llamada principal!
            ] = await Promise.all([
                fetch("modal_empresa_form.html"), 
                fetch("modal_formulario.html"),   
                fetch(`${API_URL_COTIZACIONES}?accion=leer_productos`), 
                fetch(`${API_URL_PERFIL}?accion=leer_perfil&id=${idEmpresa}`) 
            ]);

            // Guardar HTML y Productos
            modalEmpresaFormHTML = await respModalFormEmpresa.text();
            modalCotizarHTML = await respModalFormCotizar.text();
            listaProductos = await respProductos.json();

            // Guardar datos del perfil
            const data = await respPerfil.json();
            
            if (data.success === false || !data.empresa) { 
                throw new Error(data.error || "Empresa no encontrada.");
            }
            
            empresaData = data.empresa;
            contactosData = data.contactos;
            servicioData = data.servicio; 
            const detalleServicio = data.detalle_servicio; 

            // "Dibujar" los datos en la página
            popularCabecera(empresaData, servicioData);
            popularContactos(contactosData);
            popularDocumentos(servicioData);
            popularHorario(detalleServicio); 
            asignarAcciones(empresaData.id_empresa); 

        } catch (error) {
            console.error("Error al cargar datos del perfil:", error);
            document.body.innerHTML = `<h1><i class="fa fa-exclamation-triangle"></i> Error al cargar datos</h1><p>${error.message}</p><a href="empresas.html">Volver a la lista</a>`;
        }
    }

    /**
     * 2. Llenar la cabecera (Tarjeta 1)
     */
    function popularCabecera(empresa, servicio) {
        nombreComercial.textContent = empresa.nombre_comercial;
        razonSocial.textContent = empresa.razon_social;
        fechaCreacion.textContent = formatFecha(empresa.fecha_creacion);
        
        if (servicio && servicio.id_servicio) {
            const estado = servicio.estado_actual_pago;
            estadoServicio.textContent = estado;
            estadoServicio.className = "status-badge"; 
            if (estado === "Pagado") {
                estadoServicio.classList.add("pagado");
                estadoServicio.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${estado}`;
            } else { 
                estadoServicio.classList.add("pendiente");
                estadoServicio.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> ${estado}`;
            }
            perfilMonto.textContent = formatearMoneda(servicio.monto_mensual);
            perfilFechaPago.textContent = `Próximo pago: ${formatFecha(servicio.fecha_proximo_vencimiento)}`;
            paymentInfo.style.display = "block";
            btnCotizar.innerHTML = `<i class="fa-solid fa-check"></i> Servicio Activo`;
            btnCotizar.disabled = true;
            btnCotizar.classList.replace("btn-primary", "btn-secondary");
            btnCancelarServicio.style.display = 'inline-block'; 
        } else {
            estadoServicio.textContent = "Inactivo";
            estadoServicio.className = "status-badge inactivo";
            estadoServicio.innerHTML = `<i class="fa-solid fa-times-circle"></i> Inactivo`;
            paymentInfo.style.display = "none";
            btnCotizar.innerHTML = `<i class="fa-solid fa-file-invoice-dollar"></i> Cotizar`;
            btnCotizar.disabled = false;
            btnCotizar.classList.replace("btn-secondary", "btn-primary");
            btnCancelarServicio.style.display = 'none'; 
        }
    }

    /**
     * 3. Llenar la lista de contactos (Tarjeta 2)
     */
    function popularContactos(contactos) {
        listaContactos.innerHTML = "";
        if (!contactos || contactos.length === 0) {
            listaContactos.innerHTML = "<p>No hay contactos registrados.</p>";
            return;
        }
        contactos.forEach((contacto, index) => {
            const li = document.createElement("li");
            li.className = "contact-item";
            li.innerHTML = `
                <div class="contact-pic"><i class="fa-solid fa-user"></i></div>
                <div class="contact-details">
                    <p class="nombre">${contacto.nombre} ${index === 0 ? '(Principal)' : ''}</p>
                    <p class="email">${contacto.email || 'N/A'}</p>
                    <p class="telefono">${contacto.telefono || 'N/A'}</p>
                </div>
            `;
            listaContactos.appendChild(li);
        });
    }

    /**
     * 4. Llenar documentos (Tarjeta 3)
     */
    function popularDocumentos(servicio) {
        listaDocumentos.innerHTML = ""; 
        let estadoGeneral = "Inactivo";
        let estadoClase = "inactivo";
        if (servicio && servicio.id_servicio) {
            estadoGeneral = servicio.estado_documentacion;
            estadoClase = (estadoGeneral === "Todo Aceptado") ? "aceptado" : "pendiente";
        }
        const estadoDiv = document.createElement("div");
        estadoDiv.className = `doc-status-general ${estadoClase}`;
        estadoDiv.textContent = estadoGeneral;
        listaDocumentos.appendChild(estadoDiv);
        const docs = [
             { nombre: "Constancia de Situación Fiscal", icono: "fa-file-pdf", estado: estadoClase },
             { nombre: "Identificación Oficial (Rep.)", icono: "fa-id-card", estado: estadoClase },
             { nombre: "Poder Notarial (Rep.)", icono: "fa-gavel", estado: "pendiente" }, 
             { nombre: "Comprobante de Domicilio", icono: "fa-map-location-dot", estado: estadoClase }
         ];
         docs.forEach(doc => {
             const li = document.createElement("li");
             li.className = "doc-item";
             const docStatus = (doc.nombre.includes("Poder")) ? "pendiente" : doc.estado;
             li.innerHTML = `
                 <span class="doc-name"><i class="fa-solid ${doc.icono}"></i> ${doc.nombre}</span>
                 <span class="doc-status ${docStatus}">${docStatus}</span>
             `;
             listaDocumentos.appendChild(li);
         });
    }

    /**
     * 5. Llenar horario (Tarjeta 4)
     */
    function popularHorario(detalleServicio) {
        if (detalleServicio && detalleServicio.id_detalle) {
            horarioContainer.innerHTML = `
                <div class="schedule-days">
                    <div class="dia ${detalleServicio.lunes ? 'activo' : 'inactivo'}">Lunes</div>
                    <div class="dia ${detalleServicio.martes ? 'activo' : 'inactivo'}">Martes</div>
                    <div class="dia ${detalleServicio.miercoles ? 'activo' : 'inactivo'}">Miércoles</div>
                    <div class="dia ${detalleServicio.jueves ? 'activo' : 'inactivo'}">Jueves</div>
                    <div class="dia ${detalleServicio.viernes ? 'activo' : 'inactivo'}">Viernes</div>
                </div>
            `;
        } else {
            horarioContainer.innerHTML = `
                <div class="no-schedule">
                    <p>Esta empresa no tiene un servicio recurrente activo.</p>
                    <button class="btn btn-primary" id="horario-btn-cotizar">
                        <i class="fa-solid fa-file-invoice-dollar"></i> Realizar Cotización
                    </button>
                </div>
            `;
            document.getElementById("horario-btn-cotizar").addEventListener("click", () => {
                if(btnCotizar.disabled) return;
                abrirModalCotizar(empresaData.id_empresa);
            });
        }
    }

    /**
     * 6. Asignar acciones a los botones
     */
    function asignarAcciones(id) {
        document.getElementById("perfil-btn-modificar").addEventListener("click", () => {
            abrirModalModificar(id);
        });
        btnCotizar.addEventListener("click", () => {
            abrirModalCotizar(id);
        });
        document.getElementById("perfil-btn-add-contacto").addEventListener("click", () => {
            abrirModalModificar(id);
        });
        document.getElementById("perfil-btn-eliminar").addEventListener("click", () => {
            eliminarEmpresa(id);
        });
        btnCancelarServicio.addEventListener("click", () => {
            if (servicioData) {
                cancelarServicio(servicioData.id_servicio);
            } else {
                alert("No hay servicio activo para cancelar.");
            }
        });
    }

    /**
     * 7. Función para Eliminar Empresa (Llama a API Empresas)
     */
    async function eliminarEmpresa(id) {
        if (!confirm(`¿Estás seguro de que deseas eliminar a "${empresaData.nombre_comercial}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        try {
            const body = { modo: 'eliminar', id_empresa: id };
            const resp = await fetch(API_URL_EMPRESAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const resultado = await resp.json();
            if (resultado.success) {
                alert(resultado.message || "Empresa eliminada.");
                window.location.href = 'empresas.html'; 
            } else {
                throw new Error(resultado.error || "Error desconocido al eliminar.");
            }
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    }

    /**
     * 8. Función para Cancelar Servicio (Llama a API Perfil)
     */
    async function cancelarServicio(idServicio) {
        if (!confirm("¿Estás seguro de que deseas cancelar este servicio activo? La cotización asociada permanecerá.")) {
            return;
        }
        try {
            const body = { modo: 'cancelar_servicio', id_servicio: idServicio };
            const resp = await fetch(API_URL_PERFIL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const resultado = await resp.json();
            if (resultado.success) {
                alert(resultado.message || "Servicio cancelado.");
                window.location.reload(); 
            } else {
                throw new Error(resultado.error || "Error desconocido al cancelar.");
            }
        } catch (error) {
            alert("Error al cancelar: " + error.message);
        }
    }

    
    // ===================================================================
    // --- Lógica para Modal MODIFICAR EMPRESA (Llama a API Empresas) ---
    // ===================================================================
    
    function anadirBloqueContacto(container, contacto = {}) {
        const bloqueId = `contacto-${Date.now()}-${Math.floor(Math.random() * 100)}`;
        const bloqueDiv = document.createElement('div');
        bloqueDiv.className = 'contacto-block';
        bloqueDiv.id = bloqueId;
        bloqueDiv.innerHTML = `
            <div class="contacto-block-label">${container.children.length === 0 ? 'Contacto Principal' : 'Contacto Adicional'}</div>
            ${container.children.length > 0 ? '<button type="button" class="btn-remove-contacto" title="Eliminar contacto">&times;</button>' : ''}
            <div class="contacto-block-inputs">
                <div>
                    <label for="cont-nombre-${bloqueId}">Nombre</label>
                    <input type="text" id="cont-nombre-${bloqueId}" class="cont-nombre" value="${contacto.nombre || ''}" required>
                </div>
                <div>
                    <label for="cont-email-${bloqueId}">Email</label>
                    <input type="email" id="cont-email-${bloqueId}" class="cont-email" value="${contacto.email || ''}" required>
                </div>
                <div>
                    <label for="cont-telefono-${bloqueId}">Teléfono</label>
                    <input type="tel" id="cont-telefono-${bloqueId}" class="cont-telefono" value="${contacto.telefono || ''}">
                </div>
                <input type="hidden" class="cont-id" value="${contacto.id_contacto || ''}">
            </div>`;
        container.appendChild(bloqueDiv);
    }

    function cerrarModalForm() {
        modalFormPlaceholder.innerHTML = ""; 
    }

    async function manejarSubmitEmpresa(e) {
        e.preventDefault();
        const btnGuardar = document.getElementById("btn-guardar-empresa");
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";
        const empresaData = {
            "nombre_comercial": document.getElementById("emp-nombre-comercial").value,
            "razon_social": document.getElementById("emp-razon-social").value,
            tipo: document.getElementById("emp-tipo").value,
            id_ruta: document.getElementById("emp-ruta").value,
            direccion: document.getElementById("emp-direccion").value,
            id_empresa: document.getElementById("empresa-id-edit").value
        };
        const contactosData = [];
        document.querySelectorAll("#contactos-list .contacto-block").forEach(bloque => {
            const nombre = bloque.querySelector(".cont-nombre").value;
            const email = bloque.querySelector(".cont-email").value;
            if (nombre && email) {
                contactosData.push({
                    id_contacto: bloque.querySelector(".cont-id").value,
                    nombre: nombre,
                    email: email,
                    telefono: bloque.querySelector(".cont-telefono").value
                });
            }
        });
        if (contactosData.length === 0) {
            alert("Debes añadir al menos un contacto válido.");
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Cambios";
            return; 
        }
        try {
            const body = {
                modo: 'modificar', 
                empresa: empresaData,
                contactos: contactosData
            };
            const resp = await fetch(API_URL_EMPRESAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const resultado = await resp.json();
            if (resultado.success) {
                alert(resultado.message || "Empresa modificada");
                cerrarModalForm();
                window.location.reload(); 
            } else {
                throw new Error(resultado.error || "Error al guardar.");
            }
        } catch (error) {
            alert("Error al guardar: " + error.message);
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Cambios";
        }
    }

    async function abrirModalModificar(id) {
        modalFormPlaceholder.innerHTML = modalEmpresaFormHTML;
        try {
            const url = `${API_URL_EMPRESAS}?accion=leer_uno&id=${id}`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (!data.empresa) throw new Error('No se encontró la empresa.');
            document.getElementById("emp-nombre-comercial").value = data.empresa.nombre_comercial;
            document.getElementById("emp-razon-social").value = data.empresa.razon_social;
            document.getElementById("emp-tipo").value = data.empresa.tipo;
            document.getElementById("emp-ruta").value = data.empresa.id_ruta;
            document.getElementById("emp-direccion").value = data.empresa.direccion;
            const contactosList = document.getElementById("contactos-list");
            if (data.contactos.length > 0) {
                data.contactos.forEach(c => anadirBloqueContacto(contactosList, c));
            } else {
                anadirBloqueContacto(contactosList);
            }
            document.getElementById("modal-titulo").textContent = "Modificar Empresa";
            document.getElementById("btn-guardar-empresa").textContent = "Guardar Cambios";
            document.getElementById("form-mode").value = "modificar";
            document.getElementById("empresa-id-edit").value = id;
            document.getElementById("btn-add-contacto").addEventListener("click", () => anadirBloqueContacto(contactosList));
            contactosList.addEventListener("click", (e) => {
                if (e.target.classList.contains("btn-remove-contacto")) {
                    e.target.closest(".contacto-block").remove();
                }
            });
            document.getElementById("modal-close-btn").addEventListener("click", cerrarModalForm);
            document.getElementById("form-empresa-nueva").addEventListener("submit", manejarSubmitEmpresa);
        } catch (error) {
            alert("Error al cargar datos de la empresa: " + error.message);
            cerrarModalForm();
        }
    }


    // ===================================================================
    // --- Lógica para Modal COTIZAR (Llama a API Cotizaciones) ---
    // ===================================================================
    
    function cerrarModalCotizar() {
        modalCotizarPlaceholder.innerHTML = "";
    }
    
    function generarPDF(cotizacion) {
        console.log("Generando PDF (simulado)...", cotizacion);
        // (Tu lógica de pdfmake va aquí)
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
        if (document.getElementById("check-recoleccion").checked) {
            let costo_base_servicio = parseFloat(document.getElementById('check-recoleccion').dataset.precio || 0);
            let costo_dias_semanal = 0;
            const diasChecks = document.querySelectorAll('.dia-check:checked');
            diasChecks.forEach(check => {
                costo_dias_semanal += parseFloat(check.dataset.precio || 0);
            });
            const costo_servicio_mensual = costo_base_servicio + (costo_dias_semanal * 4);
            const bolsas_por_dia = parseFloat(document.getElementById('bolsas-dia').value) || 0;
            const peso_por_bolsa = parseFloat(document.getElementById('peso-bolsa').value) || 0;
            const costo_extra_peso = (bolsas_por_dia * diasChecks.length * 4) * peso_por_bolsa * COSTO_POR_KG;
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
                modo: "crear_cotizacion",
                cotizacion: cotizacionData,
                detalles: detallesData
            };
            const resp = await fetch(API_URL_COTIZACIONES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const resultado = await resp.json();
            if (resultado.success) {
                alert(resultado.message || "¡Cotización guardada!");
                cerrarModalCotizar();
                window.location.reload(); 
            } else {
                throw new Error(resultado.error || "Error al guardar cotización.");
            }
        } catch (error) {
            alert("Error al guardar: " + error.message);
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Cotización";
        }
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
            const costo_extra_peso = (bolsas_por_dia * dias_seleccionados * 4) * peso_por_bolsa * COSTO_POR_KG;
            total += costo_extra_peso;
        }
        document.querySelectorAll('#tolvas-tbody tr').forEach(tr => {
            total += parseFloat(tr.dataset.qty) * parseFloat(tr.dataset.precio);
        });
        document.getElementById('total-cotizacion').textContent = formatMoneda(total);
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

    function abrirModalCotizar(id) {
        modalCotizarPlaceholder.innerHTML = modalCotizarHTML;
        document.getElementById("modal-empresa-id").value = empresaData.id_empresa;
        document.getElementById("modal-empresa-nombre").textContent = empresaData.nombre_comercial;
        const selectContacto = document.createElement('select');
        selectContacto.id = "modal-contacto-select";
        selectContacto.style.cssText = "width:100%; padding:0.5rem;";
        if (contactosData.length > 0) {
            contactosData.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id_contacto;
                opt.textContent = `${c.nombre} (${c.email})`;
                selectContacto.appendChild(opt);
            });
        } else {
            selectContacto.innerHTML = "<option value=''>Sin contactos</option>";
        }
        document.getElementById("modal-contacto-nombre").replaceWith(selectContacto);
        const selectTolva = document.getElementById("select-tolva");
        listaProductos.filter(p => p.unidad === "renta").forEach(p => {
            const option = document.createElement('option');
            option.value = p.id_producto;
            option.textContent = `${p.descripcion} (${formatearMoneda(p.precio_unitario)})`;
            option.dataset.precio = p.precio_unitario;
            selectTolva.appendChild(option);
        });
        document.getElementById("modal-close-btn").addEventListener("click", cerrarModalCotizar);
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


    // --- Ejecutar la carga inicial ---
    cargarDatosPerfil();
});