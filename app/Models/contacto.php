<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contacto extends Model
{
    protected $fillable = ['empresa_id','nombre','email','telefono','es_principal'];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }
}
