<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class sistema_sos extends Model
{
    protected $table = 'empresa';
    protected $primarykey ='ID_EMPRESA';
    public $timestamps = false;

    protected $fillable = [
        'EMPRESA',
        'RAZON_SOCIAL'
    ];

    // funcion para buscar empresas por nombre
    public static function buscarPorNombre($nombre){
        return self::where('EMPRESA', 'LIKE', "%{$nombre}%")
            ->orWhere('RAZON_SOCIAL', 'LIKE', "%{$nombre}%")
            ->get();
    }
}
