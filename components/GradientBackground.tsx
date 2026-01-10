import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import StarBackground from './StarBackground';

export default function GradientBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={['#1a0b2e', '#2d1b4e', '#1f1333']}
      locations={[0, 0.55, 1]}
      style={styles.container}
    >
      <StarBackground />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
