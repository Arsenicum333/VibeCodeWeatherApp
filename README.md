# Noc26

# Lore

You're building an app for a group of friends who are planning a barbecue. If it rains, they won't get the fire going, and if it's cold, nobody will want to sit outside.

The friends want to see on a map of Slovakia where it will rain, and to go through the day hour by hour so they know when to head out. It must be clear what each colour means. When they click on the place they want to go, they want to know what the temperature will be there.

Your friend already started work on the application and sent you partially developed one, there are some bugs you have to fix first.

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
