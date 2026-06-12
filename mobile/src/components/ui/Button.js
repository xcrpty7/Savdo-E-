import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  icon,
  style,
  textStyle 
}) => {
  const isDark = variant === 'pos';

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: COLORS.primary[600] };
      case 'secondary':
        return { backgroundColor: COLORS.gray[100] };
      case 'danger':
        return { backgroundColor: COLORS.danger };
      case 'outline':
        return { 
          backgroundColor: 'transparent', 
          borderWidth: 1, 
          borderColor: COLORS.gray[300] 
        };
      case 'pos':
        return { backgroundColor: COLORS.pos.accent };
      default:
        return { backgroundColor: COLORS.primary[600] };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return COLORS.gray[700];
    if (variant === 'secondary') return COLORS.gray[900];
    if (variant === 'pos') return COLORS.white;
    return COLORS.white;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        getVariantStyle(),
        disabled && styles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[
            styles.text, 
            { color: getTextColor() },
            variant === 'outline' && { fontWeight: '600' },
            textStyle
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: SIZES.base,
    ...FONTS.medium,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: 8,
  }
});

export default Button;
