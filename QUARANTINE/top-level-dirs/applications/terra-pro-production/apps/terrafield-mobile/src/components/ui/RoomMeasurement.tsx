import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  PanResponder,
  ViewStyle,
  TextStyle,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Units of measurement
 */
export enum MeasurementUnit {
  FEET = "ft",
  METERS = "m",
  INCHES = "in",
  CENTIMETERS = "cm",
}

/**
 * Room dimension data
 */
export interface RoomDimension {
  id: string;
  name: string;
  length: number;
  width: number;
  unit: MeasurementUnit;
}

/**
 * Room shape options
 */
export enum RoomShape {
  RECTANGLE = "rectangle",
  SQUARE = "square",
  L_SHAPED = "l-shaped",
  IRREGULAR = "irregular",
  CIRCULAR = "circular",
}

/**
 * Props for the room measurement component
 */
interface RoomMeasurementProps {
  label: string;
  dimensions: RoomDimension[];
  onDimensionsChange: (dimensions: RoomDimension[]) => void;
  defaultUnit?: MeasurementUnit;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  showVisualEditor?: boolean;
}

/**
 * Generate a unique ID
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Convert between units
 */
const convertUnit = (value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number => {
  // Convert to meters first (as base unit)
  let meters = 0;

  switch (fromUnit) {
    case MeasurementUnit.FEET:
      meters = value * 0.3048;
      break;
    case MeasurementUnit.INCHES:
      meters = value * 0.0254;
      break;
    case MeasurementUnit.CENTIMETERS:
      meters = value * 0.01;
      break;
    case MeasurementUnit.METERS:
      meters = value;
      break;
  }

  // Then convert from meters to target unit
  switch (toUnit) {
    case MeasurementUnit.FEET:
      return meters / 0.3048;
    case MeasurementUnit.INCHES:
      return meters / 0.0254;
    case MeasurementUnit.CENTIMETERS:
      return meters / 0.01;
    case MeasurementUnit.METERS:
      return meters;
  }
};

/**
 * Calculate room area
 */
const calculateArea = (dimension: RoomDimension): number => {
  return dimension.length * dimension.width;
};

/**
 * Format area with appropriate units
 */
const formatArea = (dimension: RoomDimension): string => {
  const area = calculateArea(dimension);

  switch (dimension.unit) {
    case MeasurementUnit.FEET:
      return `${area.toFixed(2)} sq. ft`;
    case MeasurementUnit.METERS:
      return `${area.toFixed(2)} sq. m`;
    case MeasurementUnit.INCHES:
      return `${area.toFixed(2)} sq. in`;
    case MeasurementUnit.CENTIMETERS:
      return `${area.toFixed(2)} sq. cm`;
  }
};

/**
 * RoomMeasurement component
 * A specialized tool for capturing room dimensions
 */
export const RoomMeasurement: React.FC<RoomMeasurementProps> = ({
  label,
  dimensions,
  onDimensionsChange,
  defaultUnit = MeasurementUnit.FEET,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
  showVisualEditor = true,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(
    dimensions.length > 0 ? dimensions[0].id : null
  );
  const [unit, setUnit] = useState<MeasurementUnit>(defaultUnit);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  // Add a new room dimension
  const addDimension = () => {
    if (disabled) return;

    const newDimension: RoomDimension = {
      id: generateId(),
      name: `Room ${dimensions.length + 1}`,
      length: 0,
      width: 0,
      unit,
    };

    const newDimensions = [...dimensions, newDimension];
    onDimensionsChange(newDimensions);
    setSelectedDimension(newDimension.id);
    setExpandedDimension(newDimension.id);
  };

  // Remove a room dimension
  const removeDimension = (id: string) => {
    if (disabled) return;

    Alert.alert("Remove Room", "Are you sure you want to remove this room?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const newDimensions = dimensions.filter((d) => d.id !== id);
          onDimensionsChange(newDimensions);

          if (selectedDimension === id) {
            setSelectedDimension(newDimensions.length > 0 ? newDimensions[0].id : null);
          }

          if (expandedDimension === id) {
            setExpandedDimension(null);
          }
        },
      },
    ]);
  };

  // Update a room dimension
  const updateDimension = (id: string, updates: Partial<RoomDimension>) => {
    if (disabled) return;

    const newDimensions = dimensions.map((dimension) => {
      if (dimension.id === id) {
        return { ...dimension, ...updates };
      }
      return dimension;
    });

    onDimensionsChange(newDimensions);
  };

  // Change the unit for all dimensions
  const changeUnitForAll = (newUnit: MeasurementUnit) => {
    if (disabled) return;

    const newDimensions = dimensions.map((dimension) => {
      if (dimension.unit === newUnit) {
        return dimension;
      }

      return {
        ...dimension,
        length: convertUnit(dimension.length, dimension.unit, newUnit),
        width: convertUnit(dimension.width, dimension.unit, newUnit),
        unit: newUnit,
      };
    });

    setUnit(newUnit);
    onDimensionsChange(newDimensions);
  };

  // Get the selected dimension
  const getSelectedDimension = (): RoomDimension | null => {
    if (!selectedDimension) return null;
    return dimensions.find((d) => d.id === selectedDimension) || null;
  };

  // Calculate total area
  const getTotalArea = (): string => {
    if (dimensions.length === 0) return "0";

    // Convert all to the same unit (current selected unit)
    const totalArea = dimensions.reduce((sum, dimension) => {
      const area = calculateArea(dimension);

      if (dimension.unit === unit) {
        return sum + area;
      }

      // Convert to the selected unit
      const lengthConverted = convertUnit(dimension.length, dimension.unit, unit);
      const widthConverted = convertUnit(dimension.width, dimension.unit, unit);

      return sum + lengthConverted * widthConverted;
    }, 0);

    // Format based on the unit
    switch (unit) {
      case MeasurementUnit.FEET:
        return `${totalArea.toFixed(2)} sq. ft`;
      case MeasurementUnit.METERS:
        return `${totalArea.toFixed(2)} sq. m`;
      case MeasurementUnit.INCHES:
        return `${totalArea.toFixed(2)} sq. in`;
      case MeasurementUnit.CENTIMETERS:
        return `${totalArea.toFixed(2)} sq. cm`;
    }
  };

  // Toggle dimension expansion
  const toggleExpand = (id: string) => {
    if (expandedDimension === id) {
      setExpandedDimension(null);
    } else {
      setExpandedDimension(id);
      setSelectedDimension(id);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {/* Unit Selector */}
      <View style={styles.unitSelectorContainer}><>

        <Text style={styles.unitSelectorLabel}>Measurement Units:</Text>
        <View
</> style={styles.unitOptions}>
          <TouchableOpacity
            style={[
              styles.unitOption,
              unit === MeasurementUnit.FEET && styles.activeUnitOption,
              disabled && styles.disabledUnitOption,
            ]}
            onPress={() => !disabled && changeUnitForAll(MeasurementUnit.FEET)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.unitOptionText,
                unit === MeasurementUnit.FEET && styles.activeUnitOptionText,
                disabled && styles.disabledText,
              ]}
            >
              {MeasurementUnit.FEET}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.unitOption,
              unit === MeasurementUnit.METERS && styles.activeUnitOption,
              disabled && styles.disabledUnitOption,
            ]}
            onPress={() => !disabled && changeUnitForAll(MeasurementUnit.METERS)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.unitOptionText,
                unit === MeasurementUnit.METERS && styles.activeUnitOptionText,
                disabled && styles.disabledText,
              ]}
            >
              {MeasurementUnit.METERS}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.unitOption,
              unit === MeasurementUnit.INCHES && styles.activeUnitOption,
              disabled && styles.disabledUnitOption,
            ]}
            onPress={() => !disabled && changeUnitForAll(MeasurementUnit.INCHES)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.unitOptionText,
                unit === MeasurementUnit.INCHES && styles.activeUnitOptionText,
                disabled && styles.disabledText,
              ]}
            >
              {MeasurementUnit.INCHES}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.unitOption,
              unit === MeasurementUnit.CENTIMETERS && styles.activeUnitOption,
              disabled && styles.disabledUnitOption,
            ]}
            onPress={() => !disabled && changeUnitForAll(MeasurementUnit.CENTIMETERS)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.unitOptionText,
                unit === MeasurementUnit.CENTIMETERS && styles.activeUnitOptionText,
                disabled && styles.disabledText,
              ]}
            >
              {MeasurementUnit.CENTIMETERS}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Room List */}
      <ScrollView style={styles.roomListContainer}>
        {dimensions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="ruler-square" size={32} color="#bdc3c7" /><>

            <Text style={styles.emptyStateText}>No rooms added yet</Text>
            <Text
</> style={styles.emptyStateSubtext}>
              Tap the "Add Room" button to start measuring
            </Text>
          </View>
        ) : (
          dimensions.map((dimension) => (
            <View key={dimension.id} style={styles.roomItemContainer}>
              <TouchableOpacity
                style={[
                  styles.roomItem,
                  selectedDimension === dimension.id && styles.selectedRoomItem,
                ]}
                onPress={() => setSelectedDimension(dimension.id)}
                disabled={disabled}
              >
                <View style={styles.roomItemContent}><>

                  <Text style={styles.roomName}>{dimension.name}</Text>
                  <Text
</> style={styles.roomDimensions}>
                    {dimension.length.toFixed(2)} × {dimension.width.toFixed(2)} {dimension.unit}
                  </Text>
                  <Text style={styles.roomArea}>Area: {formatArea(dimension)}</Text>
                </View>

                <View style={styles.roomItemActions}>
                  <TouchableOpacity
                    style={[styles.roomAction, disabled && styles.disabledRoomAction]}
                    onPress={() => toggleExpand(dimension.id)}
                    disabled={disabled}
                  ><>

                    <MaterialCommunityIcons
                      name={expandedDimension === dimension.id ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={disabled ? "#bdc3c7" : "#7f8c8d"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
</>
                    style={[
                      styles.roomAction,
                      styles.deleteAction,
                      disabled && styles.disabledRoomAction,
                    ]}
                    onPress={() => removeDimension(dimension.id)}
                    disabled={disabled}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={20}
                      color={disabled ? "#bdc3c7" : "#e74c3c"}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {expandedDimension === dimension.id && (
                <View style={styles.expandedSection}>
                  <View style={styles.inputGroup}><>

                    <Text style={styles.inputLabel}>Name:</Text>
                    <TextInput
</>
                      style={[styles.input, disabled && styles.disabledInput]}
                      value={dimension.name}
                      onChangeText={(text) => updateDimension(dimension.id, { name: text })}
                      placeholder="Room name"
                      editable={!disabled}
                    />
                  </View>

                  <View style={styles.dimensionInputs}>
                    <View style={styles.inputGroup}><>

                      <Text style={styles.inputLabel}>Length:</Text>
                      <View
</> style={styles.measurementInput}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.numberInput,
                            disabled && styles.disabledInput,
                          ]}
                          value={dimension.length.toString()}
                          onChangeText={(text) => {
                            const value = parseFloat(text) || 0;
                            updateDimension(dimension.id, { length: value });
                          }}
                          keyboardType="numeric"
                          placeholder="0.00"
                          editable={!disabled}
                        />
                        <Text style={styles.unitText}>{dimension.unit}</Text>
                      </View>
                    </View>

                    <View style={styles.inputGroup}><>

                      <Text style={styles.inputLabel}>Width:</Text>
                      <View
</> style={styles.measurementInput}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.numberInput,
                            disabled && styles.disabledInput,
                          ]}
                          value={dimension.width.toString()}
                          onChangeText={(text) => {
                            const value = parseFloat(text) || 0;
                            updateDimension(dimension.id, { width: value });
                          }}
                          keyboardType="numeric"
                          placeholder="0.00"
                          editable={!disabled}
                        />
                        <Text style={styles.unitText}>{dimension.unit}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Visual Room Editor */}
                  {showVisualEditor && (
                    <View style={styles.visualEditor}><>

                      <Text style={styles.visualEditorTitle}>Visual Editor</Text>
                      <RoomVisualEditor
</>
                        dimension={dimension}
                        onChange={(updates) => updateDimension(dimension.id, updates)}
                        disabled={disabled}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Room Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.addButton, disabled && styles.disabledButton]}
          onPress={addDimension}
          disabled={disabled}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Room</Text>
        </TouchableOpacity>

        {dimensions.length > 0 && (
          <View style={styles.totalAreaContainer}><>

            <Text style={styles.totalAreaLabel}>Total Area:</Text>
            <Text
</> style={styles.totalAreaValue}>{getTotalArea()}</Text>
          </View>
        )}
      </View>

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Visual Room Editor Component
interface RoomVisualEditorProps {
  dimension: RoomDimension;
  onChange: (updates: Partial<RoomDimension>) => void;
  disabled?: boolean;
}

const RoomVisualEditor: React.FC<RoomVisualEditorProps> = ({
  dimension,
  onChange,
  disabled = false,
}) => {
  // Calculate appropriate scaling based on the current dimensions
  const maxDimension = Math.max(dimension.length, dimension.width);
  const screenWidth = Dimensions.get("window").width - 80; // Account for padding

  // Define minimum size to prevent tiny rooms
  const minVisualSize = 100;

  // Scale to fit in the view, but maintain minimum size
  const scale =
    maxDimension > 0 ? Math.max(minVisualSize / maxDimension, screenWidth / (maxDimension * 2)) : 1;

  // Calculate visual dimensions
  const visualLength = Math.max(dimension.length * scale, 20);
  const visualWidth = Math.max(dimension.width * scale, 20);

  // Setup drag handlers for corners
  const cornerPositions = {
    topLeft: new Animated.ValueXY({ x: 0, y: 0 }),
    topRight: new Animated.ValueXY({ x: visualLength, y: 0 }),
    bottomLeft: new Animated.ValueXY({ x: 0, y: visualWidth }),
    bottomRight: new Animated.ValueXY({ x: visualLength, y: visualWidth }),
  };

  // Create pan responders for each corner
  const createPanResponder = (corner: keyof typeof cornerPositions) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        // Store initial position
        cornerPositions[corner].setOffset({
          x: cornerPositions[corner].x._value,
          y: cornerPositions[corner].y._value,
        });
      },
      onPanResponderMove: (_, gesture) => {
        // Update position based on gesture
        cornerPositions[corner].setValue({ x: gesture.dx, y: gesture.dy });

        // Calculate new dimensions
        let newLength = dimension.length;
        let newWidth = dimension.width;

        if (corner === "topRight" || corner === "bottomRight") {
          // Dragging right side affects length
          newLength = Math.max(0.1, dimension.length + gesture.dx / scale);
        }

        if (corner === "bottomLeft" || corner === "bottomRight") {
          // Dragging bottom side affects width
          newWidth = Math.max(0.1, dimension.width + gesture.dy / scale);
        }

        // Update dimensions
        onChange({
          length: newLength,
          width: newWidth,
        });
      },
      onPanResponderRelease: () => {
        // Reset offset
        cornerPositions[corner].flattenOffset();
      },
    });
  };

  // Create pan responders
  const bottomRightPanResponder = createPanResponder("bottomRight");

  return (
    <View style={[styles.visualEditorContainer, disabled && styles.disabledVisualEditor]}>
      {/* Room Rectangle */}
      <View
        style={[
          styles.roomRectangle,
          {
            width: visualLength,
            height: visualWidth,
          },
        ]}
      >
        {/* Dimension Labels */}
        <View style={[styles.dimensionLabel, styles.lengthLabel]}>
          <Text style={styles.dimensionLabelText}>
            {dimension.length.toFixed(2)} {dimension.unit}
          </Text>
        </View>

        <View style={[styles.dimensionLabel, styles.widthLabel]}>
          <Text style={styles.dimensionLabelText}>
            {dimension.width.toFixed(2)} {dimension.unit}
          </Text>
        </View>

        {/* Draggable Handle */}
        {!disabled && (
          <Animated.View
            style={[
              styles.cornerHandle,
              {
                bottom: -10,
                right: -10,
              },
            ]}
            {...bottomRightPanResponder.panHandlers}
          >
            <MaterialCommunityIcons name="resize-bottom-right" size={20} color="#3498db" />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  required: {
    color: "#e74c3c",
  },
  unitSelectorContainer: {
    marginBottom: 16,
  },
  unitSelectorLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  unitOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  unitOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 2,
    borderRadius: 4,
  },
  activeUnitOption: {
    backgroundColor: "#3498db",
  },
  disabledUnitOption: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  unitOptionText: {
    color: "#7f8c8d",
    fontWeight: "500",
  },
  activeUnitOptionText: {
    color: "white",
  },
  disabledText: {
    color: "#bdc3c7",
  },
  roomListContainer: {
    maxHeight: 400,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7f8c8d",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 4,
    textAlign: "center",
  },
  roomItemContainer: {
    marginBottom: 8,
  },
  roomItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedRoomItem: {
    borderColor: "#3498db",
  },
  roomItemContent: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  roomDimensions: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  roomArea: {
    fontSize: 14,
    fontWeight: "500",
    color: "#27ae60",
    marginTop: 4,
  },
  roomItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  roomAction: {
    padding: 8,
    marginLeft: 4,
  },
  deleteAction: {
    backgroundColor: "#f9ebea",
    borderRadius: 4,
  },
  disabledRoomAction: {
    opacity: 0.5,
  },
  expandedSection: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#eee",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  dimensionInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  measurementInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberInput: {
    flex: 1,
    textAlign: "right",
  },
  unitText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#7f8c8d",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#bdc3c7",
  },
  visualEditor: {
    marginTop: 16,
  },
  visualEditorTitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  visualEditorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    minHeight: 200,
  },
  disabledVisualEditor: {
    opacity: 0.7,
  },
  roomRectangle: {
    backgroundColor: "#e1f5fe",
    borderWidth: 2,
    borderColor: "#3498db",
    position: "relative",
  },
  dimensionLabel: {
    position: "absolute",
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lengthLabel: {
    top: -16,
    left: "50%",
    transform: [{ translateX: -30 }],
  },
  widthLabel: {
    left: -30,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  dimensionLabelText: {
    color: "white",
    fontSize: 12,
  },
  cornerHandle: {
    position: "absolute",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 12,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  totalAreaContainer: {
    alignItems: "flex-end",
  },
  totalAreaLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  totalAreaValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  helperText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 8,
  },
});
