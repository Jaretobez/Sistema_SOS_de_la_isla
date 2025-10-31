<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class empresa extends Model
{
     // Nombre de la tabla
    protected $table = 'empresas';

    // Clave primaria personalizada
    protected $primaryKey = 'id_empresa';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'nombre_empresa',
        'razon_social',
        'tipo',
        'direccion',
        'estado',
        'horario',
        'ruta'
    ];

    /**
     * Obtener todas las empresas con los campos específicos.
     */
    public static function obtenerEmpresas()
    {
        return self::select(
            'id_empresa',
            'nombre_empresa',
            'razon_social',
            'estado',
            'created_at'
        )->get();
    }
}