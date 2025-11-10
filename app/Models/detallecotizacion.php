<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleCotizacion extends Model
{
    protected $table = 'detallecotizacion';
    protected $primaryKey = 'id_detalle';
    public $timestamps = false;

    protected $fillable = [
        'id_cotizacion','id_producto','cantidad','precio_unitario',
        'lunes','martes','miercoles','jueves','viernes',
        'tipo_residuo','bolsas_por_dia','peso_por_bolsa_kg'
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'lunes' => 'boolean','martes' => 'boolean','miercoles' => 'boolean',
        'jueves' => 'boolean','viernes' => 'boolean',
        'peso_por_bolsa_kg' => 'decimal:2',
    ];

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class, 'id_cotizacion', 'id_cotizacion');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }
}

