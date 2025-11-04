import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  PanResponder,
  Animated,
  ViewStyle,
  TextStyle,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Rect, Line, Path, Text as SvgText } from "react-native-svg";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { v4 as uuidv4 } from "uuid";

/**
 * Drawing tool types
 */
export enum SketchToolType {
  PEN = "pen",
  LINE = "line",
  RECT = "rect",
  ERASER = "eraser",
  TEXT = "text",
}

/**
 * Drawing entities
 */
export type SketchPoint = { x: number; y: number };

export interface SketchLine {
  id: string;
  type: "line";
  points: SketchPoint[];
  color: string;
  width: number;
}

export interface SketchShape {
  id: string;
  type: "rect";
  start: SketchPoint;
  end: SketchPoint;
  color: string;
  width: number;
}

export interface SketchTextElement {
  id: string;
  type: "text";
  position: SketchPoint;
  text: string;
  color: string;
  fontSize: number;
}

export type SketchElement = SketchLine | SketchShape | SketchTextElement;

/**
 * Sketch data structure
 */
export interface SketchData {
  id: string;
  title: string;
  elements: SketchElement[];
  dimensions: { width: number; height: number };
  backgroundImage?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

/**
 * Props for the sketch tool component
 */
interface SketchToolProps {
  label: string;
  sketch: SketchData | null;
  onSketchChange: (sketch: SketchData) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  height?: number;
  width?: number;
  showTools?: boolean;
  presetTemplates?: SketchTemplate[];
}

/**
 * Preset sketch template
 */
export interface SketchTemplate {
  id: string;
  name: string;
  thumbnail?: string;
  elements: SketchElement[];
}

// Default colors
const COLORS = ["#000000", "#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"];

// Line widths
const LINE_WIDTHS = [1, 2, 4, 6];

/**
 * Convert an SVG path from points
 */
const pointsToPath = (points: SketchPoint[]): string => {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return path;
};

/**
 * SketchTool component
 * A specialized input for creating floor plans and sketches
 */
export const SketchTool: React.FC<SketchToolProps> = ({
  label,
  sketch,
  onSketchChange,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
  height = 400,
  width = Dimensions.get("window").width - 32, // Default to screen width minus margin
  showTools = true,
  presetTemplates = [],
}) => {
  // Create a new sketch if none is provided
  useEffect(() => {
    if (!sketch) {
      const newSketch: SketchData = {
        id: uuidv4(),
        title: "New Sketch",
        elements: [],
        dimensions: { width, height },
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      onSketchChange(newSketch);
    }
  }, [sketch]);

  // No need to render if we don't have a sketch yet
  if (!sketch) {
    return (
      <View style={[styles.container, containerStyle]}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>

        <View style={[styles.loadingContainer, { height }]}>
          <MaterialCommunityIcons name="loading" size={32} color="#bdc3c7" />
          <Text style={styles.loadingText}>Initializing sketch...</Text>
        </View>
      </View>
    );
  }

  // State
  const [currentTool, setCurrentTool] = useState<SketchToolType>(SketchToolType.PEN);
  const [currentColor, setCurrentColor] = useState<string>(COLORS[0]);
  const [currentWidth, setCurrentWidth] = useState<number>(LINE_WIDTHS[1]);
  const [drawing, setDrawing] = useState<boolean>(false);
  const [currentElement, setCurrentElement] = useState<SketchElement | null>(null);
  const [tempPoints, setTempPoints] = useState<SketchPoint[]>([]);
  const [textInput, setTextInput] = useState<string>("");
  const [textInputVisible, setTextInputVisible] = useState<boolean>(false);
  const [textInputPosition, setTextInputPosition] = useState<SketchPoint>({ x: 0, y: 0 });
  const [showTemplates, setShowTemplates] = useState<boolean>(false);

  // Refs
  const sketchRef = useRef<View>(null);

  // Pan responder for drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (event, gestureState) => {
        if (disabled) return;

        const { locationX, locationY } = event.nativeEvent;

        setDrawing(true);

        // Handle different tools
        switch (currentTool) {
          case SketchToolType.PEN:
            // Start a new line
            const newLine: SketchLine = {
              id: uuidv4(),
              type: "line",
              points: [{ x: locationX, y: locationY }],
              color: currentColor,
              width: currentWidth,
            };

            setCurrentElement(newLine);
            setTempPoints([{ x: locationX, y: locationY }]);
            break;

          case SketchToolType.LINE:
          case SketchToolType.RECT:
            // Start a shape
            const newShape: SketchShape = {
              id: uuidv4(),
              type: "rect",
              start: { x: locationX, y: locationY },
              end: { x: locationX, y: locationY },
              color: currentColor,
              width: currentWidth,
            };

            setCurrentElement(newShape);
            break;

          case SketchToolType.TEXT:
            // Show text input at tap position
            setTextInputPosition({ x: locationX, y: locationY });
            setTextInputVisible(true);
            setDrawing(false);
            break;

          case SketchToolType.ERASER:
            // Handled in move and release
            break;
        }
      },
      onPanResponderMove: (event, gestureState) => {
        if (disabled || !drawing) return;

        const { locationX, locationY } = event.nativeEvent;

        // Handle different tools
        switch (currentTool) {
          case SketchToolType.PEN:
            // Add point to line
            if (currentElement && currentElement.type === "line") {
              const newPoints = [...tempPoints, { x: locationX, y: locationY }];
              setTempPoints(newPoints);
              setCurrentElement({
                ...currentElement,
                points: newPoints,
              });
            }
            break;

          case SketchToolType.LINE:
            // Update end point of line
            if (currentElement && currentElement.type === "rect") {
              setCurrentElement({
                ...currentElement,
                end: { x: locationX, y: locationY },
              });
            }
            break;

          case SketchToolType.RECT:
            // Update end point of rectangle
            if (currentElement && currentElement.type === "rect") {
              setCurrentElement({
                ...currentElement,
                end: { x: locationX, y: locationY },
              });
            }
            break;

          case SketchToolType.ERASER:
            // Find elements to erase (within range of tap)
            const eraseRadius = 20; // pixels

            const elementsToKeep = sketch.elements.filter((element) => {
              if (element.type === "line") {
                // Check if any point is within eraser radius
                return !element.points.some(
                  (point) =>
                    Math.sqrt(
                      Math.pow(point.x - locationX, 2) + Math.pow(point.y - locationY, 2)
                    ) <= eraseRadius
                );
              } else if (element.type === "rect") {
                // Check if any corner is within eraser radius
                const corners = [
                  element.start,
                  { x: element.end.x, y: element.start.y },
                  { x: element.start.x, y: element.end.y },
                  element.end,
                ];

                return !corners.some(
                  (point) =>
                    Math.sqrt(
                      Math.pow(point.x - locationX, 2) + Math.pow(point.y - locationY, 2)
                    ) <= eraseRadius
                );
              } else if (element.type === "text") {
                // Check if text position is within eraser radius
                return !(
                  Math.sqrt(
                    Math.pow(element.position.x - locationX, 2) +
                      Math.pow(element.position.y - locationY, 2)
                  ) <= eraseRadius
                );
              }

              return true;
            });

            if (elementsToKeep.length !== sketch.elements.length) {
              onSketchChange({
                ...sketch,
                elements: elementsToKeep,
                updatedAt: new Date(),
              });
            }
            break;
        }
      },
      onPanResponderRelease: () => {
        if (disabled || !drawing) return;

        // Finish drawing
        if (currentElement) {
          // Add element to sketch
          const updatedElements = [...sketch.elements, currentElement];

          onSketchChange({
            ...sketch,
            elements: updatedElements,
            updatedAt: new Date(),
          });
        }

        // Reset state
        setDrawing(false);
        setCurrentElement(null);
        setTempPoints([]);
      },
    })
  ).current;

  // Add text element to sketch
  const addTextElement = () => {
    if (!textInput.trim()) {
      setTextInputVisible(false);
      return;
    }

    const textElement: SketchTextElement = {
      id: uuidv4(),
      type: "text",
      position: textInputPosition,
      text: textInput,
      color: currentColor,
      fontSize: 14,
    };

    const updatedElements = [...sketch.elements, textElement];

    onSketchChange({
      ...sketch,
      elements: updatedElements,
      updatedAt: new Date(),
    });

    setTextInput("");
    setTextInputVisible(false);
  };

  // Clear the sketch
  const clearSketch = () => {
    if (disabled) return;

    Alert.alert("Clear Sketch", "Are you sure you want to clear the entire sketch?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          onSketchChange({
            ...sketch,
            elements: [],
            updatedAt: new Date(),
          });
        },
      },
    ]);
  };

  // Update sketch title
  const updateTitle = (title: string) => {
    if (disabled) return;

    onSketchChange({
      ...sketch,
      title,
      updatedAt: new Date(),
    });
  };

  // Export sketch as image
  const exportSketch = async () => {
    if (disabled || !sketchRef.current) return;

    try {
      // Capture the sketch as an image
      const uri = await captureRef(sketchRef, {
        format: "png",
        quality: 1,
      });

      // Show share dialog
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `${sketch.title} Sketch`,
        });
      } else {
        // Save locally if sharing is not available
        const filename = `${sketch.title.replace(/\s+/g, "_")}_${Date.now()}.png`;
        const destination = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.moveAsync({
          from: uri,
          to: destination,
        });

        Alert.alert("Sketch Saved", `Sketch has been saved to your device as ${filename}`, [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Error exporting sketch:", error);
      Alert.alert("Export Error", "Failed to export sketch. Please try again.");
    }
  };

  // Apply a template
  const applyTemplate = (template: SketchTemplate) => {
    if (disabled) return;

    // Confirm if sketch has elements
    if (sketch.elements.length > 0) {
      Alert.alert(
        "Apply Template",
        "Applying a template will replace your current sketch. Continue?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Continue",
            onPress: () => {
              onSketchChange({
                ...sketch,
                elements: [...template.elements],
                updatedAt: new Date(),
              });

              setShowTemplates(false);
            },
          },
        ]
      );
    } else {
      onSketchChange({
        ...sketch,
        elements: [...template.elements],
        updatedAt: new Date(),
      });

      setShowTemplates(false);
    }
  };

  // Render the sketch elements
  const renderElements = () => {
    return (
      <>
        {/* Existing elements */}
        {sketch.elements.map((element) => {
          if (element.type === "line") {
            return (
              <Path
                key={element.id}
                d={pointsToPath(element.points)}
                stroke={element.color}
                strokeWidth={element.width}
                fill="none"
              />
            );
          } else if (element.type === "rect") {
            const x = Math.min(element.start.x, element.end.x);
            const y = Math.min(element.start.y, element.end.y);
            const width = Math.abs(element.end.x - element.start.x);
            const height = Math.abs(element.end.y - element.start.y);

            return (
              <Rect
                key={element.id}
                x={x}
                y={y}
                width={width}
                height={height}
                stroke={element.color}
                strokeWidth={element.width}
                fill="none"
              />
            );
          } else if (element.type === "text") {
            return (
              <SvgText
                key={element.id}
                x={element.position.x}
                y={element.position.y}
                fill={element.color}
                fontSize={element.fontSize}
                fontFamily="Arial"
              >
                {element.text}
              </SvgText>
            );
          }

          return null;
        })}

        {/* Current drawing element */}
        {currentElement && (
          <>
            {currentElement.type === "line" && (
              <Path
                d={pointsToPath(tempPoints)}
                stroke={currentElement.color}
                strokeWidth={currentElement.width}
                fill="none"
              />
            )}

            {currentElement.type === "rect" && (
              <Rect
                x={Math.min(currentElement.start.x, currentElement.end.x)}
                y={Math.min(currentElement.start.y, currentElement.end.y)}
                width={Math.abs(currentElement.end.x - currentElement.start.x)}
                height={Math.abs(currentElement.end.y - currentElement.start.y)}
                stroke={currentElement.color}
                strokeWidth={currentElement.width}
                fill="none"
              />
            )}
          </>
        )}
      </>
    );
  };

  // Tool button component
  const ToolButton = ({ tool, icon }: { tool: SketchToolType; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.toolButton,
        currentTool === tool && styles.activeToolButton,
        disabled && styles.disabledButton,
      ]}
      onPress={() => !disabled && setCurrentTool(tool)}
      disabled={disabled}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={currentTool === tool ? "white" : "#333"}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {/* Sketch title */}
      <View style={styles.titleContainer}>
        <TextInput
          style={[styles.titleInput, disabled && styles.disabledInput]}
          value={sketch.title}
          onChangeText={updateTitle}
          placeholder="Sketch Title"
          editable={!disabled}
        />

        <TouchableOpacity
          style={[styles.exportButton, disabled && styles.disabledButton]}
          onPress={exportSketch}
          disabled={disabled}
        >
          <MaterialCommunityIcons name="export" size={18} color="white" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Drawing area */}
      <View
        style={[styles.drawingContainer, { width, height }]}
        ref={sketchRef}
        {...panResponder.panHandlers}
      >
        <Svg width="100%" height="100%">
          {renderElements()}
        </Svg>

        {/* Text input overlay */}
        {textInputVisible && (
          <View
            style={[
              styles.textInputOverlay,
              {
                left: textInputPosition.x,
                top: textInputPosition.y,
              },
            ]}
          >
            <TextInput
              style={styles.textInputField}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Enter text"
              autoFocus
              onBlur={addTextElement}
              onSubmitEditing={addTextElement}
            />
          </View>
        )}
      </View>

      {/* Drawing tools */}
      {showTools && (
        <View style={styles.toolsContainer}>
          {/* Tool selector */}
          <View style={styles.toolsRow}>
            <ToolButton tool={SketchToolType.PEN} icon="pencil" />
            <ToolButton tool={SketchToolType.LINE} icon="vector-line" />
            <ToolButton tool={SketchToolType.RECT} icon="vector-rectangle" />
            <ToolButton tool={SketchToolType.TEXT} icon="format-text" />
            <ToolButton tool={SketchToolType.ERASER} icon="eraser" />

            <TouchableOpacity
              style={[styles.clearButton, disabled && styles.disabledButton]}
              onPress={clearSketch}
              disabled={disabled}
            >
              <MaterialCommunityIcons name="delete" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Color selector */}
          <View style={styles.colorsContainer}><>

            <Text style={styles.toolOptionLabel}>Color:</Text>
            <ScrollView
</> horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorOptions}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      currentColor === color && styles.activeColorOption,
                      disabled && styles.disabledOption,
                    ]}
                    onPress={() => !disabled && setCurrentColor(color)}
                    disabled={disabled}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Line width selector */}
          <View style={styles.widthContainer}><>

            <Text style={styles.toolOptionLabel}>Width:</Text>
            <View
</> style={styles.widthOptions}>
              {LINE_WIDTHS.map((width) => (
                <TouchableOpacity
                  key={width}
                  style={[
                    styles.widthOption,
                    currentWidth === width && styles.activeWidthOption,
                    disabled && styles.disabledOption,
                  ]}
                  onPress={() => !disabled && setCurrentWidth(width)}
                  disabled={disabled}
                >
                  <View
                    style={[styles.widthPreview, { height: width, backgroundColor: currentColor }]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Templates */}
          {presetTemplates.length > 0 && (
            <View style={styles.templatesContainer}>
              <TouchableOpacity
                style={[styles.templatesButton, disabled && styles.disabledButton]}
                onPress={() => !disabled && setShowTemplates(!showTemplates)}
                disabled={disabled}
              >
                <MaterialCommunityIcons
                  name={showTemplates ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={disabled ? "#bdc3c7" : "#333"}
                />
                <Text style={[styles.templatesButtonText, disabled && styles.disabledText]}>
                  Room Templates
                </Text>
              </TouchableOpacity>

              {showTemplates && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.templatesList}
                >
                  {presetTemplates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[styles.templateItem, disabled && styles.disabledOption]}
                      onPress={() => !disabled && applyTemplate(template)}
                      disabled={disabled}
                    >
                      <View style={styles.templateThumbnail}><>

                        <MaterialCommunityIcons name="floor-plan" size={32} color="#7f8c8d" />
                      </View>
                      <Text
</> style={styles.templateName}>{template.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      )}

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Basic room templates
export const ROOM_TEMPLATES: SketchTemplate[] = [
  {
    id: "1",
    name: "Empty Room",
    elements: [
      {
        id: "1",
        type: "rect",
        start: { x: 50, y: 50 },
        end: { x: 350, y: 250 },
        color: "#000000",
        width: 2,
      },
    ],
  },
  {
    id: "2",
    name: "Studio Apartment",
    elements: [
      {
        id: "1",
        type: "rect",
        start: { x: 50, y: 50 },
        end: { x: 350, y: 250 },
        color: "#000000",
        width: 2,
      },
      {
        id: "2",
        type: "rect",
        start: { x: 50, y: 50 },
        end: { x: 100, y: 100 },
        color: "#000000",
        width: 2,
      },
      {
        id: "3",
        type: "text",
        position: { x: 70, y: 80 },
        text: "Bath",
        color: "#000000",
        fontSize: 12,
      },
      {
        id: "4",
        type: "rect",
        start: { x: 200, y: 150 },
        end: { x: 250, y: 200 },
        color: "#000000",
        width: 2,
      },
      {
        id: "5",
        type: "text",
        position: { x: 210, y: 180 },
        text: "Bed",
        color: "#000000",
        fontSize: 12,
      },
    ],
  },
  {
    id: "3",
    name: "1 Bedroom",
    elements: [
      // Outer walls
      {
        id: "1",
        type: "rect",
        start: { x: 50, y: 50 },
        end: { x: 350, y: 300 },
        color: "#000000",
        width: 2,
      },
      // Bedroom
      {
        id: "2",
        type: "rect",
        start: { x: 200, y: 50 },
        end: { x: 350, y: 150 },
        color: "#000000",
        width: 2,
      },
      {
        id: "3",
        type: "text",
        position: { x: 250, y: 100 },
        text: "Bedroom",
        color: "#000000",
        fontSize: 14,
      },
      // Bathroom
      {
        id: "4",
        type: "rect",
        start: { x: 50, y: 50 },
        end: { x: 125, y: 125 },
        color: "#000000",
        width: 2,
      },
      {
        id: "5",
        type: "text",
        position: { x: 70, y: 90 },
        text: "Bath",
        color: "#000000",
        fontSize: 12,
      },
      // Kitchen
      {
        id: "6",
        type: "rect",
        start: { x: 50, y: 200 },
        end: { x: 150, y: 300 },
        color: "#000000",
        width: 2,
      },
      {
        id: "7",
        type: "text",
        position: { x: 80, y: 250 },
        text: "Kitchen",
        color: "#000000",
        fontSize: 12,
      },
      // Living area
      {
        id: "8",
        type: "text",
        position: { x: 200, y: 200 },
        text: "Living Room",
        color: "#000000",
        fontSize: 14,
      },
    ],
  },
];

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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#7f8c8d",
  },
  titleContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  titleInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    marginRight: 8,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  exportButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 4,
  },
  drawingContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  toolsContainer: {
    marginTop: 8,
  },
  toolsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  toolButton: {
    width: 40,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  activeToolButton: {
    backgroundColor: "#3498db",
  },
  clearButton: {
    width: 40,
    height: 40,
    backgroundColor: "#e74c3c",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  colorsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  toolOptionLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginRight: 8,
    width: 50,
  },
  colorOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeColorOption: {
    borderWidth: 2,
    borderColor: "#3498db",
  },
  widthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  widthOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  widthOption: {
    width: 40,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  activeWidthOption: {
    backgroundColor: "#e1f5fe",
    borderWidth: 1,
    borderColor: "#3498db",
  },
  widthPreview: {
    width: "80%",
    borderRadius: 2,
  },
  disabledButton: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#bdc3c7",
  },
  disabledOption: {
    opacity: 0.6,
  },
  disabledText: {
    color: "#bdc3c7",
  },
  textInputOverlay: {
    position: "absolute",
    minWidth: 100,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 4,
    padding: 4,
    zIndex: 10,
  },
  textInputField: {
    fontSize: 14,
    padding: 4,
  },
  templatesContainer: {
    marginTop: 8,
  },
  templatesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  templatesButtonText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 4,
  },
  templatesList: {
    marginTop: 8,
  },
  templateItem: {
    width: 100,
    marginRight: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  templateThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  templateName: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
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
