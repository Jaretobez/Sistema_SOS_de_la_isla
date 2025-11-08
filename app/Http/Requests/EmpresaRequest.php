<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmpresaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
public function authorize(): bool
{
    return true;
}

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
public function rules(): array
{
    return [
        'empresa.nombre_comercial' => ['required','string','max:255'],
        'empresa.razon_social'     => ['nullable','string','max:255'],
        'empresa.tipo'             => ['nullable','string','max:50'],
        'empresa.id_ruta'          => ['nullable','integer'],
        'empresa.direccion'        => ['nullable','string','max:500'],

        'contactos'                => ['required','array','min:1'],
        'contactos.*.id_contacto'  => ['nullable','integer','exists:contactos,id'],
        'contactos.*.nombre'       => ['required','string','max:255'],
        'contactos.*.email'        => ['required','email','max:255'],
        'contactos.*.telefono'     => ['nullable','string','max:50'],
    ];
}
}
