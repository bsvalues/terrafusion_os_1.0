import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Keyboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Colors from "../constants/Colors";
import { DataSyncService, FieldNote, UserPresence } from "../services/DataSyncService";
import { NotificationService } from "../services/NotificationService";
import { ApiService } from "../services/ApiService";

interface CollaborativeFieldNotesProps {
  propertyId: string;
  parcelId: string;
  userId: number;
  userName: string;
  onSyncStatusChange?: (isSyncing: boolean) => void;
}

const CollaborativeFieldNotes: React.FC<CollaborativeFieldNotesProps> = ({
  propertyId,
  parcelId,
  userId,
  userName,
  onSyncStatusChange,
}) => {
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // References
  const flatListRef = useRef<FlatList>(null);

  // Services
  const dataSyncService = DataSyncService.getInstance();
  const notificationService = NotificationService.getInstance();
  const apiService = ApiService.getInstance();

  // Document ID for Yjs
  const docId = `property_${propertyId}_parcel_${parcelId}`;

  // Load initial data
  useEffect(() => {
    // Set client state in DataSyncService
    dataSyncService.setClientState(userId, userName);

    // Load notes
    loadNotes();

    // Set up refresh interval
    const interval = setInterval(() => {
      refreshNotes();
    }, 5000); // Refresh every 5 seconds

    // Set up connection status change listener
    const connectionStatusListener = () => {
      setIsOffline(!apiService.isConnected());

      // Animate notification
      if (!apiService.isConnected()) {
        showOfflineNotification();
      } else {
        hideOfflineNotification();
      }
    };

    // Check initial connection status
    setIsOffline(!apiService.isConnected());
    if (!apiService.isConnected()) {
      showOfflineNotification();
    }

    // Clean up
    return () => {
      clearInterval(interval);
    };
  }, [propertyId, parcelId]);

  // Load notes
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      await refreshNotes();
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Error", "Failed to load field notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh notes
  const refreshNotes = async () => {
    try {
      const fieldNotes = await dataSyncService.getFieldNotes(docId, parcelId);

      // Sort by creation date (newest first)
      const sortedNotes = [...fieldNotes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotes(sortedNotes);

      // Get active users
      const users = dataSyncService.getActiveUsers(docId);
      setActiveUsers(users);
    } catch (error) {
      console.error("Error refreshing notes:", error);
    }
  };

  // Add a new note
  const addNote = async () => {
    if (!noteText.trim()) {
      return;
    }

    Keyboard.dismiss();

    try {
      await dataSyncService.addFieldNote(docId, parcelId, noteText.trim(), userId, userName);

      setNoteText("");
      await refreshNotes();

      // Scroll to top
      if (notes.length > 0) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      console.error("Error adding note:", error);
      Alert.alert("Error", "Failed to add note. Please try again.");
    }
  };

  // Sync notes with server
  const syncNotes = async () => {
    if (!apiService.isConnected()) {
      Alert.alert(
        "Offline",
        "You are currently offline. Please try again when you have an internet connection."
      );
      return;
    }

    try {
      setIsSyncing(true);
      if (onSyncStatusChange) {
        onSyncStatusChange(true);
      }

      await dataSyncService.syncDoc(docId, parcelId);
      await refreshNotes();

      notificationService.sendSystemNotification(
        "Sync Complete",
        "Field notes have been synchronized successfully."
      );
    } catch (error) {
      console.error("Error syncing notes:", error);
      Alert.alert("Error", "Failed to sync notes. Please try again.");
    } finally {
      setIsSyncing(false);
      if (onSyncStatusChange) {
        onSyncStatusChange(false);
      }
    }
  };

  // Show offline notification
  const showOfflineNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide offline notification
  const hideOfflineNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // Render note item
  const renderNoteItem = ({ item }: { item: FieldNote }) => {
    const isOwnNote = item.userId === userId;
    const userColor = activeUsers.find((u) => u.userId === item.userId)?.color || Colors.primary;

    return (
      <View style={[styles.noteItem, isOwnNote ? styles.ownNoteItem : null]}>
        <View style={styles.noteHeader}>
          <View style={[styles.noteAuthorIcon, { backgroundColor: userColor + "20" }]}>
            <Text style={[styles.noteAuthorInitial, { color: userColor }]}>
              {item.createdBy.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.noteAuthorInfo}><>

            <Text style={styles.noteAuthor}>
              {item.createdBy} {isOwnNote && "(You)"}
            </Text>
            <Text
</> style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.noteText}>{item.text}</Text>
      </View>
    );
  };

  // Render active user item
  const renderActiveUserItem = ({ item }: { item: UserPresence }) => {
    const isCurrentUser = item.userId === userId;

    return (
      <View style={styles.activeUserContainer}>
        <View style={[styles.activeUserAvatar, { backgroundColor: item.color + "20" }]}><>

          <Text style={[styles.activeUserInitial, { color: item.color }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
          <View
</>
            style={[
              styles.statusIndicator,
              { backgroundColor: item.status === "online" ? Colors.success : Colors.warning },
            ]}
          />
        </View>
        <Text style={styles.activeUserName} numberOfLines={1}>
          {isCurrentUser ? "You" : item.name}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isOffline && (
        <Animated.View
          style={[
            styles.offlineNotice,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Ionicons name="cloud-offline" size={16} color={Colors.white} />
          <Text style={styles.offlineText}>
            You are offline. Changes will be synchronized when you reconnect.
          </Text>
        </Animated.View>
      )}

      {activeUsers.length > 0 && (
        <View style={styles.activeUsersContainer}>
          <FlatList
            data={activeUsers}
            renderItem={renderActiveUserItem}
            keyExtractor={(item) => item.userId.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeUsersList}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading field notes...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text" size={48} color={Colors.textLight} /><>

              <Text style={styles.emptyText}>No field notes yet</Text>
              <Text
</> style={styles.emptySubtext}>Add the first note below</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Add a field note..."
            placeholderTextColor={Colors.textLight}
            multiline
            value={noteText}
            onChangeText={setNoteText}
          />
          <TouchableOpacity
            style={[styles.addButton, !noteText.trim() && styles.addButtonDisabled]}
            onPress={addNote}
            disabled={!noteText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={noteText.trim() ? Colors.white : Colors.disabledText}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncNotes}
          disabled={isSyncing || isOffline}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="sync" size={20} color={Colors.white} />
          )}
          <Text style={styles.syncButtonText}>Sync</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning,
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 4,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  offlineText: {
    color: Colors.white,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  activeUsersContainer: {
    marginVertical: 10,
  },
  activeUsersList: {
    paddingHorizontal: 10,
  },
  activeUserContainer: {
    alignItems: "center",
    marginRight: 16,
    width: 48,
  },
  activeUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  activeUserInitial: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  activeUserName: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textLight,
  },
  notesList: {
    padding: 10,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  noteItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ownNoteItem: {
    backgroundColor: Colors.primary + "08",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  noteAuthorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  noteAuthorInitial: {
    fontSize: 14,
    fontWeight: "bold",
  },
  noteAuthorInfo: {
    flex: 1,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    position: "relative",
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 48,
    fontSize: 14,
    maxHeight: 100,
    color: Colors.text,
  },
  addButton: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: Colors.disabledButton,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 36,
  },
  syncButtonText: {
    color: Colors.white,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "600",
  },
});

export default CollaborativeFieldNotes;
