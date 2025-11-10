<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'producto';           // <- importante
    protected $primaryKey = 'id_producto';   // <- importante
    public $timestamps = false;

    protected $fillable = [
        'sku','descripcion','unidad','precio_unitario'
    ];

    public function detalles()
    {
        return $this->hasMany(DetalleCotizacion::class, 'id_producto', 'id_producto');
    }
}
