import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import type { AbstractControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export function toDebouncedFormValueSignal<T>(
  control: AbstractControl<T>,
  debounceMs = 300,
): ReturnType<typeof toSignal<T | undefined>> {
  return toSignal(
    control.valueChanges.pipe(debounceTime(debounceMs), distinctUntilChanged(), takeUntilDestroyed()),
    { initialValue: undefined },
  );
}
