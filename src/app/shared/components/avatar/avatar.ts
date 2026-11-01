import { Component, booleanAttribute, computed, input, linkedSignal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { initialsOf } from '../../../utils/app.utils';

/** Number of `.tint-N` background classes defined in the global styles. */
const TINTS = 6;

/**
 * Circular avatar: initials on a soft tint (stable per character id), with the API image on
 * top once it has loaded. The tint is what shows while loading or if the image fails, so the
 * layout never jumps and there is never a broken-image icon.
 *
 * The image uses NgOptimizedImage in `fill` mode, because the rendered size changes with the
 * breakpoint (CSS overrides `size`). It is lazy-loaded by default; pass `priority` for the one
 * above-the-fold avatar (the details page) so it is fetched eagerly with high priority.
 */
@Component({
  selector: 'app-avatar',
  imports: [NgOptimizedImage],
  template: `
    <span aria-hidden="true">{{ initials() }}</span>
    @if (src() && !failed()) {
      <img [ngSrc]="src()!" fill [priority]="priority()" alt="" (error)="failed.set(true)" />
    }
  `,
  host: {
    '[class]': "'avatar tint-' + tint()",
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.34',
  },
})
export class AvatarComponent {
  /** Character name; its initials are the fallback content. */
  readonly name = input.required<string>();
  /** Character id; picks the tint so the same character always gets the same colour. */
  readonly id = input(0);
  /** Image URL. When missing or failing to load, only the initials are shown. */
  readonly src = input<string | undefined>();
  /** Default diameter in px (may be overridden by CSS at some breakpoints). */
  readonly size = input(40);
  /** Load the image eagerly with high priority; use only for above-the-fold avatars. */
  readonly priority = input(false, { transform: booleanAttribute });

  /** Set when the image errors, so it is removed and the initials show through; reset for a new `src`. */
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly tint = computed(() => this.id() % TINTS);
}
