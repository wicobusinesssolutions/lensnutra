import React, { useState } from 'react';
import { View, Text, Image, Switch, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { ChevronLeft, Share } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THUMBNAILS = [
  'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/4056722/pexels-photo-4056722.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/4056721/pexels-photo-4056721.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/4056720/pexels-photo-4056720.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/4056719/pexels-photo-4056719.jpeg?auto=compress&cs=tinysrgb&w=200',
];

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hideWeight, setHideWeight] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Compare</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Comparison View */}
      <View style={styles.comparisonContainer}>
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800' }} 
            style={styles.compareImage} 
          />
          <View style={styles.imageOverlay}>
            {!hideWeight && <Text style={styles.weightText}>355 lbs</Text>}
            <Text style={styles.dateText}>Sep 20, 2023</Text>
          </View>
        </View>

        <View style={[styles.imageWrapper, styles.activeWrapper]}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/4056722/pexels-photo-4056722.jpeg?auto=compress&cs=tinysrgb&w=800' }} 
            style={styles.compareImage} 
          />
          <View style={styles.imageOverlay}>
            {!hideWeight && <Text style={styles.weightText}>182 lbs</Text>}
            <Text style={styles.dateText}>Jul 7, 2025</Text>
          </View>
        </View>
      </View>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Hide weight</Text>
        <Switch 
          value={hideWeight} 
          onValueChange={setHideWeight}
          trackColor={{ false: '#E0E0E0', true: '#000' }}
          thumbColor="#FFF"
        />
      </View>

      {/* Thumbnails */}
      <View style={styles.thumbnailSection}>
        <FlatList
          data={THUMBNAILS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={[styles.thumbnailWrapper, index === 1 && styles.thumbnailActive]}>
              <Image source={{ uri: item }} style={styles.thumbnailImage} />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Share Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.shareButton}>
          <Share color="#FFF" size={20} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  comparisonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    height: '55%',
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  activeWrapper: {
    borderWidth: 2,
    borderColor: '#000',
  },
  compareImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  weightText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  dateText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  thumbnailSection: {
    marginBottom: 20,
  },
  thumbnailWrapper: {
    width: 60,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    opacity: 0.6,
  },
  thumbnailActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#000',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 'auto',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
