import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform, Share, Alert, Modal, Pressable, TextInput, KeyboardAvoidingView } from 'react-native';
import { ChevronLeft, Share2, MoreHorizontal, Flame, Plus, Minus, Bookmark, Sparkles, Info, Trash2, X, ScanText, Edit2, Check } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMealStore, Meal } from '@/store/mealStore';
import * as FileSystem from 'expo-file-system/legacy';

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
  
  const { analysis, imageUri, isManual } = params;
    const addMeal = useMealStore((state) => state.addMeal);
    const deleteMeal = useMealStore((state) => state.deleteMeal);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(isManual === 'true');

  const initialMealData = useMemo(() => {
    if (!analysis) return null;
    try {
      return JSON.parse(analysis as string) as MealAnalysis;
    } catch (e) {
      console.error('Failed to parse analysis data', e);
      return null;
    }
  }, [analysis]);

  const [editableMeal, setEditableMeal] = useState<MealAnalysis | null>(initialMealData);

  useEffect(() => {
    if (initialMealData) setEditableMeal(initialMealData);
  }, [initialMealData]);

  if (!editableMeal) {
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
        
        {/* Nutrition Label Badge */}
        {editableMeal && editableMeal.ingredients.length === 0 && editableMeal.isFood && (
          <View style={[styles.imageLabel, { top: '10%', left: '50%', transform: [{ translateX: -75 }] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ScanText color="#007AFF" size={16} />
              <Text style={styles.imageLabelText}>Nutrition Label Detected</Text>
            </View>
          </View>
        )}

        {/* Ingredient Labels Overlay - Only render if AI provided coordinates */}
        {editableMeal.ingredients
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
              onPress={() => setIsEditing(!isEditing)}
              style={[styles.headerButton, isEditing && { backgroundColor: '#007AFF' }]}>
              {isEditing ? <Check color="#FFF" size={20} /> : <Edit2 color="#FFF" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={async () => {
                try {
                  await Share.share({
                    message: `Check out my meal: ${editableMeal.mealName}\nCalories: ${editableMeal.calories}\nMacros: P:${editableMeal.protein}g, C:${editableMeal.carbs}g, F:${editableMeal.fat}g\n\nAnalyzed with LensNutra AI`,
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
                                        const id = (params.id as string) || (editableMeal ? (editableMeal as any).id : null);
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheet}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <View style={styles.sheetHeader}>
            <View style={styles.timeRow}>
              <Bookmark color="#000" size={16} fill="#000" />
              <Text style={styles.timeText}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {isManual === 'true' && (
                <View style={styles.manualBadge}>
                  <Text style={styles.manualBadgeText}>Manual Entry</Text>
                </View>
              )}
            </View>
            
            <View style={styles.titleRow}>
              {isEditing ? (
                <TextInput
                  style={[styles.mealTitle, styles.editableInput]}
                  value={editableMeal.mealName}
                  onChangeText={(text) => setEditableMeal({ ...editableMeal, mealName: text })}
                  placeholder="Meal Name"
                  autoFocus={isManual === 'true'}
                />
              ) : (
                <Text style={styles.mealTitle}>{editableMeal.mealName}</Text>
              )}
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
                  {isEditing ? (
                    <TextInput
                      style={[styles.calorieValue, styles.editableInput, { minWidth: 80 }]}
                      value={editableMeal.calories.toString()}
                      onChangeText={(text) => setEditableMeal({ ...editableMeal, calories: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.calorieValue}>{editableMeal.calories}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Macro Row */}
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroIcon}>🥩</Text>
                <View>
                  <Text style={styles.macroName}>Protein</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.macroAmount, styles.editableInput]}
                      value={editableMeal.protein.toString()}
                      onChangeText={(text) => setEditableMeal({ ...editableMeal, protein: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.macroAmount}>{editableMeal.protein}g</Text>
                  )}
                </View>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroIcon}>🌾</Text>
                <View>
                  <Text style={styles.macroName}>Carbs</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.macroAmount, styles.editableInput]}
                      value={editableMeal.carbs.toString()}
                      onChangeText={(text) => setEditableMeal({ ...editableMeal, carbs: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.macroAmount}>{editableMeal.carbs}g</Text>
                  )}
                </View>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroIcon}>🥑</Text>
                <View>
                  <Text style={styles.macroName}>Fats</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.macroAmount, styles.editableInput]}
                      value={editableMeal.fat.toString()}
                      onChangeText={(text) => setEditableMeal({ ...editableMeal, fat: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.macroAmount}>{editableMeal.fat}g</Text>
                  )}
                </View>
              </View>
            </View>

            {/* AI Insights Section */}
            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <Sparkles color="#FF9500" size={18} fill="#FF9500" />
                <Text style={styles.aiTitle}>{isManual === 'true' ? 'Notes' : 'AI Insights'}</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.aiDescription, styles.editableInput, { minHeight: 60 }]}
                  value={editableMeal.description}
                  onChangeText={(text) => setEditableMeal({ ...editableMeal, description: text })}
                  multiline
                  placeholder="Add a description..."
                />
              ) : (
                <Text style={styles.aiDescription}>{editableMeal.description}</Text>
              )}
              
              {!isEditing && editableMeal.healthBenefits && (
                <View style={styles.healthImpactBox}>
                  <Text style={styles.healthImpactTitle}>Health Impact</Text>
                  <Text style={styles.healthImpactText}>{editableMeal.healthBenefits}</Text>
                </View>
              )}

              {!isEditing && editableMeal.antioxidants && (
                <View style={styles.antioxidantBadge}>
                  <Info color="#666" size={14} />
                  <Text style={styles.antioxidantText}>{editableMeal.antioxidants}</Text>
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
              {editableMeal.ingredients.map((item, index) => (
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
              {editableMeal.ingredients.length === 0 && (
                <Text style={{ color: '#A0A0A0', fontStyle: 'italic', textAlign: 'center', padding: 10 }}>
                  No ingredients listed.
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.footerActions}>
              <TouchableOpacity 
                onPress={() => {
                  // Save the current editable state
                  const finalMeal: Meal = {
                    id: (params.id as string) || Date.now().toString(),
                    mealName: editableMeal.mealName,
                    calories: editableMeal.calories,
                    protein: editableMeal.protein,
                    carbs: editableMeal.carbs,
                    fat: editableMeal.fat,
                    antioxidants: editableMeal.antioxidants,
                    description: editableMeal.description,
                    healthBenefits: editableMeal.healthBenefits,
                    ingredients: editableMeal.ingredients,
                    imageUri: imageUri as string,
                    timestamp: Date.now(),
                  };
                  
                  // If it's an existing meal, we should ideally update it, 
                  // but for now addMeal handles the history.
                  addMeal(finalMeal);
                  router.replace('/(tabs)');
                }}
                style={styles.doneButton}>
                <Text style={styles.doneButtonText}>{isEditing ? 'Save & Done' : 'Done'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  manualBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  manualBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  editableInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingVertical: 2,
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
