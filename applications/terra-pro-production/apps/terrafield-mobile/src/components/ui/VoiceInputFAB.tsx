import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  VoiceRecognitionService,
  RecognitionLanguage,
  VoiceRecognitionEvent,
} from "../../services/VoiceRecognitionService";

interface VoiceInputFABProps {
  /**
   * Z-index for the FAB
   */
  zIndex?: number;

  /**
   * Position from bottom
   */
  bottom?: number;

  /**
   * Position from right
   */
  right?: number;

  /**
   * Recognition language
   */
  language?: RecognitionLanguage;

  /**
   * Callback when text is recognized
   */
  onRecognized?: (text: string) => void;

  /**
   * Callback when data is extracted
   */
  onDataExtracted?: (data: Record<string, any>) => void;

  /**
   * Whether to auto hide the FAB after a successful recognition
   */
  autoHideAfterRecognition?: boolean;
}

/**
 * Voice Input Floating Action Button
 *
 * A floating action button that opens a voice input modal
 * for quick voice-to-text data entry.
 */
const VoiceInputFAB: React.FC<VoiceInputFABProps> = ({
  zIndex = 100,
  bottom = 20,
  right = 20,
  language = RecognitionLanguage.ENGLISH_US,
  onRecognized,
  onDataExtracted,
  autoHideAfterRecognition = true,
}) => {
  // State
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [transcription, setTranscription] = useState<string>("");

  // Refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Voice recognition service
  const voiceRecognitionService = VoiceRecognitionService.getInstance();

  // Setup animation
  useEffect(() => {
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnimation.start();

    return () => {
      scaleAnimation.stop();
    };
  }, [scaleAnim]);

  // Setup recording pulse animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isRecording, pulseAnim]);

  // Setup voice recognition event listener
  useEffect(() => {
    const removeListener = voiceRecognitionService.addListener(handleVoiceEvent);

    return () => {
      removeListener();
    };
  }, []);

  // Setup timer for recording duration
  useEffect(() => {
    if (isRecording) {
      // Reset recording time
      setRecordingTime(0);

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Clear timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    };
  }, [isRecording]);

  // Handle voice recognition events
  const handleVoiceEvent = (event: VoiceRecognitionEvent) => {
    switch (event.type) {
      case "recording_started":
        setIsRecording(true);
        break;

      case "recording_stopped":
        setIsRecording(false);
        break;

      case "transcription_started":
        setIsTranscribing(true);
        break;

      case "transcription_complete":
        setIsTranscribing(false);
        setTranscription(event.data.text);

        // Extract data and call callback
        if (onDataExtracted) {
          const extractedData = voiceRecognitionService.extractPropertyData(event.data.text);

          onDataExtracted(extractedData);
        }

        // Call recognized callback
        if (onRecognized) {
          onRecognized(event.data.text);
        }

        // Auto hide if enabled
        if (autoHideAfterRecognition) {
          setTimeout(() => {
            setModalVisible(false);
          }, 2000);
        }
        break;

      case "error":
        setIsRecording(false);
        setIsTranscribing(false);

        Alert.alert("Error", event.data.message || "An error occurred during voice recognition", [
          { text: "OK" },
        ]);
        break;
    }
  };

  // Format recording time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Open modal
  const openModal = () => {
    setModalVisible(true);
    setTranscription("");
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Reset state
      setTranscription("");

      // Start recording
      const recordingResult = await voiceRecognitionService.startRecording({
        language,
      });

      if (!recordingResult.success) {
        throw new Error(recordingResult.error || "Failed to start recording");
      }
    } catch (error) {
      console.error("Error starting recording:", error);

      Alert.alert(
        "Error",
        "Failed to start recording. Please make sure the app has permission to access the microphone.",
        [{ text: "OK" }]
      );
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      // Stop recording
      const recordingResult = await voiceRecognitionService.stopRecording();

      if (!recordingResult.success || !recordingResult.uri) {
        throw new Error(recordingResult.error || "Failed to stop recording");
      }

      // Transcribe recording
      const transcriptionResult = await voiceRecognitionService.transcribeRecording(
        recordingResult.uri,
        language
      );

      if (!transcriptionResult.success) {
        throw new Error(transcriptionResult.error || "Failed to transcribe recording");
      }
    } catch (error) {
      console.error("Error stopping recording:", error);

      Alert.alert(
        "Error",
        "An error occurred while processing your voice input. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Close modal
  const closeModal = () => {
    // If recording, stop recording first
    if (isRecording) {
      stopRecording();
    }

    setModalVisible(false);
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={[styles.fabSmall, { bottom, right, zIndex }]}
        onPress={toggleVisibility}
      >
        <MaterialCommunityIcons name="microphone-plus" size={24} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <Animated.View
        style={[
          styles.fabContainer,
          {
            bottom,
            right,
            zIndex,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.fab} onPress={openModal}><>

          <MaterialCommunityIcons name="microphone" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
</> style={styles.minimizeButton} onPress={toggleVisibility}>
          <MaterialCommunityIcons name="minus" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Voice input modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Voice Input</Text>

              <TouchableOpacity
</> style={styles.closeButton} onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.modalBody}>
              {/* Recording UI */}
              {(isRecording || isTranscribing) && (
                <View style={styles.recordingContainer}>
                  {isRecording ? (
                    <>
                      <Animated.View
                        style={[
                          styles.recordingIndicator,
                          {
                            transform: [{ scale: pulseAnim }],
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name="microphone" size={48} color="#e74c3c" />
                      </Animated.View><>


                      <Text style={styles.recordingText}>
                        Recording... {formatTime(recordingTime)}
                      </Text>
                      <Text
</> style={styles.recordingInstructions}>
                        Speak clearly into the microphone
                      </Text>

                      <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                        <MaterialCommunityIcons name="stop" size={24} color="#fff" />
                        <Text style={styles.stopButtonText}>Stop Recording</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.transcribingContainer}>
                      <ActivityIndicator size="large" color="#3498db" />
                      <Text style={styles.transcribingText}>Transcribing...</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Results UI */}
              {!isRecording && !isTranscribing && transcription && (
                <View style={styles.resultsContainer}><>

                  <Text style={styles.resultsTitle}>Transcription</Text>
                  <Text
</> style={styles.transcriptionText}>{transcription}</Text>

                  <TouchableOpacity style={styles.recordAgainButton} onPress={startRecording}>
                    <MaterialCommunityIcons name="microphone" size={20} color="#fff" />
                    <Text style={styles.recordAgainButtonText}>Record Again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Initial state */}
              {!isRecording && !isTranscribing && !transcription && (
                <View style={styles.startRecordingContainer}>
                  <TouchableOpacity style={styles.startRecordingButton} onPress={startRecording}><>

                    <MaterialCommunityIcons name="microphone" size={48} color="#fff" />
                  </TouchableOpacity>

                  <Text
</> style={styles.startRecordingText}>Tap to start recording</Text>
                  <Text style={styles.startRecordingHint}>
                    Speak clearly and include property details such as address, size, and features.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    alignItems: "center",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  fabSmall: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7f8c8d",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  minimizeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    minHeight: 300,
  },
  recordingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  recordingIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8d7da",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  recordingInstructions: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  stopButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  transcribingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  transcribingText: {
    fontSize: 16,
    marginTop: 16,
  },
  resultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  transcriptionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  recordAgainButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  recordAgainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  startRecordingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  startRecordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  startRecordingText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  startRecordingHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default VoiceInputFAB;
