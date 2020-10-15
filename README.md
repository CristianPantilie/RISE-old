# RISE

## Laravel 5.8.*
[Docs](https://laravel.com/docs/5.8)

## React ^16.2
[Docs](https://reactjs.org/version/16.2)

## OpenLayers ^5.3.1
[Docs](https://openlayers.org/en/latest/doc/)

# Deploy

```
cp .env.example .env
php artisan key:generate
```
Create database, import database from `resources/db`

Set database and site parameters in `.env`

```
composer install
npm install
npm run dev
```
