<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('documentos', function (Blueprint $table) {
            $table->integer('id_documento', true);
            $table->integer('id_servicio')->index('id_servicio');
            $table->string('tipo_documento', 100);
            $table->string('path_archivo', 500)->nullable();
            $table->string('estado_validacion', 50)->nullable()->default('Pendiente');
            $table->text('observaciones')->nullable();
            $table->dateTime('fecha_subida')->nullable();
            $table->dateTime('fecha_revision')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documentos');
    }
};
