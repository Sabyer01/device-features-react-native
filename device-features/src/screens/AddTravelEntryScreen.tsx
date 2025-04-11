import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Alert, TextInput, TouchableWithoutFeedback, Keyboard, Platform, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useEntryCount } from '../context/EntryCountContext';
import { Ionicons } from '@expo/vector-icons';
import { useTravelEntries } from '../context/TravelEntriesContext';

type RootStackParamList = {
  Home: undefined;
  Add: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Add'>;
};

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function AddTravelEntryScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { count, setCount } = useEntryCount();
  const { refreshEntries } = useTravelEntries();

  const resetForm = () => {
    setImageUri(null);
    setAddress(null);
    setDescription('');
    setTitle('');
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take pictures.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        await getLocationAddress();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const selectPicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Photo library permission is needed to select pictures.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        await getLocationAddress();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select picture');
    }
  };

  const getLocationAddress = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed for address.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.region,
          addr.country
        ]
          .filter(Boolean) // Remove any null, undefined, or empty strings
          .join(', '); // Join with commas and spaces
        
        setAddress(formattedAddress);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (!Device.isDevice) {
      return;
    }

    const { granted: existingPermission } = await Notifications.getPermissionsAsync();
    let finalPermission = existingPermission;

    if (!existingPermission) {
      const { granted: newPermission } = await Notifications.requestPermissionsAsync();
      finalPermission = newPermission;
    }

    if (!finalPermission) {
      return;
    }
  }

  const sendSuccessNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Travel Entry Added!',
        body: 'Your travel memory has been saved successfully.',
        sound: 'default',
      },
      trigger: null,
    });
  };

  const saveEntry = async () => {
    if (!imageUri || !address) {
      Alert.alert('Error', 'Please take a picture first');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (title.length > 25) {
      Alert.alert('Error', 'Title should not exceed 25 characters');
      return;
    }

    if (description.length > 200) {
      Alert.alert('Error', 'Description should not exceed 200 characters');
      return;
    }

    try {
      setLoading(true);
      const newEntry = {
        id: Date.now().toString(),
        title: title.trim(),
        imageUri,
        address,
        description: description.trim(),
        timestamp: new Date().toISOString(),
      };

      const existingEntries = await AsyncStorage.getItem('travelEntries');
      const entries = existingEntries ? JSON.parse(existingEntries) : [];
      entries.unshift(newEntry);
      await AsyncStorage.setItem('travelEntries', JSON.stringify(entries));
      setCount(entries.length);

      // Send success notification
      await sendSuccessNotification();
      
      // Refresh entries in the context
      await refreshEntries();

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        resetForm();
        navigation.navigate('Home');
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom:-4,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    input: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    imageContainer: {
      marginTop:12,
      width: '100%',
      aspectRatio: 4.2/3,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 16,
    },
    preview: {
      width: '100%',
      height: '100%',
    },
    placeholderText: {
      fontSize: 16,
      opacity: 0.7,
    },
    photoOptionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    photoButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 44,
      borderRadius: 12,
      gap: 8,
    },
    locationContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 12,
      height: 72,
    },
    locationTextContainer: {
      flex: 1,
    },
    locationText: {
      fontSize: 15,
    },
    descriptionContainer: {
      marginBottom: 16,
    },
    descriptionInput: {
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 4,
    },
    characterCount: {
      fontSize: 12,
      textAlign: 'right',
      opacity: 0.7,
    },
    characterCount2: {
      fontSize: 12,
      textAlign: 'right',
      opacity: 0.7,
      marginTop: -12,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12
    },
    actionButton: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    buttonText: {
      color: 'white',
      fontSize: 15,
      fontWeight: '600',
    },
    disabledButton: {
      opacity: 0.5,
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    successModal: {
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      width: '80%',
    },
    successText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 12,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Add Travel Entry
          </Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={theme.isDark ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
            }]}
            placeholder="Enter title..."
            placeholderTextColor={theme.colors.text}
            value={title}
            onChangeText={(text) => {
              if (text.length <= 25) {
                setTitle(text);
              }
            }}
            maxLength={25}
          />
          <Text style={[styles.characterCount2, { color: theme.colors.text }]}>
            {title.length}/25
          </Text>

          <View style={[styles.imageContainer, { backgroundColor: theme.colors.card }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
                No image selected
              </Text>
            )}
          </View>

          <View style={styles.photoOptionsContainer}>
            <TouchableOpacity
              style={[styles.photoButton, { backgroundColor: '#2f477c' }]}
              onPress={takePicture}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, { backgroundColor: '#2f477c' }]}
              onPress={selectPicture}
            >
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.buttonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionContainer}>
            <TextInput
              style={[styles.input, styles.descriptionInput, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              }]}
              placeholder="Add a description..."
              placeholderTextColor={theme.colors.text}
              value={description}
              onChangeText={(text) => {
                if (text.length <= 200) {
                  setDescription(text);
                }
              }}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={[styles.characterCount, { color: theme.colors.text }]}>
              {description.length}/200
            </Text>
          </View>
          
          <View style={styles.locationContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.locationTextContainer}
            >
              <Text style={[styles.locationText, { color: theme.colors.text }]}>
                {address || 'No location captured yet'}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#d92825' }]}
              onPress={resetForm}
            >
              <Text style={styles.buttonText}>Reset Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: '#2f477c' },
                (!imageUri || !address) && styles.disabledButton,
              ]}
              onPress={saveEntry}
              disabled={!imageUri || !address || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.successModal, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={[styles.successText, { color: theme.colors.text }]}>
                Travel Entry Added
              </Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
} 