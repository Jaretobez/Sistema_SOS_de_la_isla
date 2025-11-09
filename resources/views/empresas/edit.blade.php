@extends('layouts.app')
@section('title','Editar empresa')
@section('content')
<h2 class="text-lg font-semibold mb-4">Editar empresa</h2>

@if($errors->any())
  <div class="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded">
    <ul class="list-disc pl-5">
      @foreach($errors->all() as $e) <li>{{ $e }}</li> @endforeach
    </ul>
  </div>
@endif

<form method="POST" action="{{ route('empresas.update',$empresa) }}">
  @method('PUT')
  @include('empresas._form', ['empresa'=>$empresa])
</form>
@endsection
