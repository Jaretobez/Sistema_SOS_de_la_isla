<?php
/**
 * API PARA LA PÁGINA DE PERFIL
 * Carga todos los datos de una empresa (info, contactos, servicio, detalles)
 * y maneja la cancelación de servicios.
 */

// 1. --- CONEXIÓN Y CONFIGURACIÓN ---
//
// ¡¡¡PUNTO CRÍTICO!!!
// Asegúrate de que esta ruta sea 100% correcta.
// Debe ser idéntica a la que usaste en 'empresas_api.php' y 'cotizaciones_api.php'.
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
    global $pdo; // $pdo viene de 'conexion.php'
    $accion = $_GET['accion'] ?? null;

    if ($accion === 'leer_perfil') {
        $id_empresa = $_GET['id'] ?? 0;
        if (empty($id_empresa)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No se proporcionó ID de empresa']);
            return;
        }

        try {
            $respuesta = [];

            // 1. Obtener datos de la Empresa
            $stmt_emp = $pdo->prepare("SELECT * FROM Empresa WHERE id_empresa = ?");
            $stmt_emp->execute([$id_empresa]);
            $empresa = $stmt_emp->fetch();
            
            // ¡Esta es la comprobación que te da el error!
            if (!$empresa) {
                throw new Exception("No se encontró la empresa con ID $id_empresa.");
            }
            $respuesta['empresa'] = $empresa;

            // 2. Obtener TODOS los Contactos
            $stmt_con = $pdo->prepare("SELECT * FROM Contacto WHERE id_empresa = ? ORDER BY id_contacto ASC");
            $stmt_con->execute([$id_empresa]);
            $respuesta['contactos'] = $stmt_con->fetchAll();

            // 3. Obtener el Servicio Activo (el más reciente, si existe)
            $stmt_ser = $pdo->prepare("
                SELECT * FROM ServiciosActivos 
                WHERE id_empresa = ? 
                ORDER BY id_servicio DESC 
                LIMIT 1
            ");
            $stmt_ser->execute([$id_empresa]);
            $servicio = $stmt_ser->fetch();
            $respuesta['servicio'] = $servicio; // Será 'false' si no hay

            // 4. Obtener los detalles del servicio (si existe)
            $respuesta['detalle_servicio'] = false; // Por defecto
            if ($servicio) {
                // Buscamos el detalle de la cotización que generó este servicio
                // Asumimos que P-001 (o ID 1) es el producto de servicio
                // ¡¡ASEGÚRATE DE TENER UN PRODUCTO CON ID 1!!
                $stmt_det = $pdo->prepare("
                    SELECT * FROM DetalleCotizacion 
                    WHERE id_cotizacion = ? AND id_producto = 1 
                    LIMIT 1 
                "); // (Ajusta 'id_producto = 1' si es diferente)
                $stmt_det->execute([$servicio['id_cotizacion']]);
                $respuesta['detalle_servicio'] = $stmt_det->fetch();
            }

            echo json_encode($respuesta);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
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

    if ($modo === 'cancelar_servicio') {
        $id_servicio = $data->id_servicio ?? 0;
        if (empty($id_servicio)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Falta ID del servicio']);
            return;
        }

        $pdo->beginTransaction();
        try {
            // 1. Borrar documentos (hijos)
            $stmt_docs = $pdo->prepare("DELETE FROM Documentos WHERE id_servicio = ?");
            $stmt_docs->execute([$id_servicio]);
            
            // 2. Borrar servicio (padre)
            $stmt_serv = $pdo->prepare("DELETE FROM ServiciosActivos WHERE id_servicio = ?");
            $stmt_serv->execute([$id_servicio]);

            // (Opcional: podrías cambiar el estado de la cotización a 'Cancelada' o 'Archivada')

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Servicio cancelado con éxito']);
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