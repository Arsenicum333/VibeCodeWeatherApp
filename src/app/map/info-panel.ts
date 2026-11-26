import {Component, signal} from "@angular/core";

/**
 * Shows helpful information and tips about using the weather map.
 */
@Component({
    selector: "app-info-panel",
    templateUrl: "./info-panel.html",
    styleUrl: "./info-panel.css",
})
export class InfoPanelComponent {
    protected readonly isOpen = signal(false);

    protected toggleOpen(): void {
        this.isOpen.update(open => !open);
    }
}
