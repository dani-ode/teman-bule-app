import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../theme';

export type TextVariant = 'heading' | 'title' | 'subtitle' | 'body' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof typeof theme.colors.text | string;
  weight?: keyof typeof theme.typography.weights;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  style,
  children,
  ...props
}: TextProps) => {
  const textColor = theme.colors.text[color as keyof typeof theme.colors.text] || color;
  const variantStyle: TextStyle = styles[variant];
  const fontWeightStyle: TextStyle | undefined = weight ? { fontWeight: theme.typography.weights[weight] } : undefined;

  return (
    <RNText
      style={[
        variantStyle,
        { color: textColor, textAlign: align },
        fontWeightStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create<Record<TextVariant, TextStyle>>({
  heading: {
    fontSize: theme.typography.sizes.heading,
    fontWeight: theme.typography.weights.bold,
    lineHeight: 36,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    lineHeight: 24,
  },
  body: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.regular,
    lineHeight: 22,
  },
  caption: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    lineHeight: 16,
  },
});
