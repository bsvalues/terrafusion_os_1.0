import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Permissions from "expo-permissions";
import { v4 as uuidv4 } from "uuid";

/**
 * Voice note categories
 */
export enum VoiceNoteCategory {
  GENERAL = "general",
  EXTERIOR = "exterior",
  INTERIOR = "interior",
  REPAIRS = "repairs",
  IMPROVEMENTS = "improvements",
  NEIGHBORHOOD = "neighborhood",
}

/**
 * Voice note data structure
 */
export interface VoiceNote {
  id: string;
  uri: string;
  category: VoiceNoteCategory;
  durationMillis: number;
  createdAt: Date;
  transcription?: string;
  processingTranscription?: boolean;
}

/**
 * Props for the voice notes component
 */
interface VoiceNotesProps {
  label: string;
  notes: VoiceNote[];
  onNotesChange: (notes: VoiceNote[]) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  transcribeNotes?: boolean;
  onRequestTranscription?: (note: VoiceNote) => Promise<string>;
}

/**
 * Format duration in mm:ss format
 */
const formatDuration = (millis: number): string => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Get category icon and color
 */
const getCategoryMeta = (category: VoiceNoteCategory): { icon: string; color: string } => {
  switch (category) {
    case VoiceNoteCategory.EXTERIOR:
      return { icon: "home", color: "#3498db" };
    case VoiceNoteCategory.INTERIOR:
      return { icon: "sofa", color: "#9b59b6" };
    case VoiceNoteCategory.REPAIRS:
      return { icon: "hammer-screwdriver", color: "#e74c3c" };
    case VoiceNoteCategory.IMPROVEMENTS:
      return { icon: "home-plus", color: "#27ae60" };
    case VoiceNoteCategory.NEIGHBORHOOD:
      return { icon: "map-marker-radius", color: "#f39c12" };
    default:
      return { icon: "note-text", color: "#7f8c8d" };
  }
};

/**
 * VoiceNotes component
 * A specialized input for recording and managing voice notes
 */
export const VoiceNotes: React.FC<VoiceNotesProps> = ({
  label,
  notes,
  onNotesChange,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
  transcribeNotes = false,
  onRequestTranscription,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VoiceNoteCategory>(
    VoiceNoteCategory.GENERAL
  );
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Request permission for audio recording
  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Audio recording permission is needed to create voice notes.",
          [{ text: "OK" }]
        );
      }
    };

    getPermission();

    // Clean up on unmount
    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }

      if (sound) {
        sound.unloadAsync();
      }

      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    if (disabled) return;

    try {
      // Check permissions
      const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Audio recording permission is required for this feature.",
          [{ text: "OK" }]
        );
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Start recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer for recording duration
      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1000);
      }, 1000);

      setDurationInterval(interval);
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!recording || !isRecording) return;

    try {
      // Stop recording
      await recording.stopAndUnloadAsync();

      // Clear duration interval
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }

      // Get recording URI
      const uri = recording.getURI();

      if (!uri) {
        throw new Error("Recording URI is null");
      }

      // Create voice note
      const newNote: VoiceNote = {
        id: uuidv4(),
        uri,
        category: selectedCategory,
        durationMillis: recordingDuration || 1000, // At least 1 second
        createdAt: new Date(),
      };

      // Add note to list
      const updatedNotes = [...notes, newNote];
      onNotesChange(updatedNotes);

      // Reset recording state
      setRecording(null);
      setIsRecording(false);

      // Transcribe if enabled
      if (transcribeNotes && onRequestTranscription) {
        transcribeNote(newNote, updatedNotes);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Failed to save recording. Please try again.");
      setIsRecording(false);
      setRecording(null);

      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
    }
  };

  // Transcribe a note
  const transcribeNote = async (note: VoiceNote, allNotes: VoiceNote[]) => {
    if (!onRequestTranscription) return;

    try {
      // Mark as processing
      const processingNotes = allNotes.map((n) => {
        if (n.id === note.id) {
          return { ...n, processingTranscription: true };
        }
        return n;
      });

      onNotesChange(processingNotes);

      // Request transcription
      const transcription = await onRequestTranscription(note);

      // Update note with transcription
      const updatedNotes = processingNotes.map((n) => {
        if (n.id === note.id) {
          return {
            ...n,
            transcription,
            processingTranscription: false,
          };
        }
        return n;
      });

      onNotesChange(updatedNotes);
    } catch (error) {
      console.error("Error transcribing note:", error);

      // Update note to mark as not processing
      const updatedNotes = allNotes.map((n) => {
        if (n.id === note.id) {
          return {
            ...n,
            processingTranscription: false,
          };
        }
        return n;
      });

      onNotesChange(updatedNotes);

      Alert.alert("Transcription Error", "Failed to transcribe voice note. Please try again.");
    }
  };

  // Play a note
  const playNote = async (note: VoiceNote) => {
    if (disabled) return;

    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingNoteId(null);
      }

      // If we're stopping the same note, don't restart it
      if (playingNoteId === note.id) {
        return;
      }

      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: note.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingNoteId(note.id);

      // When playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingNoteId(null);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error("Error playing note:", error);
      Alert.alert("Playback Error", "Failed to play voice note. Please try again.");
      setPlayingNoteId(null);
      setSound(null);
    }
  };

  // Stop playback
  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingNoteId(null);
    }
  };

  // Delete a note
  const deleteNote = (id: string) => {
    if (disabled) return;

    Alert.alert("Delete Voice Note", "Are you sure you want to delete this voice note?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Stop playback if this note is playing
          if (playingNoteId === id && sound) {
            await stopPlayback();
          }

          // Find the note to get its URI
          const noteToDelete = notes.find((n) => n.id === id);

          // Delete the file
          if (noteToDelete) {
            try {
              await FileSystem.deleteAsync(noteToDelete.uri);
            } catch (error) {
              console.warn("Error deleting audio file:", error);
            }
          }

          // Remove from list
          const updatedNotes = notes.filter((n) => n.id !== id);
          onNotesChange(updatedNotes);

          // Close expanded view if open
          if (expandedNoteId === id) {
            setExpandedNoteId(null);
          }
        },
      },
    ]);
  };

  // Update note category
  const updateNoteCategory = (id: string, category: VoiceNoteCategory) => {
    if (disabled) return;

    const updatedNotes = notes.map((note) => {
      if (note.id === id) {
        return { ...note, category };
      }
      return note;
    });

    onNotesChange(updatedNotes);
  };

  // Toggle expanded view
  const toggleExpanded = (id: string) => {
    if (expandedNoteId === id) {
      setExpandedNoteId(null);
    } else {
      setExpandedNoteId(id);
    }
  };

  // Get notes grouped by category
  const getNotesByCategory = () => {
    const grouped: Record<VoiceNoteCategory, VoiceNote[]> = {
      [VoiceNoteCategory.GENERAL]: [],
      [VoiceNoteCategory.EXTERIOR]: [],
      [VoiceNoteCategory.INTERIOR]: [],
      [VoiceNoteCategory.REPAIRS]: [],
      [VoiceNoteCategory.IMPROVEMENTS]: [],
      [VoiceNoteCategory.NEIGHBORHOOD]: [],
    };

    notes.forEach((note) => {
      grouped[note.category].push(note);
    });

    return grouped;
  };

  const groupedNotes = getNotesByCategory();

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {/* Recording Controls */}
      <View style={styles.recordingContainer}>
        {isRecording ? (
          <View style={styles.activeRecordingContainer}>
            <View style={styles.recordingInfo}>
              <View style={styles.recordingIndicator}><>

                <MaterialCommunityIcons name="record-rec" size={24} color="#e74c3c" />
              </View>

              <Text
</> style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>

              <View style={styles.categoryBadge}>
                <MaterialCommunityIcons
                  name={getCategoryMeta(selectedCategory).icon}
                  size={16}
                  color="white"
                />
                <Text style={styles.categoryBadgeText}>
                  {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.stopButton} onPress={stopRecording} disabled={disabled}>
              <MaterialCommunityIcons name="stop" size={30} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.categorySelector}><>

              <Text style={styles.sectionLabel}>Select Category:</Text>
              <ScrollView
</>
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categorySelectorContent}
              >
                {Object.values(VoiceNoteCategory).map((category) => {
                  const { icon, color } = getCategoryMeta(category);
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category && { backgroundColor: color },
                        disabled && styles.disabledOption,
                      ]}
                      onPress={() => !disabled && setSelectedCategory(category)}
                      disabled={disabled}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={20}
                        color={selectedCategory === category ? "white" : color}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory === category && styles.activeCategoryText,
                          disabled && styles.disabledText,
                        ]}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.recordButton, disabled && styles.disabledButton]}
              onPress={startRecording}
              disabled={disabled}
            >
              <MaterialCommunityIcons name="microphone" size={30} color="white" />
              <Text style={styles.recordButtonText}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Voice Notes List */}
      <View style={styles.notesContainer}>
        <Text style={styles.sectionLabel}>Voice Notes ({notes.length})</Text>

        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="microphone-off" size={32} color="#bdc3c7" /><>

            <Text style={styles.emptyStateText}>No voice notes recorded</Text>
            <Text
</> style={styles.emptyStateSubtext}>
              Tap the record button to create a voice note
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.notesList}>
            {/* Display notes grouped by category */}
            {Object.entries(groupedNotes).map(([category, categoryNotes]) => {
              if (categoryNotes.length === 0) return null;

              const { icon, color } = getCategoryMeta(category as VoiceNoteCategory);

              return (
                <View key={category} style={styles.categoryGroup}>
                  <View style={[styles.categoryHeader, { backgroundColor: color }]}>
                    <MaterialCommunityIcons name={icon} size={18} color="white" />
                    <Text style={styles.categoryHeaderText}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryNotes.length}
                      )
                    </Text>
                  </View>

                  {categoryNotes.map((note) => (
                    <View key={note.id} style={styles.noteItemContainer}>
                      <View style={styles.noteItem}>
                        <TouchableOpacity
                          style={styles.playButton}
                          onPress={() =>
                            playingNoteId === note.id ? stopPlayback() : playNote(note)
                          }
                          disabled={disabled}
                        ><>

                          <MaterialCommunityIcons
                            name={playingNoteId === note.id ? "stop" : "play"}
                            size={24}
                            color="white"
                          />
                        </TouchableOpacity>

                        <View
</> style={styles.noteInfo}><>

                          <Text style={styles.noteDate}>
                            {note.createdAt.toLocaleDateString()}{" "}
                            {note.createdAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                          <Text
</> style={styles.noteDuration}>
                            {formatDuration(note.durationMillis)}
                          </Text>

                          {note.processingTranscription && (
                            <View style={styles.processingContainer}>
                              <ActivityIndicator size="small" color="#3498db" />
                              <Text style={styles.processingText}>Transcribing...</Text>
                            </View>
                          )}

                          {note.transcription && (
                            <Text
                              style={styles.transcriptionPreview}
                              numberOfLines={expandedNoteId === note.id ? undefined : 2}
                            >
                              {note.transcription}
                            </Text>
                          )}
                        </View>

                        <View style={styles.noteActions}>
                          <TouchableOpacity
                            style={styles.noteAction}
                            onPress={() => toggleExpanded(note.id)}
                            disabled={disabled}
                          ><>

                            <MaterialCommunityIcons
                              name={expandedNoteId === note.id ? "chevron-up" : "chevron-down"}
                              size={20}
                              color="#7f8c8d"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
</>
                            style={[styles.noteAction, styles.deleteAction]}
                            onPress={() => deleteNote(note.id)}
                            disabled={disabled}
                          >
                            <MaterialCommunityIcons
                              name="trash-can-outline"
                              size={20}
                              color="#e74c3c"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {expandedNoteId === note.id && (
                        <View style={styles.expandedNote}><>

                          <Text style={styles.expandedNoteLabel}>Category:</Text>
                          <ScrollView
</>
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.expandedCategoriesContainer}
                          >
                            {Object.values(VoiceNoteCategory).map((cat) => {
                              const meta = getCategoryMeta(cat);
                              return (
                                <TouchableOpacity
                                  key={cat}
                                  style={[
                                    styles.expandedCategoryOption,
                                    note.category === cat && { backgroundColor: meta.color },
                                    disabled && styles.disabledOption,
                                  ]}
                                  onPress={() => !disabled && updateNoteCategory(note.id, cat)}
                                  disabled={disabled}
                                >
                                  <MaterialCommunityIcons
                                    name={meta.icon}
                                    size={16}
                                    color={note.category === cat ? "white" : meta.color}
                                  />
                                  <Text
                                    style={[
                                      styles.expandedCategoryText,
                                      note.category === cat && styles.activeCategoryText,
                                      disabled && styles.disabledText,
                                    ]}
                                  >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>

                          {note.transcription ? (
                            <View style={styles.transcriptionContainer}><>

                              <Text style={styles.expandedNoteLabel}>Transcription:</Text>
                              <View
</> style={styles.transcriptionBox}>
                                <Text style={styles.transcriptionText}>{note.transcription}</Text>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.noTranscriptionContainer}>
                              {transcribeNotes && !note.processingTranscription ? (
                                <TouchableOpacity
                                  style={[
                                    styles.transcribeButton,
                                    disabled && styles.disabledButton,
                                  ]}
                                  onPress={() => !disabled && transcribeNote(note, notes)}
                                  disabled={disabled || !onRequestTranscription}
                                >
                                  <MaterialCommunityIcons
                                    name="text-recognition"
                                    size={18}
                                    color="white"
                                  />
                                  <Text style={styles.transcribeButtonText}>Transcribe Note</Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={styles.noTranscriptionText}>
                                  {note.processingTranscription
                                    ? "Transcribing..."
                                    : "No transcription available"}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  required: {
    color: "#e74c3c",
  },
  recordingContainer: {
    marginBottom: 16,
  },
  categorySelector: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  categorySelectorContent: {
    paddingHorizontal: 4,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  disabledOption: {
    opacity: 0.6,
  },
  categoryText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 6,
  },
  activeCategoryText: {
    color: "white",
    fontWeight: "500",
  },
  disabledText: {
    color: "#bdc3c7",
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    padding: 12,
  },
  recordButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  activeRecordingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9ebea",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  recordingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e74c3c",
    marginRight: 8,
  },
  recordingDuration: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7f8c8d",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "white",
    marginLeft: 4,
  },
  stopButton: {
    backgroundColor: "#e74c3c",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notesContainer: {
    flex: 1,
  },
  notesList: {
    maxHeight: 400,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7f8c8d",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 4,
    textAlign: "center",
  },
  categoryGroup: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  categoryHeaderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
    marginLeft: 8,
  },
  noteItemContainer: {
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#eee",
    borderTopWidth: 0,
  },
  noteItem: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3498db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  noteDuration: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  processingText: {
    fontSize: 12,
    color: "#3498db",
    marginLeft: 4,
  },
  transcriptionPreview: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
    fontStyle: "italic",
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteAction: {
    padding: 6,
    marginLeft: 4,
  },
  deleteAction: {
    backgroundColor: "#f9ebea",
    borderRadius: 4,
  },
  expandedNote: {
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  expandedNoteLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 6,
  },
  expandedCategoriesContainer: {
    paddingVertical: 6,
  },
  expandedCategoryOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 6,
  },
  expandedCategoryText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  transcriptionContainer: {
    marginTop: 12,
  },
  transcriptionBox: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
  },
  transcriptionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  noTranscriptionContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  noTranscriptionText: {
    fontSize: 14,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  transcribeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  transcribeButtonText: {
    fontSize: 12,
    color: "white",
    marginLeft: 6,
  },
  helperText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 8,
  },
});
