<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    public function data_sources()
    {
        return $this->hasMany('App\DataSource', 'region_id');
    }
}
