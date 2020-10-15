<?php

namespace App\Http\Controllers\Admin;

use App\Sensor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use InvalidArgumentException;
use League\Csv\Reader;
use TCG\Voyager\Http\Controllers\VoyagerBaseController;
use Illuminate\Support\Facades\DB;
use TCG\Voyager\Database\Schema\SchemaManager;
use TCG\Voyager\Events\BreadDataAdded;
use TCG\Voyager\Events\BreadDataDeleted;
use TCG\Voyager\Events\BreadDataUpdated;
use TCG\Voyager\Events\BreadImagesDeleted;
use TCG\Voyager\Facades\Voyager;
use TCG\Voyager\Http\Controllers\Traits\BreadRelationshipParser;
use GuzzleHttp\Client;

class DataController extends VoyagerBaseController
{
    /**
     * POST BRE(A)D - Store data.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function store(Request $request)
    {
        $slug = $this->getSlug($request);
        $dataType = Voyager::model('DataType')->where('slug', '=', $slug)->first();
        // Check permission
        $this->authorize('add', app($dataType->model_name));
        // Validate fields with ajax
        $val = $this->validateBread($request->all(), $dataType->addRows);
        if ($val->fails()) {
            if ($request->ajax()) {
                return response()->json(['errors' => $val->messages()]);
            }
            return redirect()
                ->back()
                ->withErrors($val->messages());
        }

        if (!$request->hasFile('file')) {
            return redirect()
                ->route("voyager.{$dataType->slug}.create")
                ->withErrors(['Please upload the data file']);
        }

        try {
            $client = new Client();

            $fileInfo = pathinfo($request->file('file')->getClientOriginalName());

            if ($fileInfo['extension'] === 'csv') {
                if (!$request->has('_validate')) {
                    $uploadedFile = $request->file('file');
                    $csv = Reader::createFromPath($uploadedFile->getPathName(), 'r');

                    $csv->setHeaderOffset(0);
                    $header = $csv->getHeader();

                    if (count($header) != 2) {
                        throw new InvalidArgumentException('Invalid CSV header');
                    }

                    if ($header[1] != $request->get('sensor_id')) {
                        throw new InvalidArgumentException('Invalid sensor ID in CSV file');
                    }

                    $dateTimeOffset = substr($header[0], -6);

                    if (!in_array(substr($dateTimeOffset, 0, 1), ['+', '-']) or substr($dateTimeOffset, 3, 1) != ':') {
                        throw new InvalidArgumentException('Invalid date/time offset');
                    }

                    $records = $csv->getRecords();

                    $data = null;

                    foreach ($records as $offset => $record) {
                        $record = array_values($record);

                        $timestamp = Carbon::createFromFormat('m/d/y h:i:s AP', $record[0] . $dateTimeOffset, 'Europe/Bucharest');

                        $request->request->add([
                            'timestamp' => $timestamp,
                            'value' => $record[1]
                        ]);

                        $data = $this->insertUpdateData($request, $slug, $dataType->addRows, new $dataType->model_name());
                    }

                    if ($data) {
                        event(new BreadDataAdded($dataType, $data));

                        if ($request->ajax()) {
                            return response()->json(['success' => true, 'data' => $data]);
                        }
                        return redirect()
                            ->route("voyager.{$dataType->slug}.index")
                            ->with([
                                'message' => __('voyager::generic.successfully_added_new') . " {$dataType->display_name_singular}",
                                'alert-type' => 'success',
                            ]);
                    } else {
                        return redirect()
                            ->route("voyager.{$dataType->slug}.create")
                            ->with([
                                'message' => 'Unexpected error',
                                'alert-type' => 'error',
                            ]);
                    }
                }


            } else {

                $layerName = $fileInfo['filename'];

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
                    if (!$request->has('_validate')) {

                        $request->request->add([
                            'layer' => $layerName
                        ]);

                        $data = $this->insertUpdateData($request, $slug, $dataType->addRows, new $dataType->model_name());
                        event(new BreadDataAdded($dataType, $data));

                        if ($request->ajax()) {
                            return response()->json(['success' => true, 'data' => $data]);
                        }
                        return redirect()
                            ->route("voyager.{$dataType->slug}.index")
                            ->with([
                                'message' => __('voyager::generic.successfully_added_new') . " {$dataType->display_name_singular}",
                                'alert-type' => 'success',
                            ]);
                    }
                }
            }
        }
        catch (\GuzzleHttp\Exception\GuzzleException $e) {
            return redirect()
                ->route("voyager.{$dataType->slug}.create")
                ->with([
                    'message' => $e->getMessage(),
                    'alert-type' => 'error',
                ]);
        }
        catch (\League\Csv\Exception $e) {
            return redirect()
                ->route("voyager.{$dataType->slug}.create")
                ->with([
                    'message' => $e->getMessage(),
                    'alert-type' => 'error',
                ]);
        } catch (InvalidArgumentException $e) {
            return redirect()
                ->route("voyager.{$dataType->slug}.create")
                ->with([
                    'message' => $e->getMessage(),
                    'alert-type' => 'error',
                ]);
        }


    }

    /**
     * Get BREAD relations data.
     *
     * @param Request $request
     *
     * @return mixed
     */
    public function sensorDataSourceRelation(Request $request)
    {
        $slug = explode('.', $request->route()->getName())[1];
        $page = $request->input('page');
        $on_page = 50;
        $search = $request->input('search', false);
        $dataType = Voyager::model('DataType')->where('slug', '=', $slug)->first();

        foreach ($dataType->editRows as $key => $row) {
            if ($row->field === $request->input('type')) {
                $options = $row->details;
                $skip = $on_page * ($page - 1);

                // If search query, use LIKE to filter results depending on field label
                if ($search) {
                    $total_count = app($options->model)->where($options->label, 'LIKE', '%'.$search.'%')->count();
                    $relationshipOptions = app($options->model)->take($on_page)->skip($skip)
                        ->where($options->label, 'LIKE', '%'.$search.'%')
                        ->get();
                } else {
                    $total_count = app($options->model)->count();
                    $relationshipOptions = app($options->model)->take($on_page)->skip($skip)->get();
                }

                $results = [];
                foreach ($relationshipOptions as $relationshipOption) {
                    $text = $relationshipOption->{$options->label};

                    if ($relationshipOption->data_source) {
                        $text = $relationshipOption->data_source->name . ' - ' . $text;
                        if ($relationshipOption->data_source->region) {
                            $text .= ' (' . $relationshipOption->data_source->region->name . ')';
                        }
                    }

                    $results[] = [
                        'id'   => $relationshipOption->{$options->key},
                        'text' => $text,
                    ];
                }

                return response()->json([
                    'results'    => $results,
                    'pagination' => [
                        'more' => ($total_count > ($skip + $on_page)),
                    ],
                ]);
            }
        }

        // No result found, return empty array
        return response()->json([], 404);
    }
}
