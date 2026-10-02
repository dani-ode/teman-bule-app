import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export type TextVariant = 'heading' | 'title' | 'subtitle' | 'body' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'correctionHeader';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  className?: string;
}

const variantClasses: Record<TextVariant, string> = {
  heading: 'text-3xl font-bold leading-9',
  title: 'text-2xl font-bold leading-[30px]',
  subtitle: 'text-lg font-semibold leading-6',
  body: 'text-base font-normal leading-[22px]',
  caption: 'text-xs font-medium leading-4',
};

const colorClasses: Record<NonNullable<TextProps['color']>, string> = {
  primary: 'text-ink-primary',
  secondary: 'text-ink-secondary',
  muted: 'text-ink-muted',
  inverse: 'text-ink-inverse',
  correctionHeader: 'text-ink-correctionHeader',
};

const weightClasses: Record<NonNullable<TextProps['weight']>, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const alignClasses: Record<NonNullable<TextProps['align']>, string> = {
  auto: 'text-left',
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
  justify: 'text-justify',
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  className,
  children,
  ...props
}: TextProps) => {
  const classes = [
    variantClasses[variant],
    colorClasses[color],
    weight ? weightClasses[weight] : '',
    alignClasses[align],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <RNText className={classes} {...props}>
      {children}
    </RNText>
  );
};
