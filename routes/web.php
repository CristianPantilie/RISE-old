<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::group(['prefix' => 'portal'], function () {
	Route::get('/', 'FrontendController@index');
});

Route::group(['prefix' => 'admin'], function () {
    Voyager::routes();

    Route::get('voyager/sensor-data/relation', 'Admin\DataController@sensorDataSourceRelation')->name('voyager.sensor-data.relation');

    Route::get('get-sensor-info/{id}', 'Admin\DataController@getSensorInfo')->name('get-sensor-info');
});

Route::get('/{slug?}', 'FrontendController@page');


