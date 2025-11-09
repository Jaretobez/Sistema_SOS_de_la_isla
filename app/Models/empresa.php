<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $table = 'Empresa';
    protected $primaryKey = 'id_empresa';
    public $timestamps = false;
    protected $fillable = ['nombre_comercial','razon_social','tipo','direccion','id_ruta','fecha_creacion'];

    public function contactos()
    {
        return $this->hasMany(Contacto::class, 'id_empresa', 'id_empresa');
    }

    public function contactoPrincipal()
    {
        return $this->hasOne(Contacto::class, 'id_empresa', 'id_empresa')->orderBy('id_contacto', 'asc');
    }
}


