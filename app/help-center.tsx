import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, MessageCircle, ChevronDown, ChevronUp, ExternalLink, HelpCircle } from 'lucide-react-native';
import { useThemeStore, getThemeColors } from '@/store/themeStore';

const FAQS = [
  {
    question: "How does AI scanning work?",
    answer: "LensNutra uses advanced computer vision models to identify food items in your photos. It estimates portions based on visual context and cross-references them with our nutritional database to provide calorie and macro estimates."
  },
  {
    question: "How are calorie goals calculated?",
    answer: "Your goals are calculated using the Mifflin-St Jeor equation based on your weight, height, age, and gender, then adjusted for your specific objective (Weight Loss, Muscle Gain, or Maintenance)."
  },
  {
    question: "Can I sync with Apple Health?",
    answer: "Currently, LensNutra is a standalone tracker. We are working on HealthKit and Google Fit integration for our next major update to sync your steps and nutrition data automatically."
  },
  {
    question: "Is my data private?",
    answer: "Yes. Your photos are processed securely and are not shared with third parties for marketing. We only use anonymized data to improve our AI recognition accuracy."
  }
];

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Our support team typically responds within 24 hours. Would you like to open your email client?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Email Us", onPress: () => console.log("Opening email...") }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput 
            placeholder="Search for help..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
        
        <View style={styles.faqList}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <TouchableOpacity 
                key={index}
                activeOpacity={0.7}
                onPress={() => setExpandedIndex(isExpanded ? null : index)}
                style={[
                  styles.faqItem, 
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border,
                    borderBottomWidth: isExpanded ? 0 : 1,
                    borderBottomLeftRadius: isExpanded ? 0 : 24,
                    borderBottomRightRadius: isExpanded ? 0 : 24,
                  }
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                  {isExpanded ? <ChevronUp size={20} color={colors.primary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
                </View>
                {isExpanded && (
                  <View style={[styles.faqAnswerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contact Support Card */}
        <View style={[styles.supportCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <View style={[styles.supportIcon, { backgroundColor: colors.primary }]}>
            <MessageCircle size={24} color="#FFF" />
          </View>
          <Text style={[styles.supportTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.supportText, { color: colors.textSecondary }]}>
            Our dedicated support team is available to help you with any technical issues or nutrition questions.
          </Text>
          <TouchableOpacity 
            style={[styles.supportButton, { backgroundColor: colors.primary }]}
            onPress={handleContactSupport}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, letterSpacing: -0.5 },
  faqList: { gap: 12, marginBottom: 32 },
  faqItem: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestion: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 10 },
  faqAnswerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  faqAnswer: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  supportCard: {
    padding: 24,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  supportIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  supportTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  supportText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 10 },
  supportButton: {
    height: 50,
    paddingHorizontal: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
