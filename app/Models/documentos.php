<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Documentos extends Model
{
    protected $table = 'documentos';
    protected $primaryKey = 'id_documento';
    public $timestamps = false;

    protected $fillable = [
        'id_servicio','tipo_documento','path_archivo','estado_validacion',
        'observaciones','fecha_subida','fecha_revision'
    ];

    protected $casts = [
        'fecha_subida' => 'datetime',
        'fecha_revision' => 'datetime',
    ];

    public function servicio()
    {
        return $this->belongsTo(ServiciosActivos::class, 'id_servicio', 'id_servicio');
    }
}
