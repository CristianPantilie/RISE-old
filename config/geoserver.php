<?php

return [
    'url'       => 'http://lter.ro',
    'api_url'   => 'http://lter.ro:8080/geoserver/rest',
    'wms_url'   => 'http://lter.ro:8080/geoserver/wms?',

    'user'      => 'admin',
    'password'  => 'geoserver',

    'workspace' => 'RISE',
    'stores'    => [
        'regions'   => 'regions',
        'satellite' => 'satellite'
    ],
];