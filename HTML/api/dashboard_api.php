<?php
/**
 * API PARA EL DASHBOARD
 * Carga todos los KPIs (indicadores) y la tabla de cotizaciones recientes.
 */

// 1. --- CONEXIÓN Y CONFIGURACIÓN ---
require_once '../conexion.php'; // (Ajusta la ruta a tu conexion.php)
header('Content-Type: application/json');

// 2. --- "ENRUTADOR" (ROUTER) ---
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // El dashboard solo necesita leer datos
        handle_get_request();
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

    if ($accion === 'leer_dashboard') {
        try {
            // Un array para guardar todos los resultados
            $respuesta = [];

            // --- 1. KPI: Cotizaciones Pendientes ---
            $stmt1 = $pdo->query("SELECT COUNT(*) FROM Cotizacion WHERE estado_cotizacion = 'Pendiente'");
            $respuesta['kpi_cot_pendientes'] = $stmt1->fetchColumn();

            // --- 2. KPI: Clientes Activos (Servicios Activos) ---
            $stmt2 = $pdo->query("SELECT COUNT(*) FROM ServiciosActivos");
            $respuesta['kpi_serv_activos'] = $stmt2->fetchColumn();

            // --- 3. KPI: Pagos Pendientes ---
            $stmt3 = $pdo->query("SELECT COUNT(*) FROM ServiciosActivos WHERE estado_actual_pago = 'Pendiente'");
            $respuesta['kpi_pagos_pendientes'] = $stmt3->fetchColumn();

            // --- 4. Tabla: 5 Cotizaciones Recientes (con nombre de empresa) ---
            // (Usamos id_cotizacion DESC para obtener las más nuevas)
            $stmt4 = $pdo->query("
                SELECT 
                    c.id_cotizacion, c.total, c.estado_cotizacion, c.fecha_vencimiento,
                    e.nombre_comercial
                FROM Cotizacion c
                JOIN Contacto con ON c.id_contacto = con.id_contacto
                JOIN Empresa e ON con.id_empresa = e.id_empresa
                ORDER BY c.id_cotizacion DESC
                LIMIT 5
            ");
            $respuesta['tabla_recientes'] = $stmt4->fetchAll();
            
            // Devolvemos todo en un solo JSON
            echo json_encode(['success' => true, 'data' => $respuesta]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error en la base de datos (GET): ' . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Acción GET no válida']);
    }
}
?>