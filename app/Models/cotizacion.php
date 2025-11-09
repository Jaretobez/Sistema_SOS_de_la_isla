<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cotizacion extends Model
{
    protected $table = 'Cotizacion';
    protected $primaryKey = 'id_cotizacion';
    public $timestamps = false;

    protected $fillable = [
        'folio','id_empresa','id_contacto','forma_de_pago',
        'total','estado_cotizacion','fecha_creacion','fecha_vencimiento'
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    public function detalles()
    {
        return $this->hasMany(CotizacionDetalle::class, 'id_cotizacion', 'id_cotizacion');
    }
}
