<?php
/**
 * API PARA LA GESTIÓN DE DOCUMENTOS
 * - GET: Lee documentos.
 * - POST: Sube documentos (y borra los viejos si existen para no llenar el servidor).
 */

// 1. CONFIGURACIÓN (Errores ocultos para no romper JSON)
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once '../php/conexion.php'; 

try {
    // 2. DEFINIR RUTAS
    // $baseDir será la raíz del proyecto (la carpeta padre de 'api')
    $baseDir = dirname(__DIR__); 
    $uploadDir = $baseDir . '/uploads/';

    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception("No se pudo crear la carpeta uploads.");
        }
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // ==========================================
    // MODO GET: LEER (Para el Modal)
    // ==========================================
    if ($method === 'GET') {
        $accion = $_GET['accion'] ?? '';

        if ($accion === 'leer_documentos') {
            $id_servicio = $_GET['id_servicio'] ?? 0;
            if (!$id_servicio) throw new Exception("Falta ID de servicio");

            $stmt = $pdo->prepare("SELECT tipo_documento, path_archivo, estado_validacion FROM documentos WHERE id_servicio = ?");
            $stmt->execute([$id_servicio]);
            $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'documentos' => $docs]);
            exit;
        }
    }

    // ==========================================
    // MODO POST: SUBIR (Sobreescribiendo)
    // ==========================================
    if ($method === 'POST') {
        $accion = $_POST['accion'] ?? '';

        if ($accion === 'subir_documentos') {
            handle_subida($pdo, $baseDir, $uploadDir);
        } else {
            throw new Exception("Acción no válida.");
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}


// --- FUNCIÓN DE SUBIDA CON LIMPIEZA ---
function handle_subida($pdo, $baseDir, $uploadDir) {
    
    $id_servicio = $_POST['id_servicio'] ?? null;
    if (!$id_servicio) throw new Exception("Falta ID servicio.");

    $tiposEsperados = [
        'csf'   => 'Constancia de Situación Fiscal',
        'ine'   => 'Identificación Oficial (Rep.)',
        'poder' => 'Poder Notarial (Rep.)',
        'comp'  => 'Comprobante de Domicilio'
    ];

    $archivosSubidos = [];
    $errores = [];

    $pdo->beginTransaction();

    try {
        foreach ($tiposEsperados as $key => $nombreReal) {
            
            if (isset($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
                
                // 1. Datos del nuevo archivo
                $tmpName = $_FILES[$key]['tmp_name'];
                $ext = strtolower(pathinfo($_FILES[$key]['name'], PATHINFO_EXTENSION));

                if (!in_array($ext, ['pdf', 'jpg', 'jpeg', 'png'])) {
                    $errores[] = "Formato inválido en $nombreReal";
                    continue;
                }

                // 2. Verificar si ya existía uno viejo en la BD
                $stmtCheck = $pdo->prepare("SELECT id_documento, path_archivo FROM documentos WHERE id_servicio = ? AND tipo_documento = ?");
                $stmtCheck->execute([$id_servicio, $nombreReal]);
                $docExistente = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                // 3. SI EXISTE UNO VIEJO: BORRARLO DEL SERVIDOR
                if ($docExistente) {
                    // Construimos la ruta física completa del archivo viejo
                    // $docExistente['path_archivo'] es algo como "uploads/archivo_viejo.pdf"
                    $archivoViejoFisico = $baseDir . '/' . $docExistente['path_archivo'];
                    
                    if (file_exists($archivoViejoFisico)) {
                        unlink($archivoViejoFisico); // <--- ESTO BORRA EL ARCHIVO VIEJO
                    }
                }

                // 4. Preparar el nuevo
                // Usamos time() para el nombre sea único y evitar caché del navegador
                $nuevoNombre = "{$id_servicio}_{$key}_" . time() . ".{$ext}";
                $destinoFisico = $uploadDir . $nuevoNombre;
                $rutaBD = "uploads/" . $nuevoNombre;

                // 5. Mover el nuevo archivo
                if (move_uploaded_file($tmpName, $destinoFisico)) {
                    
                    if ($docExistente) {
                        // UPDATE: Reemplazamos la ruta vieja por la nueva en el mismo registro
                        $sql = "UPDATE documentos 
                                SET path_archivo = ?, fecha_subida = NOW(), estado_validacion = 'Pendiente' 
                                WHERE id_documento = ?";
                        $stmtUpdate = $pdo->prepare($sql);
                        $stmtUpdate->execute([$rutaBD, $docExistente['id_documento']]);
                    } else {
                        // INSERT: Es el primero
                        $sql = "INSERT INTO documentos (id_servicio, tipo_documento, path_archivo, estado_validacion, fecha_subida) 
                                VALUES (?, ?, ?, 'Pendiente', NOW())";
                        $stmtInsert = $pdo->prepare($sql);
                        $stmtInsert->execute([$id_servicio, $nombreReal, $rutaBD]);
                    }

                    $archivosSubidos[] = $nombreReal;
                } else {
                    $errores[] = "Error al guardar $nombreReal";
                }
            }
        }

        $pdo->commit();

        if (count($archivosSubidos) > 0) {
            echo json_encode([
                'success' => true, 
                'message' => 'Archivos actualizados: ' . implode(', ', $archivosSubidos),
                'errores' => $errores
            ]);
        } else {
            echo json_encode([
                'success' => false, 
                'error' => 'No se seleccionaron archivos.',
                'detalles' => $errores
            ]);
        }

    } catch (Exception $ex) {
        $pdo->rollBack();
        throw $ex;
    }
}
?>