<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
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

class RegionController extends VoyagerBaseController
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

        if (!$request->has('name') or !$request->hasFile('shape_file')) {
            return redirect()
                ->route("voyager.{$dataType->slug}.create")
                ->with([
                    'message' => 'Please fill all the fields',
                    'alert-type' => 'error',
                ]);
        }

        try {
            $client = new Client();

            $layerName = pathinfo($request->shape_file->getClientOriginalName());

            $layerName = $layerName['filename'];


            $response = $client->request('PUT', config('geoserver.api_url') . '/workspaces/' . config('geoserver.workspace') . '/datastores/' . config('geoserver.stores.regions') . '/file.shp', [
                'auth' => [config('geoserver.user'), config('geoserver.password')],
                'body' => fopen($request->shape_file->getPathname(), 'r'),
                'query' => [
                    'configure' => 'all',
                    'update' => 'overwrite',
                    'charset' => 'ISO-8859-1'
                ],
                'headers' => [
                    'Content-Type' => 'application/zip',
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
        catch (\GuzzleHttp\Exception\GuzzleException $e) {
            return redirect()
                ->route("voyager.{$dataType->slug}.create")
                ->with([
                    'message' => $e->getMessage(),
                    'alert-type' => 'error',
                ]);
        }
    }

    // POST BR(E)AD
    public function update(Request $request, $id)
    {
        $slug = $this->getSlug($request);
        $dataType = Voyager::model('DataType')->where('slug', '=', $slug)->first();
        // Compatibility with Model binding.
        $id = $id instanceof Model ? $id->{$id->getKeyName()} : $id;
        $data = call_user_func([$dataType->model_name, 'findOrFail'], $id);

        // Check permission
        $this->authorize('edit', $data);
        // Validate fields with ajax
        $val = $this->validateBread($request->all(), $dataType->editRows, $dataType->name, $id);
        if ($val->fails()) {
            return response()->json(['errors' => $val->messages()]);
        }

        if (!$request->ajax()) {
            $this->insertUpdateData($request, $slug, $dataType->editRows, $data);
            event(new BreadDataUpdated($dataType, $data));
            return redirect()
                ->route("voyager.{$dataType->slug}.index")
                ->with([
                    'message'    => __('voyager::generic.successfully_updated')." {$dataType->display_name_singular}",
                    'alert-type' => 'success',
                ]);
        }
    }

}
