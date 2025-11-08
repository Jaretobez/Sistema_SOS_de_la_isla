namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmpresaRequest;
use App\Models\Empresa;
use App\Models\Contacto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmpresaApiController extends Controller
{
    // GET /api/empresas?termino=
    public function index(Request $request)
    {
        $t = trim($request->query('termino', ''));

        $q = Empresa::query()
            ->with(['contactoPrincipal:id,empresa_id,nombre,email,telefono,es_principal'])
            ->select('id','nombre_comercial','razon_social','tipo','id_ruta','direccion','created_at');

        if ($t !== '') {
            $q->where(function($w) use ($t) {
                $w->where('nombre_comercial','like',"%$t%")
                  ->orWhere('razon_social','like',"%$t%");
            })->orWhereHas('contactos', function($w) use ($t) {
                $w->where('nombre','like',"%$t%")
                  ->orWhere('email','like',"%$t%");
            });
        }

        $empresas = $q->latest()->get()->map(function($e){
            return [
                'id_empresa'        => $e->id,
                'nombre_comercial'  => $e->nombre_comercial,
                'razon_social'      => $e->razon_social,
                'contacto_nombre'   => optional($e->contactoPrincipal)->nombre,
                'contacto_email'    => optional($e->contactoPrincipal)->email,
                'contacto_telefono' => optional($e->contactoPrincipal)->telefono,
            ];
        });

        return response()->json($empresas);
    }

    // GET /api/empresas/{id}
    public function show(Empresa $empresa)
    {
        return response()->json([
            'empresa'   => $empresa->only(['id','nombre_comercial','razon_social','tipo','id_ruta','direccion']),
            'contactos' => $empresa->contactos()->get(['id as id_contacto','nombre','email','telefono','es_principal']),
        ]);
    }

    // POST /api/empresas  (crear)
    public function store(EmpresaRequest $request)
    {
        $data = $request->validated();
        return DB::transaction(function () use ($data) {
            $empresa = Empresa::create($data['empresa']);

            // el primero será principal si ninguno viene marcado
            $first = true;
            foreach ($data['contactos'] as $c) {
                $empresa->contactos()->create([
                    'nombre'       => $c['nombre'],
                    'email'        => $c['email'],
                    'telefono'     => $c['telefono'] ?? null,
                    'es_principal' => $first, // marca el primero
                ]);
                $first = false;
            }

            return response()->json([
                'success' => true,
                'message' => 'Empresa creada',
                'id'      => $empresa->id,
            ], 201);
        });
    }

    // PUT /api/empresas/{empresa}  (actualizar)
    public function update(EmpresaRequest $request, Empresa $empresa)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($empresa, $data) {
            $empresa->update($data['empresa']);

            // Sincroniza contactos:
            $idsVivos = [];
            $isFirst = true;
            foreach ($data['contactos'] as $c) {
                if (!empty($c['id_contacto'])) {
                    $contacto = Contacto::where('empresa_id',$empresa->id)
                        ->where('id',$c['id_contacto'])->first();
                    if ($contacto) {
                        $contacto->update([
                            'nombre'=>$c['nombre'],
                            'email'=>$c['email'],
                            'telefono'=>$c['telefono'] ?? null,
                            'es_principal'=>$isFirst,
                        ]);
                        $idsVivos[] = $contacto->id;
                    }
                } else {
                    $nuevo = $empresa->contactos()->create([
                        'nombre'=>$c['nombre'],
                        'email'=>$c['email'],
                        'telefono'=>$c['telefono'] ?? null,
                        'es_principal'=>$isFirst,
                    ]);
                    $idsVivos[] = $nuevo->id;
                }
                $isFirst = false;
            }

            // elimina los que ya no vienen
            $empresa->contactos()->whereNotIn('id',$idsVivos)->delete();

            return response()->json(['success'=>true,'message'=>'Empresa actualizada']);
        });
    }

    // DELETE /api/empresas/{empresa}
    public function destroy(Empresa $empresa)
    {
        $empresa->delete();
        return response()->json(['success'=>true,'message'=>'Empresa eliminada']);
    }
}
