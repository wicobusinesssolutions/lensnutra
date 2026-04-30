import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Switch, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Bell, Shield, CircleHelp, LogOut, ChevronRight, Apple, Moon, Target, Check } from 'lucide-react-native';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { useUserStore, UserGoal } from '@/store/userStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const { profile, updateProfile } = useUserStore();
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const goals: UserGoal[] = ['Weight Loss', 'Muscle Gain', 'Weight Gain'];

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const SettingItem = ({ icon: Icon, label, value, children, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.item, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress && !children}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}>
          <Icon color={colors.text} size={20} />
        </View>
        <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{value}</Text>}
        {children || <ChevronRight color={colors.textSecondary} size={20} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 120 }}>
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
          <Text style={[styles.avatarText, { color: colors.text }]}>{initials || '??'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile.name}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile.email}</Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}
          onPress={() => router.push('/profile-edit')}
        >
          <Text style={[styles.editButtonText, { color: colors.text }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem 
            icon={User} 
            label="Personal Information" 
            onPress={() => router.push('/profile-edit')}
          />
          <SettingItem 
            icon={Target} 
            label="My Goals" 
            value={profile.goal} 
            onPress={() => setShowGoalPicker(true)}
          />
          <SettingItem icon={Bell} label="Notifications" value="On" />
          <SettingItem icon={Moon} label="Dark Mode">
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isDarkMode ? '#FFFFFF' : '#F4F3F4'}
            />
          </SettingItem>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & Legal</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem icon={CircleHelp} label="Help Center" />
          <SettingItem icon={Shield} label="Privacy Policy" />
          <SettingItem icon={Apple} label="About LensNutra AI" />
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card }]}>
        <LogOut color="#FF3B30" size={20} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0 (2025)</Text>

      <Modal
        visible={showGoalPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowGoalPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Your Goal</Text>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalOption,
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => {
                  updateProfile({ goal });
                  setShowGoalPicker(false);
                }}
              >
                <Text style={[
                  styles.goalOptionText, 
                  { color: profile.goal === goal ? colors.primary : colors.text }
                ]}>
                  {goal}
                </Text>
                {profile.goal === goal && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  goalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
