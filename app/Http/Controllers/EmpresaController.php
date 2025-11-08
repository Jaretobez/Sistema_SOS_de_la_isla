<?php

namespace App\Http\Controllers;

use App\Models\empresa;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreempresaRequest;
use App\Http\Requests\UpdateempresaRequest;

class EmpresaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('empresas.index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreempresaRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(empresa $empresa)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(empresa $empresa)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateempresaRequest $request, empresa $empresa)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(empresa $empresa)
    {
        //
    }
}
