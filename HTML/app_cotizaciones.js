// Espera a que todo el contenido HTML se haya cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {

    // --- Almacenes de Datos ---
    // Guardarán los datos de los JSON para usarlos en toda la app
    let datosCombinados = []; // Almacena empresas + sus contactos anidados
    let listaProductos = [];    // Almacena el 'catálogo' de productos/servicios
    let listaCotizaciones = []; // Almacena las cotizaciones generadas
    let modalHTML = "";         // Almacena el HTML del modal de creación para reutilizarlo

    // --- Selectores del DOM (Pestañas) ---
    // Referencias a los botones de pestañas y sus contenidos
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    // --- Selectores Pestaña 1 (Crear) ---
    // Referencias a elementos de la primera pestaña (búsqueda de clientes)
    const formBusquedaClientes = document.getElementById("form-busqueda-clientes");
    const inputBusquedaClientes = document.getElementById("busqueda-clientes");
    const tablaClientesBody = document.getElementById("tabla-clientes-body");
    const noResultadosClientes = document.getElementById("no-resultados-clientes");
    const modalPlaceholder = document.getElementById("modal-placeholder"); // Contenedor del modal de 'Crear'

    // --- Selectores Pestaña 2 (Guardadas) ---
    // Referencias a elementos de la segunda pestaña (historial de cotizaciones)
    const formBusquedaCotizaciones = document.getElementById("form-busqueda-cotizaciones");
    const inputBusquedaCotizaciones = document.getElementById("busqueda-cotizaciones");
    const filtroEstadoCotizacion = document.getElementById("filtro-estado-cotizacion");
    const tablaCotizacionesBody = document.getElementById("tabla-cotizaciones-body");
    const noResultadosCotizaciones = document.getElementById("no-resultados-cotizaciones");
    const modalViewPlaceholder = document.getElementById("modal-view-placeholder"); // Contenedor del modal de 'Ver'


    // --- 1. Carga Inicial de TODOS los datos ---
    // Esta función se ejecuta una vez al cargar la página.
    async function cargarDatosIniciales() {
        try {
            // Carga todos los archivos JSON y el HTML del modal en paralelo
            const [
                respEmpresas,
                respContactos,
                respProductos,
                respModalHTML,
                respCotizaciones 
            ] = await Promise.all([
                //
                // PUNTO CLAVE (CONEXIÓN BD - LECTURA / SELECT)
                // Estas llamadas 'fetch' a archivos .json SIMULAN una llamada a un backend (API/PHP).
                // En una aplicación real, cada 'fetch' llamaría a un script de servidor (ej: 'api/getEmpresas.php').
                // Ese script de servidor es el que DEBE tener la conexión a la BD
                // para hacer los 'SELECT' y devolver los datos en formato JSON.
                //
                fetch("empresas.json"),
                fetch("contactos.json"),
                fetch("producto.json"),
                fetch("modal_formulario.html"), // Carga el HTML del modal
                fetch("cotizaciones.json") 
            ]);

            // Guardar HTML del modal en la variable global
            modalHTML = await respModalHTML.text();

            // Procesar los JSON y guardarlos en las variables globales
            const empresas = await respEmpresas.json();
            const contactos = await respContactos.json();
            listaProductos = await respProductos.json();
            listaCotizaciones = await respCotizaciones.json(); 

            // Lógica para combinar empresas y contactos en 'datosCombinados'
            // Agrupa contactos por ID de empresa
            const contactosPorEmpresa = contactos.reduce((acc, contacto) => {
                const idEmp = contacto["id empresa"];
                if (!acc[idEmp]) acc[idEmp] = [];
                acc[idEmp].push(contacto);
                return acc;
            }, {});
            // Asigna los contactos a cada empresa
            datosCombinados = empresas.map(empresa => ({
                ...empresa,
                contactos: contactosPorEmpresa[empresa.idempresa] || [],
                contactoPrincipal: (contactosPorEmpresa[empresa.idempresa] || [])[0] || null
            }));

            // 'Pinta' las tablas por primera vez con los datos cargados
            renderizarTablaClientes(datosCombinados);
            renderizarTablaCotizaciones(listaCotizaciones);

        } catch (error) {
            // Manejo de errores si falla la carga inicial
            console.error("Error fatal al cargar datos iniciales:", error);
            noResultadosClientes.textContent = "Error al cargar datos.";
            noResultadosClientes.style.display = "block";
        }
    }

    // --- 2. Lógica de Pestañas ---
    // Añade el evento 'click' a cada botón de pestaña
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Oculta todas las pestañas y desactiva botones
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            // Muestra solo la pestaña seleccionada
            button.classList.add("active");
            document.getElementById(button.dataset.tab).classList.add("active");
        });
    });

    // --- 3. Lógica Pestaña 1: CREAR (Clientes) ---

    // Dibuja la tabla de clientes en el HTML
    function renderizarTablaClientes(empresas) {
        tablaClientesBody.innerHTML = ""; // Limpia la tabla
        // Muestra u oculta el mensaje de "No se encontraron"
        noResultadosClientes.style.display = empresas.length === 0 ? "block" : "none";

        // Crea una fila (tr) por cada empresa
        empresas.forEach(item => {
            const tr = document.createElement("tr");
            const celdaEmpresa = `<td class="info-empresa"><strong>${item["nombre comercial"]}</strong><div class="razon-social">${item["razon social"]}</div></td>`;
            
            let celdaContacto = '<td>—</td>'; // Contacto por defecto
            if (item.contactoPrincipal) {
                celdaContacto = `<td class="info-contacto"><strong>${item.contactoPrincipal.nombre}</strong><div class="email">${item.contactoPrincipal.email}</div></td>`;
            }

            // Botón para iniciar la cotización
            const celdaAcciones = `
                <td>
                    <button type="button" class="btn-cotizar" data-id="${item.idempresa}">
                        <i class="fa fa-file-signature"></i> Realizar cotización
                    </button>
                </td>`;
            
            tr.innerHTML = celdaEmpresa + celdaContacto + celdaAcciones;
            tablaClientesBody.appendChild(tr);
        });
    }

    // Filtra la lista de clientes (datosCombinados) según el input de búsqueda
    function filtrarYRenderizarClientes() {
        const termino = inputBusquedaClientes.value.toLowerCase();
        const filtrados = datosCombinados.filter(item => {
            // Lógica de búsqueda (nombre comercial, razón social, contacto)
            return (item["nombre comercial"].toLowerCase().includes(termino) ||
                   (item["razon social"] && item["razon social"].toLowerCase().includes(termino)) ||
                   (item.contactoPrincipal && item.contactoPrincipal.nombre.toLowerCase().includes(termino)));
        });
        renderizarTablaClientes(filtrados); // Vuelve a dibujar la tabla con los resultados
    }

    // --- 4. Lógica Pestaña 2: GUARDADAS (Cotizaciones) ---

    // Dibuja la tabla de cotizaciones guardadas en el HTML
    function renderizarTablaCotizaciones(cotizaciones) {
        tablaCotizacionesBody.innerHTML = ""; // Limpia la tabla
        noResultadosCotizaciones.style.display = cotizaciones.length === 0 ? "block" : "none";

        cotizaciones.forEach(cot => {
            const tr = document.createElement("tr");
            
            // Busca el nombre del cliente usando el idEmpresa
            const cliente = datosCombinados.find(c => c.idempresa == cot.idEmpresa);
            const nombreCliente = cliente ? cliente["nombre comercial"] : "Cliente no encontrado";
            
            // Clase CSS para el estado (ej: 'pendiente', 'aceptada')
            const estadoClase = cot.estado.toLowerCase().replace(" ", "");

            // Botones de acción (Ver, Aceptar, Rechazar)
            tr.innerHTML = `
                <td>${cot.idCotizacion}</td>
                <td>${nombreCliente}</td>
                <td>${formatearMoneda(cot.total)}</td>
                <td><span class="badge ${estadoClase}">${cot.estado}</span></td>
                <td>
                    <button class="btn-accion-cot ver" data-id="${cot.idCotizacion}" title="Ver Detalles">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn-accion-cot aceptar" data-id="${cot.idCotizacion}" title="Aceptar">
                        <i class="fa fa-check"></i>
                    </button>
                    <button class="btn-accion-cot rechazar" data-id="${cot.idCotizacion}" title="Rechazar">
                        <i class="fa fa-times"></i>
                    </button>
                </td>
            `;
            tablaCotizacionesBody.appendChild(tr);
        });
    }

    // Filtra la lista de cotizaciones según el input de búsqueda y el dropdown de estado
    function filtrarYRenderizarCotizaciones() {
        const termino = inputBusquedaCotizaciones.value.toLowerCase();
        const estado = filtroEstadoCotizacion.value;

        const filtrados = listaCotizaciones.filter(cot => {
            // Busca el nombre del cliente para incluirlo en el filtro
            const cliente = datosCombinados.find(c => c.idempresa == cot.idEmpresa);
            const nombreCliente = cliente ? cliente["nombre comercial"].toLowerCase() : "";

            const matchTermino = cot.idCotizacion.toLowerCase().includes(termino) || nombreCliente.includes(termino);
            const matchEstado = (estado === "") || (cot.estado === estado); // Si el estado es "" (Todos), siempre es true

            return matchTermino && matchEstado;
        });
        renderizarTablaCotizaciones(filtrados); // Vuelve a dibujar la tabla
    }

    // --- 5. Lógica de Modales (Crear Cotización) ---
    
    // Prepara e inyecta el HTML del modal de 'Crear Cotización'
    function abrirModal(idEmpresa) {
        const empresa = datosCombinados.find(e => e.idempresa == idEmpresa);
        if (!empresa) return;

        // Carga el HTML del modal (guardado en 'modalHTML')
        modalPlaceholder.innerHTML = modalHTML;

        // Rellena la información de la empresa
        document.getElementById("modal-empresa-id").value = empresa.idempresa;
        document.getElementById("modal-empresa-nombre").textContent = empresa["nombre comercial"];
        
        // Crea dinámicamente el <select> de contactos
        const selectContacto = document.createElement('select');
        selectContacto.id = "modal-contacto-select";
        selectContacto.style.width = "100%";
        selectContacto.style.padding = "0.5rem";
        
        if (empresa.contactos.length > 0) {
            empresa.contactos.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c["id contacto"];
                opt.textContent = `${c.nombre} (${c.email})`;
                selectContacto.appendChild(opt);
            });
        } else {
            selectContacto.innerHTML = "<option value=''>Sin contactos</option>";
        }
        // Reemplaza el <p> estático por el <select> dinámico
        document.getElementById("modal-contacto-nombre").replaceWith(selectContacto);


        // Rellena el <select> de productos (tolvas)
        const selectTolva = document.getElementById("select-tolva");
        const productosTolva = listaProductos.filter(p => p.unidad === "renta"); // Filtra solo rentas
        productosTolva.forEach(p => {
            const option = document.createElement('option');
            option.value = p["id producto"];
            option.textContent = `${p.descripcion} ($${p["precio unitario"]})`;
            option.dataset.precio = p["precio unitario"]; // Guarda el precio en el 'data-precio'
            selectTolva.appendChild(option);
        });

        // --- Asignación de Listeners INTERNOS del Modal ---
        // Estos listeners se deben re-asignar CADA VEZ que se abre el modal
        document.getElementById("modal-close-btn").addEventListener("click", cerrarModal);
        document.getElementById("modal-overlay").addEventListener("click", (e) => {
            if (e.target.id === "modal-overlay") cerrarModal(); // Cierra al hacer clic fuera
        });
        
        // Listener principal del formulario
        document.getElementById("form-cotizacion").addEventListener("submit", manejarSubmitCotizacion);

        // Listeners para los cálculos dinámicos
        document.getElementById("check-recoleccion").addEventListener("change", function() {
            const diasDiv = document.getElementById("dias-recoleccion");
            diasDiv.classList.toggle('hidden', !this.checked); // Muestra/oculta días
            if (!this.checked) {
                diasDiv.querySelectorAll('.dia-check').forEach(check => check.checked = false);
            }
            actualizarCalculoTotal(); // Recalcula
        });

        document.querySelectorAll(".dia-check").forEach(check => check.addEventListener("change", actualizarCalculoTotal));
        document.getElementById("btn-add-tolva").addEventListener("click", agregarLineaTolva);
        
        // Listener para borrar líneas (usando delegación de eventos)
        document.getElementById("tolvas-tbody").addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-borrar-linea")) {
                e.target.closest("tr").remove(); // Borra la fila
                actualizarCalculoTotal(); // Recalcula
            }
        });
    }

    // Limpia el HTML del modal para cerrarlo
    function cerrarModal() {
        modalPlaceholder.innerHTML = "";
    }

    // Añade una fila de producto (tolva) a la tabla del modal
    function agregarLineaTolva() {
        const select = document.getElementById('select-tolva');
        const opcion = select.options[select.selectedIndex];
        if (!opcion.value) return; // No hacer nada si es la opción por defecto

        const qty = document.getElementById('input-tolva-qty').value;
        const precio = parseFloat(opcion.dataset.precio);
        const subtotal = qty * precio;
        const idProducto = opcion.value;
        const descripcion = opcion.textContent.split(' ($')[0]; 

        const tbody = document.getElementById('tolvas-tbody');
        const tr = document.createElement('tr');
        // Guarda los datos en atributos 'data-' para usarlos en el cálculo
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
        actualizarCalculoTotal(); // Recalcula el total
    }

    // Recalcula el total de la cotización cada vez que algo cambia
    function actualizarCalculoTotal() {
        let total = 0;
        // Suma el servicio de recolección y días extra si están marcados
        const checkRecoleccion = document.getElementById('check-recoleccion');
        if (checkRecoleccion.checked) {
            total += parseFloat(checkRecoleccion.dataset.precio);
            document.querySelectorAll('.dia-check:checked').forEach(check => {
                total += parseFloat(check.dataset.precio);
            });
        }
        // Suma el subtotal de cada línea de producto (tolva)
        document.querySelectorAll('#tolvas-tbody tr').forEach(tr => {
            total += parseFloat(tr.dataset.qty) * parseFloat(tr.dataset.precio);
        });
        // Muestra el total formateado
        document.getElementById('total-cotizacion').textContent = formatearMoneda(total);
    }
    
    // --- 6. Guardar y Generar PDF (ACTUALIZADO) ---
    
    // Se ejecuta al enviar el formulario del modal
    function manejarSubmitCotizacion(e) {
        e.preventDefault(); // Evita que la página se recargue
        
        // 1. Construye el objeto JSON de la cotización
        const cotizacion = {
            idCotizacion: `C-${Date.now()}`, // Folio único basado en la fecha
            fechaCreacion: new Date().toISOString(),
            fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Vence en 30 días
            idEmpresa: document.getElementById("modal-empresa-id").value,
            idContacto: document.getElementById("modal-contacto-select").value, // Lee el contacto del <select>
            formaPago: document.getElementById("forma-pago").value,
            total: parseFloat(document.getElementById("total-cotizacion").textContent.replace(/[^0-9.-]+/g,"")), // Limpia el formato de moneda
            estado: "Pendiente", // Estado inicial
            detalles: [] // Array para las líneas de producto
        };

        // 2. Añade los detalles del servicio de recolección
        const checkRecoleccion = document.getElementById("check-recoleccion");
        if (checkRecoleccion.checked) {
            let precioServicio = parseFloat(checkRecoleccion.dataset.precio);
            const diasChecks = document.querySelectorAll(".dia-check:checked");
            diasChecks.forEach(check => {
                precioServicio += parseFloat(check.dataset.precio);
            });
            cotizacion.detalles.push({
                idProducto: "P-001", // ID Fijo para el servicio
                cantidad: 1,
                precioUnitario: precioServicio,
                // Guarda los días seleccionados
                lunes: !!document.querySelector('.dia-check[data-dia="lunes"]:checked'),
                martes: !!document.querySelector('.dia-check[data-dia="martes"]:checked'),
                miercoles: !!document.querySelector('.dia-check[data-dia="miercoles"]:checked'),
                jueves: !!document.querySelector('.dia-check[data-dia="jueves"]:checked'),
                viernes: !!document.querySelector('.dia-check[data-dia="viernes"]:checked'),
            });
        }

        // 3. Añade los detalles de las tolvas
        document.querySelectorAll("#tolvas-tbody tr").forEach(tr => {
            cotizacion.detalles.push({
                idProducto: tr.dataset.idProducto,
                cantidad: parseInt(tr.dataset.qty, 10),
                precioUnitario: parseFloat(tr.dataset.precio),
            });
        });

        if (cotizacion.detalles.length === 0) {
            alert("No se puede crear una cotización vacía.");
            return;
        }

        //
        // PUNTO CLAVE (CONEXIÓN BD - ESCRITURA / INSERT)
        // Esta línea SIMULA el envío al backend.
        console.log("--- JSON A ENVIAR AL BACKEND ---", cotizacion);
        //
        // Aquí es donde deberías hacer la llamada 'fetch' al backend:
        //
        // fetch('api/guardarCotizacion.php', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(cotizacion) 
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if(data.success) {
        //         // ... El resto del código si se guarda bien ...
        //     }
        // });
        //
        // El script 'guardarCotizacion.php' DEBE conectarse a la BD
        // y hacer el INSERT de la cotización y sus detalles.
        //

        // 4. (Simulación) Añade la nueva cotización a la lista local
        listaCotizaciones.push(cotizacion);
        renderizarTablaCotizaciones(listaCotizaciones); // Actualiza la tabla 2
        
        // 5. Genera el PDF
        try {
            // PUNTO CLAVE (IMPRESIÓN)
            // Llama a la función que usa 'pdfmake' para generar el archivo.
            generarPDF(cotizacion); 
        } catch (error) {
            console.error("Error al generar el PDF:", error);
        }
        
        // 6. Cierra el modal y cambia a la pestaña de "Guardadas"
        cerrarModal();
        document.querySelector('.tab-button[data-tab="tab-guardadas"]').click();
    }

    // --- Helpers de Formato ---
    // Funciones útiles para mostrar fechas y moneda
    const formatearFecha = (fechaISO) => {
        return new Date(fechaISO).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const formatearMoneda = (numero) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numero);
    };

    // --- 7. Generador de PDF (Tu código anterior, reutilizado) ---
    //
    // PUNTO CLAVE (IMPRESIÓN / GENERACIÓN DE PDF)
    // Esta función toma el objeto JSON de la cotización
    // y usa la librería 'pdfMake' (cargada en el HTML) para
    // construir y descargar el archivo PDF.
    //
    function generarPDF(cotizacion) {
        // Busca los datos completos del cliente y contacto
        const empresa = datosCombinados.find(e => e.idempresa == cotizacion.idEmpresa);
        const contacto = empresa.contactos.find(c => c["id contacto"] == cotizacion.idContacto);
        
        // Define la cabecera de la tabla de conceptos
        const bodyTabla = [
            [{ text: 'Descripción', style: 'tableHeader' }, { text: 'Cantidad', style: 'tableHeader' }, { text: 'P. Unitario', style: 'tableHeader' }, { text: 'Subtotal', style: 'tableHeader' }]
        ];

        // Rellena las filas de la tabla de conceptos
        cotizacion.detalles.forEach(detalle => {
            const producto = listaProductos.find(p => p["id producto"] === detalle.idProducto);
            let descripcionCompleta = producto ? producto.descripcion : "Producto no encontrado";
            
            // Lógica para añadir los días al servicio de recolección
            if (detalle.idProducto === "P-001") {
                const dias = [];
                if(detalle.lunes) dias.push("Lu");
                if(detalle.martes) dias.push("Ma");
                if(detalle.miercoles) dias.push("Mi");
                if(detalle.jueves) dias.push("Ju");
                if(detalle.viernes) dias.push("Vi");
                if(dias.length > 0) descripcionCompleta += ` (Días: ${dias.join(', ')})`;
            }
            const subtotal = detalle.cantidad * detalle.precioUnitario;
            // Añade la fila al cuerpo de la tabla
            bodyTabla.push([
                { text: descripcionCompleta, style: 'tableCell' },
                { text: detalle.cantidad.toString(), style: 'tableCell', alignment: 'center' },
                { text: formatearMoneda(detalle.precioUnitario), style: 'tableCell', alignment: 'right' },
                { text: formatearMoneda(subtotal), style: 'tableCell', alignment: 'right' }
            ]);
        });

        // --- Definición completa del documento PDF ---
        const docDefinition = {
            content: [
                // Título y Folio
                { text: 'COTIZACIÓN', style: 'header' },
                { text: `Folio: ${cotizacion.idCotizacion}`, style: 'subheader' },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#cccccc' }], margin: [0, 10] },
                
                // Columnas de Cliente y Fechas
                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                { text: 'CLIENTE:', style: 'label' },
                                { text: empresa["nombre comercial"], style: 'textBold' },
                                { text: empresa["razon social"], style: 'text' },
                            ]
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'FECHA EMISIÓN:', style: 'label' },
                                { text: formatearFecha(cotizacion.fechaCreacion), style: 'text' },
                                { text: 'VENCIMIENTO:', style: 'label', margin: [0, 5, 0, 0] },
                                { text: formatearFecha(cotizacion.fechaVencimiento), style: 'text' },
                                { text: 'CONTACTO:', style: 'label', margin: [0, 5, 0, 0] },
                                { text: contacto ? contacto.nombre : 'N/A', style: 'text' },
                            ],
                            alignment: 'right'
                        }
                    ],
                    margin: [0, 10]
                },
                
                // Tabla de Conceptos
                { text: 'CONCEPTOS', style: 'subheader', margin: [0, 20, 0, 5] },
                {
                    style: 'tableExample',
                    table: { widths: ['*', 'auto', 'auto', 'auto'], body: bodyTabla },
                    layout: 'lightHorizontalLines'
                },
                
                // Total
                {
                    alignment: 'right',
                    stack: [
                        { text: `TOTAL: ${formatearMoneda(cotizacion.total)}`, style: 'total' }
                    ],
                    margin: [0, 20, 0, 0]
                },
                
                // Pie de página
                { text: `Forma de pago: ${cotizacion.formaPago}.`, style: 'textSmall', margin: [0, 40, 0, 5] },
            ],
            // Estilos del PDF
            styles: {
                header: { fontSize: 22, bold: true, alignment: 'center', color: '#333333' },
                subheader: { fontSize: 14, bold: true, color: '#555555' },
                label: { fontSize: 10, bold: true, color: '#aaaaaa' },
                text: { fontSize: 10, margin: [0, 2, 0, 2] },
                textBold: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
                textSmall: { fontSize: 9, margin: [0, 1, 0, 1] },
                tableExample: { margin: [0, 5, 0, 15] },
                tableHeader: { bold: true, fontSize: 11, color: 'black', fillColor: '#eeeeee', alignment: 'center' },
                tableCell: { fontSize: 10 },
                total: { fontSize: 16, bold: true, margin: [0, 10, 0, 0] }
            },
            // Footer del documento (numeración de página)
            footer: (currentPage, pageCount) => ({ text: `Página ${currentPage.toString()} de ${pageCount}`, alignment: 'center', style: 'textSmall', margin: [0, 20] })
        };
        // --- Fin de la definición ---

        // Comando final para generar y descargar el PDF
        pdfMake.createPdf(docDefinition).download(`cotizacion_${empresa["nombre comercial"]}.pdf`);
    }

    // --- 8. Lógica de Acciones (Pestaña 2) ---
    
    // Cambia el estado de una cotización en la lista local
    function cambiarEstadoCotizacion(id, nuevoEstado) {
        const cotizacion = listaCotizaciones.find(c => c.idCotizacion === id);
        if (cotizacion) {
            cotizacion.estado = nuevoEstado;
            
            //
            // PUNTO CLAVE (CONEXIÓN BD - ESCRITURA / UPDATE)
            // Esta acción también debe comunicarse con el backend para persistir el cambio.
            console.log(`Simulando UPDATE: Estado de ${id} cambiado a ${nuevoEstado}`);
            //
            // Aquí iría el 'fetch' para actualizar:
            // fetch('api/actualizarEstadoCotizacion.php', {
            //     method: 'POST', // o 'PUT'
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ id: id, estado: nuevoEstado })
            // });
            //
            
            // Vuelve a dibujar la tabla 2 para reflejar el cambio de estado
            filtrarYRenderizarCotizaciones(); 
        }
    }
    // --- 8. Lógica de Modal "Ver Detalles" (¡NUEVO!) ---

    // Cierra el modal de "Ver Detalles"
    function cerrarModalVerCotizacion() {
        modalViewPlaceholder.innerHTML = "";
    }

    // Abre un modal de solo lectura con el resumen de la cotización
    function abrirModalVerCotizacion(id) {
        // Busca todos los datos necesarios (cotización, empresa, contacto)
        const cotizacion = listaCotizaciones.find(c => c.idCotizacion === id);
        if (!cotizacion) return;

        const empresa = datosCombinados.find(e => e.idempresa == cotizacion.idEmpresa);
        const contacto = empresa.contactos.find(c => c["id contacto"] == cotizacion.idContacto);
        
        // --- Construye la tabla de detalles (HTML) ---
        let detallesHtml = `
            <table class="modal-ver-tabla">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>P. Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Itera sobre los detalles del JSON para crear las filas
        cotizacion.detalles.forEach(detalle => {
            const producto = listaProductos.find(p => p["id producto"] === detalle.idProducto);
            let descripcion = producto ? producto.descripcion : "Producto no encontrado";

            // Añade los días a la descripción del servicio
            if (detalle.idProducto === "P-001") {
                const dias = [];
                if(detalle.lunes) dias.push("Lu");
                if(detalle.martes) dias.push("Ma");
                if(detalle.miercoles) dias.push("Mi");
                if(detalle.jueves) dias.push("Ju");
                if(detalle.viernes) dias.push("Vi");
                if(dias.length > 0) descripcion += ` (${dias.join(', ')})`;
            }
            const subtotal = detalle.cantidad * detalle.precioUnitario;

            detallesHtml += `
                <tr>
                    <td>${descripcion}</td>
                    <td>${detalle.cantidad}</td>
                    <td>${formatearMoneda(detalle.precioUnitario)}</td>
                    <td>${formatearMoneda(subtotal)}</td>
                </tr>
            `;
        });
        detallesHtml += "</tbody></table>";
        // --- Fin de la tabla ---


        // --- Construye el HTML completo del modal ---
        const modalHtml = `
            <div class="modal-overlay" id="modal-overlay-ver">
                <div class="modal-content">
                    <button class="modal-close-btn" id="modal-close-btn-ver">&times;</button>
                    <h2>Detalles de Cotización</h2>
                    <div class="modal-ver-contenido">
                        <p><strong>Folio:</strong> ${cotizacion.idCotizacion}</p>
                        <p><strong>Estado:</strong> <span class="badge ${cotizacion.estado.toLowerCase()}">${cotizacion.estado}</span></p>
                        
                        <h3>Datos del Cliente</h3>
                        <p><strong>Empresa:</strong> ${empresa ? empresa["nombre comercial"] : "N/A"}</p>
                        <p><strong>Contacto:</strong> ${contacto ? contacto.nombre : "N/A"}</p>
                        <p><strong>Email:</strong> ${contacto ? contacto.email : "N/A"}</p>

                        <h3>Datos de la Cotización</h3>
                        <p><strong>Fecha Creación:</strong> ${formatearFecha(cotizacion.fechaCreacion)}</p>
                        <p><strong>Fecha Venc.:</strong> ${formatearFecha(cotizacion.fechaVencimiento)}</p>
                        <p><strong>Forma de Pago:</strong> ${cotizacion.formaPago}</p>
                        <p><strong>Total:</strong> <strong>${formatearMoneda(cotizacion.total)}</strong></p>

                        <h3>Conceptos</h3>
                        ${detallesHtml} </div>
                </div>
            </div>
        `;
        
        // Inyecta el modal en el placeholder
        modalViewPlaceholder.innerHTML = modalHtml;

        // Añade los listeners para cerrar este modal
        document.getElementById("modal-close-btn-ver").addEventListener("click", cerrarModalVerCotizacion);
        document.getElementById("modal-overlay-ver").addEventListener("click", (e) => {
            if (e.target.id === "modal-overlay-ver") cerrarModalVerCotizacion();
        });
    }
    
    // --- 9. Event Listeners Principales ---
    // Asigna los listeners globales que no están dentro de los modales
    
    // Pestaña 1 (Crear)
    formBusquedaClientes.addEventListener("submit", (e) => e.preventDefault()); // Evita recargar página
    inputBusquedaClientes.addEventListener("keyup", filtrarYRenderizarClientes); // Filtra al escribir
    
    // Listener en la tabla de clientes (Delegación de eventos)
    tablaClientesBody.addEventListener("click", (e) => {
        // Busca el botón 'btn-cotizar' más cercano al que se hizo clic
        const cotizarBtn = e.target.closest(".btn-cotizar");
        if (cotizarBtn) {
            abrirModal(cotizarBtn.dataset.id); // Abre el Formulario de Crear cotizacion con el ID del cliente
        }
    });

    // Pestaña 2 (Guardadas)
    formBusquedaCotizaciones.addEventListener("submit", (e) => e.preventDefault());
    inputBusquedaCotizaciones.addEventListener("keyup", filtrarYRenderizarCotizaciones); // Filtra al escribir
    filtroEstadoCotizacion.addEventListener("change", filtrarYRenderizarCotizaciones); // Filtra al cambiar el select

    // Listener en la tabla de cotizaciones (Delegación de eventos)
    tablaCotizacionesBody.addEventListener("click", (e) => {
        const btn = e.target.closest("button"); // Encuentra el botón presionado
        if (!btn) return;
        
        const id = btn.dataset.id;
        const cotizacion = listaCotizaciones.find(c => c.idCotizacion === id);

        if (btn.classList.contains("ver")) {
            abrirModalVerCotizacion(id); // Abre el modal de "Ver Detalles"
        
        // El botón 'generar PDF' (impresión) fue reemplazado por 'ver'.
        // Si quisieras regenerar el PDF sería:
        // } else if (btn.classList.contains("imprimir")) {
        //     if(cotizacion) generarPDF(cotizacion);

        } else if (btn.classList.contains("aceptar")) {
            if (confirm(`¿Marcar la cotización ${id} como ACEPTADA?`)) {
                cambiarEstadoCotizacion(id, "Aceptada"); // Llama a la función de actualizar estado
            }
        } else if (btn.classList.contains("rechazar")) {
            if (confirm(`¿Marcar la cotización ${id} como RECHAZADA?`)) {
                cambiarEstadoCotizacion(id, "Rechazada"); // Llama a la función de actualizar estado
            }
        }
    });

    // --- Carga Inicial ---
    // Llama a la función principal para cargar datos y arrancar la aplicación
    cargarDatosIniciales();
});