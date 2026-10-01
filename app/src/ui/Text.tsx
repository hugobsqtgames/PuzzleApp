// Text that follows the system text size (Dynamic Type), up to the point where
// boards and buttons still hold. Use it instead of react-native's Text.
import React from 'react';
import { lang } from '../i18n';
import { Platform, Text as RNText, TextInput as RNTextInput, StyleSheet, TextInputProps, TextProps } from 'react-native';

export const MAX_FONT_SCALE = 1.4;

/**
 * The web build cannot read the system text size; QA scripts set
 * `globalThis.__lampionFontScale` to see the screens at a larger size.
 */
function scaled(style: TextProps['style']): TextProps['style'] {
  const k = Platform.OS === 'web' ? (globalThis as { __lampionFontScale?: number }).__lampionFontScale : undefined;
  if (!k) return style;
  const s = StyleSheet.flatten(style) ?? {};
  return [style, { fontSize: (s.fontSize ?? 14) * k, lineHeight: s.lineHeight ? s.lineHeight * k : undefined }];
}

/** French typography: the space before « : ; ? ! » and inside « » never breaks the line. */
export const frenchSpaces = (t: string) => t.replace(/ ([:;?!»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
const typeset = (children: React.ReactNode): React.ReactNode =>
  typeof children === 'string' ? frenchSpaces(children) : React.Children.map(children, (c) => (typeof c === 'string' ? frenchSpaces(c) : c));

export function Text({ style, children, ...props }: TextProps & { ref?: React.Ref<RNText> }) {
  return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} style={scaled(style)}>{lang() === 'fr' ? typeset(children) : children}</RNText>;
}

export function TextInput(props: TextInputProps & { ref?: React.Ref<RNTextInput> }) {
  return <RNTextInput maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} />;
}
