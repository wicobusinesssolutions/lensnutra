import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Platform, Alert, AppState } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Footprints, Flame, Timer, TrendingUp, ChevronLeft, ChevronRight, CheckCircle2, Trophy, Info, Target } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
import { useActivityStore } from '@/store/activityStore';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isFuture, addMonths, subMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEP_GOAL = 10000;

const ActivityRing = ({ size, progress, color, isDarkMode, colors }: any) => {
  const center = size / 2;
  const strokeWidth = 18;
  const radius = (size / 2) - 12;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringContent}>
        <Footprints size={32} color={color} strokeWidth={2.5} />
        <Text style={[styles.ringValue, { color: colors.text }]}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

export default function PedometerScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const { profile } = useUserStore();
  const { dailyActivity, updateSteps, getActivityForDate } = useActivityStore();
  
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [displaySteps, setDisplaySteps] = useState(0); // For smooth UI interpolation
  const [calendarDate, setCalendarDate] = useState(new Date());

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const weightKg = parseFloat(profile.weightKg) || 70;
  const heightCm = parseFloat(profile.heightCm) || 170;

  // 1. Fetch absolute total steps for today from the hardware buffer
  const fetchTotalSteps = async () => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(String(isAvailable));
      if (!isAvailable) return;

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      
      const result = await Pedometer.getStepCountAsync(start, end);
      if (result && result.steps !== undefined) {
        setCurrentStepCount(result.steps);
        updateSteps(todayKey, result.steps, weightKg, heightCm);
      }
    } catch (e) {
      console.error("Pedometer fetch error:", e);
    }
  };

  // 2. Setup Polling and AppState listeners
  useEffect(() => {
    fetchTotalSteps();

    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchTotalSteps, 5000);

    // Refresh immediately when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchTotalSteps();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [todayKey, weightKg, heightCm]);

  // 3. Smooth UI Interpolation (The "Live" feel)
  // This effect "chases" the currentStepCount to create a count-up animation
  useEffect(() => {
    if (displaySteps < currentStepCount) {
      const diff = currentStepCount - displaySteps;
      const step = Math.ceil(diff / 10); // Move 10% of the way each tick
      
      const timer = setTimeout(() => {
        setDisplaySteps(prev => Math.min(prev + step, currentStepCount));
      }, 32); // ~30fps
      
      return () => clearTimeout(timer);
    } else if (displaySteps > currentStepCount) {
      // If count somehow goes down (e.g. new day), reset immediately
      setDisplaySteps(currentStepCount);
    }
  }, [currentStepCount, displaySteps]);

  const todayActivity = getActivityForDate(todayKey);
  // Use displaySteps for the ring and main display to ensure smoothness
  const stepProgress = (displaySteps / STEP_GOAL) * 100;

  const chartData = useMemo(() => {
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, 'yyyy-MM-dd');
      labels.push(format(date, 'EEE'));
      data.push(dailyActivity[key]?.steps || 0);
    }
    return {
      labels,
      datasets: [{ data, color: (opacity = 1) => colors.primary, strokeWidth: 3 }]
    };
  }, [dailyActivity, colors.primary]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarDate));
    const end = endOfWeek(endOfMonth(calendarDate));
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  const getDayStatus = (date: Date) => {
    if (isFuture(date)) return 'future';
    const key = format(date, 'yyyy-MM-dd');
    const steps = dailyActivity[key]?.steps || 0;
    if (steps >= STEP_GOAL) return 'completed';
    if (steps >= STEP_GOAL * 0.5) return 'partial';
    return 'missed';
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Activity</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Keep moving, stay healthy</Text>
        </View>
        <View style={[styles.goalBadge, { backgroundColor: colors.primary + '15' }]}>
          <Target size={16} color={colors.primary} />
          <Text style={[styles.goalBadgeText, { color: colors.primary }]}>10k Goal</Text>
        </View>
      </View>

      {/* Main Step Counter */}
      <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient
          colors={[colors.primary + '10', 'transparent']}
          style={styles.cardGradient}
        />
        <View style={styles.ringContainer}>
          <ActivityRing 
            size={220} 
            progress={stepProgress} 
            color={colors.primary} 
            isDarkMode={isDarkMode} 
            colors={colors} 
          />
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{displaySteps.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Steps Today</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{todayActivity.caloriesBurned}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kcal Burned</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{todayActivity.exerciseMinutes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Exercise Min</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.quickStatIcon, { backgroundColor: colors.accent + '15' }]}>
            <Flame size={20} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>{todayActivity.caloriesBurned}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Calories</Text>
          </View>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.quickStatIcon, { backgroundColor: colors.success + '15' }]}>
            <Timer size={20} color={colors.success} />
          </View>
          <View>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>{todayActivity.exerciseMinutes}m</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Exercise</Text>
          </View>
        </View>
      </View>

      {/* Weekly Trend Graph */}
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Steps</Text>
        </View>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 40}
          height={180}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 0,
            color: (opacity = 1) => colors.primary,
            labelColor: (opacity = 1) => colors.textSecondary,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
            propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border, strokeWidth: 0.5 },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
        />
      </View>

      {/* Consistency Calendar */}
      <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.calendarHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Consistency</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
              {format(calendarDate, 'MMMM yyyy')}
            </Text>
          </View>
          <View style={styles.calendarNav}>
            <TouchableOpacity onPress={() => setCalendarDate(subMonths(calendarDate, 1))} style={[styles.navBtn, { backgroundColor: colors.border }]}>
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
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>10k+</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>5k+</Text>
            </View>
          </View>
          <View style={[styles.monthSummary, { backgroundColor: colors.primary + '10' }]}>
            <Trophy size={16} color={colors.primary} />
            <Text style={[styles.summaryText, { color: colors.primary }]}>Keep it up!</Text>
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
        <Info size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Steps are tracked automatically using your device's motion sensors. We filter out high-speed movement to ensure accuracy.
        </Text>
      </View>
    </ScrollView>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goalBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mainCard: {
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  ringContainer: {
    marginBottom: 24,
  },
  ringContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 120, 128, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    opacity: 0.2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
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
  chart: {
    marginLeft: -20,
  },
  calendarCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
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
    backgroundColor: 'rgba(120, 120, 128, 0.05)',
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
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
