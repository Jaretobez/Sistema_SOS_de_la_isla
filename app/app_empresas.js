// Espera a que la página HTML se cargue por completo antes de hacer nada.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Rutas de la API ---
    // CORRECCIÓN 1: Desde 'app/', subimos un nivel (../) y entramos a 'api/'.
    const API_URL = '../api/empresas_api.php'; 

    // --- Selectores del DOM ---
    const tablaBody = document.getElementById("tabla-body");
    const noResultados = document.getElementById("no-resultados");
    const formBusqueda = document.getElementById("form-busqueda");
    const inputBusqueda = document.getElementById("busqueda");
    const btnAnadirNuevo = document.getElementById("btn-anadir-nuevo");
    const modalFormPlaceholder = document.getElementById("modal-form-placeholder");
    const modalViewPlaceholder = document.getElementById("modal-view-placeholder");

    // --- Almacenes de Datos ---
    let datosCombinados = []; 
    let modalFormHTML = ""; // Caché para el HTML del formulario

    // --- 1. Carga Inicial ---
    async function cargarDatosIniciales(terminoBusqueda = "") {
        try {
            // 🛑 COMPROBACIÓN CLAVE: Aseguramos que el HTML del modal se cargue correctamente.
            const respModalForm = await fetch("../html/modal_empresa_form.html");
            if (!respModalForm.ok) {
                 throw new Error(`Error al cargar el archivo de formulario (modal_empresa_form.html): ${respModalForm.statusText}`);
            }
            modalFormHTML = await respModalForm.text(); // Guarda el HTML del formulario.

            // Ahora, hacemos la "llamada" (fetch) a nuestro archivo PHP.
            // La acción es 'leer_empresas' como se acordó.
            const url = `${API_URL}?accion=leer_empresas&termino=${encodeURIComponent(terminoBusqueda)}`;
            const respDatos = await fetch(url);
            
            if (!respDatos.ok) {
                // Captura el error HTTP (404, 500, etc.)
                throw new Error(`Error en el servidor: ${respDatos.statusText}`);
            }

            const datosDesdePHP = await respDatos.json();
            
            if (!datosDesdePHP.success || !Array.isArray(datosDesdePHP.data)) {
                // Captura el error devuelto por el JSON de PHP
                throw new Error(datosDesdePHP.error || "Formato de datos inválido desde la API.");
            }

            // Guardamos los datos recibidos (el API de empresas ya devuelve {success: true, data: []})
            datosCombinados = datosDesdePHP.data;

            // Llama a la función para "dibujar" la tabla con los datos listos.
            renderizarTabla(datosCombinados);

        } catch (error) {
            // Si algo falla al cargar, lo muestra en la consola y en la página.
            console.error("Error al cargar datos iniciales:", error);
            noResultados.textContent = `Error al cargar los datos: ${error.message}`;
            noResultados.style.display = "block";
        }
    }

    // --- 2. Renderizar Tabla (Corregida la columna Teléfono) ---
    function renderizarTabla(empresas) {
        tablaBody.innerHTML = ""; 
        noResultados.style.display = empresas.length === 0 ? "block" : "none";

        empresas.forEach(empresa => {
            const tr = document.createElement("tr"); 
            
            // 🟢 Data-labels para responsivo 🟢
            tr.innerHTML = `
                <td data-label="Empresa">
                    <strong>${empresa.nombre_comercial}</strong>
                    <div class="razon-social">${empresa.razon_social || ''}</div>
                </td>
                <td data-label="Contacto">${empresa.contacto_nombre || '—'}</td>
                <td data-label="Email">${empresa.contacto_email ? `<a href="mailto:${empresa.contacto_email}">${empresa.contacto_email}</a>` : '—'}</td>
                
                <td data-label="Teléfono">${empresa.contacto_telefono || '—'}</td>
                
                <td data-label="Acciones">
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

    // --- 3. Helper para crear bloques de contacto (Sin cambios) ---
    function anadirBloqueContacto(container, contacto = {}) {
        const bloqueId = `contacto-${Date.now()}-${Math.floor(Math.random() * 100)}`;
        const bloqueDiv = document.createElement('div');
        bloqueDiv.className = 'contacto-block';
        bloqueDiv.id = bloqueId;
        
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
    async function abrirModalForm(modo, id = null) {
        // Validación: Si el HTML del formulario no se cargó, no podemos abrirlo.
        if (!modalFormHTML) {
            alert("Error: No se pudo cargar la plantilla del formulario. Revise la consola (F12) para ver el error de carga inicial.");
            return;
        }
        
        // En lugar de innerHTML = modalFormHTML, envolvemos el formulario
        // en un div para que CSS lo pueda estilizar como modal content.
        modalFormPlaceholder.innerHTML = `<div>${modalFormHTML}</div>`; 

        const form = document.getElementById("form-empresa-nueva");
        const titulo = document.getElementById("modal-titulo");
        const btnGuardar = document.getElementById("btn-guardar-empresa");
        const formMode = document.getElementById("form-mode");
        const empresaIdEdit = document.getElementById("empresa-id-edit");
        const contactosList = document.getElementById("contactos-list");
        const btnAnadirContacto = document.getElementById("btn-add-contacto");
        
        // 🟢 MOSTRAR MODAL 🟢
        modalFormPlaceholder.classList.add('active'); 
        
        if (modo === 'modificar') {
            titulo.textContent = "Modificar Empresa";
            btnGuardar.textContent = "Guardar Cambios";
            formMode.value = "modificar";
            empresaIdEdit.value = id;

            // 🟢 El fetch llama a 'leer_perfil'
            try {
                const url = `${API_URL}?accion=leer_perfil&id=${id}`; 
                const resp = await fetch(url);
                
                if (!resp.ok) {
                    throw new Error(`Error en el servidor al leer perfil: ${resp.statusText}`);
                }
                
                const data = await resp.json();

                if (!data.success || !data.empresa) {
                    throw new Error(data.error || 'No se encontró la empresa o la API devolvió un error.');
                }

                const empresa = data.empresa;
                const contactos = data.contactos;

                // Rellena el formulario con los datos de la empresa
                document.getElementById("emp-nombre-comercial").value = empresa.nombre_comercial;
                document.getElementById("emp-razon-social").value = empresa.razon_social;
                document.getElementById("emp-tipo").value = empresa.tipo || '';
                document.getElementById("emp-ruta").value = empresa.id_ruta || '';
                document.getElementById("emp-direccion").value = empresa.direccion || '';

                // Rellena los contactos que ya tiene
                if (contactos && contactos.length > 0) {
                    contactos.forEach(contacto => {
                        anadirBloqueContacto(contactosList, contacto);
                    });
                } else {
                    anadirBloqueContacto(contactosList); 
                }

            } catch (error) {
                console.error("Error al cargar datos para modificar:", error);
                // 🛑 CORRECCIÓN: Si falla la carga de datos, cerramos el modal.
                cerrarModalForm(); 
                alert("No se pudieron cargar los datos de la empresa. Revise la consola (F12) para detalles.");
                return;
            }

        } else { // modo === 'anadir'
            titulo.textContent = "Añadir Nueva Empresa";
            btnGuardar.textContent = "Guardar Empresa";
            formMode.value = "anadir";
            anadirBloqueContacto(contactosList);
        }

        // --- Listeners de DENTRO del modal ---
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
        // 🟢 OCULTAR MODAL 🟢
        modalFormPlaceholder.classList.remove('active'); 
        // Limpiamos el contenido después de la transición
        setTimeout(() => {
            modalFormPlaceholder.innerHTML = ""; 
        }, 300); // 300ms debe coincidir con la duración de la transición CSS.
    }

    // --- 6. Guardar Formulario (Sin cambios) ---
    async function manejarSubmitEmpresa(e) {
        e.preventDefault(); 
        const modo = document.getElementById("form-mode").value;
        const btnGuardar = document.getElementById("btn-guardar-empresa");
        btnGuardar.disabled = true; 
        btnGuardar.textContent = "Guardando...";

        // 1. Recolecta datos de la Empresa
        const empresaData = {
            "nombre_comercial": document.getElementById("emp-nombre-comercial").value,
            "razon_social": document.getElementById("emp-razon-social").value,
            tipo: document.getElementById("emp-tipo").value,
            id_ruta: document.getElementById("emp-ruta").value,
            direccion: document.getElementById("emp-direccion").value
        };

        if (modo === 'modificar') {
            empresaData.id_empresa = document.getElementById("empresa-id-edit").value;
        }

        // 2. Recolecta lista de Contactos
        const contactosData = []; 
        const bloquesDeContacto = document.querySelectorAll("#contactos-list .contacto-block");
        
        bloquesDeContacto.forEach(bloque => {
            const nombre = bloque.querySelector(".cont-nombre").value;
            const email = bloque.querySelector(".cont-email").value;
            const telefono = bloque.querySelector(".cont-telefono").value; 
            const cargo = bloque.querySelector(".cont-cargo") ? bloque.querySelector(".cont-cargo").value : null; 
            
            if (nombre && email) { 
                contactosData.push({
                    id_contacto: bloque.querySelector(".cont-id").value, 
                    nombre: nombre,
                    email: email,
                    telefono: telefono,
                    cargo: cargo 
                });
            }
        });

        if (contactosData.length === 0) {
            alert("Debes añadir al menos un contacto válido (con nombre y email).");
            btnGuardar.disabled = false;
            btnGuardar.textContent = (modo === 'anadir') ? "Guardar Empresa" : "Guardar Cambios";
            return; 
        }

        // 3. Enviar los datos al PHP
        try {
            const body = {
                modo: (modo === 'anadir' ? 'crear_empresa' : 'editar_empresa'),
                empresa: empresaData,
                contactos: contactosData 
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
                alert(resultado.message || "¡Guardado con éxito!");
                cerrarModalForm();
                cargarDatosIniciales(); // Recarga la tabla con los datos frescos de la BD
            } else {
                throw new Error(resultado.error || "Error desconocido al guardar.");
            }

        } catch (error) {
            console.error("Error al guardar:", error);
            let errorMessage = error.message;
            try {
                const errorJson = JSON.parse(errorMessage);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                // No es JSON, usa el mensaje simple
            }
            
            alert("Error al guardar: " + errorMessage);
            btnGuardar.disabled = false;
            btnGuardar.textContent = (modo === 'anadir') ? "Guardar Empresa" : "Guardar Cambios";
        }
    }


    // --- 7. Eliminar Empresa (Sin cambios) ---
    async function eliminarEmpresa(id) {
        const empresa = datosCombinados.find(e => e.id_empresa == id);
        const nombre = empresa ? empresa.nombre_comercial : `ID ${id}`;
        
        if (confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) {
            
            try {
                const body = {
                    modo: 'eliminar_empresa',
                    id_empresa: id
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
                    alert(resultado.message || "Empresa eliminada.");
                    cargarDatosIniciales(); // Recarga la tabla
                } else {
                    throw new Error(resultado.error || "Error desconocido al eliminar.");
                }

            } catch (error) {
                let errorMessage = error.message;
                try {
                    const errorJson = JSON.parse(errorMessage);
                    errorMessage = errorJson.error || errorMessage;
                } catch (e) {}
                
                console.error("Error al eliminar:", error);
                alert("Error al eliminar: " + errorMessage);
            }
        }
    }


    // --- Event Listeners Principales ---
    
    // El formulario de búsqueda ahora llama a la BD
    formBusqueda.addEventListener("submit", (e) => {
        e.preventDefault();
        cargarDatosIniciales(inputBusqueda.value);
    });
    
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
            window.open(`../html/perfil.html?id=${verBtn.dataset.id}`, '_blank'); // Corregida la ruta
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
    cargarDatosIniciales();
});