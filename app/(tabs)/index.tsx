import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Platform, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, Apple, ChevronRight, Lightbulb, Droplets, Zap } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { useMealStore } from '@/store/mealStore';
import { useUserStore } from '@/store/userStore';
import { format, isSameDay, subDays, startOfDay, addDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 44;
const ITEM_MARGIN = 12;
const FULL_ITEM_WIDTH = ITEM_WIDTH + ITEM_MARGIN;

const GOAL_CONFIGS = {
  'Weight Loss': {
    calories: 2000,
    protein: 160,
    carbs: 180,
    fat: 60,
    tips: [
      'Focus on high-volume, low-calorie foods like leafy greens.',
      'Drink a glass of water 15 minutes before every meal.',
      'Prioritize protein to maintain muscle while losing fat.'
    ]
  },
  'Muscle Gain': {
    calories: 2800,
    protein: 200,
    carbs: 350,
    fat: 80,
    tips: [
      'Ensure you are in a slight caloric surplus (200-300 kcal).',
      'Consume 20-30g of protein within 1 hour post-workout.',
      'Focus on progressive overload in your strength training.'
    ]
  },
  'Weight Gain': {
    calories: 3200,
    protein: 180,
    carbs: 450,
    fat: 90,
    tips: [
      'Eat more frequently—aim for 5-6 smaller meals a day.',
      'Include healthy fats like nuts, seeds, and avocados.',
      'Liquid calories (smoothies) are an easy way to hit targets.'
    ]
  }
};

// Generate 15 days: 7 past, Today, 7 future
const DAYS = Array.from({ length: 15 }).map((_, i) => {
  const date = addDays(subDays(new Date(), 7), i);
  return {
    day: format(date, 'EEE'),
    date: format(date, 'd'),
    fullDate: startOfDay(date),
  };
});

const ProgressRing = ({ size, strokeWidth, progress, color, children, isDarkMode }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);
  const meals = useMealStore((state) => state.meals);
  const { profile } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const scrollRef = useRef<ScrollView>(null);
  const [headerOpacity] = useState(new Animated.Value(0));

  // Center "Today" on mount
  useEffect(() => {
    const todayIndex = 7;
    const offset = (todayIndex * FULL_ITEM_WIDTH) - (SCREEN_WIDTH / 2) + (FULL_ITEM_WIDTH / 2) + 10;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: offset, animated: false });
    }, 100);
  }, []);

  // Filter meals for the selected date
  const filteredMeals = useMemo(() => {
    return meals.filter(m => isSameDay(new Date(m.timestamp), selectedDate));
  }, [meals, selectedDate]);
  
  // Calculate totals for the selected date
  const totals = useMemo(() => {
    return filteredMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [filteredMeals]);

  const currentGoalConfig = GOAL_CONFIGS[profile.goal] || GOAL_CONFIGS['Weight Loss'];
  const calorieGoal = currentGoalConfig.calories;
  const proteinGoal = currentGoalConfig.protein;
  const carbsGoal = currentGoalConfig.carbs;
  const fatGoal = currentGoalConfig.fat;

  const calorieProgress = Math.min((totals.calories / calorieGoal) * 100, 100);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: headerOpacity } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}>
      
      {/* Glass Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.20)' : 'rgba(0,122,255,0.10)' }]}>
            <Apple color={colors.primary} size={22} strokeWidth={2} />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>LensNutra</Text>
        </View>
        <View style={[
          styles.streakBadge,
          {
            backgroundColor: isDarkMode ? 'rgba(255,149,0,0.15)' : 'rgba(255,149,0,0.10)',
            borderColor: isDarkMode ? 'rgba(255,149,0,0.25)' : 'rgba(255,149,0,0.15)',
          }
        ]}>
          <Flame color={colors.accent} size={16} fill={colors.accent} />
          <Text style={[styles.streakText, { color: colors.accent }]}>15</Text>
        </View>
      </View>

      {/* Date Picker — Glass Pills */}
      <ScrollView 
        ref={scrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.datePicker} 
        contentContainerStyle={{ paddingHorizontal: 20 }}>
        {DAYS.map((item, index) => {
          const isActive = isSameDay(item.fullDate, selectedDate);
          const isToday = isSameDay(item.fullDate, new Date());
          return (
            <TouchableOpacity 
              key={index} 
              onPress={() => setSelectedDate(item.fullDate)}
              style={[
                styles.dateItem,
                isActive && {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.10)',
                }
              ]}>
              <Text style={[
                styles.dayText,
                { color: isActive ? colors.text : colors.textSecondary }
              ]}>{item.day}</Text>
              <View style={[
                styles.dateCircle,
                isActive && {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                },
                isToday && !isActive && { borderColor: colors.primary, borderWidth: 1.5 }
              ]}>
                <Text style={[
                  styles.dateText,
                  { color: isActive ? '#FFFFFF' : (isToday ? colors.primary : colors.text) }
                ]}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Calorie Card — Glassmorphism */}
      <View style={[
        styles.mainCard,
        {
          backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.72)' : 'rgba(255, 255, 255, 0.72)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.50)',
        }
      ]}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(0,122,255,0.10)', 'transparent'] : ['rgba(0,122,255,0.05)', 'transparent']}
          style={styles.cardGradient}
        />
        <View style={styles.calorieInfo}>
          <View style={styles.calorieRow}>
            <Text style={[styles.calorieValue, { color: colors.text }]}>{Math.round(totals.calories)}</Text>
            <Text style={[styles.calorieGoal, { color: colors.textSecondary }]}> / {calorieGoal}</Text>
          </View>
          <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>calories today</Text>
          
          {/* Mini macro preview */}
          <View style={styles.miniMacros}>
            <View style={styles.miniMacro}>
              <View style={[styles.miniDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={[styles.miniMacroText, { color: colors.textSecondary }]}>{Math.round(totals.protein)}g protein</Text>
            </View>
            <View style={styles.miniMacro}>
              <View style={[styles.miniDot, { backgroundColor: '#FFCC00' }]} />
              <Text style={[styles.miniMacroText, { color: colors.textSecondary }]}>{Math.round(totals.carbs)}g carbs</Text>
            </View>
          </View>
        </View>
        <ProgressRing 
          size={110} 
          strokeWidth={10} 
          progress={calorieProgress} 
          color={colors.primary} 
          isDarkMode={isDarkMode}
        >
          <View style={styles.ringContent}>
            <Flame color={calorieProgress > 80 ? colors.accent : colors.primary} size={28} fill={calorieProgress > 80 ? colors.accent : colors.primary} />
            <Text style={[styles.ringPercent, { color: colors.text }]}>{Math.round(calorieProgress)}%</Text>
          </View>
        </ProgressRing>
      </View>

      {/* Macro Grid — Glass Cards */}
      <View style={styles.macroGrid}>
        {[
          { label: 'Protein', value: totals.protein, goal: proteinGoal, color: '#FF3B30', icon: Zap },
          { label: 'Carbs', value: totals.carbs, goal: carbsGoal, color: '#FFCC00', icon: Droplets },
          { label: 'Fat', value: totals.fat, goal: fatGoal, color: '#34C759', icon: Flame },
        ].map((macro) => (
          <View key={macro.label} style={[
            styles.macroCard,
            {
              backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.72)' : 'rgba(255, 255, 255, 0.72)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.50)',
            }
          ]}>
            <View style={styles.macroHeader}>
              <View style={[styles.macroIconBg, { backgroundColor: macro.color + '18' }]}>
                <macro.icon size={16} color={macro.color} strokeWidth={2.5} />
              </View>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{macro.label}</Text>
            </View>
            <Text style={[styles.macroValue, { color: colors.text }]}>
              {Math.round(macro.value)}
              <Text style={[styles.macroGoal, { color: colors.textSecondary }]}>/{macro.goal}g</Text>
            </Text>
            <View style={styles.macroBar}>
              <View style={[
                styles.macroBarFill,
                {
                  width: `${Math.min((macro.value / macro.goal) * 100, 100)}%`,
                  backgroundColor: macro.color,
                }
              ]} />
            </View>
          </View>
        ))}
      </View>

      {/* Goal Tips — Glass Card */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for {profile.goal}</Text>
      </View>
      <View style={[
        styles.tipsCard,
        {
          backgroundColor: isDarkMode ? 'rgba(255,149,0,0.10)' : 'rgba(255,149,0,0.06)',
          borderColor: isDarkMode ? 'rgba(255,149,0,0.20)' : 'rgba(255,149,0,0.12)',
        }
      ]}>
        <View style={styles.tipsHeader}>
          <View style={[styles.tipsIcon, { backgroundColor: isDarkMode ? 'rgba(255,149,0,0.20)' : 'rgba(255,149,0,0.12)' }]}>
            <Lightbulb size={18} color={colors.accent} strokeWidth={2} />
          </View>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Daily Advice</Text>
        </View>
        {currentGoalConfig.tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={[styles.tipDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Recently Uploaded */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMM d')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {filteredMeals.length} {filteredMeals.length === 1 ? 'meal' : 'meals'}
        </Text>
      </View>

      {filteredMeals.length === 0 ? (
        <View style={[
          styles.emptyState,
          {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }
        ]}>
          <View style={[styles.emptyIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Apple color={colors.textTertiary} size={32} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No meals logged yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Tap the camera button to scan your first meal
          </Text>
        </View>
      ) : (
        filteredMeals.map((meal) => (
          <TouchableOpacity 
            key={meal.id} 
            style={[
              styles.mealCard,
              {
                backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.72)' : 'rgba(255, 255, 255, 0.72)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.50)',
              }
            ]} 
            activeOpacity={0.85}
            onPress={() => router.push({
              pathname: '/nutrition-detail',
              params: { 
                analysis: JSON.stringify(meal),
                imageUri: meal.imageUri 
              },
            })}
          >
            <Image source={{ uri: meal.imageUri }} style={styles.mealImage} />
            <View style={styles.mealInfo}>
              <View style={styles.mealHeaderRow}>
                <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>{meal.mealName}</Text>
                <Text style={[styles.mealTime, { color: colors.textSecondary }]}>{format(meal.timestamp, 'h:mma').toLowerCase()}</Text>
              </View>
              <View style={styles.mealStats}>
                <Flame color={colors.accent} size={14} fill={colors.accent} />
                <Text style={[styles.mealCalories, { color: colors.text }]}>{meal.calories} cal</Text>
              </View>
              <View style={styles.mealMacros}>
                <View style={[styles.mealMacroPill, { backgroundColor: isDarkMode ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.08)' }]}>
                  <Text style={[styles.mealMacroPillText, { color: '#FF3B30' }]}>{meal.protein}g P</Text>
                </View>
                <View style={[styles.mealMacroPill, { backgroundColor: isDarkMode ? 'rgba(255,204,0,0.15)' : 'rgba(255,204,0,0.08)' }]}>
                  <Text style={[styles.mealMacroPillText, { color: '#D4A000' }]}>{meal.carbs}g C</Text>
                </View>
                <View style={[styles.mealMacroPill, { backgroundColor: isDarkMode ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.08)' }]}>
                  <Text style={[styles.mealMacroPillText, { color: '#34C759' }]}>{meal.fat}g F</Text>
                </View>
              </View>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        ))
      )}
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
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '800',
  },
  datePicker: {
    marginBottom: 20,
  },
  dateItem: {
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  mainCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  calorieInfo: {
    flex: 1,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  calorieGoal: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  calorieLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  miniMacros: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  miniMacro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniMacroText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ringContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  ringPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  macroGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  macroCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  macroIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  macroGoal: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroBar: {
    height: 4,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  tipsCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tipsIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  mealCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mealImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  mealName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  mealTime: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    flexShrink: 0,
  },
  mealStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  mealCalories: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 6,
  },
  mealMacroPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mealMacroPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
