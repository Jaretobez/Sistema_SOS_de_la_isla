@extends('layouts.app')
@section('usuario', auth()->user()->name ?? 'Vendedor')

@section('content')

@endsection