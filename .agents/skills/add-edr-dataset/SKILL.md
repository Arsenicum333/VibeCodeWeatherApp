---
name: add-edr-dataset
description: Use when the user wants data from a weather model, satellite, radar or other EDR service that the app does not use yet (anything other than ALADIN Slovakia), e.g. "add the ICON model", "show GFS temperature", "use the Czech ALADIN". Explains what to ask the user, how to explore and check a new EDR service, and where its definition goes.
---

# Adding a new EDR dataset (model, satellite, radar)

The app reads weather data from EDR services (OGC Environmental Data Retrieval) on api.openweather.cloud. Each service is one **dataset**, described by an `EdrDataset` constant in `src/app/consts/datasets.ts`. So far there is one: `ALADIN_SLOVAKIA` (`https://api.openweather.cloud/edr/shmu/aladin/slovakia`).

Also follow the `extend-weather-map` skill: its rules (in particular rule 7 about `EdrParameter`) apply here too.

## 1. Ask the user for the EDR URL

**Do not guess the URL.** Ask the user for the base URL of the EDR service they want, in the same form as `https://api.openweather.cloud/edr/shmu/aladin/slovakia`. If they don't know it, point them to the catalogue at https://api.openweather.cloud/, which lists all available services by category (NWP models, satellites, radars, observations), and let them pick one. Examples of URLs from the catalogue: `.../edr/dwd/icon/global`, `.../edr/noaa/gfs`, `.../edr/chmi/aladin/europe`, `.../edr/noaa/goes-19`.

If it is not clear yet, also ask **which quantity** they want to see (e.g. 2 m temperature, precipitation, cloud cover).

## 2. Explore the service

Use `curl` (no authentication is needed):

- `GET {baseUrl}` returns the landing page with links.
- `GET {baseUrl}/collections` lists every collection with its `parameter_names` (with units), `extent` (spatial, temporal, vertical), supported `crs` and `data_queries`.

Some services have hundreds of collections (ICON global has 243), so search them instead of reading the whole response, e.g.:

```bash
curl -s "{baseUrl}/collections" | python3 -I -c "
import json, sys
for c in json.load(sys.stdin)['collections']:
    for name, p in c['parameter_names'].items():
        if 'temperature' in name:
            unit = p.get('unit', {}).get('symbol')
            unit = unit.get('value') if isinstance(unit, dict) else unit
            print(c['id'], '|', name, '|', unit, '| z:', c['extent'].get('vertical', {}).get('values'))
"
```

Write down the `collectionId`, the `parameterName`, its unit, and the vertical level `z` if the collection has levels. Every parameter belongs to exactly one collection; the same name (e.g. `temperature`) can exist in several collections at different levels.

## 3. Check that the app can use it

Run a real cube request with `curl` before writing any code, for an area the map will show:

```bash
curl -s -D - -o /tmp/edr-test.json -H "Origin: http://localhost:4200" \
  "{baseUrl}/collections/{collectionId with : encoded as %3A}/cube?parameter-name={parameterName}&bbox={minLon},{minLat},{maxLon},{maxLat}&z={z}&crs=CRS:84&f=CoverageJSON&datetime={current hour, e.g. 2026-11-18T13:00:00Z}"
```

Check every point; the app works unchanged only if all of them pass:

| Check                                                                                                                                   | If it fails                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status `200` and a CoverageJSON body. `204 No Content` means no data for this time, level or area.                                      | Fix the parameters. If the current hour is not in the collection's `extent.temporal.values` (e.g. analysis-only collections, satellites, model runs that end earlier), explain this to the user before changing anything: `EdrService` always requests the current hour. |
| The response has the header `Access-Control-Allow-Origin` (the browser needs it).                                                       | The browser cannot use this service directly; tell the user.                                                                                                                                                                                                             |
| `CRS:84` is in the collection's `crs` list, and `CoverageJSON` is among the cube query's `output_formats`.                              | The app cannot read this collection; tell the user.                                                                                                                                                                                                                      |
| The response is at most a few MB for the area the map shows (check the size of `/tmp/edr-test.json` and `domain.axes.x.num` × `y.num`). | Global models and satellites can return tens of MB. The cube query accepts `resolution-x` and `resolution-y` (number of grid points per axis); supporting it means an optional field on `EdrParameter` (rule 7) and a change in `EdrService`. Check with the user first. |

## 4. Find the dataset's area (`domain`) in longitude/latitude

`EdrDataset.domain` must be **longitude/latitude** `[minLon, minLat, maxLon, maxLat]`; requests are clipped to it.

- Check `extent.spatial.crs` of the collection. If it is geographic (`GEOGCS[...]` or `CRS:84`), `extent.spatial.bbox` is already longitude/latitude.
- If it is projected (`PROJCS[...]`, e.g. Lambert conformal in metres, as in both ALADIN models), **do not copy the bbox**. Instead request a generous longitude/latitude area with `crs=CRS:84` and find where the values are not `null`:

```bash
python3 -I -c "
import json
d = json.load(open('/tmp/edr-test.json')); x, y = d['domain']['axes']['x'], d['domain']['axes']['y']
r = next(iter(d['ranges'].values())); v = r['values']; nx = x['num']
dx = (x['stop'] - x['start']) / (nx - 1); dy = (y['stop'] - y['start']) / (y['num'] - 1)
pts = [(x['start'] + (i % nx) * dx, y['start'] + (i // nx) * dy) for i, val in enumerate(v) if val is not None]
print('lon', min(p[0] for p in pts), max(p[0] for p in pts), 'lat', min(p[1] for p in pts), max(p[1] for p in pts))
"
```

- Global datasets use `[-180, -90, 180, 90]`.

## 5. Add the code

A new dataset needs **no changes to general code** (`EdrService`, `EdrGridSource`, `BitmapLayer`) as long as every check in step 3 passed:

1. **Dataset**: add an `EdrDataset` constant to `src/app/consts/datasets.ts`, named after the provider and model, e.g. `CHMI_ALADIN_EUROPE` or `DWD_ICON_GLOBAL`, with `baseUrl` (no trailing slash), `domain` from step 4 and an `attribution` such as `"Weather data: ICON model by DWD"`.
2. **Parameters**: add a constant to `src/app/consts/parameters.ts`, e.g. `DWD_ICON_GLOBAL_PARAMETERS`, with entries like `temperature2m: {dataset: DWD_ICON_GLOBAL, collectionId, parameterName, z}`, typed `satisfies Record<string, EdrParameter>`. Do not create a new parameter type (rule 7 of `extend-weather-map`).
3. **Gradient**: reuse an existing gradient when the unit matches (e.g. `TEMPERATURE_GRADIENT_IN_KELVIN` for temperature in K); otherwise add one to `src/app/consts/gradients.ts` with stop values in the data's unit.
4. **Layer**: add a `BitmapLayer` with an `EdrGridSource` for the new parameter to `createLayers()` in `src/app/map/map.ts`.
5. **Map view**: the map opens over Slovakia. If the new dataset does not cover it, ask the user whether to move the initial view (`center` and `zoom` of the `View` in `createMap()`).

Dataset-specific values (URLs, areas, credits, collection IDs) go only into these constants, never into `EdrService`, `EdrGridSource` or other general code. The constants in `consts/` simulate configuration that a real app would get from the user through a UI (e.g. "add a dataset by URL") or from a config file, so keep them plain data and import them only in `MapComponent` (rule 2 of `extend-weather-map`).

## 6. Check the result

Follow "Checking a change" in the `extend-weather-map` skill: `npm run build`, run the app and look at the new layer in the browser (no console errors, no red error banner), `npm run format:check`.
