// The accent of the interface: amber, or the colour of the district the player is in
// (setting « Couleur du quartier »). Provided at the root (_layout), read by the buttons.
import { createContext, useContext } from 'react';
import { T } from './theme';

export const AccentCtx = createContext<string>(T.amber);
export const useAccent = () => useContext(AccentCtx);

/** A slightly darker shade, for the pressed state. */
export function pressedShade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.85));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}
