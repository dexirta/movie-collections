import { ElementRef, Signal, effect } from '@angular/core';

export function focusOnInit(reference: Signal<ElementRef<HTMLElement> | undefined>): void {
  effect(() => {
    const element = reference();
    if (!element) return;
    queueMicrotask(() => element.nativeElement.focus());
  });
}
