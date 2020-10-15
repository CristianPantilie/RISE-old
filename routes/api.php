<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/



Route::middleware('api')->get('/map-data', 'ApiController@getMapData');
Route::middleware('api')->get('/categories', 'ApiController@getCategories');
Route::middleware('api')->get('/sensor-data/{id}/{timestamp?}', 'ApiController@getSensorData');
Route::middleware('api')->get('/dates/{id}', 'ApiController@getAvailableDates');
Route::middleware('api')->post('/features', 'ApiController@getFeatures');
Route::middleware('api')->post('/time-series', 'ApiController@getTimeSeries');

Route::middleware('api')->post('/save-layer', 'ApiController@saveLayer');
Route::middleware('api')->get('/stations/{region}/{category}', 'ApiController@getStations');
Route::middleware('api')->get('/station/{id}', 'ApiController@getStation');

Route::middleware('api')->get('/sensor/{id}', 'ApiController@getSensor');


// Test

Route::middleware('api')->get('/features-info', 'ApiController@getFeaturesInfo');

