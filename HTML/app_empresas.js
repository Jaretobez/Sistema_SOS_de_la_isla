// Espera a que la página HTML se cargue por completo antes de hacer nada.
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Selectores del DOM ---
    // Aquí "agarramos" los elementos del HTML para poder usarlos después.
    // Es como guardar los botones y la tabla en variables.
    const tablaBody = document.getElementById("tabla-body"); // El cuerpo de la tabla
    const noResultados = document.getElementById("no-resultados"); // El mensaje de "No se encontraron"
    const formBusqueda = document.getElementById("form-busqueda"); // El formulario de búsqueda
    const inputBusqueda = document.getElementById("busqueda"); // El campo para escribir la búsqueda
    const btnAnadirNuevo = document.getElementById("btn-anadir-nuevo"); // El botón "+ Añadir Nuevo"
    const modalFormPlaceholder = document.getElementById("modal-form-placeholder"); // Div vacío para el modal de Añadir/Editar
    const modalViewPlaceholder = document.getElementById("modal-view-placeholder"); // Div vacío para el modal de "Ver" (aunque no se usa aquí)

    // --- Almacenes de Datos ---
    // Variables vacías que usaremos para guardar los datos que descarguemos.
    let datosCombinados = []; // Aquí guardaremos la lista de empresas CON sus contactos.
    let modalFormHTML = ""; // Aquí guardaremos el HTML del formulario para reusarlo.

    // --- 1. Carga Inicial ---
    // Esta función se ejecuta apenas carga la página para traer los datos.
    async function cargarDatosIniciales() {
        try {
            // Pide 3 archivos al mismo tiempo y espera a que lleguen todos.
            const [respEmpresas, respContactos, respModalForm] = await Promise.all([
                
                // =======================================================================
                // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (EN EL BACKEND)
                // =======================================================================
                //
                // Estas 2 líneas `fetch` piden archivos .json (son "datos de prueba").
                // En la versión real, deben llamar a tus archivos PHP (tu API).
                //
                // Ejemplo:
                // fetch("api/traer_empresas.php"),
                // fetch("api/traer_contactos.php"),
                //
                // Esos archivos PHP son los que DEBEN tener la CONEXIÓN A LA BD
                // para hacer el SELECT y devolver los datos en formato JSON.
                //
                fetch("empresas.json"),
                fetch("contactos.json"),
                
                // Esta línea carga el HTML del formulario (esto está bien así).
                fetch("modal_empresa_form.html")
            ]);

            // Convierte las respuestas en datos que JavaScript entiende.
            const empresas = await respEmpresas.json();
            const contactos = await respContactos.json();
            modalFormHTML = await respModalForm.text(); // Guarda el HTML del formulario.

            // Organiza los contactos: crea un "mapa" donde cada ID de empresa
            // tiene su propia lista de contactos.
            const contactosPorEmpresa = contactos.reduce((acc, contacto) => {
                const idEmp = contacto["id empresa"];
                if (!acc[idEmp]) acc[idEmp] = [];
                acc[idEmp].push(contacto);
                return acc;
            }, {});

            // Combina los datos: Junta cada empresa con su lista de contactos.
            datosCombinados = empresas.map(empresa => ({
                ...empresa, // Copia los datos de la empresa
                contactos: contactosPorEmpresa[empresa.idempresa] || [], // Le añade su lista de contactos
                contactoPrincipal: (contactosPorEmpresa[empresa.idempresa] || [])[0] || null // Pone el primer contacto como "principal"
            }));

            // Llama a la función para "dibujar" la tabla con los datos listos.
            renderizarTabla(datosCombinados);

        } catch (error) {
            // Si algo falla al cargar, lo muestra en la consola y en la página.
            console.error("Error al cargar datos iniciales:", error);
            noResultados.textContent = "Error al cargar los datos. Revisa la consola (F12).";
            noResultados.style.display = "block";
        }
    }

    // --- 2. Renderizar Tabla ---
    // Esta función "dibuja" los datos en la tabla HTML.
    function renderizarTabla(empresas) {
        tablaBody.innerHTML = ""; // Limpia la tabla por si tenía filas viejas.
        
        // Si no hay empresas, muestra el mensaje "No se encontraron resultados".
        noResultados.style.display = empresas.length === 0 ? "block" : "none";

        // Recorre la lista de empresas una por una.
        empresas.forEach(empresa => {
            const tr = document.createElement("tr"); // Crea una fila <tr>
            const contacto = empresa.contactoPrincipal; // Agarra el contacto principal

            // Rellena la fila con los datos de la empresa y los botones.
            tr.innerHTML = `
                <td>
                    <strong>${empresa["nombre comercial"]}</strong>
                    <div class="razon-social">${empresa["razon social"]}</div>
                </td>
                <td>${contacto ? contacto.nombre : '—'}</td>
                <td>${contacto ? `<a href="mailto:${contacto.email}">${contacto.email}</a>` : '—'}</td>
                <td>${contacto ? contacto.telefono : '—'}</td>
                <td>
                    <button class="btn-accion ver" data-id="${empresa.idempresa}" title="Ver Detalles">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn-accion modificar" data-id="${empresa.idempresa}" title="Modificar">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="btn-accion eliminar" data-id="${empresa.idempresa}" title="Eliminar">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            `;
            // Añade la fila nueva a la tabla.
            tablaBody.appendChild(tr);
        });
    }

    // --- 3. Filtrar Tabla (Sin 'estado') ---
    // Esta función se activa cada vez que escribes en el buscador.
    function filtrarYRenderizar() {
        const termino = inputBusqueda.value.toLowerCase(); // Lo que escribiste (en minúsculas)
        
        // Filtra la lista de empresas
        const filtrados = datosCombinados.filter(item => {
            // Revisa si el término de búsqueda está en el nombre, razón social, contacto o email.
            const matchTermino = 
                item["nombre comercial"].toLowerCase().includes(termino) ||
                (item["razon social"] && item["razon social"].toLowerCase().includes(termino)) ||
                (item.contactoPrincipal && item.contactoPrincipal.nombre.toLowerCase().includes(termino)) ||
                (item.contactoPrincipal && item.contactoPrincipal.email.toLowerCase().includes(termino));

            return matchTermino;
        });
        
        // Vuelve a "dibujar" la tabla, pero solo con los resultados filtrados.
        renderizarTabla(filtrados);
    }

    // --- 4. Helper para crear bloques de contacto ---
    // Esta es una función "ayudante" para crear el HTML del formulario de un contacto.
    function anadirBloqueContacto(container, contacto = {}) {
        const bloqueId = `contacto-${Date.now()}-${Math.floor(Math.random() * 100)}`; // ID único
        const bloqueDiv = document.createElement('div');
        bloqueDiv.className = 'contacto-block';
        bloqueDiv.id = bloqueId;

        // Si es el primer contacto, pone "Contacto Principal".
        // Si no, pone "Contacto Adicional" y un botón de borrar (X).
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
            </div>
        `;
        
        // Añade el bloque de contacto al formulario (en el modal).
        container.appendChild(bloqueDiv);
    }

    // --- 5. Abrir Modal (Añadir o Modificar) ---
    // Esta función abre la ventana emergente (modal).
    function abrirModalForm(modo, id = null) {
        // "Inyecta" el HTML del formulario (que cargamos al inicio) en la página.
        modalFormPlaceholder.innerHTML = modalFormHTML;

        // Agarra los elementos de DENTRO del modal
        const form = document.getElementById("form-empresa-nueva");
        const titulo = document.getElementById("modal-titulo");
        const btnGuardar = document.getElementById("btn-guardar-empresa");
        const formMode = document.getElementById("form-mode"); // Campo oculto que dice si es 'añadir' o 'modificar'
        const empresaIdEdit = document.getElementById("empresa-id-edit"); // Campo oculto para guardar el ID a editar
        
        const contactosList = document.getElementById("contactos-list"); // El div que contendrá los bloques de contacto
        const btnAnadirContacto = document.getElementById("btn-add-contacto"); // Botón "+ Añadir Otro Contacto"

        if (modo === 'modificar') {
            // Si es modo "Modificar"...
            titulo.textContent = "Modificar Empresa";
            btnGuardar.textContent = "Guardar Cambios";
            formMode.value = "modificar";
            empresaIdEdit.value = id;

            // Busca la empresa que queremos modificar
            const empresa = datosCombinados.find(e => e.idempresa == id);
            if (empresa) {
                // Rellena el formulario con los datos de la empresa
                document.getElementById("emp-nombre-comercial").value = empresa["nombre comercial"];
                document.getElementById("emp-razon-social").value = empresa["razon social"];
                document.getElementById("emp-tipo").value = empresa.tipo;
                document.getElementById("emp-ruta").value = empresa.id_ruta;
                document.getElementById("emp-direccion").value = empresa.direccion;

                // Rellena los contactos que ya tiene
                if (empresa.contactos.length > 0) {
                    empresa.contactos.forEach(contacto => {
                        anadirBloqueContacto(contactosList, contacto); // Llama al "ayudante"
                    });
                } else {
                    anadirBloqueContacto(contactosList); // Si no tiene, añade un bloque vacío
                }
            }
        } else { // modo === 'anadir'
            // Si es modo "Añadir"...
            titulo.textContent = "Añadir Nueva Empresa";
            btnGuardar.textContent = "Guardar Empresa";
            formMode.value = "anadir";
            
            // Añade un bloque de contacto vacío para empezar
            anadirBloqueContacto(contactosList);
        }

        // --- Listeners de DENTRO del modal ---
        
        // Activa el botón "+ Añadir Otro Contacto"
        btnAnadirContacto.addEventListener("click", () => {
            anadirBloqueContacto(contactosList);
        });

        // Activa los botones (X) para borrar contactos
        contactosList.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-remove-contacto")) {
                e.target.closest(".contacto-block").remove(); // Borra el bloque
                
                // Revisa si el primer bloque sigue ahí y le pone "Contacto Principal"
                const primerBloque = contactosList.querySelector(".contacto-block:first-child");
                if (primerBloque) {
                    primerBloque.querySelector(".contacto-block-label").textContent = "Contacto Principal";
                }
            }
        });

        // Activa el botón de cerrar (X) y el de guardar
        document.getElementById("modal-close-btn").addEventListener("click", cerrarModalForm);
        form.addEventListener("submit", manejarSubmitEmpresa);
    }

    // --- 6. Cerrar Modal (Añadir o Modificar) ---
    function cerrarModalForm() {
        modalFormPlaceholder.innerHTML = ""; // Simplemente borra el HTML del modal
    }

    // --- 7. Guardar Formulario (Simulado) ---
    // Esta función se activa cuando das clic en "Guardar"
    function manejarSubmitEmpresa(e) {
        e.preventDefault(); // Evita que la página se recargue
        const modo = document.getElementById("form-mode").value; // Revisa si era 'añadir' o 'modificar'

        // 1. Recolecta los datos de la Empresa del formulario
        const empresaData = {
            "nombre comercial": document.getElementById("emp-nombre-comercial").value,
            "razon social": document.getElementById("emp-razon-social").value,
            tipo: document.getElementById("emp-tipo").value,
            id_ruta: document.getElementById("emp-ruta").value,
            direccion: document.getElementById("emp-direccion").value,
            "fecha creacion": new Date().toISOString()
        };

        // 2. Recolecta la lista de Contactos
        const contactosData = []; // Una lista vacía
        const bloquesDeContacto = document.querySelectorAll("#contactos-list .contacto-block");
        
        // Recorre cada bloque de contacto que exista
        bloquesDeContacto.forEach(bloque => {
            const nombre = bloque.querySelector(".cont-nombre").value;
            const email = bloque.querySelector(".cont-email").value;
            const telefono = bloque.querySelector(".cont-telefono").value;

            // Solo guarda el contacto si tiene nombre y email
            if (nombre && email) {
                contactosData.push({
                    nombre: nombre,
                    email: email,
                    telefono: telefono,
                    "fecha de creacion": new Date().toISOString()
                });
            }
        });

        // Si no puso ni un contacto válido, le avisa y no guarda.
        if (contactosData.length === 0) {
            alert("Debes añadir al menos un contacto válido (con nombre y email).");
            return; 
        }

        // 3. Simular el guardado (AQUÍ IRÍA LA CONEXIÓN)
        if (modo === 'anadir') {
            // =======================================================================
            // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (EN EL BACKEND)
            // =======================================================================
            //
            // Esta parte simula un "AÑADIR NUEVO" (INSERT)
            // En lugar de 'console.log', aquí deberías enviar 'empresaData' y 'contactosData'
            // a tu archivo PHP (ej: 'api/guardar_empresa.php').
            //
            // Ese PHP DEBE tener la CONEXIÓN A LA BD para hacer el INSERT
            // de la empresa, obtener su nuevo ID, y luego hacer el INSERT
            // de todos los contactos en 'contactosData' asociándolos a ese ID.
            //
            empresaData.idempresa = `E-${Date.now()}`; // ID de prueba
            console.log("--- AÑADIENDO (Simulado) ---");
            console.log("Empresa:", empresaData);
            console.log("Contactos:", contactosData); 
            alert("Empresa añadida (ver consola F12).");
        
        } else { // modo === 'modificar'
            // =======================================================================
            // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (EN EL BACKEND)
            // =======================================================================
            //
            // Esta parte simula un "MODIFICAR" (UPDATE)
            // Aquí deberías enviar 'empresaData' y 'contactosData' (junto con el ID)
            // a tu archivo PHP (ej: 'api/modificar_empresa.php').
            //
            // Ese PHP DEBE tener la CONEXIÓN A LA BD para hacer el UPDATE
            // de la empresa, y luego manejar los contactos (borrar los viejos
            // e insertar los nuevos, o una lógica más compleja de UPDATE/INSERT).
            //
            const id = document.getElementById("empresa-id-edit").value;
            empresaData.idempresa = id;
            
            console.log(`--- MODIFICANDO (Simulado) ID: ${id} ---`);
            console.log("Empresa:", empresaData);
            console.log("Contactos:", contactosData);
            alert("Empresa modificada (ver consola F12).");
        }

        cerrarModalForm(); // Cierra el modal
        // Para ver el cambio, lo ideal sería recargar los datos desde la BD
        // cargarDatosIniciales(); 
    }


    // --- 10. Eliminar Empresa (Simulado) ---
    function eliminarEmpresa(id) {
        const empresa = datosCombinados.find(e => e.idempresa == id);
        // Pide confirmación antes de borrar
        if (confirm(`¿Estás seguro de que deseas eliminar a "${empresa["nombre comercial"]}"?`)) {
            
            // =======================================================================
            // AQUÍ ES DONDE DEBE IR LA CONEXIÓN (EN EL BACKEND)
            // =======================================================================
            //
            // Esta parte simula un "ELIMINAR" (DELETE)
            // Aquí deberías llamar a tu archivo PHP (ej: 'api/borrar_empresa.php?id=' + id)
            //
            // Ese PHP DEBE tener la CONEXIÓN A LA BD para hacer el DELETE
            // de la empresa (y la BD debería borrar sus contactos en "cascada").
            //
            console.log(`--- ELIMINANDO (Simulado) ID: ${id} ---`);
            
            // Esto es solo para simularlo en la página sin recargar
            datosCombinados = datosCombinados.filter(e => e.idempresa != id);
            renderizarTabla(datosCombinados); // Vuelve a dibujar la tabla sin la empresa
            
            alert("Empresa eliminada (simulado).");
        }
    }


    // --- Event Listeners Principales ---
    // "Activa" los botones y buscadores que están fijos en la página.
    
    // Evita que el formulario de búsqueda recargue la página
    formBusqueda.addEventListener("submit", (e) => e.preventDefault());
    // Llama a la función 'filtrar' cada vez que escribes algo
    inputBusqueda.addEventListener("keyup", filtrarYRenderizar);
    
    // Activa el botón "+ Añadir Nuevo" para que abra el modal
    btnAnadirNuevo.addEventListener("click", () => {
        abrirModalForm('anadir'); // Llama al modal en modo 'añadir'
    });

    // "Escuchador" inteligente para los botones de la tabla
    // (Escucha en la tabla, pero reacciona al botón que aprietes)
    tablaBody.addEventListener("click", (e) => {
        // Revisa qué botón fue el que se apretó (o si se apretó el icono de adentro)
        const verBtn = e.target.closest(".ver");
        const modBtn = e.target.closest(".modificar");
        const delBtn = e.target.closest(".eliminar");

        if (verBtn) {
            // Si fue "Ver", abre el perfil en una pestaña nueva
            window.open(`perfil.html?id=${verBtn.dataset.id}`, '_blank');
            return;
        }
        if (modBtn) {
            // Si fue "Modificar", abre el modal en modo 'modificar'
            abrirModalForm('modificar', modBtn.dataset.id);
            return;
        }
        if (delBtn) {
            // Si fue "Eliminar", llama a la función de borrar
            eliminarEmpresa(delBtn.dataset.id);
            return;
        }
    });

    // --- Carga Inicial ---
    // ¡Aquí empieza todo! Llama a la función que carga los datos.
    cargarDatosIniciales();
});