<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $fillable = [
        'nombre_comercial','razon_social','tipo','id_ruta','direccion'
    ];

    public function contactos()
    {
        return $this->hasMany(Contacto::class);
    }

    public function contactoPrincipal()
    {
        return $this->hasOne(Contacto::class)->where('es_principal', true);
    }
}
