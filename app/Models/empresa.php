<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $table = 'empresa';
    protected $primaryKey = 'id_empresa';
    public $timestamps = false;

    protected $fillable = [
        'nombre_comercial','razon_social','tipo','direccion','id_ruta','fecha_creacion'
    ];

    protected $casts = [
        'fecha_creacion' => 'date',
    ];

    // Relaciones
    public function contactos()
    {
        return $this->hasMany(Contacto::class, 'id_empresa', 'id_empresa');
    }

    public function serviciosActivos()
    {
        return $this->hasMany(ServiciosActivos::class, 'id_empresa', 'id_empresa');
    }

    // Contacto principal (mín id_contacto por empresa)
    public function contactoPrincipal()
    {
        return $this->hasOne(Contacto::class, 'id_empresa', 'id_empresa')
                    ->orderBy('id_contacto', 'asc');
    }
}


