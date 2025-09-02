import { 
  DrawingHistoryManager,
  DrawingOperation,
  OperationType,
  createDrawingHistoryManager
} from '@/lib/drawing-history';
import { Feature, Polygon, GeoJsonProperties } from 'geojson';

describe('Drawing History', () => {
  // Create a simple test feature
  const createTestFeature = (id: string = 'feature-1'): Feature<Polygon, GeoJsonProperties> => ({
    id,
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]
    }
  });

  // Create a modified version of a feature
  const modifyTestFeature = (feature: Feature<Polygon, GeoJsonProperties>): Feature<Polygon, GeoJsonProperties> => {
    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: [[
          [0, 0],
          [2, 0], // Changed from [1, 0]
          [2, 2], // Changed from [1, 1]
          [0, 2], // Changed from [0, 1]
          [0, 0]
        ]]
      }
    };
  };

  test('should track drawing operations in history stack', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature();
    
    historyManager.addOperation('create', feature1);
    expect(historyManager.getHistory().length).toBe(1);
  });
  
  test('should successfully undo last operation', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature();
    const feature2 = modifyTestFeature(feature1);
    
    historyManager.addOperation('create', feature1);
    historyManager.addOperation('modify', feature2);
    
    const undoResult = historyManager.undo();
    expect(undoResult).toBeTruthy();
    expect(historyManager.getCurrentState()[0]).toEqual(feature1);
  });
  
  test('should successfully redo undone operation', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature();
    const feature2 = modifyTestFeature(feature1);
    
    historyManager.addOperation('create', feature1);
    historyManager.addOperation('modify', feature2);
    historyManager.undo();
    
    const redoResult = historyManager.redo();
    expect(redoResult).toBeTruthy();
    expect(historyManager.getCurrentState()[0]).toEqual(feature2);
  });

  test('should not allow redo when no operations have been undone', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature();
    
    historyManager.addOperation('create', feature1);
    
    const redoResult = historyManager.redo();
    expect(redoResult).toBeFalsy();
  });

  test('should not allow undo when no operations exist', () => {
    const historyManager = createDrawingHistoryManager();
    
    const undoResult = historyManager.undo();
    expect(undoResult).toBeFalsy();
  });

  test('should handle multiple create operations properly', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature('feature-1');
    const feature2 = createTestFeature('feature-2');
    
    historyManager.addOperation('create', feature1);
    historyManager.addOperation('create', feature2);
    
    expect(historyManager.getCurrentState().length).toBe(2);
    
    const undoResult = historyManager.undo();
    expect(undoResult).toBeTruthy();
    expect(historyManager.getCurrentState().length).toBe(1);
    expect(historyManager.getCurrentState()[0].id).toBe('feature-1');
  });

  test('should handle delete operations properly', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature('feature-1');
    const feature2 = createTestFeature('feature-2');
    
    historyManager.addOperation('create', feature1);
    historyManager.addOperation('create', feature2);
    historyManager.addOperation('delete', feature1);
    
    expect(historyManager.getCurrentState().length).toBe(1);
    expect(historyManager.getCurrentState()[0].id).toBe('feature-2');
    
    const undoResult = historyManager.undo();
    expect(undoResult).toBeTruthy();
    expect(historyManager.getCurrentState().length).toBe(2);
  });

  test('should clear history properly', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature();
    
    historyManager.addOperation('create', feature1);
    historyManager.clearHistory();
    
    expect(historyManager.getHistory().length).toBe(0);
    expect(historyManager.getCurrentState().length).toBe(0);
  });

  test('should save and restore versions properly', () => {
    const historyManager = createDrawingHistoryManager();
    const feature1 = createTestFeature('feature-1');
    const feature2 = createTestFeature('feature-2');
    
    historyManager.addOperation('create', feature1);
    historyManager.addOperation('create', feature2);
    
    const versionId = historyManager.saveVersion('Test Version');
    expect(versionId).toBeTruthy();
    
    historyManager.addOperation('delete', feature2);
    expect(historyManager.getCurrentState().length).toBe(1);
    
    const restored = historyManager.restoreVersion(versionId!);
    expect(restored).toBeTruthy();
    expect(historyManager.getCurrentState().length).toBe(2);
  });
});