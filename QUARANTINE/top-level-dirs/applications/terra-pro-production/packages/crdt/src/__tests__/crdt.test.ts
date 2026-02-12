import * as Y from "yjs";
import {
  createParcelStore,
  createPhotoStore,
  encodeDocUpdate,
  applyEncodedUpdate,
  mergeUpdates,
  addPhoto,
  updatePhotoMetadata,
  removePhoto,
  getAllPhotos,
  getPendingPhotos,
  PhotoMetadata,
} from "../index";

describe("CRDT functionality", () => {
  test("createParcelStore initializes with empty notes", () => {
    const { store } = createParcelStore("TEST123");
    expect(store.notes).toBe("");
  });

  test("consistent merge with concurrent edits on parcel notes", () => {
    // Create two independent stores for the same parcel
    const { store: store1, doc: doc1 } = createParcelStore("TEST123");
    const { store: store2, doc: doc2 } = createParcelStore("TEST123");

    // Make different edits in each store
    store1.notes = "Update from device 1";
    store2.notes = "Update from device 2";

    // Capture updates from both devices
    const update1 = encodeDocUpdate(doc1);
    const update2 = encodeDocUpdate(doc2);

    // Create a third store to test both merges in different orders
    const { store: storeA, doc: docA } = createParcelStore("TEST123");
    const { store: storeB, doc: docB } = createParcelStore("TEST123");

    // Apply updates in different orders
    applyEncodedUpdate(docA, update1);
    applyEncodedUpdate(docA, update2);

    applyEncodedUpdate(docB, update2);
    applyEncodedUpdate(docB, update1);

    // Both stores should converge to the same state
    expect(storeA.notes).toBe(storeB.notes);

    // Final result should contain essence of both updates (actual merge depends on Yjs algorithm)
    const finalResult = storeA.notes;
    expect(finalResult.length).toBeGreaterThan(0);
  });

  test("createPhotoStore initializes with empty metadata", () => {
    const { store } = createPhotoStore("REPORT123");
    expect(Object.keys(store.metadata).length).toBe(0);
  });

  test("photo operations work correctly", () => {
    const { store } = createPhotoStore("REPORT123");

    const testPhoto: PhotoMetadata = {
      id: "photo1",
      reportId: "REPORT123",
      photoType: "SUBJECT",
      url: "",
      caption: "Test photo",
      dateTaken: new Date().toISOString(),
      latitude: 40.7128,
      longitude: -74.006,
      isOffline: true,
      localPath: "/local/path/to/photo.jpg",
      status: "pending",
    };

    // Add photo
    addPhoto(store, testPhoto);
    expect(Object.keys(store.metadata).length).toBe(1);
    expect(store.metadata["photo1"].caption).toBe("Test photo");

    // Update photo
    updatePhotoMetadata(store, "photo1", {
      caption: "Updated caption",
      status: "syncing",
    });
    expect(store.metadata["photo1"].caption).toBe("Updated caption");
    expect(store.metadata["photo1"].status).toBe("syncing");

    // Get all photos
    const allPhotos = getAllPhotos(store);
    expect(allPhotos.length).toBe(1);
    expect(allPhotos[0].id).toBe("photo1");

    // Add another photo with error status
    const errorPhoto: PhotoMetadata = {
      id: "photo2",
      reportId: "REPORT123",
      photoType: "COMPARABLE",
      url: "",
      caption: "Error photo",
      dateTaken: new Date().toISOString(),
      latitude: null,
      longitude: null,
      isOffline: true,
      status: "error",
      errorMessage: "Failed to upload",
    };

    addPhoto(store, errorPhoto);

    // Test getPendingPhotos
    const pendingPhotos = getPendingPhotos(store);
    expect(pendingPhotos.length).toBe(1);
    expect(pendingPhotos[0].id).toBe("photo2");

    // Remove photo
    removePhoto(store, "photo1");
    expect(Object.keys(store.metadata).length).toBe(1);
    expect(store.metadata["photo1"]).toBeUndefined();
  });

  test("consistent merge with concurrent photo updates", () => {
    // Create two independent stores for the same report
    const { store: store1, doc: doc1 } = createPhotoStore("REPORT123");
    const { store: store2, doc: doc2 } = createPhotoStore("REPORT123");

    // Add same photo with different metadata in each store
    const basePhoto: PhotoMetadata = {
      id: "photo1",
      reportId: "REPORT123",
      photoType: "SUBJECT",
      url: "",
      caption: "Original caption",
      dateTaken: new Date().toISOString(),
      latitude: 40.7128,
      longitude: -74.006,
      isOffline: true,
      status: "pending",
    };

    addPhoto(store1, basePhoto);
    addPhoto(store2, basePhoto);

    // Update different fields in each store
    updatePhotoMetadata(store1, "photo1", {
      caption: "Updated by device 1",
      status: "syncing",
    });

    updatePhotoMetadata(store2, "photo1", {
      latitude: 40.7129,
      longitude: -74.0061,
    });

    // Capture updates from both devices
    const update1 = encodeDocUpdate(doc1);
    const update2 = encodeDocUpdate(doc2);

    // Create a third store to test merges
    const { store: mergedStore, doc: mergedDoc } = createPhotoStore("REPORT123");

    // Apply both updates
    applyEncodedUpdate(mergedDoc, update1);
    applyEncodedUpdate(mergedDoc, update2);

    // Check that merges preserved both updates
    expect(mergedStore.metadata["photo1"].caption).toBe("Updated by device 1");
    expect(mergedStore.metadata["photo1"].status).toBe("syncing");
    expect(mergedStore.metadata["photo1"].latitude).toBe(40.7129);
    expect(mergedStore.metadata["photo1"].longitude).toBe(-74.0061);
  });
});
