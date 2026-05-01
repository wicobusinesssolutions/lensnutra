import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, Alert, ActivityIndicator, Modal, Pressable, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, HelpCircle, Image as ImageIcon, Barcode, List, Info, Camera, ScanText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('Scan Food');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    let photo: any = null;

    if (!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY.includes('your_api_key')) {
      Alert.alert(
        'API Key Missing',
        'Please ensure EXPO_PUBLIC_OPENROUTER_API_KEY is set correctly in your .env file.'
      );
      return;
    }

    try {
      setIsAnalyzing(true);
      photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture image data');
      }

      // Move to permanent storage immediately
      const filename = `meal_${Date.now()}.jpg`;
      const persistentUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: photo.uri,
        to: persistentUri,
      });

      const prompt = mode === 'Food Label' 
        ? 'Analyze this nutrition facts table image. Extract the data with high precision. Return a JSON object with: isFood (true), mealName (the brand or product name found on the label, e.g., "Oat Milk"), calories (number), protein (number), carbs (number), fat (number), antioxidants (null), description (a summary of the nutritional profile), healthBenefits (an analysis of the ingredients/additives found on the label), and ingredients (empty array []). Ensure you extract "Serving Size" information and include it in the description. If the label is vertical or horizontal, rotate your analysis accordingly.'
        : 'Analyze this image. Return a JSON object with: isFood (boolean), mealName (string), calories (number), protein (number), carbs (number), fat (number), antioxidants (string), description (string), healthBenefits (string - explain why the specific nutrients in this meal are good for the user, e.g., "High in Vitamin C which boosts immunity and collagen production"), and ingredients (array of {name, calories, portion, x, y}). The x and y values must be integers from 0-100 representing the percentage position of that specific ingredient in the image. If no food or beverage is detected, set isFood to false.';

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: '@preset/flexbuildai453633435346539234357',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${photo.base64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);

      // Navigate even if not food, allowing manual entry
      router.push({
        pathname: '/nutrition-detail',
        params: { 
          analysis: JSON.stringify(result),
          imageUri: persistentUri,
          isManual: (!result.isFood).toString()
        },
      });
    } catch (error: any) {
      console.error('AI Analysis Error:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          Alert.alert(
            'Invalid API Key',
            'The OpenRouter API key (401 Unauthorized) was rejected. Please verify the key in your .env file.'
          );
          setIsAnalyzing(false);
          return;
        }
        
        if (error.response?.status === 429) {
          Alert.alert(
            'Rate Limit Exceeded',
            'Too many requests. Please wait a moment before trying again.'
          );
          setIsAnalyzing(false);
          return;
        }
      }

      // Fallback to manual entry on error
      const fallbackResult = {
        isFood: false,
        mealName: 'Unrecognized Meal',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        antioxidants: '',
        description: 'AI could not analyze this image. Please enter details manually.',
        healthBenefits: '',
        ingredients: []
      };
      
      router.push({
              pathname: '/nutrition-detail',
              params: { 
                analysis: JSON.stringify(fallbackResult),
                imageUri: photo?.uri || '', // Use temp URI if persistent failed, or empty string if capture failed
                isManual: 'true'
              },
            });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <X color="#FFF" size={24} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/icon.png')} 
                style={{ width: 24, height: 24, borderRadius: 6 }} 
                resizeMode="contain"
              />
              <Text style={styles.logoText}>LensNutra</Text>
            </View>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setIsHelpVisible(true)}
            >
              <HelpCircle color="#FFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.modeSelectorScroll}
            >
              {['Scan Food', 'Barcode', 'Food Label', 'Library'].map((m) => (
                <TouchableOpacity 
                  key={m} 
                  onPress={() => setMode(m)}
                  style={[styles.modeItem, mode === m && styles.modeItemActive]}>
                  <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.shutterRow}>
              <TouchableOpacity style={styles.sideButton}>
                <Zap color="#FFF" size={24} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleCapture} 
                style={styles.shutterOuter}
                disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFF" size="large" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.sideButton}>
                <ImageIcon color="#FFF" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Help Modal */}
      <Modal
        visible={isHelpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsHelpVisible(false)} />
          
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={styles.helpIconBg}>
                <Info color="#007AFF" size={24} />
              </View>
              <Text style={styles.helpTitle}>Camera Features</Text>
            </View>

            <View style={styles.helpList}>
              <View style={styles.helpItem}>
                <View style={[styles.helpItemIcon, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                  <Camera color="#34C759" size={20} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={styles.helpItemTitle}>Scan Food</Text>
                  <Text style={styles.helpItemDesc}>Identify meals, estimate portions, and get instant nutritional breakdowns.</Text>
                </View>
              </View>

              <View style={styles.helpItem}>
                <View style={[styles.helpItemIcon, { backgroundColor: 'rgba(0, 122, 255, 0.15)' }]}>
                  <Barcode color="#007AFF" size={20} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={styles.helpItemTitle}>Barcode</Text>
                  <Text style={styles.helpItemDesc}>Quickly lookup branded products and packaged items by scanning their barcode.</Text>
                </View>
              </View>

              <View style={styles.helpItem}>
                <View style={[styles.helpItemIcon, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
                  <ScanText color="#FF9500" size={20} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={styles.helpItemTitle}>Food Label</Text>
                  <Text style={styles.helpItemDesc}>Extract precise data from nutrition tables on the back of food packaging.</Text>
                </View>
              </View>

              <View style={styles.helpItem}>
                <View style={[styles.helpItemIcon, { backgroundColor: 'rgba(175, 82, 222, 0.15)' }]}>
                  <ImageIcon color="#AF52DE" size={20} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={styles.helpItemTitle}>Library</Text>
                  <Text style={styles.helpItemDesc}>Upload a photo from your gallery to analyze meals you've already captured.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.helpCloseBtn}
              onPress={() => setIsHelpVisible(false)}
            >
              <Text style={styles.helpCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomControls: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 20,
  },
  modeSelectorScroll: {
    paddingHorizontal: 40,
    gap: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  modeItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  modeItemActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#FFF',
  },
  shutterRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 10,
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  helpIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  helpList: {
    gap: 20,
    marginBottom: 32,
  },
  helpItem: {
    flexDirection: 'row',
    gap: 16,
  },
  helpItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  helpItemDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontWeight: '500',
  },
  helpCloseBtn: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  helpCloseBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
