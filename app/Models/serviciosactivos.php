<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiciosActivos extends Model
{
    protected $table = 'serviciosactivos';
    protected $primaryKey = 'id_servicio';
    public $timestamps = false;

    protected $fillable = [
        'id_cotizacion','id_empresa','monto_mensual',
        'estado_actual_pago','fecha_proximo_vencimiento','estado_documentacion'
    ];

    protected $casts = [
        'monto_mensual' => 'decimal:2',
        'fecha_proximo_vencimiento' => 'date',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class, 'id_cotizacion', 'id_cotizacion');
    }

    public function documentos()
    {
        return $this->hasMany(Documentos::class, 'id_servicio', 'id_servicio');
    }
}
