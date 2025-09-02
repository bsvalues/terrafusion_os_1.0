import { 
  getSnappedPoint, 
  SnapMode,
  SnapOptions,
  createSnapManager
} from '@/lib/snap-to-feature';
import { Feature, Polygon, Point, GeoJsonProperties } from 'geojson';

describe('Snap-to-Feature Drawing', () => {
  // Create a simple test feature for snapping
  const createTestFeature = (): Feature<Polygon, GeoJsonProperties> => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0, 0],       // Vertex 1
        [10, 0],      // Vertex 2
        [10, 10],     // Vertex 3
        [0, 10],      // Vertex 4
        [0, 0]        // Closing vertex (same as first)
      ]]
    }
  });

  test('should snap to nearest vertex when within threshold', () => {
    const existingFeature = createTestFeature();
    const drawPoint: [number, number] = [9.9, 10.1]; // Close to vertex [10, 10]
    
    const snappedPoint = getSnappedPoint(drawPoint, existingFeature, {
      mode: SnapMode.VERTEX,
      threshold: 0.5
    });
    
    expect(snappedPoint).toEqual([10, 10]);
  });
  
  test('should not snap when distance exceeds threshold', () => {
    const existingFeature = createTestFeature();
    const drawPoint: [number, number] = [8.5, 10.1]; // Too far from any vertex
    
    const snappedPoint = getSnappedPoint(drawPoint, existingFeature, {
      mode: SnapMode.VERTEX,
      threshold: 0.5 
    });
    
    expect(snappedPoint).toEqual(drawPoint);
  });
  
  test('should snap to line when closer to edge than vertex', () => {
    const existingFeature = createTestFeature();
    const drawPoint: [number, number] = [10, 5.1]; // Close to edge [10,0]-[10,10]
    
    const snappedPoint = getSnappedPoint(drawPoint, existingFeature, {
      mode: SnapMode.EDGE,
      threshold: 0.5
    });
    
    expect(snappedPoint).toEqual([10, 5.1]);
  });
  
  test('should respect mode setting when snapping', () => {
    const existingFeature = createTestFeature();
    const drawPoint: [number, number] = [10, 5.1]; // Close to edge [10,0]-[10,10]
    
    // With vertex-only mode, should not snap to edge
    const snappedPoint1 = getSnappedPoint(drawPoint, existingFeature, {
      mode: SnapMode.VERTEX,
      threshold: 0.5
    });
    expect(snappedPoint1).toEqual(drawPoint);
    
    // With edge-only mode, should snap to edge
    const snappedPoint2 = getSnappedPoint(drawPoint, existingFeature, {
      mode: SnapMode.EDGE,
      threshold: 0.5
    });
    expect(snappedPoint2).toEqual([10, 5.1]);
    
    // With both modes, should snap to edge
    const snappedPoint3 = getSnappedPoint(drawPoint, existingFeature, {
      mode: SnapMode.BOTH,
      threshold: 0.5
    });
    expect(snappedPoint3).toEqual([10, 5.1]);
  });
  
  test('SnapManager should find nearest feature point', () => {
    const manager = createSnapManager();
    const feature1 = createTestFeature();
    const feature2 = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20, 20],
          [30, 20],
          [30, 30],
          [20, 30],
          [20, 20]
        ]]
      }
    } as Feature<Polygon, GeoJsonProperties>;
    
    manager.addFeature(feature1);
    manager.addFeature(feature2);
    
    // Point closer to feature1
    const snappedPoint1 = manager.snapPoint([9.8, 10.2], {
      mode: SnapMode.VERTEX,
      threshold: 0.5
    });
    expect(snappedPoint1).toEqual([10, 10]);
    
    // Point closer to feature2
    const snappedPoint2 = manager.snapPoint([20.2, 20.2], {
      mode: SnapMode.VERTEX,
      threshold: 0.5
    });
    expect(snappedPoint2).toEqual([20, 20]);
    
    // Point not close to any feature
    const farPoint: [number, number] = [15, 15];
    const snappedPoint3 = manager.snapPoint(farPoint, {
      mode: SnapMode.BOTH,
      threshold: 0.5
    });
    expect(snappedPoint3).toEqual(farPoint);
  });
});