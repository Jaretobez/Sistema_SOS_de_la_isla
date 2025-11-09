<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contacto extends Model
{
    protected $table = 'Contacto';
    protected $primaryKey = 'id_contacto';
    public $timestamps = false;
    protected $fillable = ['id_empresa','nombre','email','telefono','fecha_registro_contacto'];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }
}

