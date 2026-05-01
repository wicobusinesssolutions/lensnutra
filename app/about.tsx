import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Apple, Globe, Github, Twitter, Cpu, Zap, Heart } from 'lucide-react-native';
import { useThemeStore, getThemeColors } from '@/store/themeStore';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);

  const FeatureItem = ({ icon: Icon, title, desc }: any) => (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: colors.card }]}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Apple color="#FFF" size={48} strokeWidth={1.5} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>LensNutra</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0 (Build 2025.10)</Text>
        </View>

        <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.missionTitle, { color: colors.text }]}>Our Mission</Text>
          <Text style={[styles.missionText, { color: colors.textSecondary }]}>
            Empowering healthy choices through computer vision. We believe that understanding what you eat should be as simple as taking a photo.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>Core Features</Text>
        <View style={styles.featuresList}>
          <FeatureItem 
            icon={Cpu} 
            title="AI Meal Recognition" 
            desc="State-of-the-art vision models identify ingredients and portions instantly." 
          />
          <FeatureItem 
            icon={Zap} 
            title="Macro Tracking" 
            desc="Real-time calculation of proteins, carbs, and fats for every meal." 
          />
          <FeatureItem 
            icon={Heart} 
            title="Health Insights" 
            desc="Personalized tips based on your specific fitness and weight goals." 
          />
        </View>

        <View style={[styles.techCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.techTitle, { color: colors.text }]}>Built With</Text>
          <Text style={[styles.techText, { color: colors.textSecondary }]}>
            LensNutra is built using Expo, React Native, and OpenRouter LLM technology to provide a seamless cross-platform experience.
          </Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialIcon}><Globe size={20} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Twitter size={20} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Github size={20} color={colors.textSecondary} /></TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.copyright, { color: colors.textTertiary }]}>
          © 2025 LensNutra. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  version: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  missionCard: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 32 },
  missionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  missionText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  sectionLabel: { fontSize: 16, fontWeight: '800', marginBottom: 16, paddingLeft: 4 },
  featuresList: { gap: 20, marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  featureDesc: { fontSize: 13, fontWeight: '500' },
  techCard: { padding: 24, borderRadius: 28, borderWidth: 1, alignItems: 'center' },
  techTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  techText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  socialLinks: { flexDirection: 'row', gap: 24 },
  socialIcon: { padding: 8 },
  copyright: { textAlign: 'center', fontSize: 12, marginTop: 32, fontWeight: '500' },
});
