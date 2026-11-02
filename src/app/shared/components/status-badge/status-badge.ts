import { Component, input } from '@angular/core';
import { Status } from '../../../core/models/character.model';

/** Character status as a coloured dot plus label; status and variant become host classes for styling. */
@Component({
  selector: 'app-status-badge',
  template: `<span class="dot" aria-hidden="true"></span>{{ status() }}`,
  host: { '[class]': "status().toLowerCase() + ' ' + variant()" },
  styleUrl: './status-badge.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<Status>();
  /** `plain`: dot + text (list rows). `pill`: white chip (cards). `soft`: tinted chip (details). */
  readonly variant = input<'plain' | 'pill' | 'soft'>('plain');
}
