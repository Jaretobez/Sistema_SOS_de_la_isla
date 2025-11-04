// Espera a que la página HTML se cargue por completo antes de hacer nada.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- CAMBIO BD ---
    // Definimos la ubicación de nuestros archivos PHP (nuestra API)
    const API_URL = 'api/empresas_api.php'; 

    // --- Selectores del DOM ---
    const tablaBody = document.getElementById("tabla-body");
    const noResultados = document.getElementById("no-resultados");
    const formBusqueda = document.getElementById("form-busqueda");
    const inputBusqueda = document.getElementById("busqueda");
    const btnAnadirNuevo = document.getElementById("btn-anadir-nuevo");
    const modalFormPlaceholder = document.getElementById("modal-form-placeholder");
    const modalViewPlaceholder = document.getElementById("modal-view-placeholder");

    // --- Almacenes de Datos ---
    // 'datosCombinados' ahora solo guardará la lista que viene del servidor.
    // Ya no hacemos la combinación de "empresas" y "contactos" aquí.
    let datosCombinados = []; 
    let modalFormHTML = ""; // Caché para el HTML del formulario

    // --- 1. Carga Inicial ---
    // Esta función ahora también se usará para BUSCAR.
    async function cargarDatosIniciales(terminoBusqueda = "") {
        try {
            // --- CAMBIO BD ---
            // Solo cargamos el HTML del modal. Los datos de la empresa vendrán del PHP.
            const respModalForm = await fetch("modal_empresa_form.html");
            modalFormHTML = await respModalForm.text(); // Guarda el HTML del formulario.

            // Ahora, hacemos la "llamada" (fetch) a nuestro archivo PHP.
            // Le pasamos el término de búsqueda en la URL.
            const url = `${API_URL}?accion=leer&termino=${encodeURIComponent(terminoBusqueda)}`;
            const respDatos = await fetch(url);
            
            if (!respDatos.ok) {
                throw new Error(`Error en el servidor: ${respDatos.statusText}`);
            }

            const datosDesdePHP = await respDatos.json();
            
            // Guardamos los datos recibidos.
            // El PHP ya nos dará los datos combinados (empresa + contacto principal).
            datosCombinados = datosDesdePHP;

            // Llama a la función para "dibujar" la tabla con los datos listos.
            renderizarTabla(datosCombinados);

        } catch (error) {
            // Si algo falla al cargar, lo muestra en la consola y en la página.
            console.error("Error al cargar datos iniciales:", error);
            noResultados.textContent = "Error al cargar los datos. Revisa la consola (F12) o el log del servidor PHP.";
            noResultados.style.display = "block";
        }
    }

    // --- 2. Renderizar Tabla ---
    // Esta función "dibuja" los datos en la tabla HTML.
    function renderizarTabla(empresas) {
        tablaBody.innerHTML = ""; 
        noResultados.style.display = empresas.length === 0 ? "block" : "none";

        empresas.forEach(empresa => {
            const tr = document.createElement("tr"); 
            
            // --- CAMBIO BD ---
            // Ahora usamos los nombres de las columnas de la BD (o los alias del PHP).
            // Asumiremos que tu PHP nos dará 'contacto_nombre', 'contacto_email', etc.
            tr.innerHTML = `
                <td>
                    <strong>${empresa.nombre_comercial}</strong>
                    <div class="razon-social">${empresa.razon_social || ''}</div>
                </td>
                <td>${empresa.contacto_nombre || '—'}</td>
                <td>${empresa.contacto_email ? `<a href="mailto:${empresa.contacto_email}">${empresa.contacto_email}</a>` : '—'}</td>
                <td>${empresa.contacto_telefono || '—'}</td>
                <td>
                    <button class="btn-accion ver" data-id="${empresa.id_empresa}" title="Ver Detalles">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn-accion modificar" data-id="${empresa.id_empresa}" title="Modificar">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="btn-accion eliminar" data-id="${empresa.id_empresa}" title="Eliminar">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    // --- 3. Helper para crear bloques de contacto ---
    // (Esta función "ayudante" no necesita cambios)
    function anadirBloqueContacto(container, contacto = {}) {
        const bloqueId = `contacto-${Date.now()}-${Math.floor(Math.random() * 100)}`;
        const bloqueDiv = document.createElement('div');
        bloqueDiv.className = 'contacto-block';
        bloqueDiv.id = bloqueId;
        
        // --- CAMBIO BD ---
        // Usamos los nombres de columna de la BD: 'nombre', 'email', 'telefono'
        // (El `contacto.nombre || ''` ya funciona)
        bloqueDiv.innerHTML = `
            <div class="contacto-block-label">
                ${container.children.length === 0 ? 'Contacto Principal' : 'Contacto Adicional'}
            </div>
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
            </div>
        `;
        container.appendChild(bloqueDiv);
    }

    // --- 4. Abrir Modal (Añadir o Modificar) ---
    // ¡Esta función ahora es 'async' porque necesita cargar datos!
    async function abrirModalForm(modo, id = null) {
        modalFormPlaceholder.innerHTML = modalFormHTML;

        const form = document.getElementById("form-empresa-nueva");
        const titulo = document.getElementById("modal-titulo");
        const btnGuardar = document.getElementById("btn-guardar-empresa");
        const formMode = document.getElementById("form-mode");
        const empresaIdEdit = document.getElementById("empresa-id-edit");
        const contactosList = document.getElementById("contactos-list");
        const btnAnadirContacto = document.getElementById("btn-add-contacto");

        if (modo === 'modificar') {
            titulo.textContent = "Modificar Empresa";
            btnGuardar.textContent = "Guardar Cambios";
            formMode.value = "modificar";
            empresaIdEdit.value = id;

            // --- CAMBIO BD ---
            // En lugar de buscar en 'datosCombinados', le pedimos al PHP
            // los datos completos de ESTA empresa (empresa + TODOS sus contactos).
            try {
                const url = `${API_URL}?accion=leer_uno&id=${id}`;
                const resp = await fetch(url);
                const data = await resp.json();

                if (!data.empresa) throw new Error('No se encontró la empresa.');

                const empresa = data.empresa;
                const contactos = data.contactos;

                // Rellena el formulario con los datos de la empresa
                document.getElementById("emp-nombre-comercial").value = empresa.nombre_comercial;
                document.getElementById("emp-razon-social").value = empresa.razon_social;
                document.getElementById("emp-tipo").value = empresa.tipo;
                document.getElementById("emp-ruta").value = empresa.id_ruta;
                document.getElementById("emp-direccion").value = empresa.direccion;

                // Rellena los contactos que ya tiene
                if (contactos.length > 0) {
                    contactos.forEach(contacto => {
                        anadirBloqueContacto(contactosList, contacto);
                    });
                } else {
                    anadirBloqueContacto(contactosList); // Añade uno vacío si no hay
                }

            } catch (error) {
                console.error("Error al cargar datos para modificar:", error);
                alert("No se pudieron cargar los datos de la empresa. Intente de nuevo.");
                cerrarModalForm();
            }

        } else { // modo === 'anadir'
            titulo.textContent = "Añadir Nueva Empresa";
            btnGuardar.textContent = "Guardar Empresa";
            formMode.value = "anadir";
            anadirBloqueContacto(contactosList);
        }

        // --- Listeners de DENTRO del modal ---
        // (Esta lógica no cambia)
        btnAnadirContacto.addEventListener("click", () => {
            anadirBloqueContacto(contactosList);
        });
        contactosList.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-remove-contacto")) {
                e.target.closest(".contacto-block").remove();
                const primerBloque = contactosList.querySelector(".contacto-block:first-child");
                if (primerBloque) {
                    primerBloque.querySelector(".contacto-block-label").textContent = "Contacto Principal";
                }
            }
        });
        document.getElementById("modal-close-btn").addEventListener("click", cerrarModalForm);
        form.addEventListener("submit", manejarSubmitEmpresa); // Llama a la nueva función de guardado
    }

    // --- 5. Cerrar Modal ---
    function cerrarModalForm() {
        modalFormPlaceholder.innerHTML = ""; 
    }

    // --- 6. Guardar Formulario (¡AHORA ES REAL!) ---
    // Esta función se activa cuando das clic en "Guardar"
    async function manejarSubmitEmpresa(e) {
        e.preventDefault(); 
        const modo = document.getElementById("form-mode").value;
        const btnGuardar = document.getElementById("btn-guardar-empresa");
        btnGuardar.disabled = true; // Deshabilita el botón para evitar doble clic
        btnGuardar.textContent = "Guardando...";

        // 1. Recolecta datos de la Empresa
        const empresaData = {
            "nombre_comercial": document.getElementById("emp-nombre-comercial").value,
            "razon_social": document.getElementById("emp-razon-social").value,
            tipo: document.getElementById("emp-tipo").value,
            id_ruta: document.getElementById("emp-ruta").value,
            direccion: document.getElementById("emp-direccion").value
            // La fecha_creacion la pondrá el PHP/BD
        };

        // Si es modo "modificar", añade el ID de la empresa
        if (modo === 'modificar') {
            empresaData.id_empresa = document.getElementById("empresa-id-edit").value;
        }

        // 2. Recolecta lista de Contactos
        const contactosData = []; 
        const bloquesDeContacto = document.querySelectorAll("#contactos-list .contacto-block");
        
        bloquesDeContacto.forEach(bloque => {
            const nombre = bloque.querySelector(".cont-nombre").value;
            const email = bloque.querySelector(".cont-email").value;
            
            if (nombre && email) { // Solo guarda si tiene nombre y email
                contactosData.push({
                    id_contacto: bloque.querySelector(".cont-id").value, // Será '' si es nuevo
                    nombre: nombre,
                    email: email,
                    telefono: bloque.querySelector(".cont-telefono").value
                });
            }
        });

        if (contactosData.length === 0) {
            alert("Debes añadir al menos un contacto válido (con nombre y email).");
            btnGuardar.disabled = false;
            btnGuardar.textContent = (modo === 'anadir') ? "Guardar Empresa" : "Guardar Cambios";
            return; 
        }

        // --- CAMBIO BD ---
        // 3. Enviar los datos al PHP
        try {
            const body = {
                modo: modo,
                empresa: empresaData,
                contactos: contactosData
            };
            
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body) // Envía todo en un solo JSON
            });

            const resultado = await resp.json();

            if (resultado.success) {
                alert(resultado.message || "¡Guardado con éxito!");
                cerrarModalForm();
                cargarDatosIniciales(); // Recarga la tabla con los datos frescos de la BD
            } else {
                throw new Error(resultado.error || "Error desconocido al guardar.");
            }

        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar: " + error.message);
            btnGuardar.disabled = false;
            btnGuardar.textContent = (modo === 'anadir') ? "Guardar Empresa" : "Guardar Cambios";
        }
    }


    // --- 7. Eliminar Empresa (¡AHORA ES REAL!) ---
    async function eliminarEmpresa(id) {
        // Busca el nombre en los datos locales para el confirm
        const empresa = datosCombinados.find(e => e.id_empresa == id);
        const nombre = empresa ? empresa.nombre_comercial : `ID ${id}`;
        
        if (confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) {
            
            // --- CAMBIO BD ---
            // 3. Enviar la orden de eliminar al PHP
            try {
                const body = {
                    modo: 'eliminar',
                    id_empresa: id
                };

                const resp = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const resultado = await resp.json();

                if (resultado.success) {
                    alert(resultado.message || "Empresa eliminada.");
                    cargarDatosIniciales(); // Recarga la tabla
                } else {
                    throw new Error(resultado.error || "Error desconocido al eliminar.");
                }

            } catch (error) {
                console.error("Error al eliminar:", error);
                alert("Error al eliminar: " + error.message);
            }
        }
    }


    // --- Event Listeners Principales ---
    
    // --- CAMBIO BD ---
    // El formulario de búsqueda ahora llama a la BD
    formBusqueda.addEventListener("submit", (e) => {
        e.preventDefault();
        cargarDatosIniciales(inputBusqueda.value);
    });
    // (Opcional: puedes hacer que busque mientras escribe,
    // pero puede hacer muchas llamadas a la BD)
    // inputBusqueda.addEventListener("keyup", () => {
    //     cargarDatosIniciales(inputBusqueda.value);
    // });
    
    // Activa el botón "+ Añadir Nuevo"
    btnAnadirNuevo.addEventListener("click", () => {
        abrirModalForm('anadir');
    });

    // "Escuchador" para los botones de la tabla (Ver, Modificar, Eliminar)
    tablaBody.addEventListener("click", (e) => {
        const verBtn = e.target.closest(".ver");
        const modBtn = e.target.closest(".modificar");
        const delBtn = e.target.closest(".eliminar");

        if (verBtn) {
            // 'id_empresa' porque así se llama en la BD
            window.open(`perfil.html?id=${verBtn.dataset.id}`, '_blank');
            return;
        }
        if (modBtn) {
            abrirModalForm('modificar', modBtn.dataset.id);
            return;
        }
        if (delBtn) {
            eliminarEmpresa(delBtn.dataset.id);
            return;
        }
    });

    // --- Carga Inicial ---
    // ¡Aquí empieza todo! Llama a la función que carga los datos de la BD.
    cargarDatosIniciales();
});