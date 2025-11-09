<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmpresaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
 public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nombre_comercial' => 'required|string|max:255',
            'razon_social'     => 'nullable|string|max:255',
            'tipo'             => 'nullable|string|max:100',
            'direccion'        => 'nullable|string|max:500',
            'id_ruta'          => 'nullable|string|max:50',
            'fecha_creacion'   => 'nullable|date',

            // contactos[] como arreglos paralelos
            'contactos.nombre.*'   => 'required|string|max:255',
            'contactos.email.*'    => 'nullable|email|max:255',
            'contactos.telefono.*' => 'nullable|string|max:20',
            'contactos.id.*'       => 'nullable|integer',
        ];
}
}
