// Espera a que la página HTML esté completamente cargada.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- URLs de las APIs ---
    const API_URL_PERFIL = '../api/perfil_api.php';
    const API_URL_EMPRESAS = '../api/empresas_api.php';
    const API_URL_COTIZACIONES = '../api/cotizaciones_api.php';
    const COSTO_POR_KG = 1.5;

    // --- Selectores del DOM ---
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
    // CORRECCIÓN: Agregamos el selector correcto para docs
    const modalDocsPlaceholder = document.getElementById("modal-docs-placeholder"); 

    // --- Almacenes de Datos ---
    let empresaData = null; 
    let contactosData = []; 
    let servicioData = null; 
    let listaProductos = []; 
    // Variables para guardar el HTML crudo
    let modalEmpresaFormHTML = ""; 
    let modalCotizarHTML = ""; 
    let modalDocumentacionHTML = ""; // Esta variable vive aquí adentro

    // Variable temporal para documentos (ahora vive aquí adentro también)
    let documentosMemoria = {}; 

    // --- Helpers ---
    const formatearMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatFecha = (dateISO) => {
        if (!dateISO) return 'N/A';
        return new Date(dateISO.replace(/-/g, '/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    /**
     * 1. Cargar Datos
     */
    async function cargarDatosPerfil() {
        const params = new URLSearchParams(window.location.search);
        const idEmpresa = params.get('id');

        if (!idEmpresa) {
            document.body.innerHTML = "<h1>Error: No se proporcionó un ID de empresa.</h1>";
            return;
        }

        try {
            const [
                respModalFormEmpresa,
                respModalFormCotizar,
                respModalDocs,       // Fetch del nuevo modal
                respProductos,
                respPerfil 
            ] = await Promise.all([
                fetch("../html/modal_empresa_form.html"), 
                fetch("../html/modal_formulario.html"),  
                fetch("../html/modal_documentacion.html"), // Asegúrate que este archivo exista en la carpeta html/
                fetch(`${API_URL_COTIZACIONES}?accion=leer_productos`), 
                fetch(`${API_URL_PERFIL}?accion=leer_perfil&id=${idEmpresa}`) 
            ]);

            // Guardamos los textos HTML en las variables
            modalEmpresaFormHTML = await respModalFormEmpresa.text();
            modalCotizarHTML = await respModalFormCotizar.text();
            modalDocumentacionHTML = await respModalDocs.text(); // AQUI SE LLENA LA VARIABLE
            
            listaProductos = await respProductos.json();
            const data = await respPerfil.json();
            
            if (data.success === false || !data.empresa) { 
                throw new Error(data.error || "Empresa no encontrada.");
            }
            
            empresaData = data.empresa;
            contactosData = data.contactos;
            servicioData = data.servicio; 
            const detalleServicio = data.detalle_servicio; 

            popularCabecera(empresaData, servicioData);
            popularContactos(contactosData);
            popularDocumentos(servicioData);
            popularHorario(detalleServicio); 
            asignarAcciones(empresaData.id_empresa); 

        } catch (error) {
            console.error("Error:", error);
            document.body.innerHTML = `<h1>Error</h1><p>${error.message}</p>`;
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
                <i class="fa-solid fa-user contact-icon-individual"></i>
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
     * 4. Llenar documentos (Tarjeta 3) - VERSIÓN LIMPIA
     */
    function popularDocumentos(servicio) {
        listaDocumentos.innerHTML = ""; 
        
        // 1. ELIMINADO: Ya no calculamos ni mostramos el estado general ("En Revisión", etc.)
        
        // 2. Solo mostramos la lista estática de lo que se requiere
        const docs = [
             { nombre: "Constancia de Situación Fiscal", icono: "fa-file-pdf" },
             { nombre: "Identificación Oficial (Rep.)", icono: "fa-id-card" },
             { nombre: "Poder Notarial (Rep.)", icono: "fa-file-signature" }, 
             { nombre: "Comprobante de Domicilio", icono: "fa-house-chimney" }
        ];

        if (servicio && servicio.id_servicio) {
            docs.forEach(doc => {
                const li = document.createElement("li");
                li.className = "doc-item";
                // Solo mostramos Ícono y Nombre. Quitamos los estados.
                li.innerHTML = `
                    <span class="doc-name" style="font-size: 0.95rem; color: #555;">
                        <i class="fa-solid ${doc.icono}" style="margin-right:8px; color:#0d6efd;"></i> 
                        ${doc.nombre}
                    </span>
                `;
                listaDocumentos.appendChild(li);
            });
        } else {
            // Mensaje simple si no hay servicio
            listaDocumentos.innerHTML = "<p class='text-muted small p-2'>Se requiere cotizar un servicio para gestionar documentos.</p>";
        }
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
            // El botón de añadir contacto generalmente abre el modal de modificar
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

        const btnDocs = document.querySelector('.div3.card .card-header button');
        if(btnDocs) {
            // Ahora sí funcionará porque abrirModalDocumentacion está en el mismo scope
            btnDocs.addEventListener("click", abrirModalDocumentacion); 
        }
   
    }

    /**
     * 7. Función para Eliminar Empresa (Llama a API Empresas)
     */
    async function eliminarEmpresa(id) {
        if (!confirm(`¿Estás seguro de que deseas eliminar a "${empresaData.nombre_comercial}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        try {
            const body = { modo: 'eliminar_empresa', id_empresa: id };
            const resp = await fetch(API_URL_EMPRESAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const resultado = await resp.json();
            if (resultado.success) {
                alert(resultado.message || "Empresa eliminada.");
                // CORRECCIÓN DE RUTA: Redirigimos a la página de empresas
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
                modo: 'editar_empresa', // Solo puede ser 'modificar' en esta pantalla
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
            // El API de empresas debe devolver los datos completos de la empresa y sus contactos
            // 🛑 CORRECCIÓN CLAVE: Cambiamos 'id_empresa' por 'id' para coincidir con perfil_api.php
            const url = `${API_URL_EMPRESAS}?accion=leer_perfil&id=${id}`; 
            const resp = await fetch(url);
            const data = await resp.json();
            
            // 🛑 CORRECCIÓN: Ajustamos la lógica para leer directamente de la raíz de la respuesta,
            // asumiendo que el API devuelve { empresa: {...}, contactos: [...] }
            // Si la API usa la clave 'success', la revisamos primero.
            if (data.success === false) {
                 throw new Error(data.error || 'Error en la API al cargar la empresa.');
            }

            // Aseguramos que la empresa y los contactos existan.
            if (!data.empresa) throw new Error('No se encontró la empresa.');
            
            const empresa = data.empresa; // ⬅️ CAMBIO: Acceso directo a 'data.empresa'
            const contactos = data.contactos; // ⬅️ CAMBIO: Acceso directo a 'data.contactos'
            
            document.getElementById("emp-nombre-comercial").value = empresa.nombre_comercial;
            document.getElementById("emp-razon-social").value = empresa.razon_social;
            document.getElementById("emp-tipo").value = empresa.tipo || '';
            document.getElementById("emp-ruta").value = empresa.id_ruta || '';
            document.getElementById("emp-direccion").value = empresa.direccion || '';
            
            const contactosList = document.getElementById("contactos-list");
            contactosList.innerHTML = ''; // Limpiar cualquier contacto de ejemplo
            
            if (contactos.length > 0) {
                contactos.forEach(c => anadirBloqueContacto(contactosList, c));
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
                    // Lógica para reasignar "Principal"
                    const primerBloque = contactosList.querySelector(".contacto-block:first-child .contacto-block-label");
                    if (primerBloque) primerBloque.textContent = "Contacto Principal";
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
        
        // El resto de la lógica de recolección de datos y cálculo se mantiene igual...
        
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
            const dias_seleccionados = diasChecks.length;
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
    let subtotal = 0;
    const checkRecoleccion = document.getElementById('check-recoleccion');
    
    // 1. Calcular Servicio de Recolección
    if (checkRecoleccion && checkRecoleccion.checked) {
        let costo_base = parseFloat(checkRecoleccion.dataset.precio || 0);
        let costo_dias_semanal = 0;
        
        document.querySelectorAll('.dia-check:checked').forEach(check => {
            costo_dias_semanal += parseFloat(check.dataset.precio || 0);
        });

        // Sumar mensualidad
        subtotal += costo_base + (costo_dias_semanal * 4);

        // Sumar Peso Extra
        const bolsas_por_dia = parseFloat(document.getElementById('bolsas-dia').value) || 0;
        const peso_por_bolsa = parseFloat(document.getElementById('peso-bolsa').value) || 0;
        const dias_seleccionados = document.querySelectorAll('.dia-check:checked').length;
        
        const costo_extra_peso = (bolsas_por_dia * dias_seleccionados * 4) * peso_por_bolsa * COSTO_POR_KG;
        subtotal += costo_extra_peso;
    }

    // 2. Calcular Tolvas
    document.querySelectorAll('#tolvas-tbody tr').forEach(tr => {
        const qty = parseFloat(tr.dataset.qty) || 0;
        const precio = parseFloat(tr.dataset.precio) || 0;
        subtotal += (qty * precio);
    });

    // 🟢 3. LÓGICA DE IVA MEJORADA (Efectivo = 0%) 🟢
    const selectPago = document.getElementById("forma-pago");
    
    // Obtenemos valor, quitamos espacios y pasamos a minúsculas para comparar seguro
    const formaPago = selectPago ? selectPago.value.trim().toLowerCase() : "";
    
    // Si es "efectivo", IVA es 0. Si no, es 16%
    const tasaIVA = (formaPago === "efectivo") ? 0 : 0.16;
    
    const iva = subtotal * tasaIVA;
    const total = subtotal + iva;

    // 4. Mostrar en pantalla
    if(document.getElementById('subtotal-cotizacion')) {
        document.getElementById('subtotal-cotizacion').textContent = formatearMoneda(subtotal);
    }
    
    if(document.getElementById('iva-cotizacion')) {
        document.getElementById('iva-cotizacion').textContent = formatearMoneda(iva);
        
        // Visual: poner en gris si es 0, negro si tiene valor
        if (tasaIVA === 0) {
            document.getElementById('iva-cotizacion').style.color = "#999";
        } else {
            document.getElementById('iva-cotizacion').style.color = "#333";
        }
    }

    const elementoTotal = document.getElementById('total-cotizacion');
    if (elementoTotal) {
        elementoTotal.textContent = formatearMoneda(total);
    }
}

function abrirModalCotizar(id) {
    // 1. Inyectar HTML
    modalCotizarPlaceholder.innerHTML = modalCotizarHTML;
    
    // 2. Llenar datos de empresa
    if (empresaData) {
        document.getElementById("modal-empresa-id").value = empresaData.id_empresa;
        document.getElementById("modal-empresa-nombre").textContent = empresaData.nombre_comercial;
    }

    // 3. Select de Contactos
    const selectContacto = document.createElement('select');
    selectContacto.id = "modal-contacto-select";
    selectContacto.style.cssText = "width:100%; padding:0.5rem;";
    
    if (contactosData && contactosData.length > 0) {
        contactosData.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id_contacto;
            opt.textContent = `${c.nombre} (${c.email})`;
            selectContacto.appendChild(opt);
        });
    } else {
        selectContacto.innerHTML = "<option value=''>Sin contactos</option>";
    }
    const inputContacto = document.getElementById("modal-contacto-nombre");
    if(inputContacto) inputContacto.replaceWith(selectContacto);


    // 4. Select de Tolvas
    const selectTolva = document.getElementById("select-tolva");
    const productosTolva = listaProductos.filter(p => p.unidad === "renta" || p.descripcion.toLowerCase().includes('tolva'));
    productosTolva.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_producto;
        option.textContent = `${p.descripcion} (${formatearMoneda(p.precio_unitario)})`;
        option.dataset.precio = p.precio_unitario;
        selectTolva.appendChild(option);
    });

    // 5. Inyectar Precio Servicio (Búsqueda Inteligente que ya tenías)
    const checkRecoleccion = document.getElementById("check-recoleccion");
    if (checkRecoleccion) {
        // Intento 1: SKU
        let productoServicio = listaProductos.find(p => p.sku === 'P-001'); 
        
        // Intento 2: Nombre
        if (!productoServicio) {
             productoServicio = listaProductos.find(p => {
                 const desc = p.descripcion.toLowerCase();
                 return (desc.includes('recolección') || desc.includes('servicio')) 
                        && !desc.includes('renta') 
                        && !desc.includes('tolva');
             });
        }

        if (productoServicio) {
            checkRecoleccion.dataset.precio = productoServicio.precio_unitario;
            const label = document.querySelector('label[for="check-recoleccion"]');
            if (label) {
                const textoLimpio = "Incluir servicio de recolección"; 
                label.innerHTML = `${textoLimpio} <strong>(${formatearMoneda(productoServicio.precio_unitario)})</strong>`;
            }
        }
    }

    // 6. LISTENERS
    document.getElementById("modal-close-btn").addEventListener("click", cerrarModalCotizar);
    document.getElementById("form-cotizacion").addEventListener("submit", manejarSubmitCotizacion);
    
    // Checkbox Recolección
    if (checkRecoleccion) {
        checkRecoleccion.addEventListener("change", function() {
            const estaMarcado = this.checked;
            document.getElementById("dias-recoleccion").classList.toggle('hidden', !estaMarcado);
            document.getElementById("tipo-residuo-group").classList.toggle('hidden', !estaMarcado);
            document.getElementById("bolsas-peso-group").classList.toggle('hidden', !estaMarcado);
            
            if (!estaMarcado) {
                document.querySelectorAll('.dia-check').forEach(check => check.checked = false);
                document.getElementById('bolsas-dia').value = "";
                document.getElementById('peso-bolsa').value = "";
            }
            actualizarCalculoTotal();
        });
    }

    // Inputs de cálculo
    document.querySelectorAll(".dia-check").forEach(check => check.addEventListener("change", actualizarCalculoTotal));
    document.getElementById("bolsas-dia").addEventListener("input", actualizarCalculoTotal);
    document.getElementById("peso-bolsa").addEventListener("input", actualizarCalculoTotal);
    
    // Tolvas
    document.getElementById("btn-add-tolva").addEventListener("click", agregarLineaTolva);
    document.getElementById("tolvas-tbody").addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-borrar-linea")) {
            e.target.closest("tr").remove();
            actualizarCalculoTotal();
        }
    });

    // 🟢 NUEVO: DETECTAR CAMBIO EN FORMA DE PAGO 🟢
    const selectPago = document.getElementById("forma-pago");
    if (selectPago) {
        selectPago.addEventListener("change", actualizarCalculoTotal);
    }

    // 🟢 NUEVO: FORZAR CÁLCULO INICIAL 🟢
    // Para que si empieza en "Efectivo" ya salga sin IVA desde el segundo 0
    actualizarCalculoTotal();
}

async function abrirModalDocumentacion() {
        // 1. Validaciones básicas
        if(!modalDocsPlaceholder) return;
        
        // Verificamos tener el servicio activo (variable global 'servicioData')
        if (!servicioData || !servicioData.id_servicio) {
            alert("No hay un servicio activo para gestionar documentos. Realiza una cotización primero.");
            return;
        }

        // 2. Inyectar HTML
        modalDocsPlaceholder.innerHTML = modalDocumentacionHTML;
        
        // 3. Configurar Estilos del Modal (Centrado)
        const modalNode = document.getElementById("modalDocumentacion");
        if (modalNode) {
            modalNode.classList.add("show");
            Object.assign(modalNode.style, {
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
                zIndex: "1055", backgroundColor: "rgba(0,0,0,0.5)", opacity: "1"
            });
            document.body.classList.add("modal-open");

            // ============================================================
            // 4. CEREBRO: RECUPERAR ARCHIVOS SUBIDOS
            // ============================================================
            try {
                // Llamamos a la API para ver qué hay en la BD
                const url = `../api/documentos_api.php?accion=leer_documentos&id_servicio=${servicioData.id_servicio}`;
                const resp = await fetch(url);
                const data = await resp.json();

                if (data.success && data.documentos.length > 0) {
                    
                    // Diccionario: Nombre en BD -> ID en tu HTML
                    const mapa = {
                        'Constancia de Situación Fiscal': 'csf',
                        'Identificación Oficial (Rep.)': 'ine',
                        'Poder Notarial (Rep.)': 'poder',
                        'Comprobante de Domicilio': 'comp'
                    };

                    data.documentos.forEach(doc => {
                        // Buscamos el código corto (ej: 'csf') usando el nombre largo de la BD
                        const codigoHTML = mapa[doc.tipo_documento]; 
                        
                        if (codigoHTML) {
                            // A. Modificar Botón VER (Ojito)
                            const btnVer = document.getElementById(`btn-ver-${codigoHTML}`);
                            if (btnVer) {
                                // Le quitamos lo gris y deshabilitado
                                btnVer.classList.remove('disabled', 'btn-light', 'border');
                                // Le ponemos color verde
                                btnVer.classList.add('btn-success', 'text-white');
                                
                                // Construimos la ruta. 
                                // En la BD está como: "uploads/archivo.pdf"
                                // Desde el HTML necesitamos: "../uploads/archivo.pdf"
                                const rutaFinal = "../" + doc.path_archivo;
                                
                                // Le asignamos la acción de abrir
                                btnVer.onclick = () => window.open(rutaFinal, '_blank');
                            }

                            // B. Opcional: Cambiar texto del botón subir a "Actualizar"
                            // Para que sepa que ya hay uno
                            const btnSubir = document.querySelector(`button[data-target="input-${codigoHTML}"]`);
                            if(btnSubir) {
                                btnSubir.innerHTML = '<i class="fa-solid fa-rotate"></i> Actualizar';
                                btnSubir.classList.remove('btn-primary');
                                btnSubir.classList.add('btn-outline-primary');
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Error al cargar documentos existentes:", error);
            }
        }

        // 5. Configurar Botones de Cerrar
        const cerrar = () => { 
            modalDocsPlaceholder.innerHTML = ""; 
            document.body.classList.remove("modal-open");
        };
        document.getElementById("btn-cerrar-docs").addEventListener("click", cerrar);
        document.getElementById("btn-cerrar-docs-x").addEventListener("click", cerrar);

        // 6. Activar la lógica de subir nuevos archivos
        configurarLogicaDocumentos();
    }



function configurarLogicaDocumentos() {
        // Botones Subir
        document.querySelectorAll('.btn-subir-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.closest('button').dataset.target;
                document.getElementById(targetId).click();
            });
        });
        
        // Inputs Change
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', () => {
                const tipo = input.dataset.tipo;
                if (input.files[0]) {
                    documentosMemoria[tipo] = input.files[0];
                    
                    const msg = document.getElementById(`msg-${tipo}`);
                    if(msg) {
                        msg.textContent = input.files[0].name;
                        msg.className = "text-success small fw-bold ms-4";
                    }

                    const btnVer = document.getElementById(`btn-ver-${tipo}`);
                    if(btnVer) {
                        btnVer.classList.remove('disabled', 'btn-secondary');
                        btnVer.classList.add('btn-success');
                    }
                }
            });
        });

        // Botones Ver
        document.querySelectorAll('.btn-ver-doc').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tipo = e.target.closest('button').dataset.tipo;
                if (documentosMemoria[tipo]) {
                    window.open(URL.createObjectURL(documentosMemoria[tipo]), '_blank');
                }
            });
        });

        // Botón Guardar (Opcional, si lo tienes en el HTML)
const btnGuardarDocs = document.getElementById("btn-guardar-docs");
        if(btnGuardarDocs) {
            btnGuardarDocs.addEventListener("click", async () => {
                
                // 1. Validaciones básicas
                if (Object.keys(documentosMemoria).length === 0) {
                    alert("No has seleccionado ningún archivo para subir.");
                    return;
                }

                // Asegurarnos de que tenemos un servicio al cual adjuntar los docs
                // servicioData es la variable global que llenamos en cargarDatosPerfil
                if (!servicioData || !servicioData.id_servicio) {
                    alert("Error: Esta empresa no tiene un servicio activo vinculado para subir documentos.");
                    return;
                }

                const btnContentOriginal = btnGuardarDocs.innerHTML;
                btnGuardarDocs.disabled = true;
                btnGuardarDocs.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

                try {
                    // 2. Crear FormData
                    const formData = new FormData();
                    formData.append('accion', 'subir_documentos');
                    formData.append('id_servicio', servicioData.id_servicio);

                    // Agregar archivos del objeto documentosMemoria
                    // Las claves (key) son 'csf', 'ine', 'poder', 'comp'
                    for (const [key, file] of Object.entries(documentosMemoria)) {
                        formData.append(key, file);
                    }

                    // 3. Enviar a la API
                    const response = await fetch('../api/documentos_api.php', {
                        method: 'POST',
                        body: formData // Fetch detecta FormData y pone los headers correctos automáticamente
                    });

                    const resultado = await response.json();

                    if (resultado.success) {
                        alert("¡Documentos guardados correctamente!");
                        
                        // Limpiar memoria
                        documentosMemoria = {};
                        
                        // Cerrar modal
                        document.getElementById("modalDocumentacion").classList.remove("show");
                        document.getElementById("modalDocumentacion").style.display = "none";
                        document.body.classList.remove("modal-open");
                        
                        // Recargar la página para ver cambios en la lista de docs
                        window.location.reload(); 
                    } else {
                        throw new Error(resultado.error || "Error desconocido al subir.");
                    }

                } catch (error) {
                    console.error(error);
                    alert("Hubo un problema: " + error.message);
                } finally {
                    btnGuardarDocs.disabled = false;
                    btnGuardarDocs.innerHTML = btnContentOriginal;
                }
            });
        }
    }



    // --- Ejecutar la carga inicial ---
    cargarDatosPerfil();
});




