// Espera a que la página HTML esté completamente cargada.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Selectores del DOM (Principales) ---
    // "Agarra" todas las cajas de texto del HTML para poder rellenarlas después.
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

    // --- Selectores de Modales ---
    // "Agarra" los espacios vacíos donde aparecerán las ventanas pop-up.
    const modalFormPlaceholder = document.getElementById("modal-form-placeholder"); // Para modificar empresa
    const modalCotizarPlaceholder = document.getElementById("modal-cotizar-placeholder"); // Para cotizar

    // --- Almacenes de Datos ---
    // Variables vacías para guardar los datos que descarguemos.
    let empresaData = null; // Guardará la info de ESTA empresa
    let contactosData = []; // Guardará los contactos de ESTA empresa
    let listaProductos = []; // Guardará todos los productos (para el modal de cotizar)
    let modalEmpresaFormHTML = ""; // Guardará el HTML del pop-up de "Modificar"
    let modalCotizarHTML = ""; // Guardará el HTML del pop-up de "Cotizar"

    // --- Helpers de Formato ---
    // Herramientas para que el dinero y las fechas se vean bonitos.
    const formatMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatFecha = (dateISO) => new Date(dateISO).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    /**
     * 1. Función Principal: Cargar todo
     */
    async function cargarDatosPerfil() {
        // Revisa la dirección web (URL) para ver el ID de la empresa.
        // Ej: perfil.html?id=E-12345
        const params = new URLSearchParams(window.location.search);
        const idEmpresa = params.get('id'); // Saca el "E-12345"

        // Si no hay ID en la URL, muestra un error y no hace nada más.
        if (!idEmpresa) {
            document.body.innerHTML = "<h1>Error: No se proporcionó un ID de empresa.</h1>";
            return;
        }

        try {
            // Pide TODOS los archivos que necesita al mismo tiempo.
            const [
                respEmpresas, 
                respContactos, 
                respServicios, 
                respCotizaciones,
                respProductos,
                respModalFormEmpresa,
                respModalFormCotizar
            ] = await Promise.all([
                
                // =======================================================================
                // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (PARA LEER DATOS / SELECT)
                // =======================================================================
                //
                // Estas 5 líneas `fetch` están pidiendo TODOS los datos de prueba.
                // En la versión real, esto es ineficiente. Lo ideal sería
                // llamar a UN solo archivo PHP que reciba el ID de la empresa.
                //
                // Ejemplo:
                // fetch("api/traer_perfil_completo.php?id=" + idEmpresa)
                //
                // Ese archivo PHP DEBE conectarse a la BD y hacer TODOS los SELECTS
                // necesarios (SELECT * FROM empresas WHERE id=..., 
                // SELECT * FROM contactos WHERE id_empresa=..., etc.)
                // y devolver un JSON gigante con toda la información.
                //
                fetch("empresas.json"),
                fetch("contactos.json"),
                fetch("servicios_activos.json"),
                fetch("cotizaciones.json"),
                fetch("producto.json"),
                // Estas 2 líneas cargan el HTML de los pop-ups (están bien así).
                fetch("modal_empresa_form.html"), // HTML para Modificar
                fetch("modal_formulario.html")   // HTML para Cotizar
            ]);

            // Convierte las respuestas en datos que JavaScript entiende.
            const empresas = await respEmpresas.json();
            const contactos = await respContactos.json();
            const servicios = await respServicios.json();
            const cotizaciones = await respCotizaciones.json();
            
            // Guarda los datos y los HTML en las variables que preparamos antes.
            listaProductos = await respProductos.json();
            modalEmpresaFormHTML = await respModalFormEmpresa.text();
            modalCotizarHTML = await respModalFormCotizar.text();

            // Busca los datos ESPECÍFICOS de esta empresa
            empresaData = empresas.find(e => e.idempresa == idEmpresa); // Encuentra LA empresa
            contactosData = contactos.filter(c => c["id empresa"] == idEmpresa); // Encuentra SUS contactos
            const servicioData = servicios.find(s => s.id_empresa == idEmpresa); // Encuentra SU servicio
            let cotizacionData = null;
            if (servicioData) {
                // Si tiene servicio, busca la cotización con la que se creó
                cotizacionData = cotizaciones.find(c => c.idCotizacion === servicioData.id_cotizacion);
            }

            // Si después de buscar, no encontramos la empresa, muestra error.
            if (!empresaData) {
                document.body.innerHTML = `<h1>Error: No se encontró la empresa con ID ${idEmpresa}.</h1>`;
                return;
            }

            // Llama a las funciones para "dibujar" los datos en la página.
            popularCabecera(empresaData, servicioData);
            popularContactos(contactosData);
            popularDocumentos(servicioData);
            popularHorario(cotizacionData);
            asignarAcciones(idEmpresa); // "Activa" los botones de la página

        } catch (error) {
            // Si algo falla, lo muestra en la consola y en la página.
            console.error("Error al cargar datos:", error);
            nombreComercial.textContent = "Error al cargar datos.";
        }
    }

    /**
     * 2. Llenar la cabecera (Tarjeta 1)
     */
    function popularCabecera(empresa, servicio) {
        // Rellena la información básica de la empresa
        nombreComercial.textContent = empresa["nombre comercial"];
        razonSocial.textContent = empresa["razon social"];
        fechaCreacion.textContent = formatFecha(empresa["fecha creacion"]);
        
        // Si la empresa tiene un servicio activo...
        if (servicio) {
            const estado = servicio["estado actual de pago"];
            estadoServicio.textContent = estado;
            estadoServicio.className = "status-badge"; 
            
            if (estado === "Pagado") {
                // Si ya pagó, pone la insignia en verde
                estadoServicio.classList.add("pagado");
                estadoServicio.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${estado}`;
                
                // --- CAMBIO IMPORTANTE ---
                // Bloquea el botón de "Cotizar" porque ya tiene un servicio.
                btnCotizar.innerHTML = `<i class="fa-solid fa-check"></i> Cotizado`;
                btnCotizar.disabled = true;
                btnCotizar.classList.replace("btn-primary", "btn-secondary");
                
            } else { // Si está "Pendiente"
                // Pone la insignia en amarillo/rojo
                estadoServicio.classList.add("pendiente");
                estadoServicio.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> ${estado}`;
            }

            // Muestra la información del pago (monto y fecha)
            perfilMonto.textContent = formatMoneda(servicio.monto_mensual);
            perfilFechaPago.textContent = `Próximo pago: ${formatFecha(servicio["dia de facturacion"])}`;
            paymentInfo.style.display = "block"; // Muestra la caja de pagos

        } else {
            // Si NO tiene servicio, pone la insignia en gris "Inactivo"
            estadoServicio.textContent = "Inactivo";
            estadoServicio.className = "status-badge inactivo";
            estadoServicio.innerHTML = `<i class="fa-solid fa-times-circle"></i> Inactivo`;
            paymentInfo.style.display = "none"; // Oculta la caja de pagos
            
            // Se asegura de que el botón de "Cotizar" SÍ esté activo
            btnCotizar.innerHTML = `<i class="fa-solid fa-file-invoice-dollar"></i> Cotizar`;
            btnCotizar.disabled = false;
            btnCotizar.classList.replace("btn-secondary", "btn-primary");
        }
    }

    /**
     * 3. Llenar la lista de contactos (Tarjeta 2)
     */
    function popularContactos(contactos) {
        listaContactos.innerHTML = ""; // Limpia la lista
        if (contactos.length === 0) {
            listaContactos.innerHTML = "<p>No hay contactos registrados.</p>";
            return;
        }
        // "Dibuja" un bloque por cada contacto encontrado
        contactos.forEach((contacto, index) => {
            const li = document.createElement("li");
            li.className = "contact-item";
            li.innerHTML = `
                <div class="contact-pic"><i class="fa-solid fa-user"></i></div>
                <div class="contact-details">
                    <p class="nombre">${contacto.nombre} ${index === 0 ? '(Principal)' : ''}</p>
                    <p class="email">${contacto.email}</p>
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
        // (Esta lógica es de simulación, muestra el estado de los documentos)
        listaDocumentos.innerHTML = ""; 
        let estadoGeneral = "Inactivo";
        let estadoClase = "inactivo";
        
        if (servicio) {
            estadoGeneral = servicio["estado de documentacion"];
            estadoClase = (estadoGeneral === "Todo Aceptado") ? "aceptado" : "pendiente";
        }
        // ... (resto de la lógica para "dibujar" la lista de documentos) ...
        // ...
    }

    /**
     * 5. Llenar horario (Tarjeta 4)
     */
    function popularHorario(cotizacion) {
        let servicioActivo = null;
        if (cotizacion) {
            // Busca en la cotización el detalle del "servicio" (P-001)
            servicioActivo = cotizacion.detalles.find(d => d.idProducto === "P-001");
        }

        if (servicioActivo) {
            // Si lo encuentra, "dibuja" los días de la semana y marca los activos
            horarioContainer.innerHTML = `
                <div class="schedule-days">
                    <div class="dia ${servicioActivo.lunes ? 'activo' : 'inactivo'}">Lunes</div>
                    <div class="dia ${servicioActivo.martes ? 'activo' : 'inactivo'}">Martes</div>
                    <div class="dia ${servicioActivo.miercoles ? 'activo' : 'inactivo'}">Miércoles</div>
                    <div class="dia ${servicioActivo.jueves ? 'activo' : 'inactivo'}">Jueves</div>
                    <div class="dia ${servicioActivo.viernes ? 'activo' : 'inactivo'}">Viernes</div>
                </div>
            `;
        } else {
            // Si no tiene servicio, muestra un botón para cotizar
            horarioContainer.innerHTML = `
                <div class="no-schedule">
                    <p>Esta empresa no tiene una cotización de servicio recurrente activa.</p>
                    <button class="btn btn-primary" id="horario-btn-cotizar">
                        <i class="fa-solid fa-file-invoice-dollar"></i> Realizar Cotización
                    </button>
                </div>
            `;
            // Activa ese botón
            document.getElementById("horario-btn-cotizar").addEventListener("click", () => {
                if(btnCotizar.disabled) return; // Si el botón principal está bloqueado, este tampoco funciona
                abrirModalCotizar(empresaData.idempresa);
            });
        }
    }

    /**
     * 6. Asignar acciones a los botones
     */
    function asignarAcciones(id) {
        // --- Botón MODIFICAR EMPRESA ---
        document.getElementById("perfil-btn-modificar").addEventListener("click", () => {
            abrirModalModificar(id); // Abre el pop-up de modificar
        });

        // --- Botón COTIZAR ---
        btnCotizar.addEventListener("click", () => {
            abrirModalCotizar(id); // Abre el pop-up de cotizar
        });
        
        // --- Botón AÑADIR CONTACTO ---
        document.getElementById("perfil-btn-add-contacto").addEventListener("click", () => {
            // (Truco: Abre el modal de "Modificar" que ya tiene la lógica de añadir contactos)
            abrirModalModificar(id);
        });
        
        // --- Botón ELIMINAR EMPRESA (Simulado) ---
        document.getElementById("perfil-btn-eliminar").addEventListener("click", () => {
            // =======================================================================
            // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (PARA BORRAR / DELETE)
            // =======================================================================
            //
            // Esta acción DEBE llamar a un archivo PHP.
            // Ej: fetch("api/borrar_empresa.php?id=" + id)
            //
            // Ese PHP DEBE conectarse a la BD para hacer el DELETE de la empresa.
            //
            if(confirm("¿Seguro que deseas eliminar esta empresa?")) {
                alert(`Acción: Eliminar empresa ${id}. (Simulado)`);
            }
        });
        
        // --- Botón CANCELAR SERVICIO (Simulado) ---
        document.getElementById("perfil-btn-cancelar").addEventListener("click", () => {
            // =======================================================================
            // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (PARA MODIFICAR / UPDATE)
            // =======================================================================
            //
            // Esta acción DEBE llamar a un archivo PHP.
            // Ej: fetch("api/cancelar_servicio.php?id_empresa=" + id)
            //
            // Ese PHP DEBE conectarse a la BD para hacer el UPDATE o DELETE
            // en la tabla 'servicios_activos'.
            //
            if (confirm("¿Estás seguro de que deseas cancelar este servicio?")) {
                alert(`Acción: Cancelar servicio de la empresa ${id}. (Simulado)`);
            }
        });
    }

    
    // ===================================================================
    // --- Lógica para Modal MODIFICAR EMPRESA (Copiada de app_empresas.js) ---
    // ===================================================================
    // (Estas funciones son las mismas que ya comentamos en app_empresas.js)

    // "Ayudante" para crear los campos del formulario de contacto
    function anadirBloqueContacto(container, contacto = {}) {
        // ... (código idéntico para crear el bloque HTML) ...
    }

    // Cierra el pop-up de "Modificar"
    function cerrarModalForm() {
        modalFormPlaceholder.innerHTML = ""; 
    }

    // Se activa al pulsar "Guardar Cambios" en el pop-up de Modificar
    function manejarSubmitEmpresa(e) {
        e.preventDefault();
        
        // 1. Recoge los datos de la empresa
        const empresaDataModificada = { /* ... (recoge datos del form) ... */ };
        // 2. Recoge los datos de los contactos
        const contactosDataModificados = []; /* ... (recoge datos de los bloques) ... */

        // =======================================================================
        // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (PARA MODIFICAR / UPDATE)
        // =======================================================================
        //
        // Esta acción DEBE llamar a un archivo PHP.
        // Ej: fetch("api/modificar_empresa.php", { method: 'POST', body: JSON.stringify(...) })
        //
        // Ese PHP DEBE conectarse a la BD para hacer el UPDATE de la empresa
        // y también actualizar/borrar/añadir los contactos.
        //
        console.log(`--- MODIFICANDO (Simulado) ID: ${empresaData.idempresa} ---`);
        console.log("Empresa:", empresaDataModificada);
        console.log("Contactos:", contactosDataModificados);
        alert("Empresa modificada (ver consola F12).");
        
        cerrarModalForm(); // Cierra el pop-up
        
        // Vuelve a cargar TODOS los datos de la página para ver los cambios
        cargarDatosPerfil();
    }

    // Abre el pop-up de "Modificar Empresa"
    function abrirModalModificar(id) {
        modalFormPlaceholder.innerHTML = modalEmpresaFormHTML; // "Inyecta" el HTML
        
        // Rellena el formulario con los datos que ya tenemos
        document.getElementById("emp-nombre-comercial").value = empresaData["nombre comercial"];
        // ... (rellena los demás campos de la empresa) ...

        // Rellena los contactos
        const contactosList = document.getElementById("contactos-list");
        if (contactosData.length > 0) {
            contactosData.forEach(c => anadirBloqueContacto(contactosList, c));
        } else {
            anadirBloqueContacto(contactosList); // Añade uno vacío
        }

        // Configura los títulos y botones del pop-up
        document.getElementById("modal-titulo").textContent = "Modificar Empresa";
        // ... (configura los demás botones y campos ocultos) ...

        // "Activa" los botones de DENTRO del pop-up
        document.getElementById("btn-add-contacto").addEventListener("click", () => anadirBloqueContacto(contactosList));
        // ... (activa el resto de botones: borrar contacto, cerrar, guardar) ...
    }


    // ===================================================================
    // --- Lógica para Modal COTIZAR (Copiada de app_cotizaciones.js) ---
    // ===================================================================
    // (Estas funciones son las mismas que ya comentamos en app_cotizaciones.js)

    // Cierra el pop-up de "Cotizar"
    function cerrarModalCotizar() {
        modalCotizarPlaceholder.innerHTML = "";
    }

    // Función que usa 'pdfmake' para crear el PDF
    function generarPDF(cotizacion) {
        // ... (código idéntico para definir y crear el PDF) ...
        // ...
        // (Usa 'empresaData', 'contactosData' y 'listaProductos' que ya cargamos al inicio)
        // ...
        pdfMake.createPdf(docDefinition).download(`cotizacion_${empresaData["nombre comercial"]}.pdf`);
    }

    // Se activa al pulsar "Guardar Cotización" en el pop-up de Cotizar
    function manejarSubmitCotizacion(e) {
        e.preventDefault();
        
        // 1. Recoge todos los datos del formulario de cotización
        const cotizacion = {
            idCotizacion: `C-${Date.now()}`, 
            fechaCreacion: new Date().toISOString(),
            idEmpresa: document.getElementById("modal-empresa-id").value,
            // ... (recoge el resto de datos: contacto, total, detalles, etc.) ...
            detalles: []
        };
        // ... (lógica para rellenar los detalles) ...
        
        // =======================================================================
        // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (PARA GUARDAR / INSERT)
        // =======================================================================
        //
        // Esta acción DEBE llamar a un archivo PHP.
        // Ej: fetch("api/guardar_cotizacion.php", { method: 'POST', body: JSON.stringify(cotizacion) })
        //
        // Ese PHP DEBE conectarse a la BD para hacer el INSERT de la nueva
        // cotización y sus detalles.
        // (Idealmente, este PHP también crearía el "servicio activo" en la otra tabla).
        //
        console.log("--- COTIZACIÓN GENERADA (Simulado) ---", cotizacion);
        alert("Cotización generada (ver consola F12).");
        
        generarPDF(cotizacion); // Llama al creador de PDF
        cerrarModalCotizar(); // Cierra el pop-up
        
        // Recarga TODA la página.
        // Esto es para que la página vuelva a cargar y vea el "servicio activo" nuevo
        // y así se bloquee el botón de "Cotizar".
        window.location.reload();
    }
    
    // Funciones "ayudantes" para el cálculo del total en el pop-up de cotizar
    function actualizarCalculoTotal() { /* ... (código idéntico) ... */ }
    function agregarLineaTolva() { /* ... (código idéntico) ... */ }

    // Abre el pop-up de "Cotizar"
    function abrirModalCotizar(id) {
        modalCotizarPlaceholder.innerHTML = modalCotizarHTML; // "Inyecta" el HTML

        // Rellena los datos de la empresa (que ya tenemos)
        document.getElementById("modal-empresa-id").value = empresaData.idempresa;
        document.getElementById("modal-empresa-nombre").textContent = empresaData["nombre comercial"];
        
        // Crea el <select> de contactos (usando los contactos que ya tenemos)
        const selectContacto = document.createElement('select');
        // ... (código idéntico para rellenar el select de contactos) ...
        document.getElementById("modal-contacto-nombre").replaceWith(selectContacto);

        // Rellena el <select> de productos (usando la lista que ya tenemos)
        const selectTolva = document.getElementById("select-tolva");
        // ... (código idéntico para rellenar el select de tolvas) ...

        // "Activa" todos los botones de DENTRO del pop-up de cotizar
        document.getElementById("modal-close-btn").addEventListener("click", cerrarModalCotizar);
        document.getElementById("form-cotizacion").addEventListener("submit", manejarSubmitCotizacion);
        // ... (activa el resto de listeners: checkbox, añadir línea, etc.) ...
    }


    // --- Ejecutar la carga inicial ---
    // ¡Aquí empieza todo! Llama a la función principal para cargar la página.
    cargarDatosPerfil();
});