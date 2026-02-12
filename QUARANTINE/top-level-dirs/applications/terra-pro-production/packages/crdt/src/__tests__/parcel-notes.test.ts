import * as Y from "yjs";
import {
  createParcelDoc,
  getParcelNoteData,
  updateParcelNoteData,
  encodeDocUpdate,
  applyEncodedUpdate,
  mergeUpdates,
  ParcelNote,
} from "../index";

describe("Parcel Note CRDT functionality", () => {
  test("createParcelDoc initializes with empty notes", () => {
    const doc = createParcelDoc("PARCEL123");
    const noteData = getParcelNoteData(doc);

    expect(noteData.parcelId).toBe("PARCEL123");
    expect(noteData.text).toBe("");
    expect(noteData.version).toBe(1);
    expect(new Date(noteData.lastUpdated)).toBeInstanceOf(Date);
  });

  test("updateParcelNoteData updates the note", () => {
    const doc = createParcelDoc("PARCEL123");

    updateParcelNoteData(doc, { text: "New note text" });

    const noteData = getParcelNoteData(doc);
    expect(noteData.text).toBe("New note text");
    expect(noteData.version).toBe(2);
  });

  test("consistent merge with concurrent note edits", () => {
    // Create two independent docs for the same parcel
    const doc1 = createParcelDoc("PARCEL123");
    const doc2 = createParcelDoc("PARCEL123");

    // Make different edits in each doc
    updateParcelNoteData(doc1, { text: "Update from device 1" });
    updateParcelNoteData(doc2, { text: "Update from device 2" });

    // Capture updates from both devices
    const update1 = encodeDocUpdate(doc1);
    const update2 = encodeDocUpdate(doc2);

    // Create a third doc to test both merges in different orders
    const docA = createParcelDoc("PARCEL123");
    const docB = createParcelDoc("PARCEL123");

    // Apply updates in different orders
    applyEncodedUpdate(docA, update1);
    applyEncodedUpdate(docA, update2);

    applyEncodedUpdate(docB, update2);
    applyEncodedUpdate(docB, update1);

    // Both docs should converge to the same state
    const dataA = getParcelNoteData(docA);
    const dataB = getParcelNoteData(docB);

    expect(dataA.text).toBe(dataB.text);

    // Final result should be one of the updates (typically the last one applied wins)
    // The actual merge strategy is determined by Yjs's algorithm
    const finalText = dataA.text;
    expect(
      finalText === "Update from device 1" || finalText === "Update from device 2"
    ).toBeTruthy();
  });

  test("mergeUpdates returns the correct encoded state", () => {
    const doc1 = createParcelDoc("PARCEL123");
    updateParcelNoteData(doc1, { text: "Initial text" });

    const doc2 = createParcelDoc("PARCEL123");

    // Encode the update from doc1
    const update = encodeDocUpdate(doc1);

    // Merge the update into doc2
    const mergedState = mergeUpdates(doc2, update);

    // Verify mergedState is a base64 string
    expect(typeof mergedState).toBe("string");

    // Create a new doc and apply the merged state
    const doc3 = createParcelDoc("PARCEL123");
    applyEncodedUpdate(doc3, mergedState);

    // Verify doc3 has the correct state
    const data3 = getParcelNoteData(doc3);
    expect(data3.text).toBe("Initial text");
  });
});
