import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';

const Card = ({ children, style, onPress, isDark = false }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={[
        styles.card, 
        isDark ? styles.cardDark : styles.cardLight,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray[200],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: COLORS.pos.card,
    borderColor: COLORS.pos.border,
  }
});

export default Card;
