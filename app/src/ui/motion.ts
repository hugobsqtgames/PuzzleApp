// Motion tokens (DESIGN_SYSTEM § motion) and the system "Reduce Motion" switch.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

export const MOTION = {
  instant: 80,
  quick: 160,
  standard: 280,
  emphasis: 450,
  celebrate: 1200,
  reveal: 2400,
} as const;

export const EASE_OUT = Easing.out(Easing.cubic);
export const EASE_IN_OUT = Easing.inOut(Easing.sin);

let reduced = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduced = !!v; }).catch(() => { /* web */ });

/** True when the player asked the system for less motion: ambient loops stop, reveals become fades. */
export function useReducedMotion(): boolean {
  const [v, setV] = useState(reduced);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((x) => { if (alive) setV(!!x); }).catch(() => { /* web */ });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (x: boolean) => { reduced = x; setV(x); });
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return v;
}
