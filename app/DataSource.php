<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class DataSource extends Model
{
    protected $table = 'data_sources';

    public function category()
    {
        return $this->belongsTo('App\Category', 'category_id');
    }

    public function sensors()
    {
        return $this->hasMany('App\Sensor', 'data_source_id');
    }

    public function region()
    {
        return $this->belongsTo('App\Region', 'region_id');
    }
}
