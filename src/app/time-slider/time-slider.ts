import {DatePipe} from "@angular/common";
import {Component, computed, input, model} from "@angular/core";

const MINUTE_MS = 60_000;

/**
 * Lets the user pick one of the `times` (EDR times, in UTC; shown in local time). The slider runs
 * along real time, so the 5-minute radar steps in the past and the hourly forecast steps in the
 * future are spread evenly; it snaps to the nearest available time.
 */
@Component({
    selector: "app-time-slider",
    templateUrl: "./time-slider.html",
    styleUrl: "./time-slider.css",
    imports: [DatePipe],
})
export class TimeSliderComponent {
    readonly times = input.required<string[]>();
    readonly selectedTime = model.required<string>();

    private readonly timesMs = computed(() => this.times().map(time => Date.parse(time)));
    protected readonly startMs = computed(() => this.timesMs()[0] ?? 0);
    protected readonly endMs = computed(() => this.timesMs().at(-1) ?? 0);
    protected readonly selectedMs = computed(() => Date.parse(this.selectedTime()));
    protected readonly stepMs = MINUTE_MS;

    protected readonly selectedIndex = computed(() =>
        Math.max(this.times().indexOf(this.selectedTime()), 0)
    );
    protected readonly isPast = computed(() => this.selectedMs() <= Date.now());

    /** Position of "now" along the slider, in percent; `undefined` when it is outside. */
    protected readonly nowPercent = computed(() => {
        const percent = this.percent(Date.now());
        return percent >= 0 && percent <= 100 ? percent : undefined;
    });

    /** Local midnights along the slider, for day labels. */
    protected readonly days = computed(() => {
        const start = this.startMs();
        const end = this.endMs();
        const days: {percent: number; time: number}[] = [];
        if (end <= start) {
            return days;
        }
        const day = new Date(start);
        day.setHours(24, 0, 0, 0);
        for (; day.getTime() < end; day.setDate(day.getDate() + 1)) {
            days.push({percent: this.percent(day.getTime()), time: day.getTime()});
        }
        return days;
    });

    /** CSS background of the track: the past part darker than the forecast part. */
    protected readonly trackBackground = computed(() => {
        const now = Math.min(Math.max(this.percent(Date.now()), 0), 100);
        const selected = this.percent(this.selectedMs());
        return (
            `linear-gradient(to right, var(--accent) 0%, var(--accent) ${selected}%, transparent ${selected}%), ` +
            `linear-gradient(to right, var(--track-past) 0%, var(--track-past) ${now}%, var(--track-future) ${now}%)`
        );
    });

    protected step(offset: number): void {
        const time = this.times()[this.selectedIndex() + offset];
        if (time !== undefined) {
            this.selectedTime.set(time);
        }
    }

    /** Selects the latest time that is not in the future. */
    protected selectNow(): void {
        const now = Date.now();
        const times = this.times();
        const past = times.filter(time => Date.parse(time) <= now);
        const time = past.at(-1) ?? times[0];
        if (time !== undefined) {
            this.selectedTime.set(time);
        }
    }

    protected onInput(value: number): void {
        const timesMs = this.timesMs();
        let nearest = 0;
        for (let index = 1; index < timesMs.length; index++) {
            if (Math.abs(timesMs[index] - value) < Math.abs(timesMs[nearest] - value)) {
                nearest = index;
            }
        }
        const time = this.times()[nearest];
        if (time !== undefined && time !== this.selectedTime()) {
            this.selectedTime.set(time);
        }
    }

    private percent(ms: number): number {
        const start = this.startMs();
        const end = this.endMs();
        return end > start ? ((ms - start) / (end - start)) * 100 : 0;
    }
}
