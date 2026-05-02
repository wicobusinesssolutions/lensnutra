import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Dimensions, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Modal, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Pressable,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Flame, 
  Target, 
  ChevronRight, 
  TrendingUp, 
  Scale, 
  Plus, 
  History,
  TrendingDown,
  Calendar,
  Camera,
  X,
  ImageIcon,
  CheckCircle2,
  Trophy,
  ChevronLeft
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useMealStore } from '@/store/mealStore';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { 
  format, 
  subDays, 
  startOfDay, 
  eachDayOfInterval, 
  parseISO, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isFuture,
  addMonths,
  subMonths
} from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const { profile, logWeight, getWeightTrend, getWaterGoal } = useUserStore();
  const meals = useMealStore((state) => state.meals);
  
  const [selectedRange, setSelectedRange] = useState<'90D' | '6M' | '1Y' | 'ALL'>('90D');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const getDayStatus = (date: Date) => {
    if (isFuture(date)) return 'future';
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const dailyMeals = meals.filter(m => isSameDay(new Date(m.timestamp), date));
    const totalCals = dailyMeals.reduce((sum, m) => sum + m.calories, 0);
    const waterIntake = profile.waterIntake?.[dateKey] ?? 0;
    
    // Goal Logic: 80% Calories, 100% Water
    const calorieGoal = 2000; // Default fallback
    const waterGoal = getWaterGoal();
    
    const caloriesMet = totalCals >= calorieGoal * 0.8;
    const waterMet = waterIntake >= waterGoal;

    if (caloriesMet && waterMet) return 'completed';
    if (caloriesMet || waterMet) return 'partial';
    return 'missed';
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarDate));
    const end = endOfWeek(endOfMonth(calendarDate));
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  const monthStats = useMemo(() => {
    const days = eachDayOfInterval({ 
      start: startOfMonth(calendarDate), 
      end: isSameDay(startOfMonth(calendarDate), startOfMonth(new Date())) ? new Date() : endOfMonth(calendarDate) 
    });
    const completed = days.filter(d => getDayStatus(d) === 'completed').length;
    return { completed, total: days.length };
  }, [calendarDate, meals, profile.waterIntake]);
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const weightUnit = profile.weightUnit || 'kg';
  const displayWeight = (kg: number) => {
    const val = weightUnit === 'lbs' ? kg * 2.20462 : kg;
    return val.toFixed(1);
  };
  const parseInputToKg = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return weightUnit === 'lbs' ? num / 2.20462 : num;
  };

  const [weightInput, setWeightInput] = useState(displayWeight(parseFloat(profile?.weightKg || '0')));

  const trend = getWeightTrend();

  // Chart Data Processing
  const chartData = useMemo(() => {
    const history = profile?.weightHistory || {};
    const dates = Object.keys(history).sort();
    
    if (dates.length === 0) return null;

    let filteredDates = dates;
    const now = new Date();
    
    if (selectedRange === '90D') {
      const cutoff = subDays(now, 90);
      filteredDates = dates.filter(d => parseISO(d) >= cutoff);
    } else if (selectedRange === '6M') {
      const cutoff = subDays(now, 180);
      filteredDates = dates.filter(d => parseISO(d) >= cutoff);
    }

    if (filteredDates.length === 0) return null;

    // If only one point, add a dummy point for the chart to render
    const labels = filteredDates.map(d => format(parseISO(d), 'MMM d'));
    const data = filteredDates.map(d => {
      const entry = history[d];
      const kg = typeof entry === 'number' ? entry : entry.weight;
      return weightUnit === 'lbs' ? kg * 2.20462 : kg;
    });

    return {
      labels: labels.length > 6 ? labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0) : labels,
      datasets: [{
        data: data,
        color: (opacity = 1) => colors.primary,
        strokeWidth: 3,
      }],
    };
  }, [profile.weightHistory, selectedRange, colors.primary, weightUnit]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera access to take progress photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        const filename = `weight_${Date.now()}.jpg`;
        const persistentUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: persistentUri,
        });
        setTempImageUri(persistentUri);
      } catch (error) {
        console.error('Error saving progress photo:', error);
        Alert.alert('Error', 'Failed to save progress photo.');
      }
    }
  };

  const handleLogWeight = () => {
    const kgValue = parseInputToKg(weightInput);
    if (kgValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight.');
      return;
    }
    logWeight(kgValue, format(new Date(), 'yyyy-MM-dd'), tempImageUri || undefined);
    setIsLogModalVisible(false);
    setTempImageUri(null);
    Alert.alert('Success', 'Weight logged successfully!');
  };

  const historyList = useMemo(() => {
    const history = profile?.weightHistory || {};
    return Object.entries(history)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entry]) => ({ 
        date, 
        weight: typeof entry === 'number' ? entry : entry.weight,
        imageUri: typeof entry === 'number' ? undefined : entry.imageUri
      }));
  }, [profile?.weightHistory]);

  const currentWeight = parseFloat(profile?.weightKg || '0') || 0;
  const goalWeight = parseFloat(profile?.weightGoal || '0') || 0;
  const progressToGoal = goalWeight > 0 
    ? Math.min(Math.max((currentWeight / goalWeight) * 100, 0), 100) 
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
        </View>

        {/* Consistency Calendar */}
        <View style={[
          styles.calendarCard, 
          { 
            backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : colors.card, 
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.border 
          }
        ]}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Consistency</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                {format(calendarDate, 'MMMM yyyy')}
              </Text>
            </View>
            <View style={styles.calendarNav}>
              <TouchableOpacity 
                onPress={() => setCalendarDate(subMonths(calendarDate, 1))}
                style={[styles.navBtn, { backgroundColor: colors.border }]}
              >
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setCalendarDate(addMonths(calendarDate, 1))}
                style={[styles.navBtn, { backgroundColor: colors.border }]}
                disabled={isSameDay(startOfMonth(calendarDate), startOfMonth(new Date()))}
              >
                <ChevronRight size={20} color={isSameDay(startOfMonth(calendarDate), startOfMonth(new Date())) ? colors.textTertiary : colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={[styles.weekDayText, { color: colors.textTertiary }]}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((date, i) => {
              const status = getDayStatus(date);
              const isCurrentMonth = isSameDay(startOfMonth(date), startOfMonth(calendarDate));
              const isTodayDate = isSameDay(date, new Date());

              return (
                <View key={i} style={styles.dayCell}>
                  <View style={[
                    styles.dayCircle,
                    status === 'completed' && { 
                      backgroundColor: colors.success + '20',
                      borderColor: colors.success,
                      borderWidth: 1,
                      shadowColor: colors.success,
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    },
                    status === 'partial' && { 
                      backgroundColor: colors.accent + '15',
                      borderColor: colors.accent + '40',
                      borderWidth: 1,
                    },
                    !isCurrentMonth && { opacity: 0.3 },
                    isTodayDate && { borderColor: colors.primary, borderWidth: 1.5 }
                  ]}>
                    <Text style={[
                      styles.dayText,
                      { color: isCurrentMonth ? colors.text : colors.textTertiary },
                      status === 'completed' && { color: colors.success, fontWeight: '800' }
                    ]}>
                      {format(date, 'd')}
                    </Text>
                    {status === 'completed' && (
                      <View style={styles.checkIcon}>
                        <CheckCircle2 size={8} color={colors.success} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.calendarFooter}>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Goal Met</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Partial</Text>
              </View>
            </View>
            
            <View style={[styles.monthSummary, { backgroundColor: colors.primary + '10' }]}>
              <Trophy size={16} color={colors.primary} />
              <Text style={[styles.summaryText, { color: colors.primary }]}>
                {monthStats.completed}/{monthStats.total} Days Perfect
              </Text>
            </View>
          </View>
        </View>

        {/* Groundbreaking Weight Card */}
        <View style={styles.topRow}>
          <View style={[
            styles.weightCard, 
            { 
              backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : colors.card, 
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.border 
            }
          ]}>
            <View style={styles.weightHeader}>
              <View style={[styles.iconBg, { backgroundColor: colors.primary + '10' }]}>
                <Scale color={colors.primary} size={20} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Current Weight</Text>
            </View>
            
            <View style={styles.weightValueRow}>
              <Text style={[styles.weightValue, { color: colors.text }]}>{displayWeight(currentWeight)}</Text>
              <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>{weightUnit}</Text>
              
              {trend && (
                <View style={[
                  styles.trendBadge, 
                  { backgroundColor: trend.type === 'lost' ? colors.success + '15' : colors.error + '15' }
                ]}>
                  {trend.type === 'lost' ? <TrendingDown size={14} color={colors.success} /> : <TrendingUp size={14} color={colors.error} />}
                  <Text style={[
                    styles.trendText, 
                    { color: trend.type === 'lost' ? colors.success : colors.error }
                  ]}>
                    {(weightUnit === 'lbs' ? trend.change * 2.20462 : trend.change).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.goalContainer}>
              <View style={styles.goalInfo}>
                <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Goal: {displayWeight(goalWeight)}{weightUnit}</Text>
                <Text style={[styles.goalPercent, { color: colors.primary }]}>{Math.round(progressToGoal)}%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${progressToGoal}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.logWeightButton, { backgroundColor: colors.primary + '10' }]}
              onPress={() => setIsLogModalVisible(true)}
              activeOpacity={0.7}
            >
              <Plus color={colors.primary} size={16} strokeWidth={3} />
              <Text style={[styles.logWeightButtonText, { color: colors.primary }]}>Log Weight</Text>
            </TouchableOpacity>
          </View>

          <View style={[
            styles.streakCard, 
            { 
              backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : colors.card, 
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.border 
            }
          ]}>
            <Flame color={colors.accent} size={32} fill={profile.streak > 0 ? colors.accent : 'transparent'} />
            <Text style={[styles.streakValue, { color: colors.text }]}>{profile.streak}</Text>
            <Text style={[styles.streakLabel, { color: colors.accent }]}>Day Streak</Text>
          </View>
        </View>

        {/* Interactive Chart Card */}
        <View style={[
          styles.chartCard, 
          { 
            backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : colors.card, 
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.border 
          }
        ]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Weight Analytics</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Visualizing your transformation</Text>
            </View>
            <View style={[styles.rangeSelector, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              {['90D', '6M', 'ALL'].map((r) => (
                <TouchableOpacity 
                  key={r} 
                  onPress={() => setSelectedRange(r as any)}
                  style={[styles.rangeItem, selectedRange === r && { backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.rangeText, { color: selectedRange === r ? colors.text : colors.textSecondary }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {chartData ? (
            <View style={styles.chartWrapper}>
              <LineChart
                data={chartData}
                width={SCREEN_WIDTH - 40}
                height={220}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: isDarkMode ? 'rgba(28, 28, 30, 0)' : colors.card,
                  backgroundGradientTo: isDarkMode ? 'rgba(28, 28, 30, 0)' : colors.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primary },
                  propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border, strokeWidth: 0.5 },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <TrendingUp size={48} color={colors.textTertiary} strokeWidth={1} />
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>Not enough data to show chart</Text>
              <Text style={[styles.emptyChartSubtext, { color: colors.textTertiary }]}>Log your weight for a few days to see trends</Text>
            </View>
          )}
        </View>

        {/* History List */}
        <View style={styles.sectionHeader}>
          <History size={20} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weight History</Text>
        </View>

        {historyList.length === 0 ? (
          <View style={[styles.emptyHistory, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>No weight logs yet</Text>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {historyList.map((item, index) => {
              const prevWeight = historyList[index + 1]?.weight;
              const diff = prevWeight ? item.weight - prevWeight : 0;
              
              return (
                <View key={item.date} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.historyLeft}>
                    {item.imageUri ? (
                      <TouchableOpacity onPress={() => setPreviewImage(item.imageUri!)}>
                        <Image source={{ uri: item.imageUri }} style={styles.historyThumbnail} />
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.historyIcon, { backgroundColor: colors.primary + '10' }]}>
                        <Calendar size={24} color={colors.primary} />
                      </View>
                    )}
                    <View>
                      <Text style={[styles.historyDate, { color: colors.text }]}>
                        {isSameDay(parseISO(item.date), new Date()) ? 'Today' : format(parseISO(item.date), 'MMMM d, yyyy')}
                      </Text>
                      <Text style={[styles.historyWeight, { color: colors.textSecondary }]}>{displayWeight(item.weight)} {weightUnit}</Text>
                    </View>
                  </View>
                  
                  {diff !== 0 && (
                    <View style={[
                      styles.historyDiff, 
                      { backgroundColor: diff < 0 ? colors.success + '15' : colors.error + '15' }
                    ]}>
                      <Text style={[
                        styles.historyDiffText, 
                        { color: diff < 0 ? colors.success : colors.error }
                      ]}>
                        {diff < 0 ? '-' : '+'}{(weightUnit === 'lbs' ? Math.abs(diff) * 2.20462 : Math.abs(diff)).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal
        visible={isLogModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLogModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsLogModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Log Weight</Text>
              <TouchableOpacity onPress={() => setIsLogModalVisible(false)}>
                <Text style={[styles.closeText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabelModal, { color: colors.textSecondary }]}>Weight ({weightUnit})</Text>
              <TextInput
                style={[styles.weightInput, { color: colors.text, borderColor: colors.border }]}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                autoFocus
                placeholder="0.0"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.photoSection}>
              <Text style={[styles.inputLabelModal, { color: colors.textSecondary }]}>Progress Photo</Text>
              {tempImageUri ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: tempImageUri }} style={styles.photoPreview} />
                  <TouchableOpacity 
                    style={styles.removePhotoBtn} 
                    onPress={() => setTempImageUri(null)}
                  >
                    <X color="#FFF" size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.addPhotoBtn, { borderColor: colors.border }]}
                  onPress={handleTakePhoto}
                >
                  <Camera color={colors.textSecondary} size={24} />
                  <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Take Progress Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleLogWeight}
            >
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Screen Image Preview */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.fullPreviewOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewImage(null)} />
          <Image source={{ uri: previewImage || '' }} style={styles.fullPreviewImage} resizeMode="contain" />
          <TouchableOpacity 
            style={[styles.closePreviewBtn, { top: insets.top + 20 }]} 
            onPress={() => setPreviewImage(null)}
          >
            <X color="#FFF" size={24} />
          </TouchableOpacity>
        </View>
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
  calendarCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  calendarFooter: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  monthSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  weightCard: {
    flex: 1.5,
    borderRadius: 28,
    padding: 20,
    paddingBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  logWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  logWeightButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  weightValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 16,
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginLeft: 8,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalContainer: {
    gap: 8,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  streakCard: {
    flex: 1,
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rangeSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  rangeItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -20,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyChartSubtext: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  emptyHistory: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyContainer: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '700',
  },
  historyWeight: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  historyDiff: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyDiffText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabelModal: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  weightInput: {
    height: 80,
    borderWidth: 1,
    borderRadius: 20,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
  },
  saveButton: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  photoSection: {
    marginBottom: 32,
  },
  addPhotoBtn: {
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreviewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  closePreviewBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
