<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Aquí llamas a todos tus seeders
        $this->call([
            ProductoSeeder::class,
            // Aquí puedes añadir más seeders, ej:
            // EmpresaSeeder::class,
            // ContactoSeeder::class,
        ]);
    }
}
