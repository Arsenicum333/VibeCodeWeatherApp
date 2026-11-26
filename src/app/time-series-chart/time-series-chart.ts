import {DatePipe, DecimalPipe} from "@angular/common";
import {Component, computed, input, signal} from "@angular/core";
import {TimeSeries} from "../types/time-series.type";

const WIDTH = 280;
const HEIGHT = 120;
const MARGIN = {top: 10, right: 8, bottom: 20, left: 28};
const HOUR_MS = 3_600_000;

interface PlotPoint {
    time: string;
    value: number;
    x: number;
    y: number;
}

/**
 * Line chart of one time series (e.g. the temperature forecast at a point), with a marker at the
 * selected time and a crosshair with the exact value under the pointer.
 */
@Component({
    selector: "app-time-series-chart",
    templateUrl: "./time-series-chart.html",
    styleUrl: "./time-series-chart.css",
    imports: [DatePipe, DecimalPipe],
})
export class TimeSeriesChartComponent {
    readonly series = input.required<TimeSeries>();
    /** Time to mark in the chart, e.g. the time selected on the timeline. */
    readonly selectedTime = input<string>();

    protected readonly width = WIDTH;
    protected readonly height = HEIGHT;
    protected readonly plotLeft = MARGIN.left;
    protected readonly plotRight = WIDTH - MARGIN.right;
    protected readonly plotTop = MARGIN.top;
    protected readonly plotBottom = HEIGHT - MARGIN.bottom;

    private readonly hoverIndex = signal<number | undefined>(undefined);

    private readonly timeRange = computed(() => {
        const times = this.series().points.map(point => Date.parse(point.time));
        const start = Math.min(...times);
        const end = Math.max(...times);
        return {start, end: end > start ? end : start + HOUR_MS};
    });

    /** Y axis range, extended to whole ticks so the line never touches the edges. */
    protected readonly yTicks = computed(() => {
        const values = this.series()
            .points.map(point => point.value)
            .filter(value => value !== undefined);
        const min = values.length > 0 ? Math.min(...values) : 0;
        const max = values.length > 0 ? Math.max(...values) : 1;
        const step = niceStep((max - min) / 4 || 1);
        const ticks: number[] = [];
        for (let tick = Math.floor(min / step) * step; tick <= max + step * 0.999; tick += step) {
            ticks.push(Number(tick.toFixed(6)));
        }
        return ticks.length >= 2 ? ticks : [ticks[0] ?? 0, (ticks[0] ?? 0) + step];
    });

    /** One label per day at local midnight, plus vertical gridlines. */
    protected readonly dayTicks = computed(() => {
        const {start, end} = this.timeRange();
        const ticks: {x: number; time: number}[] = [];
        const day = new Date(start);
        day.setHours(24, 0, 0, 0);
        for (; day.getTime() <= end; day.setDate(day.getDate() + 1)) {
            ticks.push({x: this.x(day.getTime()), time: day.getTime()});
        }
        return ticks;
    });

    protected readonly points = computed<PlotPoint[]>(() =>
        this.series()
            .points.filter(point => point.value !== undefined)
            .map(point => ({
                time: point.time,
                value: point.value!,
                x: this.x(Date.parse(point.time)),
                y: this.y(point.value!),
            }))
    );

    /** SVG path of the line; gaps in the data break it into several pieces. */
    protected readonly linePath = computed(() => {
        let path = "";
        let drawing = false;
        for (const point of this.series().points) {
            if (point.value === undefined) {
                drawing = false;
                continue;
            }
            const command = drawing ? "L" : "M";
            path += `${command}${this.x(Date.parse(point.time)).toFixed(1)},${this.y(point.value).toFixed(1)}`;
            drawing = true;
        }
        return path;
    });

    /** Light fill under the line, down to the bottom of the plot. */
    protected readonly areaPath = computed(() => {
        const points = this.points();
        if (points.length < 2) {
            return "";
        }
        const line = points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join("L");
        return `M${points[0].x.toFixed(1)},${this.plotBottom}L${line}L${points.at(-1)!.x.toFixed(1)},${this.plotBottom}Z`;
    });

    protected readonly selectedX = computed(() => {
        const time = this.selectedTime();
        if (time === undefined) {
            return undefined;
        }
        const ms = Date.parse(time);
        const {start, end} = this.timeRange();
        return ms >= start && ms <= end ? this.x(ms) : undefined;
    });

    /** The point under the pointer, or else the one at the selected time. */
    protected readonly highlighted = computed(() => {
        const points = this.points();
        const hover = this.hoverIndex();
        if (hover !== undefined) {
            return points[hover];
        }
        const selected = this.selectedTime();
        if (selected === undefined) {
            return undefined;
        }
        const selectedMs = Date.parse(selected);
        let found: PlotPoint | undefined;
        for (const point of points) {
            if (Date.parse(point.time) <= selectedMs) {
                found = point;
            }
        }
        return found;
    });

    protected readonly isHovering = computed(() => this.hoverIndex() !== undefined);

    protected y(value: number): number {
        const ticks = this.yTicks();
        const min = ticks[0];
        const max = ticks.at(-1)!;
        return this.plotBottom - ((value - min) / (max - min)) * (this.plotBottom - this.plotTop);
    }

    protected onPointerMove(event: PointerEvent): void {
        const svg = event.currentTarget as SVGSVGElement;
        const box = svg.getBoundingClientRect();
        const x = ((event.clientX - box.left) / box.width) * WIDTH;
        const points = this.points();
        if (points.length === 0) {
            return;
        }
        let nearest = 0;
        for (let index = 1; index < points.length; index++) {
            if (Math.abs(points[index].x - x) < Math.abs(points[nearest].x - x)) {
                nearest = index;
            }
        }
        this.hoverIndex.set(nearest);
    }

    protected onPointerLeave(): void {
        this.hoverIndex.set(undefined);
    }

    private x(ms: number): number {
        const {start, end} = this.timeRange();
        return this.plotLeft + ((ms - start) / (end - start)) * (this.plotRight - this.plotLeft);
    }
}

/** A round step (1, 2 or 5 times a power of ten) close to `rough`. */
function niceStep(rough: number): number {
    const power = 10 ** Math.floor(Math.log10(rough));
    const fraction = rough / power;
    const nice = fraction < 1.5 ? 1 : fraction < 3.5 ? 2 : fraction < 7.5 ? 5 : 10;
    return nice * power;
}
