import React, { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform, Share, Alert, Modal, Pressable } from 'react-native';
import { ChevronLeft, Share2, MoreHorizontal, Flame, Plus, Minus, Bookmark, Sparkles, Info, Trash2, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMealStore, Meal } from '@/store/mealStore';

interface Ingredient {
  name: string;
  calories: number;
  portion: string;
  x?: number;
  y?: number;
}

interface MealAnalysis {
  isFood: boolean;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  antioxidants: string;
  description: string;
  healthBenefits: string;
  ingredients: Ingredient[];
}

export default function NutritionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const { analysis, imageUri } = params;
  const addMeal = useMealStore((state) => state.addMeal);
  const deleteMeal = useMealStore((state) => state.deleteMeal);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const mealData = useMemo(() => {
    if (!analysis) return null;
    try {
      return JSON.parse(analysis as string) as MealAnalysis;
    } catch (e) {
      console.error('Failed to parse analysis data', e);
      return null;
    }
  }, [analysis]);

  if (!mealData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFF' }}>No analysis data found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Image Section */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: (imageUri as string) || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' }} 
          style={styles.heroImage} 
        />
        
        {/* Ingredient Labels Overlay - Only render if AI provided coordinates */}
        {mealData.ingredients
          .filter(ing => typeof ing.x === 'number' && typeof ing.y === 'number')
          .map((ingredient, index) => {
            // Determine if label should be above or below the point to avoid edge clipping
            const isBottomHalf = (ingredient.y || 0) > 50;
            const isRightHalf = (ingredient.x || 0) > 50;

            return (
              <View 
                key={`label-${index}`} 
                style={[
                  styles.imageLabel, 
                  { 
                    top: `${ingredient.y}%`, 
                    left: `${ingredient.x}%`,
                    // Offset the label so the "point" of the line is at the coordinate
                    transform: [
                      { translateX: isRightHalf ? -100 : 0 },
                      { translateY: isBottomHalf ? -40 : 0 }
                    ]
                  }
                ]}
              >
                <Text style={styles.imageLabelText}>{ingredient.name}</Text>
                <View 
                  style={[
                    styles.imageLabelLine, 
                    isBottomHalf 
                      ? { bottom: -15, left: isRightHalf ? '80%' : '20%' } 
                      : { top: -15, left: isRightHalf ? '80%' : '20%' },
                    { transform: [{ rotate: isBottomHalf ? '45deg' : '-45deg' }] }
                  ]} 
                />
              </View>
            );
          })}

        <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={async () => {
                try {
                  await Share.share({
                    message: `Check out my meal: ${mealData.mealName}\nCalories: ${mealData.calories}\nMacros: P:${mealData.protein}g, C:${mealData.carbs}g, F:${mealData.fat}g\n\nAnalyzed with LensNutra AI`,
                  });
                } catch (error) {
                  console.error(error);
                }
              }}
              style={styles.headerButton}>
              <Share2 color="#FFF" size={20} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setIsMenuVisible(true)}
              style={styles.headerButton}>
              <MoreHorizontal color="#FFF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Menu Modal */}
        <Modal
          visible={isMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMenuVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setIsMenuVisible(false)}
          >
            <View style={[styles.menuContent, { top: insets.top + 60 }]}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  Alert.alert(
                    "Delete Meal",
                    "Are you sure you want to remove this meal from your history?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete", 
                        style: "destructive",
                        onPress: () => {
                          // If the meal has an ID (it's from history), delete it
                          // If it's a new scan, just go back
                          const id = (params.id as string) || (JSON.parse(analysis as string).id);
                          if (id) deleteMeal(id);
                          router.replace('/(tabs)');
                        }
                      }
                    ]
                  );
                }}
              >
                <Trash2 color="#FF3B30" size={20} />
                <Text style={styles.menuItemTextRed}>Delete Meal</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setIsMenuVisible(false)}
              >
                <X color="#666" size={20} />
                <Text style={styles.menuItemText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>

      {/* Content Sheet */}
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <View style={styles.sheetHeader}>
            <View style={styles.timeRow}>
              <Bookmark color="#000" size={16} fill="#000" />
              <Text style={styles.timeText}>6:21 PM</Text>
            </View>
            
            <View style={styles.titleRow}>
              <Text style={styles.mealTitle}>{mealData.mealName}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepButton}>
                  <Minus color="#000" size={16} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>1</Text>
                <TouchableOpacity style={styles.stepButton}>
                  <Plus color="#000" size={16} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Calorie Badge */}
            <View style={styles.calorieBadge}>
              <View style={styles.calorieBadgeInner}>
                <Flame color="#000" size={20} fill="#000" />
                <View style={styles.calorieBadgeText}>
                  <Text style={styles.calorieLabel}>Calories</Text>
                  <Text style={styles.calorieValue}>{mealData.calories}</Text>
                </View>
              </View>
            </View>

            {/* Macro Row */}
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroIcon}>🥩</Text>
                <View>
                  <Text style={styles.macroName}>Protein</Text>
                  <Text style={styles.macroAmount}>{mealData.protein}g</Text>
                </View>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroIcon}>🌾</Text>
                <View>
                  <Text style={styles.macroName}>Carbs</Text>
                  <Text style={styles.macroAmount}>{mealData.carbs}g</Text>
                </View>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroIcon}>🥑</Text>
                <View>
                  <Text style={styles.macroName}>Fats</Text>
                  <Text style={styles.macroAmount}>{mealData.fat}g</Text>
                </View>
              </View>
            </View>

            {/* AI Insights Section */}
            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <Sparkles color="#FF9500" size={18} fill="#FF9500" />
                <Text style={styles.aiTitle}>AI Insights</Text>
              </View>
              <Text style={styles.aiDescription}>{mealData.description}</Text>
              
              {mealData.healthBenefits && (
                <View style={styles.healthImpactBox}>
                  <Text style={styles.healthImpactTitle}>Health Impact</Text>
                  <Text style={styles.healthImpactText}>{mealData.healthBenefits}</Text>
                </View>
              )}

              {mealData.antioxidants && (
                <View style={styles.antioxidantBadge}>
                  <Info color="#666" size={14} />
                  <Text style={styles.antioxidantText}>{mealData.antioxidants}</Text>
                </View>
              )}
            </View>

            {/* Ingredients */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <TouchableOpacity style={styles.addMore}>
                <Plus color="#A0A0A0" size={16} />
                <Text style={styles.addMoreText}>Add more</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ingredientList}>
              {mealData.ingredients.map((item, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientMain}>
                    <View style={styles.dot} />
                    <Text style={styles.ingredientName}>
                      {item.name} <Text style={styles.ingredientCal}>• {item.calories} cal</Text>
                    </Text>
                  </View>
                  <Text style={styles.ingredientPortion}>{item.portion}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.footerActions}>
              <TouchableOpacity 
                onPress={() => {
                  // Only add if it's a new scan (no ID in params)
                  if (!params.id) {
                    const newMeal: Meal = {
                      id: Date.now().toString(),
                      mealName: mealData.mealName,
                      calories: mealData.calories,
                      protein: mealData.protein,
                      carbs: mealData.carbs,
                      fat: mealData.fat,
                      antioxidants: mealData.antioxidants,
                      description: mealData.description,
                      healthBenefits: mealData.healthBenefits,
                      ingredients: mealData.ingredients,
                      imageUri: imageUri as string,
                      timestamp: Date.now(),
                    };
                    addMeal(newMeal);
                  }
                  router.replace('/(tabs)');
                }}
                style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    height: '45%',
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageLabel: {
    position: 'absolute',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  imageLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  imageLabelLine: {
    position: 'absolute',
    width: 30,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  sheetHeader: {
    padding: 24,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    marginRight: 16,
    letterSpacing: -0.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  stepButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  calorieBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  calorieBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  calorieBadgeText: {
    alignItems: 'flex-start',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroIcon: {
    fontSize: 20,
  },
  macroName: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  macroAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMoreText: {
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  ingredientList: {
    gap: 12,
    marginBottom: 32,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 16,
  },
  ingredientMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
  },
  ingredientCal: {
    color: '#A0A0A0',
    fontWeight: '400',
  },
  ingredientPortion: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  aiSection: {
    backgroundColor: '#FDF8F1',
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FEEBC8',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C05621',
  },
  aiDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#744210',
    fontWeight: '500',
  },
  healthImpactBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 86, 33, 0.1)',
  },
  healthImpactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C05621',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  healthImpactText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#744210',
    fontWeight: '400',
  },
  antioxidantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  antioxidantText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContent: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: 200,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuItemTextRed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  doneButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
