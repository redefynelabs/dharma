// Module augmentation: adds getReactNativePersistence to firebase/auth types.
// The symbol exists at runtime because Metro resolves @firebase/auth's
// react-native export condition. The firebase wrapper just doesn't re-export it.
//
// The top-level import makes TypeScript treat this as augmentation (merge)
// rather than an ambient declaration (replace).
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
