<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cotizacion extends Model
{
    protected $table = 'Cotizacion';      // usa EXACTAMENTE el nombre real en la BD
    protected $primaryKey = 'id_cotizacion';
    public $timestamps = false;

    protected $fillable = [
        'id_contacto','forma_de_pago','total','estado_cotizacion','fecha_vencimiento'
    ];

    public function contacto()
    {
        return $this->belongsTo(Contacto::class, 'id_contacto', 'id_contacto');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleCotizacion::class, 'id_cotizacion', 'id_cotizacion');
    }

    public function servicioActivo()
    {
        return $this->hasOne(ServiciosActivos::class, 'id_cotizacion', 'id_cotizacion');
    }
}
