<?php

namespace App\Http\Controllers;

use App\Category;
use App\DataSource;
use App\Region;
use App\Sensor;
use App\SensorData;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Spatie\Url\Url;

class ApiController extends Controller
{
    public function getMapData()
    {
        $regions = Region::orderBy('name', 'asc')->get();
        $layers = SensorData::whereNotNull('layer')->with('sensor.data_source')->get();

        $response = [
            'regions'   => $regions,
            'layers'    => $layers,
        ];

        return collect($response);
    }

    public function getCategories()
    {
        //$regions = Region::with(['data_sources.category', 'data_sources.sensors'])->get();
        $categories = Category::whereNull('parent_id')->with(['data_sources.sensors', 'data_sources.region'])->get();

        $response = [
            'categories'   => $categories
        ];

        return collect($response);
    }

    public function getSensorData($id, $timestamp)
    {
        if ($timestamp) {
            $sensor = Sensor::with(['data_source.category', 'data' => function ($query) use ($timestamp) {
                $query->whereRaw('DATE(timestamp) = \'' . $timestamp . '\'');
            }])->find($id);
        } else {
            $sensor = Sensor::with(['data_source.category'])->find($id);
        }

        if (!$sensor) {
            abort(404);
        }

        /*
        $client = new Client();

        $response = $client->request('GET', 'http://141.85.164.8:8080/geoserver/rest/workspaces/RISE/coveragestores/satellite/coverages/LC08_20160501_NDVI.json', [
            'auth' => [config('geoserver.user'), config('geoserver.password')]
        ]);

        $layerData = json_decode($response->getBody(), true);

        $bbox = $layerData['coverage']['latLonBoundingBox'];

        $polygon = [
            [
                [$bbox['minx'], $bbox['miny']],
                [$bbox['minx'], $bbox['maxy']],
                [$bbox['maxx'], $bbox['maxy']],
                [$bbox['maxx'], $bbox['miny']],
                [$bbox['minx'], $bbox['miny']],
            ]
        ];

        $sensor->polygon = $polygon;
        */

        $response = [
            'sensorData'   => $sensor,
        ];

        return collect($response);
    }

    public function getAvailableDates($id)
    {
        $data = SensorData::where('sensor_id', $id)->select('timestamp')->get();

        $response = [
            'sensor' => (int)$id,
            'dates' => $data
        ];

        return collect($response);
    }

    public function getFeaturesInfo()
    {
        try {
            $client = new Client();

            $response = $client->request('GET', config('geoserver.api_url') . '/workspaces/' . config('geoserver.workspace') . '/coveragestores/' . config('geoserver.stores.satellite') . '/coverages/LC08_20160501_NDVI.json', [
                'auth' => [config('geoserver.user'), config('geoserver.password')],
                'query' => [
                    'list' => 'available',
                ]
            ]);

            return $response;

            /*
            if ($response->getStatusCode() == 201) {

            }
            */
        }
        catch (\GuzzleHttp\Exception\GuzzleException $e) {
            return $e;
        }
    }

    public function getFeatures(Request $request)
    {
        if ($request->has('url')) {
            try {
                $client = new Client();

                $response = $client->request('GET', $request->get('url'), [
                    'auth' => [config('geoserver.user'), config('geoserver.password')]
                ]);

                if ($response->getStatusCode() != 200) {
                    abort(404);
                }

                return $response->getBody();

            } catch (\GuzzleHttp\Exception\GuzzleException $e) {
                return $e;
            }
        } else {
            abort(404);
        }
    }

    public function getTimeSeries(Request $request)
    {
        if ($request->has('dates') && $request->has('sensor')) {
            if ($request->has('url') && !empty($request->get('url'))) {

                $data = SensorData::selectRaw('layer, DATE(timestamp) as `date`')->where('sensor_id', $request->get('sensor')['id'])->whereRaw("DATE(timestamp) BETWEEN '" . $request->get('dates')['start'] . "' AND '" . $request->get('dates')['end'] . "'")->orderBy('timestamp', 'asc')->get();

                if ($data) {
                    $points = [];
                    foreach ($data as $layer) {
                        $layerUrl = $request->get('url') . '&LAYERS=' . $layer->layer . '&QUERY_LAYERS=' . $layer->layer;

                        try {
                            $client = new Client();

                            $response = $client->request('GET', $layerUrl, [
                                'auth' => [config('geoserver.user'), config('geoserver.password')]
                            ]);

                            if ($response->getStatusCode() != 200) {
                                abort(404);
                            }

                            //var_dump(json_encode((string)$response->getBody()));
                            $responseData = json_decode($response->getBody()->getContents());

                            foreach ($responseData->features as $feature) {
                                if ($feature && $feature->properties) {
                                    foreach ($feature->properties as $property => $value) {
                                        if ($value && ($property !== 'Band2' && $property !== 'ALPHA_CHANNEL')) {
                                            $points[$property][] = [
                                                'value' => $value,
                                                'timestamp' => $layer->date
                                            ];
                                        }
                                    }
                                }
                            }

                        } catch (\GuzzleHttp\Exception\GuzzleException $e) {
                            return $e;
                        }

                    }

                    return $points;

                } else {
                    abort(404);
                }
            } else {
                $sensor = Sensor::find($request->get('sensor')['id']);

                if (!$sensor) {
                    abort(404,'Sensor not found');
                }

                $data = SensorData::select(['value', 'timestamp'])->where('sensor_id', $request->get('sensor')['id'])->whereRaw("DATE(timestamp) BETWEEN '" . $request->get('dates')['start'] . "' AND '" . $request->get('dates')['end'] . "'")->orderBy('timestamp', 'asc')->get();

                $property = $sensor->name;
                $var = ($sensor->variable) ? $sensor->variable . ' ' : ' ';

                if ($sensor->unit) {
                    $var .= '(' . $sensor->unit . ')';
                }

                $property .= ' ' . $var;

                return [$property => $data];
            }

        } else {
            abort(404);
        }
    }

    public function saveLayer(Request $request)
    {
        if (!$request->hasFile('file') || !$request->has('timestamp') || !$request->has('sensor_id')) {
            return "Invalid args";
            abort(404, "Invalid arguments");
        }

        try {
            $client = new Client();

            $layerName = pathinfo($request->file('file')->getClientOriginalName());

            $layerName = $layerName['filename'];

            $filename = uniqid();


            $response = $client->request('PUT', config('geoserver.api_url') . '/workspaces/' . config('geoserver.workspace') . '/coveragestores/' . config('geoserver.stores.satellite') . $filename . '/file.geotiff', [
                'auth' => [config('geoserver.user'), config('geoserver.password')],
                'body' => fopen($request->file('file')->getPathname(), 'r'),
                'query' => [
                    'configure' => 'all',
                    'coverageName' => $layerName,
                    'filename' => $filename . '.tiff'
                ],
                'headers' => [
                    'Content-Type' => 'image/tiff',
                ]
            ]);

            if ($response->getStatusCode() == 201) {
                $data = new SensorData();

                $data->timestamp = Carbon::createFromFormat('Y-m-d', $request->get('timestamp'));
                $data->layer = $layerName;
                $data->sensor_id = $request->get('sensor_id');

                if ($data->save()) {
                    return response()->json(['success' => true, 'data' => $data]);
                } else {
                    return "Not saved";
                    abort(404, "Unexpected error");
                }

            }
        }
        catch (\GuzzleHttp\Exception\GuzzleException $e) {
            return $e->getMessage();
            abort(404, $e->getMessage());
        }
    }

    public function getStations($region, $category) {
        $stations = DataSource::where('category_id', $category)->where('region_id', $region)->where('visible', 1)->get();
        return $stations;
    }

    public function getStation($id) {
        $stations = DataSource::where('id', $id)->get();
        return $stations;
    }
}
