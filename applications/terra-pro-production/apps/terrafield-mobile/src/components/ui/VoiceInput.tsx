import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  VoiceRecognitionService,
  RecordingResult,
  TranscriptionResult,
  RecognitionLanguage,
  VoiceRecognitionEvent,
} from "../services/VoiceRecognitionService";

interface VoiceInputProps {
  /**
   * Input label
   */
  label: string;

  /**
   * Current input value
   */
  value: string;

  /**
   * Callback when value changes
   */
  onChangeText: (text: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Maximum number of lines for multiline input
   */
  numberOfLines?: number;

  /**
   * Whether to use multiline input
   */
  multiline?: boolean;

  /**
   * Whether to extract structured data
   */
  extractData?: boolean;

  /**
   * Callback when data is extracted
   */
  onDataExtracted?: (data: Record<string, any>) => void;

  /**
   * Allowed field types for data extraction
   */
  allowedFields?: string[];

  /**
   * Field help examples
   */
  helpExamples?: Record<string, string[]>;

  /**
   * Recognition language
   */
  language?: RecognitionLanguage;

  /**
   * Style for container
   */
  style?: any;

  /**
   * Auto focus input after recording
   */
  autoFocusAfterRecording?: boolean;
}

/**
 * VoiceInput component
 *
 * A text input with voice recording capabilities.
 * Allows users to input text by speaking instead of typing.
 */
const VoiceInput: React.FC<VoiceInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = "",
  disabled = false,
  numberOfLines = 1,
  multiline = false,
  extractData = false,
  onDataExtracted,
  allowedFields = [],
  helpExamples,
  language = RecognitionLanguage.ENGLISH_US,
  style,
  autoFocusAfterRecording = true,
}) => {
  // State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [transcription, setTranscription] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [hasFocus, setHasFocus] = useState<boolean>(false);

  // Refs
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Voice recognition service
  const voiceRecognitionService = VoiceRecognitionService.getInstance();

  // Setup pulse animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();
    } else {
      pulseAnimation.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isRecording, pulseAnimation]);

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

  // Handle press on voice input button
  const handleVoiceInputPress = () => {
    if (disabled) return;

    if (isRecording) {
      stopRecording();
    } else {
      setModalVisible(true);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Reset state
      setTranscription("");
      setExtractedData({});

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

      // Set transcription
      setTranscription(transcriptionResult.text);

      // Extract data if enabled
      if (extractData) {
        const extractedData = voiceRecognitionService.extractPropertyData(transcriptionResult.text);

        // Filter to allowed fields if specified
        if (allowedFields.length > 0) {
          const filteredData: Record<string, any> = {};

          Object.keys(extractedData).forEach((key) => {
            if (allowedFields.includes(key)) {
              filteredData[key] = extractedData[key];
            }
          });

          setExtractedData(filteredData);

          // Call onDataExtracted callback
          if (onDataExtracted) {
            onDataExtracted(filteredData);
          }
        } else {
          setExtractedData(extractedData);

          // Call onDataExtracted callback
          if (onDataExtracted) {
            onDataExtracted(extractedData);
          }
        }
      }

      // Auto focus input after recording if enabled
      if (autoFocusAfterRecording && textInputRef.current) {
        textInputRef.current.focus();
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

  // Accept transcription and close modal
  const acceptTranscription = () => {
    // Update input value
    onChangeText(transcription);

    // Close modal
    setModalVisible(false);
  };

  // Cancel transcription and close modal
  const cancelTranscription = () => {
    // Reset state
    setTranscription("");
    setExtractedData({});

    // Close modal
    setModalVisible(false);
  };

  // Edit transcription
  const editTranscription = (text: string) => {
    setTranscription(text);
  };

  // Render extracted data
  const renderExtractedData = () => {
    if (!extractData || Object.keys(extractedData).length === 0) {
      return null;
    }

    return (
      <View style={styles.extractedDataContainer}>
        <Text style={styles.extractedDataTitle}>Extracted Data:</Text>
        {Object.entries(extractedData).map(([key, value]) => (
          <View key={key} style={styles.extractedDataItem}><>

            <Text style={styles.extractedDataKey}>{key}:</Text>
            <Text
</> style={styles.extractedDataValue}>
              {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Render help examples
  const renderHelpExamples = () => {
    if (!helpExamples || Object.keys(helpExamples).length === 0) {
      return null;
    }

    return (
      <View style={styles.helpExamplesContainer}>
        <Text style={styles.helpExamplesTitle}>Example phrases:</Text>
        {Object.entries(helpExamples)
          .filter(([key]) => !allowedFields.length || allowedFields.includes(key))
          .slice(0, 3) // Limit to 3 examples
          .map(([key, examples]) => (
            <View key={key} style={styles.helpExampleItem}>
              <Text style={styles.helpExampleText}>• {examples[0]}</Text>
            </View>
          ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input container */}
      <View
        style={[
          styles.inputContainer,
          disabled && styles.disabledInput,
          hasFocus && styles.focusedInput,
        ]}
      >
        <TextInput
          ref={textInputRef}
          style={[styles.input, multiline && { height: numberOfLines * 20 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
        />

        <TouchableOpacity
          style={[styles.voiceButton, disabled && styles.disabledButton]}
          onPress={handleVoiceInputPress}
          disabled={disabled}
        >
          <MaterialCommunityIcons
            name="microphone"
            size={24}
            color={disabled ? "#ccc" : "#3498db"}
          />
        </TouchableOpacity>
      </View>

      {/* Voice input modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (isRecording) {
            stopRecording();
          } else {
            setModalVisible(false);
          }
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Voice Input</Text>

              <TouchableOpacity
</>
                style={styles.modalCloseButton}
                onPress={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    cancelTranscription();
                  }
                }}
              >
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
                            transform: [{ scale: pulseAnimation }],
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

              {/* Transcription UI */}
              {!isRecording && !isTranscribing && (
                <View style={styles.transcriptionContainer}>
                  <View style={styles.transcriptionHeader}><>

                    <Text style={styles.transcriptionTitle}>Transcription</Text>

                    <TouchableOpacity
</> style={styles.recordAgainButton} onPress={startRecording}>
                      <MaterialCommunityIcons name="microphone" size={20} color="#fff" />
                      <Text style={styles.recordAgainButtonText}>Record Again</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.transcriptionInput}
                    value={transcription}
                    onChangeText={editTranscription}
                    multiline
                    numberOfLines={5}
                    placeholder="No transcription available"
                  />

                  {/* Extracted data */}
                  {renderExtractedData()}

                  {/* Help examples */}
                  {renderHelpExamples()}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={cancelTranscription}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.acceptButton} onPress={acceptTranscription}>
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
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

                  {/* Help examples */}
                  {renderHelpExamples()}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    borderColor: "#eee",
  },
  focusedInput: {
    borderColor: "#3498db",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  voiceButton: {
    padding: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: "70%",
    maxHeight: "90%",
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
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    flex: 1,
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
  transcriptionContainer: {
    flex: 1,
  },
  transcriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  recordAgainButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  recordAgainButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  transcriptionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
  },
  acceptButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
    fontSize: 16,
    marginBottom: 24,
  },
  extractedDataContainer: {
    marginTop: 16,
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
  },
  extractedDataTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  extractedDataItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  extractedDataKey: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  extractedDataValue: {
    fontSize: 14,
  },
  helpExamplesContainer: {
    marginTop: 16,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  helpExamplesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  helpExampleItem: {
    marginBottom: 4,
  },
  helpExampleText: {
    fontSize: 14,
    color: "#666",
  },
});

export default VoiceInput;
