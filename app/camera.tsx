import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, HelpCircle, Image as ImageIcon, Barcode, List, Apple } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('Scan Food');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

    if (!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY === 'your_api_key_here') {
      Alert.alert(
        'Configuration Required',
        'Please add your OpenRouter API key to the .env file as EXPO_PUBLIC_OPENROUTER_API_KEY.'
      );
      return;
    }

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture image data');
      }

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
                  text: 'Analyze this image. Return a JSON object with: isFood (boolean), mealName (string), calories (number), protein (number), carbs (number), fat (number), antioxidants (string), description (string), healthBenefits (string - explain why the specific nutrients in this meal are good for the user, e.g., "High in Vitamin C which boosts immunity and collagen production"), and ingredients (array of {name, calories, portion, x, y}). The x and y values must be integers from 0-100 representing the percentage position of that specific ingredient in the image. If no food or beverage is detected, set isFood to false.',
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

      if (!result.isFood) {
        Alert.alert('No food detected', 'Please try taking a clearer photo of your meal.');
        setIsAnalyzing(false);
        return;
      }

      router.push({
        pathname: '/nutrition-detail',
        params: { 
          analysis: JSON.stringify(result),
          imageUri: photo.uri 
        },
      });
    } catch (error) {
      console.error('AI Analysis Error:', error);
      Alert.alert('Analysis Failed', 'There was an error analyzing your meal. Please try again.');
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
              <Apple color="#FFF" size={20} fill="#FFF" />
              <Text style={styles.logoText}>LensNutra AI</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <HelpCircle color="#FFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modeSelector}>
              {['Scan Food', 'Barcode', 'Food Label', 'Library'].map((m) => (
                <TouchableOpacity 
                  key={m} 
                  onPress={() => setMode(m)}
                  style={[styles.modeItem, mode === m && styles.modeItemActive]}>
                  <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
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
});
