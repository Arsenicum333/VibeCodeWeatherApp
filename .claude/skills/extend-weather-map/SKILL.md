---
name: extend-weather-map
description: Use whenever adding or changing a feature of this workshop app, e.g. showing another weather parameter, a new gradient, a new layer or renderer, a legend, map overlays, or anything reacting to the map's layers. Explains where code belongs and how to extend the existing EDR + OpenLayers code without restructuring it.
---

# Extending the weather map

This is a workshop demo with two parts:

1. **Weather data from EDR**: the app requests forecast grids from an OGC EDR service (SHMU ALADIN model for Slovakia, no authentication).
2. **Visualisation with OpenLayers**: a custom WebGL2 layer draws the grid on a full-screen map.

The starting point is deliberately small: an OpenStreetMap base layer with one `BitmapLayer` showing 2 m temperature. Students extend it with the help of AI agents. Your job is to add the requested feature in the place where it belongs, in the style of the existing code, without restructuring what is there.

## Project layout

| Path                                       | What it is for                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/edr/`                             | Everything about the EDR services: `edr-api.service.ts` (HTTP requests), `edr-grid-source.ts` (OpenLayers source), `edr-error.ts` (error messages).                                                                                                                                               |
| `src/app/consts/`                          | Simulated configuration: values that a real app would get from the user (through a UI) or from a config file or server. `datasets.ts` (`ALADIN_SLOVAKIA`), `parameters.ts` (`ALADIN_PARAMETERS`), `gradients.ts` (`TEMPERATURE_GRADIENT_IN_KELVIN`). Only constants; their types are in `types/`. |
| `src/app/types/`                           | Type-only files, named `<name>.type.ts`: `edr-datasets.type.ts` (`EdrDataset`), `edr-parameters.type.ts` (`EdrParameter`), `coverage-json.type.ts` (EDR response types), `gradients.type.ts` (`Gradient`, `GradientStop`, `GradientMode`, `MAX_GRADIENT_STOPS`).                                  |
| `src/app/data-types/`                      | Plain data structures shared by data and visualisation code, e.g. `GridData`.                                                                                                                                                                                                                     |
| `src/app/visualizations/`                  | **Only** layers, their renderers and shaders, and legend visualisation. One subfolder per kind of layer, e.g. `bitmap/`.                                                                                                                                                                          |
| `src/app/map/map.ts`                       | The map component. `createLayers()` is where layers are created and configured; students edit it a lot.                                                                                                                                                                                           |
| `src/app/map/map-layers-helper.service.ts` | `MapLayersHelperService`: all logic that works with the map's OpenLayers layers (listening to them, collecting information from them) and the signals the template reads.                                                                                                                         |
| `src/app/map/map.html`, `map.css`          | Map container and overlays on top of the map (error banner, and e.g. legends).                                                                                                                                                                                                                    |

## Rules

1. **`visualizations/` holds only layers, renderers (and their shaders) and legend visualisation.** Do not put services, HTTP code, EDR code or general helpers there. A new kind of layer gets its own subfolder, e.g. `visualizations/isolines/`; a legend goes in `visualizations/legend/`.
2. **Ready-to-use constants go in `src/app/consts/`**: datasets in `datasets.ts`, model parameters in `parameters.ts`, gradients in `gradients.ts`. Add a new file there for a new kind of configuration constant (e.g. `colors.ts`). Their **types go in `src/app/types/`** (`EdrDataset`, `EdrParameter`, `Gradient`, the CoverageJSON response types). Files that only define types (and constants describing those types, like `MAX_GRADIENT_STOPS`) live in `types/` and are named `<name>.type.ts`, e.g. `types/edr-parameters.type.ts`; files whose main content is a class, service or function stay in their feature folder with a plain `.ts` name even if they also export a type (e.g. `LonLatBbox` in `edr-api.service.ts`, `GridData` in `data-types/`). Constants that are part of how a single file works (e.g. `LOAD_ERROR_PROPERTY` or `MESH_SEGMENTS`) stay in that file.
    - **`consts/` simulates configuration or user input.** In a real application, the datasets, parameters and gradients would be entered by the user in a UI, loaded from a config file or sent by a server. In this demo they are hard-coded in `consts/` instead. Write code as if these values could change without touching the code:
    - **Only `MapComponent` (`createLayers()`) imports from `consts/`**, like a UI that passes the user's choices on. Services, sources, layers, renderers and helpers receive the values as arguments or constructor options; they never import a constant from `consts/` themselves. (Constants in `consts/` may reference each other, e.g. a parameter's `dataset`.)
    - **Keep the constants plain data**: objects, arrays, strings, numbers and booleans, as if they were read from JSON. No functions, class instances or Observables inside them; helper functions that only compute values while defining them (like `celsius()` in `gradients.ts`) are fine.
    - **Never hard-code what belongs in a constant** (a URL, a collection ID, a colour, a parameter name) in general code; add it to `consts/` and pass it in.
3. **Logic that does something with the map's OpenLayers layers goes in `MapLayersHelperService`**, e.g. listening for load errors (already there), collecting legends from layers, toggling layer visibility, or reading values from layers. It keeps its state in private writable signals and exposes them read-only (`signal(...)` + `.asReadonly()`). `MapComponent` creates it with `new MapLayersHelperService()`, calls its methods right after the map is created (in `afterNextRender`, next to `listenForLoadErrors`), and the template reads its signals. Do not put this logic into `MapComponent` or into the layers themselves.
4. **Keep `createLayers()` in `map.ts` short and declarative.** It only builds layers from options, so students can easily see and change what is on the map. Layers are rendered bottom to top, in array order.
5. **Layers are static.** Everything is configured through constructor options when the layer is created. Do not add setters or `update...()` methods to layers, renderers or sources.
6. **All EDR requests go through `EdrApiService`.** Add a new method there for a new kind of query instead of calling `HttpClient` elsewhere.
7. **`EdrParameter` is the only parameter type, also for composite parameters.** Some quantities are made of several EDR parameters, e.g. wind has a `u-component-of-wind` and a `v-component-of-wind`. For them, **extend the existing `EdrParameter` interface** (e.g. with an optional field listing the component parameter names) instead of creating a new type like `EdrVectorParameter` or `EdrWindParameter`. Keep the existing parameters valid, so a new field must be optional.
    - A parameter from ALADIN goes into **`ALADIN_PARAMETERS`**, next to `temperature2m`; do not create a separate constant such as `ALADIN_VECTOR_PARAMETERS` or `ALADIN_WIND_PARAMETERS`.
    - A parameter from another EDR service may get its own constant (e.g. `GOES_18_PARAMETERS`), but it uses the same type: `satisfies Record<string, EdrParameter>`.
8. **Keep it simple.** Extend OpenLayers classes directly (`ol/layer/Layer`, `ol/renderer/Layer`, `ol/source/Source`) and use plain WebGL2 or Canvas 2D. Do not add extra abstraction layers, rendering libraries, web workers or offscreen rendering.
9. **No tests.** This repository intentionally has none; see the `no-tests` skill.
10. Prettier formats the code (4 spaces, double quotes, 105 characters per line). Run `npm run format` after changing files.

## How the existing pieces work

- An `EdrDataset` (type in `types/edr-datasets.type.ts`, constants in `consts/datasets.ts`) describes one EDR service: its `baseUrl`, the `domain` it covers (longitude/latitude bbox) and the map `attribution`. `ALADIN_SLOVAKIA` is the only one so far. **Dataset-specific values (URLs, areas, credits) belong only in these constants**; general code such as `EdrApiService` or `EdrGridSource` reads them from the parameter's `dataset` and must not mention a specific dataset.
- `EdrApiService.getCube(parameter, bbox)` requests a cube query from the parameter's dataset for the current hour, always in `CRS:84` (longitude/latitude) and as CoverageJSON. An empty answer (`204 No Content`, e.g. wrong level or time) becomes an `EdrNoDataError`.
- `ALADIN_PARAMETERS` in `consts/parameters.ts` lists ready-to-use parameters. An `EdrParameter` is a `dataset`, a `collectionId`, a `parameterName` and an optional vertical level `z`. Every parameter belongs to exactly one collection; see `${dataset.baseUrl}/collections` (for ALADIN: https://api.openweather.cloud/edr/shmu/aladin/slovakia/collections) for all collections, parameters, units and levels.
- `EdrGridSource` (an OpenLayers `Source`) turns the visible map extent into a bbox clipped to its dataset's `domain`, fetches it with `getGridData(bbox)` and converts it to `GridData`. Its attribution comes from the dataset. It stores the last error message in the `loadError` property (`LOAD_ERROR_PROPERTY`), which `MapLayersHelperService.listenForLoadErrors` turns into the red banner at the top of the map.
- `GridData` is a regular longitude/latitude grid: `values` row by row from the north, `NaN` where data is missing.
- `BitmapLayer` takes a `source`, a `gradient`, an optional `gradientMode` (`"linear"` or `"stepped"`) and any OpenLayers layer option such as `opacity`. Its `BitmapLayerRenderer` requests data in `prepareFrame` once the view stops moving, uploads the grid as a float texture and draws a reprojected mesh. The fragment shader in `bitmap-shaders.ts` interpolates the grid and colours it with the gradient.
- A `Gradient` is a list of up to `MAX_GRADIENT_STOPS` (16) stops `{value, color: [r, g, b, a]}` (0–255), sorted by value. **Stop values are in the unit of the data** (e.g. Kelvin for temperature, mm for precipitation).

## Recipes

### Show another weather parameter

1. Find the parameter, its collection, unit and levels in the `/collections` listing above.
2. Add it to `ALADIN_PARAMETERS` in `src/app/consts/parameters.ts` with `dataset: ALADIN_SLOVAKIA`. Set `z` only if the collection has vertical levels (e.g. `"2"` for 2 m, `"850"` for 850 hPa); surface collections have none. For a parameter of another EDR service (another model, a satellite or radar), follow the `add-edr-dataset` skill: it starts by asking the user for the service's URL.
3. Add a gradient to `src/app/consts/gradients.ts`, with stop values in the data unit. Use a transparent first stop (alpha 0) for values that should not be drawn, e.g. 0 mm of precipitation.
4. Add a `BitmapLayer` to `createLayers()` in `map.ts` with an `EdrGridSource` for the new parameter. Put it after the layers it should cover.

Wind and other vector quantities come as two parameters (U and V components) of one collection. Define them as one entry in `ALADIN_PARAMETERS` by extending `EdrParameter` (see rule 7), not with a new parameter type or constant. A bitmap layer of wind speed also needs both grids and `√(u² + v²)`; that means a change to the source or to `GridData`, so check with the user first.

### Add a new kind of layer (e.g. isolines, arrows, numbers)

1. Create `src/app/visualizations/<name>/` with `<name>-layer.ts` and `<name>-layer-renderer.ts` (plus shaders if it uses WebGL). Use `visualizations/bitmap/` as the example.
2. The layer extends `Layer<EdrGridSource, YourRenderer>` from `ol/layer/Layer`, takes all its settings as constructor options and creates its renderer in `createRenderer()`.
3. The renderer extends `LayerRenderer` from `ol/renderer/Layer`:
    - `prepareFrame(frameState)` is called before every frame. Request data there when the view is not moving (see `requestData` in `BitmapLayerRenderer`), and return whether there is anything to draw.
    - `renderFrame(frameState)` draws into the renderer's own canvas and returns it. Size the canvas from `frameState.size` and `frameState.pixelRatio`, and set its opacity from `frameState.layerStatesArray[frameState.layerIndex].opacity`.
    - After new data arrives, call `this.getLayer().changed()` so the map renders again.
    - Release resources (subscriptions, WebGL objects) in `disposeInternal()`.
4. Reuse `EdrGridSource` and `GridData` for the data; convert grid coordinates (longitude/latitude, `EPSG:4326`) to the map projection with `getTransform` from `ol/proj`.
5. Add the layer to `createLayers()`.

### Add a legend

There is no legend in the code yet. Build it like this:

1. **Types** in `src/app/types/legend.type.ts` (rule 2):
    - `LegendOptions { title: string; formatValue?: (value: number) => string }`: the title includes the unit (e.g. `"Temperature [°C]"`); `formatValue` converts stop values for display (e.g. Kelvin to °C) and defaults to showing the value unchanged.
    - `LegendData extends LegendOptions { gradient: Gradient; gradientMode: GradientMode }`.
2. **Layer option**: add `legend?: LegendOptions` to `BitmapLayerOptions`, keep it in a private field, and add `getLegend(): LegendData | undefined` to `BitmapLayer`, returning the options together with the layer's own `gradient` and `gradientMode` (so the legend always matches what is drawn). No legend option means no legend.
3. **Collecting**: add `collectLegends(map)` to `MapLayersHelperService`. It takes `map.getAllLayers()`, keeps the `BitmapLayer`s, calls `getLegend()`, drops `undefined` results and stores them in a read-only `legends` signal. Call it in `MapComponent` right after `listenForLoadErrors(this.map)`.
4. **Component**: `LegendComponent` in `src/app/visualizations/legend/` (`legend.ts`, `legend.html`, `legend.css`) with `legend = input.required<LegendData>()`:
    - Draw the colour bar as a CSS `linear-gradient(to top, ...)` with colours `rgba(r, g, b, a / 255)`, lowest value at the bottom.
    - Space the stops **evenly**, not by value, so uneven stops (0.1, 0.5, 1 … 50 mm) stay readable. With `n` stops: `"linear"` puts stop `i` at `i / (n - 1) * 100%` and blends between them; `"stepped"` gives stop `i` a solid band from `i / n` to `(i + 1) / n` (repeat each colour at both positions for hard edges).
    - Put a label (`formatValue(stop.value)`) next to the bar at the same positions: at the stop for `"linear"`, at the start of the band for `"stepped"`.
5. **Placement**: in `map.html`, loop over `mapLayersHelper.legends()` inside an absolutely positioned container in the bottom-right corner (e.g. `right: 8px; bottom: 32px`, above the OpenLayers attribution text, `z-index: 1`), and add `LegendComponent` to the `imports` of `MapComponent`. Legends of several layers sit side by side.
6. Add `legend: {title: ..., formatValue: ...}` to the layers in `createLayers()`.

### React to the map's layers in the UI (banners, toggles, info panels)

Follow the load-error banner: the layer or source exposes the information (a getter, or an OpenLayers property that fires `propertychange`); `MapLayersHelperService` listens to it on all relevant layers and keeps a read-only signal up to date; `map.html` shows it as an absolutely positioned overlay styled in `map.css`.

### Query a value at a point (e.g. temperature where the user clicks)

Add a method to `EdrApiService` for the EDR position query: `GET .../collections/{collectionId}/position?coords=POINT(lon lat)&parameter-name=...&datetime=...&crs=CRS:84&f=CoverageJSON` (plus `z` when the parameter has levels). **`crs=CRS:84` is required**: without it the service answers `204 No Content`. The answer is a CoverageJSON with `domainType: "Point"`. Convert the clicked map coordinate to longitude/latitude with `toLonLat` from `ol/proj`; the click handling and the resulting state belong in `MapLayersHelperService`, the display in `map.html`.

## Checking a change

1. `npm run build`: must finish without errors.
2. `npm start` (or `npm exec ng serve`), open http://localhost:4200, check that the layers draw where expected and that the browser console shows no errors.
3. `npm run format:check`: must report that all files use Prettier code style.
