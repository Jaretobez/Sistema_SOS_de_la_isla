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
        Schema::create('contacto', function (Blueprint $table) {
            $table->integer('id_contacto', true);
            $table->integer('id_empresa')->index('id_empresa');
            $table->string('nombre');
            $table->string('email')->nullable();
            $table->string('telefono', 20)->nullable();
            $table->date('fecha_registro_contacto')->nullable();
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
