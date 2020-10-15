<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Sensor extends Model
{
    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['data_points_number'];

    public function data_source()
    {
        return $this->belongsTo('App\DataSource', 'data_source_id');
    }

    public function data()
    {
        return $this->hasMany('App\SensorData', 'sensor_id');
    }

    public function getDataPointsNumberAttribute()
    {
        return $this->data->count();
    }
}
