import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Lock, Eye, Server } from 'lucide-react-native';
import { useThemeStore, getThemeColors } from '@/store/themeStore';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);

  const PolicySection = ({ icon: Icon, title, content }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconBg, { backgroundColor: colors.primary + '15' }]}>
          <Icon size={20} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{content}</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ShieldCheck size={48} color={colors.success} strokeWidth={1.5} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>Your Privacy Matters</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Last updated: October 2025. We are committed to protecting your personal data and being transparent about how we use it.
          </Text>
        </View>

        <PolicySection 
          icon={Eye}
          title="Data Collection"
          content="We collect information you provide directly, such as your name, email, and physical metrics (weight, height). When you use the AI camera, we process the images to identify food items. These images are stored locally on your device unless you choose to back them up."
        />

        <PolicySection 
          icon={Server}
          title="AI Processing"
          content="Food recognition is performed using secure cloud-based AI models (OpenRouter/LLM). Images sent for analysis are processed in real-time and are not used to build a personal profile of your eating habits for third-party advertisers."
        />

        <PolicySection 
          icon={Lock}
          title="Data Security"
          content="We implement industry-standard security measures to protect your data. Your nutritional history and profile information are encrypted during transit and at rest. We do not sell your personal information to any third parties."
        />

        <PolicySection 
          icon={ShieldCheck}
          title="User Rights"
          content="You have the right to access, correct, or delete your personal data at any time. You can clear your meal history or delete your account directly from the settings menu. For data portability requests, please contact our support team."
        />

        <View style={[styles.footerInfo, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            By using LensNutra, you agree to the terms outlined in this policy. We may update this policy periodically to reflect changes in our practices or for legal reasons.
          </Text>
        </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  heroCard: {
    padding: 24,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 32,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionContent: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  footerInfo: { marginTop: 20, paddingTop: 24, borderTopWidth: 1 },
  footerText: { fontSize: 13, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
});
