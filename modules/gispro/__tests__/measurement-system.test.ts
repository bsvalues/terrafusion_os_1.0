import { describe, expect, test } from '@jest/globals';
import {
  calculateDistance,
  calculateArea,
  convertUnits,
  formatMeasurement,
  UnitSystem,
  MeasurementType,
  createMeasurement
} from '../client/src/lib/measurement-system';

describe('Measurement System', () => {
  test('calculateDistance should correctly compute distance between two points', () => {
    const point1 = { lat: 47.123, lng: -122.456 };
    const point2 = { lat: 47.125, lng: -122.458 };
    
    const distanceMeters = calculateDistance(point1, point2);
    
    // Expected distance using Haversine formula
    expect(distanceMeters).toBeGreaterThan(0);
    expect(typeof distanceMeters).toBe('number');
  });
  
  test('calculateArea should compute area of a polygon', () => {
    const polygon = [
      { lat: 47.123, lng: -122.456 },
      { lat: 47.123, lng: -122.458 },
      { lat: 47.125, lng: -122.458 },
      { lat: 47.125, lng: -122.456 },
      { lat: 47.123, lng: -122.456 } // Closing point
    ];
    
    const areaSquareMeters = calculateArea(polygon);
    
    expect(areaSquareMeters).toBeGreaterThan(0);
    expect(typeof areaSquareMeters).toBe('number');
  });
  
  test('convertUnits should correctly convert between metric and imperial', () => {
    // Test metric to imperial length conversion
    let result = convertUnits(1000, MeasurementType.LENGTH, UnitSystem.METRIC, UnitSystem.IMPERIAL);
    expect(result).toBeCloseTo(3280.84, 1); // 1000 meters ≈ 3280.84 feet
    
    // Test imperial to metric length conversion
    result = convertUnits(5280, MeasurementType.LENGTH, UnitSystem.IMPERIAL, UnitSystem.METRIC);
    expect(result).toBeCloseTo(1609.34, 1); // 5280 feet (1 mile) ≈ 1609.34 meters
    
    // Test metric to imperial area conversion
    result = convertUnits(10000, MeasurementType.AREA, UnitSystem.METRIC, UnitSystem.IMPERIAL);
    expect(result).toBeCloseTo(107639.1, 0); // 10000 sq meters ≈ 107639.1 sq feet
    
    // Test imperial to metric area conversion
    result = convertUnits(43560, MeasurementType.AREA, UnitSystem.IMPERIAL, UnitSystem.METRIC);
    expect(result).toBeCloseTo(4046.86, 0); // 43560 sq feet (1 acre) ≈ 4046.86 sq meters
  });
  
  test('formatMeasurement should format measurements with proper units', () => {
    // Format a metric length
    let formatted = formatMeasurement(1500, MeasurementType.LENGTH, UnitSystem.METRIC);
    expect(formatted).toBe('1.50 km');
    
    // Format a small metric length
    formatted = formatMeasurement(45, MeasurementType.LENGTH, UnitSystem.METRIC);
    expect(formatted).toBe('45.00 m');
    
    // Format an imperial length
    formatted = formatMeasurement(5280, MeasurementType.LENGTH, UnitSystem.IMPERIAL);
    expect(formatted).toBe('1.00 mi');
    
    // Format a small imperial length
    formatted = formatMeasurement(500, MeasurementType.LENGTH, UnitSystem.IMPERIAL);
    expect(formatted).toBe('500.00 ft');
    
    // Format a metric area
    formatted = formatMeasurement(5000, MeasurementType.AREA, UnitSystem.METRIC);
    expect(formatted).toBe('0.50 ha'); // 5000 sq meters = 0.5 hectares
    
    // Format a small metric area
    formatted = formatMeasurement(45, MeasurementType.AREA, UnitSystem.METRIC);
    expect(formatted).toBe('45.00 m²');
    
    // Format an imperial area
    formatted = formatMeasurement(43560, MeasurementType.AREA, UnitSystem.IMPERIAL);
    expect(formatted).toBe('1.00 ac'); // 43560 sq feet = 1 acre
    
    // Format a small imperial area
    formatted = formatMeasurement(500, MeasurementType.AREA, UnitSystem.IMPERIAL);
    expect(formatted).toBe('500.00 ft²');
  });
  
  test('createMeasurement should create a proper measurement object', () => {
    // Create a distance measurement
    const distanceMeasurement = createMeasurement(
      MeasurementType.LENGTH,
      [
        { lat: 47.123, lng: -122.456 },
        { lat: 47.125, lng: -122.458 }
      ],
      UnitSystem.METRIC
    );
    
    expect(distanceMeasurement).toHaveProperty('type', MeasurementType.LENGTH);
    expect(distanceMeasurement).toHaveProperty('points');
    expect(distanceMeasurement).toHaveProperty('value');
    expect(distanceMeasurement).toHaveProperty('unitSystem', UnitSystem.METRIC);
    expect(distanceMeasurement).toHaveProperty('formatted');
    expect(distanceMeasurement.points.length).toBe(2);
    expect(distanceMeasurement.value).toBeGreaterThan(0);
    
    // Create an area measurement
    const areaMeasurement = createMeasurement(
      MeasurementType.AREA,
      [
        { lat: 47.123, lng: -122.456 },
        { lat: 47.123, lng: -122.458 },
        { lat: 47.125, lng: -122.458 },
        { lat: 47.125, lng: -122.456 }
      ],
      UnitSystem.IMPERIAL
    );
    
    expect(areaMeasurement).toHaveProperty('type', MeasurementType.AREA);
    expect(areaMeasurement).toHaveProperty('points');
    expect(areaMeasurement).toHaveProperty('value');
    expect(areaMeasurement).toHaveProperty('unitSystem', UnitSystem.IMPERIAL);
    expect(areaMeasurement).toHaveProperty('formatted');
    expect(areaMeasurement.points.length).toBe(4);
    expect(areaMeasurement.value).toBeGreaterThan(0);
  });
  
  test('measurement system should handle single-point measurements', () => {
    // A single point should result in zero distance/area
    const singlePoint = createMeasurement(
      MeasurementType.LENGTH,
      [{ lat: 47.123, lng: -122.456 }],
      UnitSystem.METRIC
    );
    
    expect(singlePoint.value).toBe(0);
    expect(singlePoint.formatted).toBe('0.00 m');
  });
  
  test('measurement system should handle invalid polygon for area', () => {
    // Less than 3 points should result in zero area
    const invalidPolygon = createMeasurement(
      MeasurementType.AREA,
      [
        { lat: 47.123, lng: -122.456 },
        { lat: 47.125, lng: -122.458 }
      ],
      UnitSystem.METRIC
    );
    
    expect(invalidPolygon.value).toBe(0);
    expect(invalidPolygon.formatted).toBe('0.00 m²');
  });
});