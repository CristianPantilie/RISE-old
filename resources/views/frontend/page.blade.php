<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>RISE</title>
    <link href="{{asset('css/app.css')}}" rel="stylesheet">
</head>
<body>
	<div class="container-fluid">
		<nav class="navbar navbar-expand navbar-light bg-light">
                <a class="navbar-brand" href="/">RISE</a>
                <button class="navbar-toggler" type="button" data-toggle="collapse"
                        data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon" />
                </button>

                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul class="navbar-nav mr-auto">
                        @foreach($pages as $page)
                        	<li class="nav-item {{($page->id == $current_page->id) ? 'active' : null}}">
					        	<a class="nav-link" href="/{{$page->slug}}">{{$page->name}} {!!($page->id == $current_page->id) ? '<span class="sr-only">(current)</span>' : null!!}</a>
					      	</li>
                        @endforeach
                    </ul>
                    <div class="ml-auto">
				       	<a class="btn btn-primary" href="/portal" tabindex="-1">Portal</a>
				    </div>
                </div>
            </nav>
	</div>
	<div class="container">
		{!!
			$current_page->content
		!!}
	</div>
</body>
</html>
