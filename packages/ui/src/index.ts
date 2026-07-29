export type InterfaceDirection = 'ltr' | 'rtl';

export interface LocalizedShell {
  readonly direction: InterfaceDirection;
  readonly locale: 'ar' | 'en';
}
