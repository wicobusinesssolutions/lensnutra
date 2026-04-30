import React from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Flame, Target, ChevronRight, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const chartData = {
    labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        data: [122, 130, 125, 131.2, 128, 135],
        color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      {/* Top Cards */}
      <View style={styles.topRow}>
        <View style={styles.weightCard}>
          <Text style={styles.cardLabel}>Your Weight</Text>
          <Text style={styles.weightValue}>132.1 lbs</Text>
          <View style={styles.goalProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '80%' }]} />
            </View>
            <Text style={styles.goalText}>Goal 140 lbs</Text>
          </View>
          <TouchableOpacity style={styles.logButton}>
            <Text style={styles.logButtonText}>Log Weight</Text>
            <ChevronRight color="#FFF" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Flame color="#FF9500" size={32} fill="#FF9500" />
            <Text style={styles.streakValue}>21</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.streakDays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <View key={i} style={styles.streakDay}>
                <Text style={styles.streakDayText}>{day}</Text>
                <View style={[styles.streakCircle, i < 3 && styles.streakCircleActive]} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Weight Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Weight Progress</Text>
          <View style={styles.goalBadge}>
            <Target color="#666" size={14} />
            <Text style={styles.goalBadgeText}>80% of goal</Text>
          </View>
        </View>

        <LineChart
          data={chartData}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#FFF',
            backgroundGradientFrom: '#FFF',
            backgroundGradientTo: '#FFF',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(160, 160, 160, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#4ADE80' },
            propsForBackgroundLines: { strokeDasharray: '', stroke: '#F0F0F0' },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
        />

        <View style={styles.rangeSelector}>
          {['90D', '6M', '1Y', 'ALL'].map((r) => (
            <TouchableOpacity key={r} style={[styles.rangeItem, r === '6M' && styles.rangeItemActive]}>
              <Text style={[styles.rangeText, r === '6M' && styles.rangeTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartFooter}>
          <Text style={styles.footerText}>Great job! Consistency is key, and you're mastering it!</Text>
        </View>
      </View>

      {/* Daily Average */}
      <View style={styles.averageCard}>
        <Text style={styles.averageLabel}>Daily Average Calories</Text>
        <View style={styles.averageRow}>
          <Text style={styles.averageValue}>2861 <Text style={styles.averageUnit}>cal</Text></Text>
          <View style={styles.trendBadge}>
            <TrendingUp color="#34C759" size={14} />
            <Text style={styles.trendText}>90%</Text>
          </View>
        </View>
      </View>

      {/* Compare Button */}
      <TouchableOpacity 
        onPress={() => router.push('/compare')}
        style={styles.compareButton}>
        <Text style={styles.compareButtonText}>Watch the change</Text>
        <ChevronRight color="#000" size={20} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
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
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  weightCard: {
    flex: 1.2,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  goalProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 3,
  },
  goalText: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  logButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  streakHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '700',
  },
  streakDays: {
    flexDirection: 'row',
    gap: 4,
  },
  streakDay: {
    alignItems: 'center',
    gap: 4,
  },
  streakDayText: {
    fontSize: 10,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  streakCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  streakCircleActive: {
    backgroundColor: '#FF9500',
  },
  chartCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  goalBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 40,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 4,
    marginTop: 16,
  },
  rangeItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  rangeItemActive: {
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A0A0',
  },
  rangeTextActive: {
    color: '#000',
  },
  chartFooter: {
    marginTop: 20,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },
  averageCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  averageLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  averageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  averageValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  averageUnit: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  compareButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  compareButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
