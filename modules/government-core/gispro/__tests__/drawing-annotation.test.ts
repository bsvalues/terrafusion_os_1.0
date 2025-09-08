import { describe, expect, test } from '@jest/globals';

// Import the utilities being tested
import { addAnnotation, getAnnotations, clearAnnotations } from '../client/src/lib/drawing-annotation';

// Define an Attribution interface to represent annotation data
interface Attribution {
  position: {
    lat: number;
    lng: number;
  };
  text: string;
  type: string;
  createdAt: Date;
  id: string;
}

describe('Drawing Annotation Tool', () => {
  
  // Reset annotations before each test
  beforeEach(() => {
    clearAnnotations();
  });
  
  test('addAnnotation should create a new annotation with proper structure', () => {
    const position = { lat: 45.123, lng: -122.456 };
    const text = 'Test annotation';
    const type = 'note';
    
    const annotation = addAnnotation(position, text, type);
    
    // Check that the annotation has the expected properties
    expect(annotation).toHaveProperty('position');
    expect(annotation).toHaveProperty('text');
    expect(annotation).toHaveProperty('type');
    expect(annotation).toHaveProperty('createdAt');
    expect(annotation).toHaveProperty('id');
    
    // Check that the values are correct
    expect(annotation.position).toEqual(position);
    expect(annotation.text).toBe(text);
    expect(annotation.type).toBe(type);
    expect(annotation.createdAt instanceof Date).toBe(true);
    expect(typeof annotation.id).toBe('string');
    expect(annotation.id.length).toBeGreaterThan(0);
  });
  
  test('getAnnotations should return all added annotations', () => {
    // Add multiple annotations
    const annotation1 = addAnnotation(
      { lat: 45.123, lng: -122.456 },
      'First annotation',
      'note'
    );
    
    const annotation2 = addAnnotation(
      { lat: 45.789, lng: -122.987 },
      'Second annotation',
      'measurement'
    );
    
    const annotation3 = addAnnotation(
      { lat: 46.123, lng: -123.456 },
      'Third annotation',
      'warning'
    );
    
    // Get all annotations
    const annotations = getAnnotations();
    
    // Check that all annotations were returned
    expect(annotations.length).toBe(3);
    
    // Check that the annotations match what was added
    expect(annotations).toContainEqual(annotation1);
    expect(annotations).toContainEqual(annotation2);
    expect(annotations).toContainEqual(annotation3);
  });
  
  test('clearAnnotations should remove all annotations', () => {
    // Add some annotations
    addAnnotation(
      { lat: 45.123, lng: -122.456 },
      'Test annotation',
      'note'
    );
    
    addAnnotation(
      { lat: 45.789, lng: -122.987 },
      'Another test',
      'measurement'
    );
    
    // Verify annotations were added
    expect(getAnnotations().length).toBe(2);
    
    // Clear all annotations
    clearAnnotations();
    
    // Verify annotations were cleared
    expect(getAnnotations().length).toBe(0);
  });
  
  test('annotations should maintain order of addition', () => {
    // Add annotations in a specific order
    const annotation1 = addAnnotation(
      { lat: 45.123, lng: -122.456 },
      'First',
      'note'
    );
    
    const annotation2 = addAnnotation(
      { lat: 45.789, lng: -122.987 },
      'Second',
      'measurement'
    );
    
    const annotation3 = addAnnotation(
      { lat: 46.123, lng: -123.456 },
      'Third',
      'warning'
    );
    
    // Get all annotations
    const annotations = getAnnotations();
    
    // Check that annotations are in the order they were added
    expect(annotations[0]).toEqual(annotation1);
    expect(annotations[1]).toEqual(annotation2);
    expect(annotations[2]).toEqual(annotation3);
  });
  
  test('annotations with the same position but different text should be treated as separate', () => {
    const position = { lat: 45.123, lng: -122.456 };
    
    // Add two annotations at the same position
    const annotation1 = addAnnotation(
      position,
      'First at this position',
      'note'
    );
    
    const annotation2 = addAnnotation(
      position,
      'Second at this position',
      'note'
    );
    
    // Get all annotations
    const annotations = getAnnotations();
    
    // Check that both annotations were added
    expect(annotations.length).toBe(2);
    expect(annotations).toContainEqual(annotation1);
    expect(annotations).toContainEqual(annotation2);
    
    // Ensure they have different IDs despite same position
    expect(annotation1.id).not.toBe(annotation2.id);
  });
});