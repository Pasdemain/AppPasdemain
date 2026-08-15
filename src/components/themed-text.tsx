import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'heading' | 'small' | 'label' | 'mono';
  color?: ThemeColor;
};

export function ThemedText({ style, type = 'default', color, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[color ?? 'text'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 16, lineHeight: 23 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 21, lineHeight: 27, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  mono: { fontSize: 13, lineHeight: 19, fontFamily: Fonts?.mono },
});
