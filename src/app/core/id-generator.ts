import { InjectionToken } from '@angular/core';

export type IdGenerator = () => string;

export const ID_GENERATOR = new InjectionToken<IdGenerator>('ID_GENERATOR', {
  providedIn: 'root',
  factory: () => () => globalThis.crypto?.randomUUID?.(),
});
