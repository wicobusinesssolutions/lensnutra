import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Platform, Dimensions, Animated, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, ChevronRight, Lightbulb, Droplets, Zap, Plus, GlassWater, Scale, TrendingDown, TrendingUp, X, Camera, Minus, Target } from 'lucide-react-native';
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

// Generate 31 days: 30 past days + Today
const TODAY_START = startOfDay(new Date());
const DAYS = Array.from({ length: 31 }).map((_, i) => {
  // i=0 is 30 days ago, i=30 is Today
  const date = subDays(TODAY_START, 30 - i);
  return {
    day: format(date, 'EEE'),
    date: format(date, 'd'),
    fullDate: startOfDay(date),
  };
});

const OverviewRing = ({ size, metrics, overallPercentage, isDarkMode, colors }: any) => {
  const center = size / 2;
  const strokeWidth = 10;
  // Tighten spacing to keep rings clustered at the edge
  const spacing = 12;
  // Push rings to the absolute edge to maximize the central hole
  const baseRadius = (size / 2) - 8;

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <Text style={styles.overviewTopLabel}>DAILY SCORE</Text>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} style={{ zIndex: 1 }}>
        {metrics.map((metric: any, index: number) => {
          // Outer to inner: index 0 is outermost
          const radius = baseRadius - (index * spacing);
          const circumference = radius * 2 * Math.PI;
          const strokeDashoffset = circumference - (Math.min(metric.progress, 100) / 100) * circumference;

          return (
            <React.Fragment key={metric.label}>
              {/* Track */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={metric.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${center} ${center})`}
              />
            </React.Fragment>
          );
        })}
      </Svg>
        {/* Text container moved to end and given explicit zIndex to float above SVG */}
        <View style={[styles.overviewCenter, { zIndex: 10, elevation: 10 }]}>
          <Text style={[styles.overviewScore, { color: colors.text }]}>{Math.round(overallPercentage)}%</Text>
        </View>
      </View>
    </View>
  );
};

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
  const { profile, checkAndIncrementStreak, addWater, getWaterGoal } = useUserStore();
  const weightUnit = profile.weightUnit || 'kg';
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formatWeight = (kg: number) => {
    const val = weightUnit === 'lbs' ? kg * 2.20462 : kg;
    return val.toFixed(1);
  };
  const scrollRef = useRef<ScrollView>(null);
  const [headerOpacity] = useState(new Animated.Value(0));

  // Scroll to the end (Today) on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
    return () => clearTimeout(timer);
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

  const calorieProgress = Math.min((totals.calories / (calorieGoal || 2000)) * 100, 100);
  
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  // Defensive access to waterIntake to prevent "Cannot read properties of undefined"
  const currentWater = profile?.waterIntake?.[dateKey] ?? 0;
  const waterGoal = getWaterGoal() || 2000;
  const waterProgress = Math.min((currentWater / (waterGoal || 2000)) * 100, 100);

  const proteinProgress = Math.min((totals.protein / (proteinGoal || 1)) * 100, 100);
  const carbsProgress = Math.min((totals.carbs / (carbsGoal || 1)) * 100, 100);
  const fatProgress = Math.min((totals.fat / (fatGoal || 1)) * 100, 100);

  const overallPercentage = (calorieProgress + waterProgress + proteinProgress + carbsProgress + fatProgress) / 5;

  const overviewMetrics = [
    { label: 'Calories', progress: calorieProgress, color: colors.primary },
    { label: 'Water', progress: waterProgress, color: colors.primaryLight || '#5AC8FA' },
    { label: 'Protein', progress: proteinProgress, color: '#FF3B30' },
    { label: 'Carbs', progress: carbsProgress, color: '#FFCC00' },
    { label: 'Fat', progress: fatProgress, color: '#34C759' },
  ];

  // Check for streak update when calories or water change
  useEffect(() => {
    if (isSameDay(selectedDate, new Date()) && profile) {
      checkAndIncrementStreak(
        totals.calories || 0, 
        calorieGoal || 2000, 
        currentWater || 0, 
        waterGoal || 2000
      );
    }
  }, [totals.calories, calorieGoal, currentWater, waterGoal, selectedDate, profile]);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={{ paddingTop: 0, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: headerOpacity } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}>
      
      {/* Glass Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.20)' : 'rgba(0,122,255,0.10)' }]}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: '100%', height: '100%', borderRadius: 10 }} 
              resizeMode="contain"
            />
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
          <Flame color={colors.accent} size={16} fill={profile.streak > 0 ? colors.accent : 'transparent'} />
          <Text style={[styles.streakText, { color: colors.accent }]}>{profile.streak}</Text>
        </View>
      </View>

      {/* Date Picker — Glass Pills */}
      <ScrollView 
        ref={scrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.datePicker} 
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}>
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

      {/* Master Overview Ring Card */}
      <View style={[
        styles.overviewCard,
        {
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.50)',
          backgroundColor: 'transparent',
        }
      ]}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(28, 28, 30, 0.9)', 'rgba(10, 10, 10, 0.9)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(242, 242, 247, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modernGradientFill}
        />
        <View style={styles.overviewMainContainer}>
          <OverviewRing 
            size={220} 
            metrics={overviewMetrics} 
            overallPercentage={overallPercentage}
            isDarkMode={isDarkMode}
            colors={colors}
          />
        </View>

        {/* Integrated Weight Status */}
        {(() => {
          const dateKey = format(selectedDate, 'yyyy-MM-dd');
          const entry = profile.weightHistory?.[dateKey];
          const loggedWeight = typeof entry === 'number' ? entry : entry?.weight;
          const imageUri = typeof entry === 'number' ? undefined : entry?.imageUri;
          const trend = useUserStore.getState().getWeightTrend();
          
          if (loggedWeight) {
            // Determine success color based on goal
            let statusColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
            let trendIcon = null;
            let trendDisplay = null;

            if (trend && trend.change !== 0) {
              const isLossGoal = profile.goal === 'Weight Loss';
              const isSuccess = isLossGoal ? trend.type === 'lost' : trend.type === 'gained';
              statusColor = isSuccess ? colors.success + '20' : colors.error + '20';
              
              const displayDiff = (weightUnit === 'lbs' ? trend.change * 2.20462 : trend.change).toFixed(1);
              trendDisplay = `${trend.type === 'gained' ? '+' : '-'}${displayDiff} ${weightUnit}`;
              
              if (trend.type === 'lost') trendIcon = <TrendingDown size={14} color={isSuccess ? colors.success : colors.error} />;
              else trendIcon = <TrendingUp size={14} color={isSuccess ? colors.success : colors.error} />;
            }

            return (
              <TouchableOpacity 
                style={[styles.integratedWeightBox, { backgroundColor: statusColor }]}
                onPress={() => imageUri && setPreviewImage(imageUri)}
                activeOpacity={imageUri ? 0.8 : 1}
              >
                <View style={styles.integratedWeightContent}>
                  <View style={styles.integratedWeightHeaderRow}>
                    <Text style={[styles.integratedWeightLabel, { color: colors.textSecondary }]}>WEIGHT LOGGED</Text>
                    {trendDisplay && (
                      <View style={styles.trendIndicator}>
                        {trendIcon}
                        <Text style={[styles.trendIndicatorText, { color: statusColor.includes(colors.success) ? colors.success : colors.error }]}>
                          {trendDisplay}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.integratedWeightValue, { color: colors.text }]}>{formatWeight(loggedWeight)} {weightUnit}</Text>
                </View>
                <View style={[styles.integratedWeightIconBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Scale size={24} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          } else if (isSameDay(selectedDate, new Date())) {
            return (
              <TouchableOpacity 
                style={[styles.integratedWeightCTA, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => router.push('/progress')}
              >
                <Scale size={16} color={colors.textSecondary} />
                <Text style={[styles.integratedWeightCTAText, { color: colors.textSecondary }]}>Log Today's Weight</Text>
                <Plus size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }
          return null;
        })()}
      </View>

      {/* Main Calorie Card — Modern Gradient */}
      <View style={styles.modernGradientCard}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(28, 28, 30, 0.9)', 'rgba(10, 10, 10, 0.9)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(242, 242, 247, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modernGradientFill}
        />
        <View style={styles.calorieInfo}>
          <View style={styles.calorieRow}>
            <Text style={[styles.calorieValue, { color: colors.text }]}>{Math.round(totals.calories)}</Text>
            <Text style={[styles.calorieGoal, { color: colors.textSecondary }]}> / {calorieGoal}</Text>
          </View>
          <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>calories today</Text>
          
          {/* Macro indicators at bottom */}
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
          size={120} 
          strokeWidth={14} 
          progress={calorieProgress} 
          color={colors.primary} 
          isDarkMode={isDarkMode}
        >
          <View style={styles.ringContent}>
            <Flame color={colors.primary} size={28} fill={colors.primary} />
            <Text style={[styles.ringPercent, { color: colors.text }]}>{Math.round(calorieProgress)}%</Text>
          </View>
        </ProgressRing>
      </View>

      {/* Macro Grid — Modern Gradient */}
      <View style={styles.macroGrid}>
        {[
          { label: 'Protein', value: totals.protein, goal: proteinGoal, color: '#FF3B30', icon: Zap },
          { label: 'Carbs', value: totals.carbs, goal: carbsGoal, color: '#FFCC00', icon: Droplets },
          { label: 'Fat', value: totals.fat, goal: fatGoal, color: '#34C759', icon: Flame },
        ].map((macro) => {
          const progress = Math.min((macro.value / macro.goal) * 100, 100);
          return (
            <View key={macro.label} style={styles.macroCardModern}>
              <LinearGradient
                colors={isDarkMode ? ['rgba(28, 28, 30, 0.9)', 'rgba(10, 10, 10, 0.9)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(242, 242, 247, 0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modernGradientFill}
              />
              <View style={styles.macroHeader}>
                <View style={[styles.macroIconBg, { backgroundColor: macro.color + '18' }]}>
                  <macro.icon size={14} color={macro.color} strokeWidth={2.5} />
                </View>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{macro.label}</Text>
              </View>
              
              <View style={styles.macroRingContainer}>
                <ProgressRing 
                  size={68} 
                  strokeWidth={10} 
                  progress={progress} 
                  color={macro.color} 
                  isDarkMode={isDarkMode}
                >
                  <View style={styles.ringContent}>
                    <Text style={[styles.ringPercentTiny, { color: colors.text }]}>{Math.round(progress)}%</Text>
                  </View>
                </ProgressRing>
              </View>

              <Text style={[styles.macroValue, { color: colors.text }]}>
                {Math.round(macro.value)}
                <Text style={[styles.macroGoal, { color: colors.textSecondary }]}>/{macro.goal}g</Text>
              </Text>
            </View>
          );
        })}
      </View>

      {/* Hydration Section — Modern Gradient */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Hydration</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {currentWater} / {waterGoal}ml
        </Text>
      </View>
      <View style={styles.modernGradientCard}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(28, 28, 30, 0.9)', 'rgba(10, 10, 10, 0.9)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(242, 242, 247, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modernGradientFill}
        />
        <View style={styles.waterInfo}>
          <ProgressRing 
            size={95} 
            strokeWidth={12} 
            progress={waterProgress} 
            color={colors.primary} 
            isDarkMode={isDarkMode}
          >
            <View style={styles.ringContent}>
              <Droplets size={22} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.ringPercentSmall, { color: colors.text }]}>{Math.round(waterProgress)}%</Text>
            </View>
          </ProgressRing>
          
          <View style={styles.waterActions}>
            <TouchableOpacity 
              style={[styles.waterButtonLarge, { backgroundColor: colors.primary }]}
              onPress={() => addWater(1000, dateKey)}
            >
              <GlassWater size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={[styles.waterButtonTextLarge, { color: '#FFF' }]}>+1L</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Goal Tips — Modern Gradient */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for {profile.goal}</Text>
      </View>
      <View style={[styles.modernGradientCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(28, 28, 30, 0.9)', 'rgba(10, 10, 10, 0.9)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(242, 242, 247, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modernGradientFill}
        />
        <View style={[styles.tipsHeader, { marginBottom: 16 }]}>
          <View style={[styles.tipsIcon, { backgroundColor: isDarkMode ? 'rgba(255,149,0,0.10)' : 'rgba(255,149,0,0.08)' }]}>
            <Lightbulb size={18} color={colors.accent} strokeWidth={2.5} />
          </View>
          <View style={styles.tipsHeaderContent}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Daily Advice</Text>
            <View style={[styles.tipDotInline, { backgroundColor: colors.accent }]} />
            <View style={styles.tipTextWrapper}>
              <Text 
                style={[styles.tipTextInline, { color: colors.textSecondary }]} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {currentGoalConfig.tips[0]}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.tipListContainer, { borderTopColor: colors.divider }]}>
          {currentGoalConfig.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
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
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: 32, height: 32, opacity: 0.5 }} 
              resizeMode="contain"
            />
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
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
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
  overviewCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    overflow: 'hidden',
  },
  overviewMainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  overviewCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  overviewTopLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  overviewScore: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  modernGradientCard: {
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modernGradientFill: {
    ...StyleSheet.absoluteFillObject,
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
    fontSize: 15,
    fontWeight: '800',
  },
  ringPercentSmall: {
    fontSize: 13,
    fontWeight: '800',
  },
  ringPercentTiny: {
    fontSize: 12,
    fontWeight: '800',
  },
  macroGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  macroCardModern: {
    flex: 1,
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    width: '100%',
  },
  macroIconBg: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  macroRingContainer: {
    marginBottom: 12,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  macroGoal: {
    fontSize: 10,
    fontWeight: '600',
  },
  waterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  waterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterButtonLarge: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  waterButtonTextLarge: {
    fontSize: 15,
    fontWeight: '800',
  },
  integratedWeightBox: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  integratedWeightContent: {
    flex: 1,
    gap: 2,
  },
  integratedWeightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
  },
  integratedWeightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  integratedWeightValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  integratedWeightIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  integratedWeightCTA: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 128, 0.12)',
    borderStyle: 'dashed',
  },
  integratedWeightCTAText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  tipsHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tipDotInline: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  tipTextWrapper: {
    flex: 1,
  },
  tipTextInline: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipListContainer: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
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
