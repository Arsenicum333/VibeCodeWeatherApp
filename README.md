# Noc26

This workshop demonstrates how to use weather data from an EDR service and how to visualize it on a map with OpenLayers.

## Workshop parts

1. **Weather data from EDR.** [OGC API – Environmental Data Retrieval (EDR)](https://ogcapi.ogc.org/edr/) is an open standard for requesting weather and other environmental data over HTTP. The app fetches the 2 m air temperature forecast from the [SHMU ALADIN model for Slovakia](https://api.openweather.cloud/edr/shmu/aladin/slovakia) on the OpenWeather EDR service, which needs no authentication. See `src/app/edr/` (requests and the OpenLayers source), `src/app/consts/` (which dataset, parameters and colours to use) and `src/app/types/`.
2. **Visualization with OpenLayers.** [OpenLayers](https://openlayers.org/) shows a full-screen map with an OpenStreetMap base layer, and the weather data is displayed on top of it by a custom WebGL layer. See `src/app/map/` (the map and its layers) and `src/app/visualizations/` (the layer and its renderer).

The project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.7.

## Installing packages

Before running the application locally for the first time, install the project's packages:

```bash
npm install
```

The project requires Node.js 24 (see `.nvmrc`).

## Development server

To start a local development server, run:

```bash
npm exec ng serve
```

This uses the Angular CLI installed in the project's `node_modules`, so you don't need a global Angular CLI. To pass options to `ng`, put `--` before it, for example `npm exec -- ng serve --port 4300`.

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Tests

This is a workshop demo focused on EDR weather data and OpenLayers, so it intentionally has no unit or end-to-end tests.

## License

The code in this repository is released under the [MIT License](LICENSE).

The license covers only the code. The weather data it loads from [OpenWeather](https://api.openweather.cloud/) (for example the ALADIN model by SHMU) is not part of this repository and is subject to its providers' own terms.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
