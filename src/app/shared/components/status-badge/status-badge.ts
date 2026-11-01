import { Component, computed, input } from '@angular/core';
import { Status } from '../../../core/models/character.model';

/**
 * Character status (Alive / Dead / Unknown) as a coloured dot plus label.
 * The status and variant are applied as host classes, which the stylesheet uses
 * to pick the dot colour and chip style.
 */
@Component({
  selector: 'app-status-badge',
  template: `<span class="dot" aria-hidden="true"></span>{{ label() }}`,
  host: { '[class]': 'cssClass()' },
  styleUrl: './status-badge.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<Status>();
  /** `plain`: dot + text (list rows). `pill`: white chip (over card tint). `soft`: tinted chip (details). */
  readonly variant = input<'plain' | 'pill' | 'soft'>('plain');
  /** Display text; the API sends `unknown` in lowercase, unlike `Alive` / `Dead`. */
  protected readonly label = computed(() =>
    this.status() === 'unknown' ? 'Unknown' : this.status(),
  );
  /** e.g. `alive pill` — lowercased so it matches the `.alive` / `.dead` selectors. */
  protected readonly cssClass = computed(() => `${this.status().toLowerCase()} ${this.variant()}`);
}
