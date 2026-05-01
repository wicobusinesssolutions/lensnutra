import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Switch, 
  Modal, 
  Pressable, 
  Alert, 
  TextInput 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Bell, 
  ChevronLeft, 
  Clock, 
  RefreshCw, 
  Send, 
  Droplets, 
  Utensils,
  Check
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { useUserStore, MealReminder } from '@/store/userStore';

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const { profile, updateProfile, calculateDefaultReminders, calculateDefaultWaterReminders } = useUserStore();
  const [editingReminder, setEditingReminder] = useState<{ id: string, type: 'meal' | 'water' } | null>(null);

  // Automatically sync OS notifications when store state changes (e.g. from goal change)
  React.useEffect(() => {
    scheduleAllNotifications(
      profile.notificationsEnabled,
      profile.mealReminders,
      profile.waterNotificationsEnabled,
      profile.waterReminders
    );
  }, [profile.mealReminders, profile.waterReminders, profile.goal]);

  const scheduleAllNotifications = async (
    mealEnabled: boolean, 
    mealReminders: MealReminder[],
    waterEnabled: boolean,
    waterReminders: MealReminder[]
  ) => {
    if (Platform.OS === 'web') return;
    
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted' && (mealEnabled || waterEnabled)) {
        Alert.alert('Permission Required', 'Please enable notifications in settings to receive reminders.');
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      
      if (mealEnabled && mealReminders) {
        for (const reminder of mealReminders) {
          if (!reminder.active) continue;
          const [hours, minutes] = reminder.time.split(':').map(Number);
          const messages = {
            'Weight Loss': `Time for ${reminder.label}! Keep it light and stay consistent.`,
            'Muscle Gain': `Fuel up for growth! Time for your ${reminder.label}.`,
            'Weight Gain': `Don't miss your ${reminder.label}! Every calorie counts.`,
          };

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${reminder.label} Time! 🥗`,
              body: messages[profile.goal as keyof typeof messages] || `Stay on track with your ${profile.goal} goal.`,
              data: { type: 'meal_reminder', id: reminder.id },
              sound: true,
              priority: Notifications.AndroidPriority.HIGH,
            },
            trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: hours, minute: minutes },
          });
        }
      }

      if (waterEnabled && waterReminders) {
        for (const reminder of waterReminders) {
          if (!reminder.active) continue;
          const [hours, minutes] = reminder.time.split(':').map(Number);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Hydration Reminder 💧`,
              body: `Time to drink some water! Stay on track with your daily goal.`,
              data: { type: 'water_reminder', id: reminder.id },
              sound: true,
              priority: Notifications.AndroidPriority.HIGH,
            },
            trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: hours, minute: minutes },
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const testNotification = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Web Preview', 'Notifications are only supported on native devices.');
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Enable notifications to test this feature.');
        return;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "LensNutra Test 🚀",
        body: "Your reminders are working perfectly with sound!",
        data: { type: 'test' },
        sound: true,
      },
      trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false },
    });
    
    Alert.alert('Success', 'Test notification scheduled for 5 seconds from now.');
  };

  const toggleMealNotifications = async (value: boolean) => {
    updateProfile({ notificationsEnabled: value });
    await scheduleAllNotifications(value, profile.mealReminders, profile.waterNotificationsEnabled, profile.waterReminders);
  };

  const toggleWaterNotifications = async (value: boolean) => {
    updateProfile({ waterNotificationsEnabled: value });
    await scheduleAllNotifications(profile.notificationsEnabled, profile.mealReminders, value, profile.waterReminders);
  };

  const toggleReminder = async (id: string, type: 'meal' | 'water') => {
    if (type === 'meal') {
      const updated = profile.mealReminders.map(r => r.id === id ? { ...r, active: !r.active } : r);
      updateProfile({ mealReminders: updated });
      await scheduleAllNotifications(profile.notificationsEnabled, updated, profile.waterNotificationsEnabled, profile.waterReminders);
    } else {
      const updated = profile.waterReminders.map(r => r.id === id ? { ...r, active: !r.active } : r);
      updateProfile({ waterReminders: updated });
      await scheduleAllNotifications(profile.notificationsEnabled, profile.mealReminders, profile.waterNotificationsEnabled, updated);
    }
  };

  const updateReminderTime = async (id: string, type: 'meal' | 'water', newTime: string) => {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) {
      Alert.alert('Invalid Time', 'Please use HH:mm format (e.g., 08:30)');
      return;
    }

    if (type === 'meal') {
      const updated = profile.mealReminders.map(r => r.id === id ? { ...r, time: newTime } : r);
      updateProfile({ mealReminders: updated });
      await scheduleAllNotifications(profile.notificationsEnabled, updated, profile.waterNotificationsEnabled, profile.waterReminders);
    } else {
      const updated = profile.waterReminders.map(r => r.id === id ? { ...r, time: newTime } : r);
      updateProfile({ waterReminders: updated });
      await scheduleAllNotifications(profile.notificationsEnabled, profile.mealReminders, profile.waterNotificationsEnabled, updated);
    }
    setEditingReminder(null);
  };

  const resetReminders = async () => {
    Alert.alert(
      'Restore Defaults',
      'Would you like to restore all reminders to health-optimized recommended times?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          onPress: async () => {
            const mealDefaults = calculateDefaultReminders(profile.goal);
            const waterDefaults = calculateDefaultWaterReminders();
            updateProfile({ mealReminders: mealDefaults, waterReminders: waterDefaults });
            await scheduleAllNotifications(profile.notificationsEnabled, mealDefaults, profile.waterNotificationsEnabled, waterDefaults);
            Alert.alert('Reset Complete', 'All reminders have been restored to health-optimized times.');
          }
        }
      ]
    );
  };

  const isMealScheduleDefault = () => {
    const defaults = calculateDefaultReminders(profile.goal);
    if (profile.mealReminders.length !== defaults.length) return false;
    return profile.mealReminders.every((r, i) => r.time === defaults[i].time);
  };

  const isWaterScheduleDefault = () => {
    const defaults = calculateDefaultWaterReminders();
    if (profile.waterReminders.length !== defaults.length) return false;
    return profile.waterReminders.every((r, i) => r.time === defaults[i].time);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Global Settings</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={testNotification} style={styles.actionButton}>
                <Send size={14} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Test</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetReminders} style={styles.actionButton}>
                <RefreshCw size={14} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
            <View style={[styles.item, { borderBottomColor: colors.border }]}>
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}>
                  <Utensils color={colors.text} size={20} />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>Meal Reminders</Text>
              </View>
              <Switch 
                value={profile.notificationsEnabled} 
                onValueChange={toggleMealNotifications}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : profile.notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}>
                  <Droplets color={colors.primary} size={20} />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>Water Reminders</Text>
              </View>
              <Switch 
                value={profile.waterNotificationsEnabled} 
                onValueChange={toggleWaterNotifications}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : profile.waterNotificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
          </View>
        </View>

        {profile.notificationsEnabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Meal Schedule</Text>
              {isMealScheduleDefault() && (
                <View style={[styles.badge, { backgroundColor: colors.success + '15' }]}>
                  <Check size={10} color={colors.success} strokeWidth={3} />
                  <Text style={[styles.badgeText, { color: colors.success }]}>Recommended</Text>
                </View>
              )}
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
              {(profile.mealReminders || []).map((reminder, index) => (
                <TouchableOpacity 
                  key={reminder.id} 
                  style={[styles.item, index !== profile.mealReminders.length - 1 && { borderBottomColor: colors.border }]}
                  onPress={() => setEditingReminder({ id: reminder.id, type: 'meal' })}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}>
                      <Clock color={colors.text} size={20} />
                    </View>
                    <View>
                      <Text style={[styles.itemLabel, { color: colors.text }]}>{reminder.label}</Text>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{reminder.time}</Text>
                    </View>
                  </View>
                  <Switch 
                    value={reminder.active} 
                    onValueChange={() => toggleReminder(reminder.id, 'meal')}
                    trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : reminder.active ? '#FFFFFF' : '#F4F3F4'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {profile.waterNotificationsEnabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Water Schedule</Text>
              {isWaterScheduleDefault() && (
                <View style={[styles.badge, { backgroundColor: colors.success + '15' }]}>
                  <Check size={10} color={colors.success} strokeWidth={3} />
                  <Text style={[styles.badgeText, { color: colors.success }]}>Recommended</Text>
                </View>
              )}
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
              {(profile.waterReminders || []).map((reminder, index) => (
                <TouchableOpacity 
                  key={reminder.id} 
                  style={[styles.item, index !== profile.waterReminders.length - 1 && { borderBottomColor: colors.border }]}
                  onPress={() => setEditingReminder({ id: reminder.id, type: 'water' })}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}>
                      <Droplets color={colors.primary} size={20} />
                    </View>
                    <View>
                      <Text style={[styles.itemLabel, { color: colors.text }]}>{reminder.label}</Text>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{reminder.time}</Text>
                    </View>
                  </View>
                  <Switch 
                    value={reminder.active} 
                    onValueChange={() => toggleReminder(reminder.id, 'water')}
                    trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : reminder.active ? '#FFFFFF' : '#F4F3F4'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editingReminder !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingReminder(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditingReminder(null)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Reminder Time</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Enter time in 24h format (HH:mm)</Text>
            <TextInput
              style={[styles.timeInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="08:00"
              placeholderTextColor={colors.textTertiary}
              defaultValue={
                editingReminder?.type === 'meal' 
                  ? (profile.mealReminders || []).find(r => r.id === editingReminder?.id)?.time 
                  : (profile.waterReminders || []).find(r => r.id === editingReminder?.id)?.time || ''
              }
              onSubmitEditing={(e) => {
                if (editingReminder) {
                  updateReminderTime(editingReminder.id, editingReminder.type, e.nativeEvent.text);
                }
              }}
              autoFocus
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => setEditingReminder(null)}
            >
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
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
  itemValue: {
    fontSize: 14,
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
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  timeInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginRight: 24,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
