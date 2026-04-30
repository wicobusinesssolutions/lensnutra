import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform, 
  KeyboardAvoidingView 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Mail, Scale, Ruler, Check } from 'lucide-react-native';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
import { useEffect } from 'react';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const { profile, updateProfile } = useUserStore();

  // Local state for form fields
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  
  // Source of truth is Metric (kg/cm)
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [weightLbs, setWeightLbs] = useState('');
  
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [heightFt, setHeightFt] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

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
    if (isNaN(val)) return '';
    // Convert cm to feet (1 ft = 30.48 cm)
    const ft = val / 30.48;
    return ft.toFixed(1);
  };

  const ftToCm = (ft: string) => {
    const f = parseFloat(ft);
    if (isNaN(f)) return '';
    return (f * 30.48).toFixed(1);
  };

  // Handlers
  const handleWeightKgChange = (val: string) => {
    setWeightKg(val);
    setWeightLbs(kgToLbs(val));
  };

  const handleWeightLbsChange = (val: string) => {
    setWeightLbs(val);
    setWeightKg(lbsToKg(val));
  };

  const handleHeightCmChange = (val: string) => {
    setHeightCm(val);
    setHeightFt(cmToFt(val));
  };

  const handleHeightFtChange = (val: string) => {
    setHeightFt(val);
    setHeightCm(ftToCm(val));
  };

  // Initialize imperial values on mount
  useEffect(() => {
    setWeightLbs(kgToLbs(profile.weightKg));
    setHeightFt(cmToFt(profile.heightCm));
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    // Persist to global store
    updateProfile({
      name,
      email,
      weightKg,
      heightCm,
    });

    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 600);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Information</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <InputField 
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              icon={User}
              colors={colors}
            />
            
            <InputField 
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              icon={Mail}
              colors={colors}
            />

            <View style={styles.sectionHeader}>
              <Scale size={18} color={colors.text} />
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Weight</Text>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField 
                  value={weightKg}
                  onChangeText={handleWeightKgChange}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  icon={Scale}
                  unit="kg"
                  colors={colors}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <InputField 
                  value={weightLbs}
                  onChangeText={handleWeightLbsChange}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  icon={Scale}
                  unit="lbs"
                  colors={colors}
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Ruler size={18} color={colors.text} />
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Height</Text>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField 
                  value={heightCm}
                  onChangeText={handleHeightCmChange}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  icon={Ruler}
                  unit="cm"
                  colors={colors}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <InputField 
                  value={heightFt}
                  onChangeText={handleHeightFtChange}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  icon={Ruler}
                  unit="ft"
                  colors={colors}
                />
              </View>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.card + '80' }]}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Your physical metrics are used to calculate your daily calorie and macro goals more accurately.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Text style={[styles.saveButtonText, { color: isDarkMode ? '#000' : '#FFF' }]}>Saving...</Text>
            ) : (
              <>
                <Check size={20} color={isDarkMode ? '#000' : '#FFF'} />
                <Text style={[styles.saveButtonText, { color: isDarkMode ? '#000' : '#FFF' }]}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const InputField = ({ label, value, onChangeText, placeholder, keyboardType, icon: Icon, unit, colors }: any) => (
  <View style={styles.inputContainer}>
    {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.inputIcon}>
        <Icon size={20} color={colors.textSecondary} />
      </View>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
      />
      {unit && <Text style={[styles.unitText, { color: colors.textSecondary }]}>{unit}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: -8,
    paddingLeft: 4,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoBox: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
