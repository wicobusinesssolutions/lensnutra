import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  User, 
  Target, 
  Scale, 
  Ruler,
  ArrowRight,
  Sparkles,
  Apple,
  Camera,
  BarChart2
} from 'lucide-react-native';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { useUserStore, UserGoal } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const { updateProfile, completeOnboarding } = useUserStore();

  const [step, setStep] = useState(0);
  const totalSteps = 6;
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Form State
  const [gender, setGender] = useState('Male');
  const [goal, setGoal] = useState<UserGoal>('Weight Loss');
  const [weightKg, setWeightKg] = useState('70');
  const [weightLbs, setWeightLbs] = useState('154.3');
  const [heightCm, setHeightCm] = useState('170');
  const [heightFt, setHeightFt] = useState('5.6');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Conversion Helpers
  const kgToLbs = (kg: string) => {
    const val = parseFloat(kg);
    return isNaN(val) ? '' : (val * 2.20462).toFixed(1);
  };
  const lbsToKg = (lbs: string) => {
    const val = parseFloat(lbs);
    return isNaN(val) ? '' : (val / 2.20462).toFixed(1);
  };
  const cmToFt = (cm: string) => {
    const val = parseFloat(cm);
    return isNaN(val) ? '' : (val / 30.48).toFixed(1);
  };
  const ftToCm = (ft: string) => {
    const f = parseFloat(ft);
    return isNaN(f) ? '' : (f * 30.48).toFixed(1);
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    callback();
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      animateTransition(() => setStep(step + 1));
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) animateTransition(() => setStep(step - 1));
  };

  const finishOnboarding = () => {
    updateProfile({
      name: name || 'User',
      email: email || 'user@example.com',
      weightKg,
      heightCm,
      goal,
      gender,
    });
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.welcomeContainer}>
            {/* Glassmorphism Hero Card */}
            <View style={[
              styles.heroGlassCard,
              {
                backgroundColor: isDarkMode ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.08)',
                borderColor: isDarkMode ? 'rgba(0, 122, 255, 0.25)' : 'rgba(0, 122, 255, 0.15)',
              }
            ]}>
              <View style={styles.heroIconGlow}>
                <Apple size={64} color={colors.primary} />
              </View>
              <LinearGradient
                colors={isDarkMode ? ['rgba(0,122,255,0.3)', 'transparent'] : ['rgba(0,122,255,0.15)', 'transparent']}
                style={styles.heroGradient}
              />
            </View>
            
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Transform Your{'\n'}Nutrition with AI
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Get a personalized nutrition plan in seconds using advanced meal recognition.
            </Text>

            <View style={styles.featureList}>
              {[
                { icon: Camera, title: 'AI Meal Recognition', desc: 'Snap a photo to instantly track calories and macros.' },
                { icon: Target, title: 'Personalized Goals', desc: 'Tailored targets for weight loss or muscle gain.' },
                { icon: BarChart2, title: 'Progress Tracking', desc: 'Visualize your journey with detailed analytics.' },
              ].map((feature, i) => (
                <View key={i} style={[
                  styles.featureItem,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)',
                  }
                ]}>
                  <View style={[styles.featureIcon, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.20)' : 'rgba(0,122,255,0.10)' }]}>
                    <feature.icon size={22} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.stepIconContainer, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.08)' }]}>
              <Sparkles size={40} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>What's your gender?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>This helps us calibrate your metabolic rate.</Text>
            <View style={styles.optionsGrid}>
              {['Male', 'Female', 'Other'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: gender === item 
                        ? (isDarkMode ? 'rgba(0,122,255,0.20)' : 'rgba(0,122,255,0.10)')
                        : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)'),
                      borderColor: gender === item ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)'),
                    }
                  ]}
                  onPress={() => setGender(item)}
                >
                  <Text style={[styles.optionText, { color: colors.text, fontWeight: gender === item ? '700' : '500' }]}>{item}</Text>
                  {gender === item && <Check size={20} color={colors.primary} strokeWidth={2.5} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.stepIconContainer, { backgroundColor: isDarkMode ? 'rgba(255,149,0,0.15)' : 'rgba(255,149,0,0.08)' }]}>
              <Target size={40} color={colors.accent} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>What's your goal?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>We'll tailor your daily macros accordingly.</Text>
            <View style={styles.optionsGrid}>
              {(['Weight Loss', 'Muscle Gain', 'Weight Gain'] as UserGoal[]).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: goal === item 
                        ? (isDarkMode ? 'rgba(255,149,0,0.20)' : 'rgba(255,149,0,0.10)')
                        : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)'),
                      borderColor: goal === item ? colors.accent : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)'),
                    }
                  ]}
                  onPress={() => setGoal(item)}
                >
                  <Text style={[styles.optionText, { color: colors.text, fontWeight: goal === item ? '700' : '500' }]}>{item}</Text>
                  {goal === item && <Check size={20} color={colors.accent} strokeWidth={2.5} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.stepIconContainer, { backgroundColor: isDarkMode ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.08)' }]}>
              <Scale size={40} color={colors.success} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Current Weight</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your weight in either unit.</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kilograms</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)',
                    }
                  ]}
                  value={weightKg}
                  onChangeText={(v) => { setWeightKg(v); setWeightLbs(kgToLbs(v)); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Pounds</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)',
                    }
                  ]}
                  value={weightLbs}
                  onChangeText={(v) => { setWeightLbs(v); setWeightKg(lbsToKg(v)); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.stepIconContainer, { backgroundColor: isDarkMode ? 'rgba(175,82,222,0.15)' : 'rgba(175,82,222,0.08)' }]}>
              <Ruler size={40} color="#AF52DE" strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Your Height</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>How tall are you?</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Centimeters</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)',
                    }
                  ]}
                  value={heightCm}
                  onChangeText={(v) => { setHeightCm(v); setHeightFt(cmToFt(v)); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Feet</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)',
                    }
                  ]}
                  value={heightFt}
                  onChangeText={(v) => { setHeightFt(v); setHeightCm(ftToCm(v)); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.stepIconContainer, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.08)' }]}>
              <User size={40} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Almost there!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tell us who you are.</Text>
            <View style={styles.fullWidthInput}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)',
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={[styles.fullWidthInput, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)',
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Dots */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.progressDot, 
                { 
                  backgroundColor: i <= step ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'),
                  width: i === step ? 24 : 8,
                }
              ]} 
            />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.buttonRow, step === 0 && { justifyContent: 'center' }]}>
            {step > 0 && (
              <TouchableOpacity 
                style={[
                  styles.backButton,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  }
                ]} 
                onPress={handleBack}
              >
                <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.nextButton, 
                { backgroundColor: colors.primary },
                step === 0 && { flex: 1 }
              ]} 
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextButtonText, { color: '#FFFFFF' }]}>
                {step === 0 ? 'Start My Journey' : step === totalSteps - 1 ? 'Finish' : 'Next'}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    transitionProperty: 'width',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  heroGlassCard: {
    width: 140,
    height: 140,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroIconGlow: {
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  optionsGrid: {
    width: '100%',
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    gap: 8,
  },
  fullWidthInput: {
    width: '100%',
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
