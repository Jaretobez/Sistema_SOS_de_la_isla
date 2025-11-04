<?php
/**
 * API PARA LA GESTIÓN DE COTIZACIONES
 * Lee clientes, productos y cotizaciones.
 * Guarda, modifica estado y elimina cotizaciones.
 */

// 1. --- CONEXIÓN Y CONFIGURACIÓN ---
// (Asegúrate de que esta ruta sea correcta)
require_once '../conexion.php'; 
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
        if ($accion === 'leer_clientes') {
            // Trae las empresas y su contacto principal
            $sql = "
                SELECT 
                    e.id_empresa, e.nombre_comercial, e.razon_social,
                    c.id_contacto,
                    c.nombre AS contacto_nombre,
                    c.email AS contacto_email
                FROM 
                    Empresa e
                LEFT JOIN (
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
                ORDER BY 
                    e.nombre_comercial ASC
            ";
            $stmt = $pdo->query($sql);
            $datos = $stmt->fetchAll();
            echo json_encode($datos);

        } elseif ($accion === 'leer_productos') {
            // Trae el catálogo de productos
            $stmt = $pdo->query("SELECT * FROM Producto");
            $datos = $stmt->fetchAll();
            echo json_encode($datos);

        } elseif ($accion === 'leer_cotizaciones') {
            // Trae el historial de cotizaciones
            $sql = "
                SELECT 
                    c.id_cotizacion, c.total, c.estado_cotizacion,
                    e.nombre_comercial
                FROM Cotizacion c
                JOIN Contacto con ON c.id_contacto = con.id_contacto
                JOIN Empresa e ON con.id_empresa = e.id_empresa
                ORDER BY c.id_cotizacion DESC
            ";
            $stmt = $pdo->query($sql);
            $datos = $stmt->fetchAll();
            echo json_encode($datos);
        
        } else {
            throw new Exception("Acción GET no válida.");
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error en la base de datos (GET): ' . $e->getMessage()]);
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

    // Leemos el "modo" para saber qué hacer
    $modo = $data->modo ?? null;

    $pdo->beginTransaction();

    try {
        if ($modo === 'crear_cotizacion') {
            // --- MODO: CREAR COTIZACIÓN ---
            
            $cot = $data->cotizacion;
            $detalles = $data->detalles;
            if (empty($cot) || empty($detalles)) {
                throw new Exception("Datos de cotización o detalles vacíos.");
            }

            // 1. Insertar el Encabezado (Cotizacion)
            $sql_cot = "INSERT INTO Cotizacion (id_contacto, forma_de_pago, total, estado_cotizacion, fecha_vencimiento) 
                        VALUES (?, ?, ?, ?, ?)";
            $stmt_cot = $pdo->prepare($sql_cot);
            $stmt_cot->execute([
                $cot->id_contacto,
                $cot->forma_de_pago,
                $cot->total,
                $cot->estado_cotizacion,
                $cot->fecha_vencimiento
            ]);
            $id_cotizacion_nueva = $pdo->lastInsertId();

            // 2. Insertar las Líneas (DetalleCotizacion)
            $sql_detalle = "INSERT INTO DetalleCotizacion 
                                (id_cotizacion, id_producto, cantidad, precio_unitario, 
                                 lunes, martes, miercoles, jueves, viernes, 
                                 tipo_residuo, bolsas_por_dia, peso_por_bolsa_kg) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt_detalle = $pdo->prepare($sql_detalle);
            
            foreach ($detalles as $det) {
                $stmt_detalle->execute([
                    $id_cotizacion_nueva,
                    $det->id_producto,
                    $det->cantidad,
                    $det->precio_unitario,
                    $det->lunes ?? 0,
                    $det->martes ?? 0,
                    $det->miercoles ?? 0,
                    $det->jueves ?? 0,
                    $det->viernes ?? 0,
                    $det->tipo_residuo ?? null,
                    $det->bolsas_por_dia ?? null,
                    $det->peso_por_bolsa_kg ?? null
                ]);
            }

            // 3. Si todo salió bien, confirmamos los cambios
            $pdo->commit();
            echo json_encode([
                'success' => true, 
                'message' => 'Cotización guardada con éxito',
                'id_cotizacion_nueva' => $id_cotizacion_nueva
            ]);

        } elseif ($modo === 'cambiar_estado') {
            // --- MODO: CAMBIAR ESTADO (simple, para "Rechazada") ---
            $id = $data->id_cotizacion ?? 0;
            $estado = $data->nuevo_estado ?? '';

            if (empty($id) || empty($estado)) {
                throw new Exception("Faltan datos para actualizar el estado.");
            }

            $sql = "UPDATE Cotizacion SET estado_cotizacion = ? WHERE id_cotizacion = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$estado, $id]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => "Estado actualizado a $estado"]);

        } elseif ($modo === 'aceptar_cotizacion') {
            // --- MODO: ACEPTAR COTIZACIÓN Y CREAR SERVICIO ---
            $id = $data->id_cotizacion ?? 0;
            if (empty($id)) {
                throw new Exception("Falta ID para aceptar la cotización.");
            }

            // 1. Obtener los datos necesarios (total y id_empresa)
            $stmt_data = $pdo->prepare("
                SELECT c.total, con.id_empresa 
                FROM Cotizacion c
                JOIN Contacto con ON c.id_contacto = con.id_contacto
                WHERE c.id_cotizacion = ?
            ");
            $stmt_data->execute([$id]);
            $datos = $stmt_data->fetch();

            if (!$datos) {
                throw new Exception("No se encontraron datos de la cotización.");
            }
            $total_cotizacion = $datos['total'];
            $id_empresa = $datos['id_empresa'];

            // 2. Actualizar el estado de la cotización a "Aceptada"
            $sql_update_cot = "UPDATE Cotizacion SET estado_cotizacion = 'Aceptada' WHERE id_cotizacion = ?";
            $pdo->prepare($sql_update_cot)->execute([$id]);

            // 3. Calcular la nueva fecha de vencimiento (1 mes desde HOY)
            $stmt_fecha = $pdo->query("SELECT (now() + INTERVAL 1 MONTH) AS fecha_vencimiento");
            $fecha_vencimiento = $stmt_fecha->fetchColumn();

            // 4. Insertar el nuevo servicio activo
            // estado_actual_pago y estado_documentacion se ponen 'Pendiente'
            $sql_insert_servicio = "
                INSERT INTO ServiciosActivos 
                    (id_cotizacion, id_empresa, monto_mensual, fecha_proximo_vencimiento, estado_actual_pago, estado_documentacion) 
                VALUES 
                    (?, ?, ?, ?, 'Pendiente', 'Pendiente')
            ";
            $pdo->prepare($sql_insert_servicio)->execute([
                $id,
                $id_empresa,
                $total_cotizacion,
                $fecha_vencimiento
            ]);
            
            // 5. Confirmar transacción
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => '¡Cotización aceptada! Nuevo servicio activo creado.']);


        } elseif ($modo === 'eliminar_cotizacion') {
            // --- MODO: ELIMINAR COTIZACIÓN ---
            $id = $data->id_cotizacion ?? 0;
            if (empty($id)) {
                throw new Exception("Falta ID para eliminar la cotización.");
            }

            // 1. Chequeo de seguridad (no puedes borrar si tiene un servicio activo)
            $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM ServiciosActivos WHERE id_cotizacion = ?");
            $stmt_check->execute([$id]);
            if ($stmt_check->fetchColumn() > 0) {
                 throw new Exception("Error: No se puede eliminar una cotización que ya tiene un servicio activo. Debe cancelar el servicio primero.");
            }

            // 2. Borrar los "hijos" (DetalleCotizacion)
            $stmt_del_det = $pdo->prepare("DELETE FROM DetalleCotizacion WHERE id_cotizacion = ?");
            $stmt_del_det->execute([$id]);

            // 3. Borrar el "padre" (Cotizacion)
            $stmt_del_cot = $pdo->prepare("DELETE FROM Cotizacion WHERE id_cotizacion = ?");
            $stmt_del_cot->execute([$id]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Cotización eliminada con éxito']);

        } else {
            throw new Exception("Modo POST no reconocido.");
        }

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500); 
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>