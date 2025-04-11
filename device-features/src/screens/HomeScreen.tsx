import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useEntryCount } from '../context/EntryCountContext';
import { useTravelEntries } from '../context/TravelEntriesContext';

interface TravelEntry {
  id: string;
  title: string;
  imageUri: string;
  address: string;
  description: string;
  timestamp: string;
}

export default function HomeScreen() {
  const [selectedEntry, setSelectedEntry] = useState<TravelEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { setCount } = useEntryCount();
  const { entries: travelEntries, refreshEntries } = useTravelEntries();

  useEffect(() => {
    refreshEntries();
  }, []);

  const handleEdit = () => {
    if (selectedEntry) {
      setEditedTitle(selectedEntry.title);
      setEditedDescription(selectedEntry.description);
      setIsEditing(true);
    }
  };

  const saveEdit = async () => {
    if (selectedEntry) {
      if (!editedTitle.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }

      if (!editedDescription.trim()) {
        Alert.alert('Error', 'Please enter a description');
        return;
      }

      if (editedTitle.length > 25) {
        Alert.alert('Error', 'Title should not exceed 25 characters');
        return;
      }

      try {
        const updatedEntries = travelEntries.map(entry => {
          if (entry.id === selectedEntry.id) {
            return {
              ...entry,
              title: editedTitle.trim(),
              description: editedDescription.trim(),
            };
          }
          return entry;
        });

        await AsyncStorage.setItem('travelEntries', JSON.stringify(updatedEntries));
        refreshEntries();
        setSelectedEntry({
          ...selectedEntry,
          title: editedTitle.trim(),
          description: editedDescription.trim(),
        });
        setIsEditing(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to save changes');
      }
    }
  };

  const handleRemove = async () => {
    if (selectedEntry) {
      Alert.alert(
        'Remove Entry',
        'Are you sure you want to remove this travel entry?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const updatedEntries = travelEntries.filter(
                  entry => entry.id !== selectedEntry.id
                );
                await AsyncStorage.setItem('travelEntries', JSON.stringify(updatedEntries));
                refreshEntries();
                setCount(updatedEntries.length);
                setSelectedEntry(null);
              } catch (error) {
                Alert.alert('Error', 'Failed to remove entry');
              }
            },
          },
        ]
      );
    }
  };

  const filteredEntries = travelEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: TravelEntry }) => (
    <TouchableOpacity
      style={[styles.entryContainer, { backgroundColor: theme.colors.card }]}
      onPress={() => setSelectedEntry(item)}
    >
      <Image source={{ uri: item.imageUri }} style={styles.entryImage} />
      <View style={styles.entryContent}>
        <Text style={[styles.entryTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.entryAddress, { color: theme.colors.text }]}>{item.address},</Text>
        <Text style={[styles.entryDate, { color: theme.colors.text }]}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Travel Diary
          </Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={theme.isDark ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.searchContainer, { 
          backgroundColor: theme.isDark ? '#2d2b2e' : theme.colors.card 
        }]}>
          <Ionicons name="search" size={20} color={theme.colors.text} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
              },
            ]}
            placeholder="Search by title..."
            placeholderTextColor={theme.colors.text}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>

      {filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {searchQuery ? 'No matching entries found' : 'No Entries yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={!!selectedEntry}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isEditing) {
            setSelectedEntry(null);
          }
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { 
                backgroundColor: theme.isDark ? theme.colors.card : '#ffffff'
              }]}>
                {selectedEntry && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.titleContainer}>
                        {isEditing ? (
                          <>
                            <TextInput
                              style={[
                                styles.titleInput,
                                {
                                  color: theme.colors.text,
                                  backgroundColor: theme.isDark ? '#3a383b' : theme.colors.card,
                                },
                              ]}
                              value={editedTitle}
                              onChangeText={(text) => {
                                if (text.length <= 25) {
                                  setEditedTitle(text);
                                }
                              }}
                              maxLength={25}
                              placeholder="Enter title"
                              placeholderTextColor={theme.colors.text}
                            />
                            <Text style={[styles.characterCount, { color: theme.colors.text }]}>
                              {editedTitle.length}/25
                            </Text>
                          </>
                        ) : (
                          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            {selectedEntry.title}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          if (!isEditing) {
                            setSelectedEntry(null);
                          }
                        }}
                        style={styles.closeButton}
                      >
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                      </TouchableOpacity>
                    </View>

                    <Image source={{ uri: selectedEntry.imageUri }} style={styles.modalImage} />
                    
                    <Text style={[styles.modalAddress, { color: theme.colors.text }]}>
                      {selectedEntry.address}
                    </Text>
                    <Text style={[styles.modalDate, { color: theme.colors.text }]}>
                      {new Date(selectedEntry.timestamp).toLocaleDateString()}
                    </Text>
                    
                    {isEditing ? (
                      <>
                        <TextInput
                          style={[styles.descriptionInput, { 
                            color: theme.colors.text,
                            backgroundColor: theme.isDark ? '#3a383b' : theme.colors.card,
                          }]}
                          value={editedDescription}
                          onChangeText={(text) => {
                            if (text.length <= 250) {
                              setEditedDescription(text);
                            }
                          }}
                          placeholder="Enter description"
                          placeholderTextColor={theme.colors.text}
                          multiline
                          numberOfLines={4}
                        />
                        <Text style={[styles.characterCount2, { color: theme.colors.text }]}>
                          {editedDescription.length}/250
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.modalDescription, { color: theme.colors.text }]}>
                        {selectedEntry.description}
                      </Text>
                    )}

                    <View style={styles.modalButtons}>
                      {isEditing ? (
                        <>
                          <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: '#1a5c1a' }]}
                            onPress={saveEdit}
                          >
                            <Text style={styles.buttonText}>Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: '#d92825' }]}
                            onPress={() => setIsEditing(false)}
                          >
                            <Text style={styles.buttonText}>Cancel</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: '#2f477c' }]}
                            onPress={handleEdit}
                          >
                            <Text style={styles.buttonText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.removeButton, { backgroundColor: '#d92825' }]}
                            onPress={handleRemove}
                          >
                            <Text style={styles.buttonText}>Delete</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: -4,
  },
  listContainer: {
    padding: 16,
  },
  entryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryImage: {
    width: 100,
    height: 100,
  },
  entryContent: {
    flex: 1,
    padding: 12,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 12,
    borderRadius: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    aspectRatio: 4.2/3,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalAddress: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  descriptionInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    opacity: 0.7,
    marginTop:4
  },
   characterCount2: {
    fontSize: 12,
    textAlign: 'right',
    opacity: 0.7,
    marginTop:-20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 4,
  },
}); 