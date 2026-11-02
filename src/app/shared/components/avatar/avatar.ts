import { Component, booleanAttribute, computed, input, linkedSignal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

/**
 * Circular avatar: initials on a tint (one of `.tint-0`…`.tint-5`, stable per id), with the image
 * on top once loaded, so there is no layout jump or broken-image icon. NgOptimizedImage `fill`
 * mode because CSS changes the size per breakpoint; `priority` for the above-the-fold one.
 */
@Component({
  selector: 'app-avatar',
  imports: [NgOptimizedImage],
  template: `
    <span aria-hidden="true">{{ initials() }}</span>
    @if (!failed()) {
      <img [ngSrc]="src()" fill [priority]="priority()" alt="" (error)="failed.set(true)" />
    }
  `,
  host: {
    '[class]': "'avatar tint-' + (id() % 6)",
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.34',
  },
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly id = input.required<number>();
  readonly src = input.required<string>();
  /** Diameter in px (CSS may override it at some breakpoints). */
  readonly size = input(40);
  readonly priority = input(false, { transform: booleanAttribute });

  /** True once the image fails, so the initials show; reset for a new `src`. */
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
  /** "Rick Sanchez" -> "RS". */
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join(''),
  );
}
