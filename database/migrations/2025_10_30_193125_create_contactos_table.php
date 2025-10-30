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
        Schema::create('Contacto', function (Blueprint $table) {
            $table->id('id_contacto');
            $table->unsignedBigInteger('id_empresa'); // Llave Foránea
            $table->string('nombre', 255);
            $table->string('email', 255)->nullable()->unique();
            $table->string('telefono', 20)->nullable(); // VARCHAR es mejor que LONG para teléfonos
            $table->date('fecha_registro_contacto')->nullable();
            $table->timestamps();

            // Definición de la Llave Foránea
            $table->foreign('id_empresa')->references('id_empresa')->on('Empresa')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacto');
    }
};