<?php

namespace App\Http\Controllers;

use App\Region;
use App\Page;
use Illuminate\Http\Request;

class FrontendController extends Controller
{
    public function index()
    {
        return view('frontend.index');
    }

    public function page($slug = null) 
    {
    	$pages = Page::all();

    	if ($slug) {
    		$page = Page::where('slug', $slug)->first();
    	} else {
    		$page = Page::where('default', 1)->first();
    		if (!$page) {
    			$page = Page::first();
    		}
    	}

    	return view('frontend.page', [
    		'pages' => $pages,
    		'current_page' => $page
    	]);
    }
}
