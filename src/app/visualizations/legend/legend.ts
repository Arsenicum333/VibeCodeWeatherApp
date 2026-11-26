import {Component, computed, input} from "@angular/core";
import {GradientStop} from "../../types/gradients.type";
import {LegendData} from "../../types/legend.type";

interface LegendBand {
    color: string;
    label: string;
}

/**
 * Colour scale of one layer. Stops are spaced evenly, whatever their values. "linear" gradients
 * blend between the stops; "stepped" gradients show one solid band per stop, starting at its value.
 */
@Component({
    selector: "app-legend",
    templateUrl: "./legend.html",
    styleUrl: "./legend.css",
})
export class LegendComponent {
    readonly legend = input.required<LegendData>();

    protected readonly bands = computed<LegendBand[]>(() => {
        const {gradient, formatValue = String} = this.legend();
        return gradient.map(stop => ({color: cssColor(stop), label: formatValue(stop.value)}));
    });

    /** CSS background of the bar for "linear" gradients: colours blend from stop to stop. */
    protected readonly linearBackground = computed(() => {
        const bands = this.bands();
        const last = Math.max(bands.length - 1, 1);
        const colors = bands.map((band, index) => `${band.color} ${(index / last) * 100}%`);
        return `linear-gradient(to right, ${colors.join(", ")})`;
    });

    /** Label position along the bar, in percent. */
    protected labelPosition(index: number): number {
        const count = this.bands().length;
        if (this.legend().gradientMode === "stepped") {
            return (index / count) * 100;
        }
        return (index / Math.max(count - 1, 1)) * 100;
    }
}

function cssColor({color: [r, g, b, a]}: GradientStop): string {
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}
