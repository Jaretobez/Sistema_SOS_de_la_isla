<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
 public function run(): void
    {
        // ESTE ES EL BLOQUE QUE CAMBIA:
        Schema::disableForeignKeyConstraints();
        DB::table('Producto')->truncate();
        Schema::enableForeignKeyConstraints();

        // Inserta los productos
        // Inserta los productos
        DB::table('Producto')->insert([
            [
                'sku' => 'BOTE-G',
                'descripcion' => 'Bote de Basura Grande (200L)',
                'unidad' => 'Pieza',
                'precio_unitario' => 1500.00,
                'created_at' => now(), // Añadido por si usas timestamps
                'updated_at' => now()
            ],
            [
                'sku' => 'BOTE-P',
                'descripcion' => 'Bote de Basura Pequeño (80L)',
                'unidad' => 'Pieza',
                'precio_unitario' => 850.00,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }
}
