<?php
/**
 * API PARA LA GESTIÓN DE FACTURACIÓN (SERVICIOS ACTIVOS)
 * Lee la lista de servicios y permite marcarlos como pagados.
 */

// 1. --- CONEXIÓN Y CONFIGURACIÓN ---
require_once '../conexion.php'; // (Ajusta la ruta a tu conexion.php)
header('Content-Type: application/json');

// 2. --- "ENRUTADOR" (ROUTER) ---
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // GET se usa para LEER la lista de servicios
        handle_get_request();
        break;
    case 'POST':
        // POST se usa para ACTUALIZAR el estado (marcar como pagado)
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

    // Asumimos que la única acción GET es leer la lista de servicios
    if ($accion === 'leer_servicios') {
        try {
            // Esta consulta une ServiciosActivos con Empresa para obtener el nombre
            $sql = "
                SELECT 
                    s.id_servicio, 
                    s.monto_mensual, 
                    s.fecha_proximo_vencimiento, 
                    s.estado_actual_pago,
                    e.nombre_comercial
                FROM 
                    ServiciosActivos s
                JOIN 
                    Empresa e ON s.id_empresa = e.id_empresa
                ORDER BY 
                    s.fecha_proximo_vencimiento ASC
            ";
            $stmt = $pdo->query($sql);
            $datos = $stmt->fetchAll();
            echo json_encode($datos);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error en la base de datos (GET): ' . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Acción GET no válida']);
    }
}

// 4. --- FUNCIÓN PARA ESCRIBIR DATOS (POST) ---
function handle_post_request() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'));
    $modo = $data->modo ?? null;

    if ($modo === 'marcar_pagado') {
        $id_servicio = $data->id_servicio ?? 0;
        if (empty($id_servicio)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Falta ID del servicio']);
            return;
        }

        $pdo->beginTransaction();
        try {
            // Actualiza el estado a "Pagado"
            $sql = "UPDATE ServiciosActivos 
                    SET estado_actual_pago = 'Pagado' 
                    WHERE id_servicio = ?";
            
            // (Nota: En un futuro, aquí también podrías actualizar
            // la 'fecha_proximo_vencimiento' sumándole un mes)
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id_servicio]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Servicio marcado como Pagado']);

        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Modo POST no reconocido']);
    }
}
?>