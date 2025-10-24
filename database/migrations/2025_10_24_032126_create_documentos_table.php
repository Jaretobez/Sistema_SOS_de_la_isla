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
        Schema::create('Documentos', function (Blueprint $table) {
            $table->id('id_documento'); // Usamos id_documento (singular)
            $table->unsignedBigInteger('id_servicio'); // Llave Foránea
            $table->string('tipo_documento', 100);
            $table->string('path_archivo', 500)->nullable(); // 'path' es más estándar
            $table->string('estado_validacion', 50)->default('Pendiente');
            $table->text('observaciones')->nullable(); // Corregido de 'obsrevacion'
            $table->dateTime('fecha_subida')->nullable(); // DATETIME para más precisión
            $table->dateTime('fecha_revision')->nullable(); // DATETIME para más precisión
            $table->timestamps();

            // Definición de la Llave Foránea
            $table->foreign('id_servicio')->references('id_servicio')->on('ServiciosActivos')->onDelete('cascade');
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
