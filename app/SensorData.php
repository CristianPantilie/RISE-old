<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class SensorData extends Model
{
    protected $table = 'sensor_data';

    public function sensor()
    {
        return $this->belongsTo('App\Sensor', 'sensor_id');
    }
}
