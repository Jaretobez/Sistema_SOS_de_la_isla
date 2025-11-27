<?php
/**
 * API PARA LA GESTIÓN DE EMPRESAS Y CONTACTOS
 */
// --- LÍNEAS DE DEPURACIÓN (Recomendadas en desarrollo) ---
ini_set('display_errors', 1);
error_reporting(E_ALL);
// --- FIN DEPURACIÓN ---

// 1. --- CONEXIÓN Y CONFIGURACIÓN ---

// RUTA CORREGIDA: Subir y entrar a la carpeta 'php' (Asumimos que esta es la ruta correcta)
require_once '../php/conexion.php'; 

header('Content-Type: application/json');

// 2. --- "ENRUTADOR" (ROUTER) ---
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_request();
        break;
    case 'POST':
        handle_post_request();
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        break;
}

// 3. --- FUNCIÓN PARA LEER DATOS (GET) ---
function handle_get_request() {
    global $pdo; 
    $accion = $_GET['accion'] ?? null; 
    
    try {
        // 🟢 ACCIÓN SINCRONIZADA: 'leer_empresas'
        if ($accion === 'leer_empresas') {
            
            $termino = $_GET['termino'] ?? '';
            $termino_like = "%$termino%"; 

            $sql = "
                SELECT 
                    e.*, 
                    c.nombre AS contacto_nombre,
                    c.email AS contacto_email,
                    c.telefono AS contacto_telefono  /* <-- CAMBIO CLAVE PARA MOSTRAR EL TELÉFONO */
                FROM 
                    Empresa e
                LEFT JOIN (
                    SELECT sub_c.*
                    FROM Contacto sub_c
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
            $stmt->execute([$termino_like, $termino_like, $termino_like, $termino_like]);
            $empresas = $stmt->fetchAll();
            
            // Devuelve el formato esperado por JS: {success: true, data: []}
            echo json_encode(['success' => true, 'data' => $empresas]); 

        } 
        // 🟢 ACCIÓN SINCRONIZADA: 'leer_perfil'
        elseif ($accion === 'leer_perfil') { 
            
            $id = $_GET['id'] ?? 0;
            if (empty($id)) {
                throw new Exception("No se proporcionó un ID de empresa.");
            }

            // 1. Obtener los datos de la empresa
            $stmt_empresa = $pdo->prepare("SELECT * FROM Empresa WHERE id_empresa = ?");
            $stmt_empresa->execute([$id]);
            $empresa = $stmt_empresa->fetch();

            if (!$empresa) {
                echo json_encode(['success' => false, 'error' => "Empresa ID {$id} no encontrada."]);
                return;
            }

            // 2. Obtener TODOS sus contactos
            $stmt_contactos = $pdo->prepare("SELECT * FROM Contacto WHERE id_empresa = ? ORDER BY id_contacto ASC");
            $stmt_contactos->execute([$id]);
            $contactos = $stmt_contactos->fetchAll();

            echo json_encode(['success' => true, 'empresa' => $empresa, 'contactos' => $contactos]);

        } else {
            throw new Exception("Acción GET no válida.");
        }

    } catch (PDOException $e) {
        http_response_code(500); 
        echo json_encode(['success' => false, 'error' => 'Error en la base de datos (GET): ' . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// 4. --- FUNCIÓN PARA ESCRIBIR DATOS (POST) ---
function handle_post_request() {
    global $pdo; 
    
    $data = json_decode(file_get_contents('php://input'));

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400); 
        echo json_encode(['success' => false, 'error' => 'JSON inválido enviado desde JS.']);
        return;
    }

    $modo = $data->modo ?? null; 
    $pdo->beginTransaction();

    try {
        if ($modo === 'crear_empresa') { 
            $emp = $data->empresa;
            
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
                $id_ruta_limpio 
            ]);
            
            $id_empresa_nueva = $pdo->lastInsertId();

            // 2. Insertar los Contactos
            $sql_contacto = "INSERT INTO Contacto (id_empresa, nombre, email, telefono, fecha_registro_contacto) 
                              VALUES (?, ?, ?, ?, CURDATE())";
            $stmt_contacto = $pdo->prepare($sql_contacto);
            
            foreach ($data->contactos as $contacto) {
                $stmt_contacto->execute([
                    $id_empresa_nueva, 
                    $contacto->nombre,
                    $contacto->email,
                    $contacto->telefono
                ]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Empresa y contactos añadidos con éxito']);

        } elseif ($modo === 'editar_empresa') {
            $emp = $data->empresa;

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
                $id_ruta_limpio, 
                $emp->id_empresa
            ]);

            // 2. Sincronizar Contactos
            $ids_contactos_enviados = []; 
            
            foreach ($data->contactos as $contacto) {
                if (isset($contacto->id_contacto) && !empty($contacto->id_contacto)) {
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
            if (!empty($ids_contactos_enviados)) {
                $placeholders = implode(',', array_fill(0, count($ids_contactos_enviados), '?'));
                $sql_del = "DELETE FROM Contacto WHERE id_empresa = ? AND id_contacto NOT IN ($placeholders)";
                $params = array_merge([$emp->id_empresa], $ids_contactos_enviados);
                $pdo->prepare($sql_del)->execute($params);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Empresa modificada con éxito']);

        } elseif ($modo === 'eliminar_empresa') {
            $id_empresa = $data->id_empresa ?? 0;
            if (empty($id_empresa)) {
                throw new Exception("No se proporcionó ID para eliminar");
            }
            
            // 1. Borrar Contactos
            $stmt_del_c = $pdo->prepare("DELETE FROM Contacto WHERE id_empresa = ?");
            $stmt_del_c->execute([$id_empresa]);

            // 2. Borrar Empresa
            $stmt_del_e = $pdo->prepare("DELETE FROM Empresa WHERE id_empresa = ?");
            $stmt_del_e->execute([$id_empresa]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Empresa eliminada con éxito']);

        } else {
            throw new Exception("Modo POST no válido.");
        }

    } catch (PDOException $e) {
        $pdo->rollBack();
        
        http_response_code(500); 
        $error_message = $e->getMessage();

        if ($e->getCode() == '23000') { 
             $error_message = "No se puede eliminar la empresa. Asegúrese de que no tenga cotizaciones o servicios activos asociados.";
        }
        
        echo json_encode(['success' => false, 'error' => $error_message]);
    }
}
?>
