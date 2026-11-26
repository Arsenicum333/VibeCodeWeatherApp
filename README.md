# Noc26 - Barbecue Weather Map

A weather map of Slovakia built during a **vibe-coding workshop**. Participants didn't write the app line by line. They described what they wanted to an AI coding agent, then reviewed, tested and steered what it produced. The repository shows the result: a working Angular + OpenLayers app that loads real weather data from an OGC EDR service.

## The story

You're building an app for a group of friends who are planning a barbecue. If it rains, they won't get the fire going, and if it's cold, nobody will want to sit outside.

The friends want to see on a map of Slovakia where it will rain, and to go through the day hour by hour so they know when to head out. It must be clear what each colour means. When they click on the place they want to go, they want to know what the temperature will be there.

A friend started the app and handed it over half-finished, with a few bugs planted along the way. The workshop was about finding and fixing them one at a time with the agent, then adding new features.

## What the app does

- **Temperature at 2 m** and **hourly precipitation** forecasts from the ALADIN model by SHMU
- **Weather radar** (SHMU CAPPI 2 km reflectivity), clipped to the border of Slovakia
- **Timeline** to step through the forecast hour by hour
- **Legends** that explain what each colour means
- **Click on the map** to see the weather at that spot, with a forecast chart over time
- **Layer toggles** to show or hide each weather layer

The data comes from the [OpenWeather EDR API](https://api.openweather.cloud/). Each weather grid is coloured per pixel on the GPU by a custom WebGL layer.

## How the workshop worked

1. Open the app and see what is broken or missing.
2. Describe the problem or the feature to the AI agent in plain language.
3. Let the agent make the change, then check it in the browser.
4. Repeat, one bug or one feature at a time.

The rules the agent follows are in [AGENTS.md](AGENTS.md) and the skills in `.agents/skills/` (copied to `.claude/skills/`). For example: where new code belongs, how to add a dataset, and how to debug without fixing everything at once.

## Running it locally

The project requires Node.js 24 (see `.nvmrc`). Install the packages once:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Then open `http://localhost:4200/`. The app reloads automatically when you change a source file.

To check that everything compiles, run:

```bash
npm run build
```

## Tests

The workshop is about EDR weather data, OpenLayers and working with an AI agent, so the project intentionally has no unit or end-to-end tests.

## License

The code in this repository is released under the [MIT License](LICENSE).

The license covers only the code. The weather data it loads from [OpenWeather](https://api.openweather.cloud/) (the ALADIN model and radar data by SHMU) is not part of this repository and is subject to its providers' own terms.
