<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contacto extends Model
{
    protected $table = 'contacto';
    protected $primaryKey = 'id_contacto';
    public $timestamps = false;

    protected $fillable = [
        'id_empresa','nombre','email','telefono','fecha_registro_contacto'
    ];

    protected $casts = [
        'fecha_registro_contacto' => 'date',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    public function cotizaciones()
    {
        return $this->hasMany(Cotizacion::class, 'id_contacto', 'id_contacto');
    }
}


