import { View, Text, StyleSheet } from 'react-native';

export default function LogoFinora() {
  return (
    <View style={styles.container}>
      {/* Moon / symbol */}
      <View style={styles.moon} />

      {/* Brand name */}
      <Text style={styles.text}>FINORA</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>clarity over chaos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  moon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F4F4F6',
    marginBottom: 18,

    shadowColor: '#7B8CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 14,
  },

  text: {
    fontSize: 60,
    fontWeight: '700',
    letterSpacing: 10,
    color: '#FFFFFF',
    marginBottom: 6,
  },

  tagline: {
    fontSize: 14,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.6)',
  },
});
