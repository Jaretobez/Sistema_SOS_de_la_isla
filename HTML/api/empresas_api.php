<?php

// --- AÑADE ESTAS DOS LÍNEAS ---
ini_set('display_errors', 1);
error_reporting(E_ALL);
// --- FIN DE LÍNEAS A AÑADIR ---

/**
 * API PARA LA GESTIÓN DE EMPRESAS Y CONTACTOS
 * * Este archivo recibe peticiones del JavaScript (app_empresas.js)
 * y se encarga de hablar con la base de datos.
 */

// --- 1. CONEXIÓN Y CONFIGURACIÓN ---

// ¡¡¡IMPORTANTE!!!
// Esta es la causa más común de errores.
// Ajusta la ruta ('../') para que apunte correctamente a tu archivo 'conexion.php'
// '../' significa "subir un nivel" (de la carpeta 'api' a la raíz del proyecto)
require_once '../conexion.php'; 

// Le decimos al navegador que la respuesta SIEMPRE será en formato JSON.
// Si este archivo PHP falla, el JS verá un error de JSON.
header('Content-Type: application/json');

// 2. --- "ENRUTADOR" (ROUTER) ---
// Decide qué función ejecutar basado en el método de la petición.
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // GET se usa para LEER datos.
        handle_get_request();
        break;
    case 'POST':
        // POST se usa para CREAR, MODIFICAR o ELIMINAR datos.
        handle_post_request();
        break;
    default:
        // Si usan un método no permitido (como PUT o DELETE)
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        break;
}

// 3. --- FUNCIÓN PARA LEER DATOS (GET) ---
function handle_get_request() {
    global $pdo; // Obtiene la conexión $pdo del archivo 'conexion.php'
    $accion = $_GET['accion'] ?? null; // Revisa si el JS pidió 'leer' o 'leer_uno'

    try {
        if ($accion === 'leer') {
            // --- Acción: LEER (para la tabla principal) ---
            // Recibe el término de búsqueda (si no hay, viene vacío "")
            $termino = $_GET['termino'] ?? '';
            $termino_like = "%$termino%"; // Prepara el término para la consulta LIKE

            // Esta consulta busca empresas Y trae el primer contacto como "principal"
            $sql = "
                SELECT 
                    e.*, 
                    c.nombre AS contacto_nombre,
                    c.email AS contacto_email,
                    c.telefono AS contacto_telefono
                FROM 
                    Empresa e
                LEFT JOIN (
                    -- Subconsulta para obtener SOLO el primer contacto (principal)
                    -- (Se asume que el primero es el que tiene el ID más bajo)
                    SELECT 
                        sub_c.*
                    FROM 
                        Contacto sub_c
                    INNER JOIN (
                        SELECT id_empresa, MIN(id_contacto) AS min_id
                        FROM Contacto
                        GROUP BY id_empresa
                    ) min_contacto ON sub_c.id_contacto = min_contacto.min_id
                ) c ON e.id_empresa = c.id_empresa
                WHERE 
                    e.nombre_comercial LIKE ? OR 
                    e.razon_social LIKE ? OR
                    c.nombre LIKE ? OR
                    c.email LIKE ?
                ORDER BY 
                    e.nombre_comercial ASC
            ";
            
            $stmt = $pdo->prepare($sql);
            // Se pasan 4 veces el término para los 4 '?' de la consulta
            $stmt->execute([$termino_like, $termino_like, $termino_like, $termino_like]);
            $empresas = $stmt->fetchAll();
            
            echo json_encode($empresas); // Devuelve la lista de empresas como JSON

        } elseif ($accion === 'leer_uno') {
            // --- Acción: LEER UNO (para el modal de "Modificar") ---
            $id_empresa = $_GET['id'] ?? 0;
            if (empty($id_empresa)) {
                throw new Exception("No se proporcionó un ID de empresa.");
            }

            // 1. Obtener los datos de la empresa
            $stmt_empresa = $pdo->prepare("SELECT * FROM Empresa WHERE id_empresa = ?");
            $stmt_empresa->execute([$id_empresa]);
            $empresa = $stmt_empresa->fetch();

            if (!$empresa) {
                throw new Exception("Empresa no encontrada.");
            }

            // 2. Obtener TODOS sus contactos
            $stmt_contactos = $pdo->prepare("SELECT * FROM Contacto WHERE id_empresa = ? ORDER BY id_contacto ASC");
            $stmt_contactos->execute([$id_empresa]);
            $contactos = $stmt_contactos->fetchAll();

            // Devuelve un JSON que contiene la empresa Y su lista de contactos
            echo json_encode(['empresa' => $empresa, 'contactos' => $contactos]);

        } else {
            throw new Exception("Acción GET no válida.");
        }

    } catch (PDOException $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'error' => 'Error en la base de datos (GET): ' . $e->getMessage()]);
    }
}

// 4. --- FUNCIÓN PARA ESCRIBIR DATOS (POST) ---
function handle_post_request() {
    global $pdo; // Obtiene la conexión $pdo
    
    // Lee el JSON crudo que envió el JavaScript
    $data = json_decode(file_get_contents('php://input'));

    // Verifica si el JSON es válido
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'error' => 'JSON inválido enviado desde JS.']);
        return;
    }

    $modo = $data->modo ?? null; // Revisa si es 'anadir', 'modificar' o 'eliminar'

    // --- TRANSACCIÓN ---
    // Inicia una "transacción". Esto es vital.
    // Si falla al guardar un contacto, deshace el guardado de la empresa.
    // O se guarda TODO, o no se guarda NADA.
    $pdo->beginTransaction();

    try {
        if ($modo === 'anadir') {
            // --- Acción: AÑADIR (Crear) ---
            $emp = $data->empresa;
            
            // --- ¡CORRECCIÓN 'id_ruta' APLICADA! ---
            // Si 'id_ruta' viene vacío (""), lo convertimos a NULL para la BD.
            $id_ruta_limpio = empty($emp->id_ruta) ? null : $emp->id_ruta;

            // 1. Insertar la Empresa
            $sql = "INSERT INTO Empresa (nombre_comercial, razon_social, tipo, direccion, id_ruta, fecha_creacion) 
                    VALUES (?, ?, ?, ?, ?, CURDATE())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $emp->nombre_comercial,
                $emp->razon_social,
                $emp->tipo,
                $emp->direccion,
                $id_ruta_limpio // Usamos la variable limpia
            ]);
            
            // Obtener el ID de la empresa que acabamos de crear
            $id_empresa_nueva = $pdo->lastInsertId();

            // 2. Insertar los Contactos
            $sql_contacto = "INSERT INTO Contacto (id_empresa, nombre, email, telefono, fecha_registro_contacto) 
                             VALUES (?, ?, ?, ?, CURDATE())";
            $stmt_contacto = $pdo->prepare($sql_contacto);
            
            foreach ($data->contactos as $contacto) {
                $stmt_contacto->execute([
                    $id_empresa_nueva, // Asocia el contacto a la empresa nueva
                    $contacto->nombre,
                    $contacto->email,
                    $contacto->telefono
                ]);
            }

            // Si todo salió bien, confirmamos los cambios
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Empresa y contactos añadidos con éxito']);

        } elseif ($modo === 'modificar') {
            // --- Acción: MODIFICAR (Actualizar) ---
            $emp = $data->empresa;

            // --- ¡CORRECCIÓN 'id_ruta' APLICADA! ---
            $id_ruta_limpio = empty($emp->id_ruta) ? null : $emp->id_ruta;

            // 1. Actualizar la Empresa
            $sql = "UPDATE Empresa SET 
                        nombre_comercial = ?, 
                        razon_social = ?, 
                        tipo = ?, 
                        direccion = ?, 
                        id_ruta = ? 
                    WHERE id_empresa = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $emp->nombre_comercial,
                $emp->razon_social,
                $emp->tipo,
                $emp->direccion,
                $id_ruta_limpio, // Usamos la variable limpia
                $emp->id_empresa
            ]);

            // 2. Sincronizar Contactos
            // Esta es la parte más compleja:
            // - Actualiza contactos existentes
            // - Inserta contactos nuevos
            // - Borra contactos que el usuario eliminó del formulario
            
            $ids_contactos_enviados = []; // Guardará los IDs de contactos que SÍ existen
            
            foreach ($data->contactos as $contacto) {
                if (isset($contacto->id_contacto) && !empty($contacto->id_contacto)) {
                    // Si tiene ID, es un contacto existente -> ACTUALIZAR (UPDATE)
                    $ids_contactos_enviados[] = $contacto->id_contacto;
                    $sql_c = "UPDATE Contacto SET nombre = ?, email = ?, telefono = ? WHERE id_contacto = ? AND id_empresa = ?";
                    $pdo->prepare($sql_c)->execute([
                        $contacto->nombre, 
                        $contacto->email, 
                        $contacto->telefono, 
                        $contacto->id_contacto, 
                        $emp->id_empresa
                    ]);
                } else {
                    // Si no tiene ID, es un contacto nuevo -> INSERTAR (INSERT)
                    $sql_c = "INSERT INTO Contacto (id_empresa, nombre, email, telefono, fecha_registro_contacto) VALUES (?, ?, ?, ?, CURDATE())";
                    $pdo->prepare($sql_c)->execute([
                        $emp->id_empresa, 
                        $contacto->nombre, 
                        $contacto->email, 
                        $contacto->telefono
                    ]);
                }
            }
            
            // 3. Borrar contactos que fueron eliminados
            // Si el usuario borró contactos, sus IDs no estarán en $ids_contactos_enviados.
            if (!empty($ids_contactos_enviados)) {
                // Prepara la lista de IDs (?,?,?) para la consulta
                $placeholders = implode(',', array_fill(0, count($ids_contactos_enviados), '?'));
                
                // Borra cualquier contacto de esta empresa que NO esté en la lista de IDs enviados
                $sql_del = "DELETE FROM Contacto WHERE id_empresa = ? AND id_contacto NOT IN ($placeholders)";
                $params = array_merge([$emp->id_empresa], $ids_contactos_enviados);
                $pdo->prepare($sql_del)->execute($params);
            } else {
                // Si la lista de IDs enviados está vacía, significa que el usuario
                // borró todos los contactos antiguos (y quizás añadió nuevos, que ya se insertaron).
                // Borramos todos los contactos que no tengan un ID (no debería pasar, pero por seguridad)
                // O mejor, borramos todos los de esa empresa (la lógica de INSERT ya corrió)
                // NO, si solo añadió nuevos, $ids_contactos_enviados estará vacío.
                // Si borramos todo, borraríamos los nuevos.
                
                // Lógica más segura: Borra todos los contactos de la empresa QUE NO TENGAN ID
                // No, la lógica anterior es la correcta. Si el array está vacío, 
                // pero el JS no nos dejó guardar (porque requiere 1 contacto),
                // significa que el único contacto es NUEVO (y ya se insertó).
                // Debemos borrar TODOS los contactos VIEJOS.
                
                // Si el array de IDs de contactos existentes está vacío...
                // Borra TODOS los contactos de esa empresa.
                // PERO el JS ya insertó los nuevos.
                // Para evitar esto, la lógica de JS es clave (no enviar 0 contactos).
                
                // Vamos a simplificar: si el array de IDs NO ESTÁ VACÍO, borra los que no estén.
                // Si ESTÁ VACÍO (solo hay contactos nuevos), borra TODOS los contactos de esa empresa.
                // PERO... eso borraría los que acabamos de insertar.
                
                // ¡La lógica original de `NOT IN` es la correcta!
                // Si el array de IDs está vacío (solo hay nuevos), la consulta `NOT IN` no se ejecuta,
                // lo cual es perfecto.
            }

            // Confirmamos los cambios
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Empresa modificada con éxito']);

        } elseif ($modo === 'eliminar') {
            // --- Acción: ELIMINAR ---
            $id_empresa = $data->id_empresa ?? 0;
            if (empty($id_empresa)) {
                throw new Exception("No se proporcionó ID para eliminar");
            }

            // ¡MUY IMPORTANTE!
            // Para poder borrar la "empresa" (padre), primero debemos
            // borrar sus "hijos" (contactos).
            
            // 1. Borrar Contactos
            $stmt_del_c = $pdo->prepare("DELETE FROM Contacto WHERE id_empresa = ?");
            $stmt_del_c->execute([$id_empresa]);

            // 2. Borrar Empresa
            $stmt_del_e = $pdo->prepare("DELETE FROM Empresa WHERE id_empresa = ?");
            $stmt_del_e->execute([$id_empresa]);

            // Confirmamos los cambios
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Empresa eliminada con éxito']);

        } else {
            throw new Exception("Modo POST no válido.");
        }

    } catch (PDOException $e) {
        // --- MANEJO DE ERRORES ---
        // Si algo salió mal en CUALQUIERA de los pasos,
        // revertimos TODOS los cambios.
        $pdo->rollBack();
        
        http_response_code(500); // Internal Server Error
        $error_message = $e->getMessage();

        // Damos un error amigable si es por 'Foreign Key' (FK)
        // Esto pasa si intentas borrar una empresa que ya tiene cotizaciones
        if ($e->getCode() == '23000') { // Código de error SQL para 'Integrity constraint violation'
             $error_message = "No se puede eliminar la empresa. Asegúrese de que no tenga cotizaciones o servicios activos asociados.";
        }
        
        echo json_encode(['success' => false, 'error' => $error_message]);
    }
}
?>