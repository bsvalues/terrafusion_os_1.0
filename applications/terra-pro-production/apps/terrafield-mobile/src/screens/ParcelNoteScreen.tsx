import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { createParcelStore, encodeDocUpdate, applyEncodedUpdate } from "@terrafield/crdt";

type ParcelNoteRouteProp = RouteProp<RootStackParamList, "ParcelNote">;

const API_BASE_URL = "https://terrafield-api.example.com"; // This would be set in a config file

export default function ParcelNoteScreen() {
  const route = useRoute<ParcelNoteRouteProp>();
  const { parcelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [parcelStore, setParcelStore] = useState<ReturnType<typeof createParcelStore> | null>(null);
  const [notes, setNotes] = useState("");
  const [syncTime, setSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    initializeParcelStore();
  }, [parcelId]);

  const initializeParcelStore = async () => {
    setLoading(true);
    try {
      // Create a new parcel store
      const store = createParcelStore(parcelId);
      setParcelStore(store);

      // Try to initialize from server
      try {
        await fetchNotesFromServer(store);
      } catch (error) {
        console.log("Could not fetch notes from server, using local only");
      }

      // Set initial notes value
      setNotes(store.store.notes);
    } catch (error) {
      console.error("Error initializing parcel store:", error);
      Alert.alert("Error", "Failed to initialize note storage.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotesFromServer = async (store: ReturnType<typeof createParcelStore>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sync/parcels/${parcelId}/notes`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const { update } = await response.json();

      if (update) {
        applyEncodedUpdate(store.doc, update);
        setSyncTime(new Date());
      }
    } catch (error) {
      console.error("Error fetching notes from server:", error);
      throw error;
    }
  };

  const syncNotesToServer = async () => {
    if (!parcelStore) return;

    setSyncing(true);
    try {
      // Encode the current state
      const encodedUpdate = encodeDocUpdate(parcelStore.doc);

      // Send to the server
      const response = await fetch(`${API_BASE_URL}/api/sync/parcels/${parcelId}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ update: encodedUpdate }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      // Get the merged result from the server
      const { mergedUpdate } = await response.json();

      // Apply the merged update
      applyEncodedUpdate(parcelStore.doc, mergedUpdate);

      // Update the UI with the potentially merged result
      setNotes(parcelStore.store.notes);
      setSyncTime(new Date());

      Alert.alert("Sync Successful", "Notes synchronized with server.");
    } catch (error) {
      console.error("Error syncing notes to server:", error);
      Alert.alert("Sync Failed", "Failed to synchronize notes. You can try again later.");
    } finally {
      setSyncing(false);
    }
  };

  const handleNotesChange = (text: string) => {
    if (!parcelStore) return;

    // Update the local store
    parcelStore.store.notes = text;

    // Update the UI
    setNotes(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Notes for Parcel #{parcelId}</Text>
          {syncTime && (
            <Text style={styles.syncTime}>Last synced: {syncTime.toLocaleTimeString()}</Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
        ) : (
          <>
            <View style={styles.notesContainer}><>

              <TextInput
                style={styles.notesInput}
                multiline
                placeholder="Enter your notes about this parcel here. All changes will be synchronized when you have internet connection."
                value={notes}
                onChangeText={handleNotesChange}
              />
            </View>

            <TouchableOpacity
</>
              style={styles.syncButton}
              onPress={syncNotesToServer}
              disabled={syncing}
            >
              <Text style={styles.buttonText}>{syncing ? "Syncing..." : "Sync Notes Now"}</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}><>

              <Text style={styles.infoTitle}>About CRDT Synchronization</Text>
              <Text
</> style={styles.infoText}>
                This note editor uses Conflict-free Replicated Data Types (CRDT) to ensure your
                notes can be edited offline and will properly merge when synchronized with the
                server, even if multiple people are editing simultaneously.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  syncTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  notesContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notesInput: {
    fontSize: 16,
    textAlignVertical: "top",
    height: 300,
  },
  syncButton: {
    marginTop: 16,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
  infoCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#0D47A1",
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
