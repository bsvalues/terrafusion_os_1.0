import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  ViewStyle,
  TextStyle,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  TextField,
  NumberField,
  SelectField,
  ToggleSwitch,
  RadioGroup,
  Checkbox,
  FormSection,
} from "./ui/FormComponents";
import { ConditionRating, ConditionRatingInput } from "./ui/ConditionRating";
import { LocationPicker, LocationData } from "./ui/LocationPicker";
import { RoomDimension, RoomMeasurement } from "./ui/RoomMeasurement";
import { VoiceNote, VoiceNotes, VoiceNoteCategory } from "./ui/VoiceNotes";
import { SketchData, SketchTool, ROOM_TEMPLATES } from "./ui/SketchTool";
import { PropertyData } from "../services/types";
import { DataSyncService } from "../services/DataSyncService";
import { OfflineQueueService, OperationType } from "../services/OfflineQueueService";

// Screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Property inspection workflow steps
 */
export enum InspectionStep {
  PROPERTY_DETAILS = "property_details",
  CONDITION_ASSESSMENT = "condition_assessment",
  MEASUREMENTS = "measurements",
  FEATURES = "features",
  PHOTOS = "photos",
  NOTES = "notes",
  SKETCHES = "sketches",
  SUMMARY = "summary",
}

/**
 * Property inspection data
 */
export interface PropertyInspectionData {
  property: PropertyData;
  condition: {
    overall: ConditionRating;
    exterior: ConditionRating;
    interior: ConditionRating;
    roof: ConditionRating;
    foundation: ConditionRating;
    systems: ConditionRating;
  };
  rooms: RoomDimension[];
  features: {
    garage: boolean;
    pool: boolean;
    fireplace: boolean;
    basement: boolean;
    centralAir: boolean;
    renovated: boolean;
    [key: string]: boolean;
  };
  photos: {
    front: string[];
    rear: string[];
    interior: string[];
    damages: string[];
    other: string[];
    [key: string]: string[];
  };
  notes: VoiceNote[];
  sketches: SketchData[];
  location?: LocationData;
  completed: boolean;
  completedSteps: Record<InspectionStep, boolean>;
  startTime: Date;
  endTime?: Date;
}

/**
 * Props for the property inspection workflow component
 */
interface PropertyInspectionWorkflowProps {
  inspectionData: PropertyInspectionData;
  onUpdate: (data: PropertyInspectionData) => void;
  onComplete?: (data: PropertyInspectionData) => void;
  containerStyle?: ViewStyle;
  headerStyle?: TextStyle;
  disabled?: boolean;
  initialStep?: InspectionStep;
  hideSteps?: InspectionStep[];
}

/**
 * Step configuration
 */
interface StepConfig {
  key: InspectionStep;
  label: string;
  icon: string;
  description?: string;
  required?: boolean;
}

// Define steps configuration
const STEPS: StepConfig[] = [
  {
    key: InspectionStep.PROPERTY_DETAILS,
    label: "Property Details",
    icon: "home",
    description: "Basic property information and location",
    required: true,
  },
  {
    key: InspectionStep.CONDITION_ASSESSMENT,
    label: "Condition",
    icon: "home-search",
    description: "Property condition ratings",
    required: true,
  },
  {
    key: InspectionStep.MEASUREMENTS,
    label: "Measurements",
    icon: "ruler",
    description: "Room dimensions and area",
    required: true,
  },
  {
    key: InspectionStep.FEATURES,
    label: "Features",
    icon: "tag-multiple",
    description: "Property features and amenities",
    required: true,
  },
  {
    key: InspectionStep.PHOTOS,
    label: "Photos",
    icon: "camera",
    description: "Property photographs",
    required: true,
  },
  {
    key: InspectionStep.NOTES,
    label: "Notes",
    icon: "text",
    description: "Voice notes and observations",
  },
  {
    key: InspectionStep.SKETCHES,
    label: "Sketches",
    icon: "pencil",
    description: "Floor plans and property sketches",
  },
  {
    key: InspectionStep.SUMMARY,
    label: "Summary",
    icon: "check-circle",
    description: "Review and complete inspection",
    required: true,
  },
];

/**
 * Property types for selection
 */
const PROPERTY_TYPES = [
  { label: "Single Family", value: "single_family" },
  { label: "Condo", value: "condo" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Multi-Family", value: "multi_family" },
  { label: "Vacant Land", value: "vacant_land" },
  { label: "Commercial", value: "commercial" },
];

/**
 * Additional features list for selection
 */
const ADDITIONAL_FEATURES = [
  { key: "deck", label: "Deck/Patio" },
  { key: "fence", label: "Fence" },
  { key: "sprinklers", label: "Sprinkler System" },
  { key: "securitySystem", label: "Security System" },
  { key: "solarPanels", label: "Solar Panels" },
  { key: "hottub", label: "Hot Tub/Spa" },
  { key: "workshop", label: "Workshop/Shed" },
  { key: "waterfront", label: "Waterfront" },
  { key: "view", label: "View" },
  { key: "cornerLot", label: "Corner Lot" },
];

/**
 * Create default inspection data
 */
export const createDefaultInspectionData = (propertyId?: string): PropertyInspectionData => ({
  property: {
    id: propertyId || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "",
    yearBuilt: null,
    squareFeet: null,
    bedrooms: null,
    bathrooms: null,
    lotSize: null,
    hasGarage: false,
    hasPool: false,
    additionalFeatures: {},
  },
  condition: {
    overall: ConditionRating.AVERAGE,
    exterior: ConditionRating.AVERAGE,
    interior: ConditionRating.AVERAGE,
    roof: ConditionRating.AVERAGE,
    foundation: ConditionRating.AVERAGE,
    systems: ConditionRating.AVERAGE,
  },
  rooms: [],
  features: {
    garage: false,
    pool: false,
    fireplace: false,
    basement: false,
    centralAir: false,
    renovated: false,
  },
  photos: {
    front: [],
    rear: [],
    interior: [],
    damages: [],
    other: [],
  },
  notes: [],
  sketches: [],
  completed: false,
  completedSteps: {
    [InspectionStep.PROPERTY_DETAILS]: false,
    [InspectionStep.CONDITION_ASSESSMENT]: false,
    [InspectionStep.MEASUREMENTS]: false,
    [InspectionStep.FEATURES]: false,
    [InspectionStep.PHOTOS]: false,
    [InspectionStep.NOTES]: false,
    [InspectionStep.SKETCHES]: false,
    [InspectionStep.SUMMARY]: false,
  },
  startTime: new Date(),
});

/**
 * PropertyInspectionWorkflow component
 * A comprehensive workflow for property inspections
 */
export const PropertyInspectionWorkflow: React.FC<PropertyInspectionWorkflowProps> = ({
  inspectionData,
  onUpdate,
  onComplete,
  containerStyle,
  headerStyle,
  disabled = false,
  initialStep = InspectionStep.PROPERTY_DETAILS,
  hideSteps = [],
}) => {
  // Filter visible steps
  const visibleSteps = STEPS.filter((step) => !hideSteps.includes(step.key));

  // State
  const [currentStep, setCurrentStep] = useState<InspectionStep>(initialStep);
  const [progress, setProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Services
  const dataSyncService = DataSyncService.getInstance();
  const offlineQueueService = OfflineQueueService.getInstance();

  // Calculate progress
  useEffect(() => {
    const completedStepCount = Object.values(inspectionData.completedSteps).filter(Boolean).length;
    const totalRequiredSteps = visibleSteps.filter((step) => step.required).length;
    const newProgress = totalRequiredSteps > 0 ? completedStepCount / totalRequiredSteps : 0;
    setProgress(newProgress);
  }, [inspectionData.completedSteps]);

  // Update inspection data
  const updateInspectionData = (updates: Partial<PropertyInspectionData>) => {
    if (disabled) return;

    onUpdate({
      ...inspectionData,
      ...updates,
    });
  };

  // Mark step as complete
  const markStepComplete = (step: InspectionStep, isComplete: boolean = true) => {
    if (disabled) return;

    const updatedCompletedSteps = {
      ...inspectionData.completedSteps,
      [step]: isComplete,
    };

    onUpdate({
      ...inspectionData,
      completedSteps: updatedCompletedSteps,
    });
  };

  // Navigate to a step
  const navigateToStep = (step: InspectionStep) => {
    if (disabled) return;

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue:
          STEPS.findIndex((s) => s.key === currentStep) < STEPS.findIndex((s) => s.key === step)
            ? -50
            : 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change step
      setCurrentStep(step);

      // Reset animation values
      slideAnim.setValue(
        STEPS.findIndex((s) => s.key === currentStep) > STEPS.findIndex((s) => s.key === step)
          ? 50
          : -50
      );

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Handle next step
  const handleNextStep = () => {
    if (disabled) return;

    const currentIndex = visibleSteps.findIndex((step) => step.key === currentStep);

    if (currentIndex < visibleSteps.length - 1) {
      // Mark current step as complete
      markStepComplete(currentStep);

      // Navigate to next step
      navigateToStep(visibleSteps[currentIndex + 1].key);
    } else if (currentStep === InspectionStep.SUMMARY) {
      // Complete inspection
      handleComplete();
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (disabled) return;

    const currentIndex = visibleSteps.findIndex((step) => step.key === currentStep);

    if (currentIndex > 0) {
      navigateToStep(visibleSteps[currentIndex - 1].key);
    }
  };

  // Handle complete
  const handleComplete = async () => {
    if (disabled || isSubmitting) return;

    // Check if required steps are completed
    const requiredSteps = visibleSteps.filter((step) => step.required);
    const incompleteSteps = requiredSteps.filter(
      (step) => !inspectionData.completedSteps[step.key]
    );

    if (incompleteSteps.length > 0) {
      Alert.alert(
        "Incomplete Inspection",
        `Please complete the following required steps: ${incompleteSteps.map((step) => step.label).join(", ")}`,
        [{ text: "OK" }]
      );
      return;
    }

    // Confirm completion
    Alert.alert("Complete Inspection", "Are you sure you want to complete this inspection?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Complete",
        onPress: async () => {
          setIsSubmitting(true);

          try {
            // Update completion status
            const completedInspection: PropertyInspectionData = {
              ...inspectionData,
              completed: true,
              endTime: new Date(),
            };

            // Save to local storage and queue for sync
            onUpdate(completedInspection);

            // Queue property update for sync
            await offlineQueueService.enqueue(
              OperationType.UPDATE_PROPERTY,
              completedInspection.property,
              2 // High priority
            );

            // Call onComplete callback
            if (onComplete) {
              onComplete(completedInspection);
            }

            // Show success message
            Alert.alert(
              "Inspection Completed",
              "Property inspection has been completed and will be synchronized when online.",
              [{ text: "OK" }]
            );
          } catch (error) {
            console.error("Error completing inspection:", error);
            Alert.alert("Error", "Failed to complete inspection. Please try again.", [
              { text: "OK" },
            ]);
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  // Render active step content
  const renderStepContent = () => {
    switch (currentStep) {
      case InspectionStep.PROPERTY_DETAILS:
        return renderPropertyDetailsStep();
      case InspectionStep.CONDITION_ASSESSMENT:
        return renderConditionAssessmentStep();
      case InspectionStep.MEASUREMENTS:
        return renderMeasurementsStep();
      case InspectionStep.FEATURES:
        return renderFeaturesStep();
      case InspectionStep.PHOTOS:
        return renderPhotosStep();
      case InspectionStep.NOTES:
        return renderNotesStep();
      case InspectionStep.SKETCHES:
        return renderSketchesStep();
      case InspectionStep.SUMMARY:
        return renderSummaryStep();
      default:
        return null;
    }
  };

  // Render Property Details step
  const renderPropertyDetailsStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Property Identification" subtitle="Basic property details">
          <TextField
            label="Street Address"
            value={inspectionData.property.address}
            onChangeText={(text) => {
              updateInspectionData({
                property: {
                  ...inspectionData.property,
                  address: text,
                },
              });
            }}
            required
            disabled={disabled}
          />

          <View style={styles.rowFields}>
            <View style={styles.fieldHalf}><>

              <TextField
                label="City"
                value={inspectionData.property.city}
                onChangeText={(text) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      city: text,
                    },
                  });
                }}
                required
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.fieldHalf}>
              <TextField
                label="State"
                value={inspectionData.property.state}
                onChangeText={(text) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      state: text,
                    },
                  });
                }}
                required
                disabled={disabled}
              />
            </View>
          </View>

          <View style={styles.rowFields}>
            <View style={styles.fieldHalf}><>

              <TextField
                label="ZIP Code"
                value={inspectionData.property.zipCode}
                onChangeText={(text) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      zipCode: text,
                    },
                  });
                }}
                required
                keyboardType="numeric"
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.fieldHalf}>
              <SelectField
                label="Property Type"
                value={inspectionData.property.propertyType}
                options={PROPERTY_TYPES}
                onSelect={(value) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      propertyType: value,
                    },
                  });
                }}
                required
                disabled={disabled}
              />
            </View>
          </View>
        </FormSection>

        <FormSection title="Property Characteristics" subtitle="Size and basic features">
          <View style={styles.rowFields}>
            <View style={styles.fieldHalf}><>

              <NumberField
                label="Square Feet"
                value={inspectionData.property.squareFeet}
                onChangeValue={(value) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      squareFeet: value,
                    },
                  });
                }}
                suffix="sq ft"
                required
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.fieldHalf}>
              <NumberField
                label="Lot Size"
                value={inspectionData.property.lotSize}
                onChangeValue={(value) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      lotSize: value,
                    },
                  });
                }}
                suffix="acres"
                disabled={disabled}
              />
            </View>
          </View>

          <View style={styles.rowFields}>
            <View style={styles.fieldHalf}><>

              <NumberField
                label="Bedrooms"
                value={inspectionData.property.bedrooms}
                onChangeValue={(value) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      bedrooms: value,
                    },
                  });
                }}
                required
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.fieldHalf}>
              <NumberField
                label="Bathrooms"
                value={inspectionData.property.bathrooms}
                onChangeValue={(value) => {
                  updateInspectionData({
                    property: {
                      ...inspectionData.property,
                      bathrooms: value,
                    },
                  });
                }}
                step={0.5}
                fractionDigits={1}
                required
                disabled={disabled}
              />
            </View>
          </View><>


          <NumberField
            label="Year Built"
            value={inspectionData.property.yearBuilt}
            onChangeValue={(value) => {
              updateInspectionData({
                property: {
                  ...inspectionData.property,
                  yearBuilt: value,
                },
              });
            }}
            required
            disabled={disabled}
          />
        </FormSection>

        <FormSection
</> title="Property Location" subtitle="Capture GPS coordinates" collapsible>
          <LocationPicker
            label="Property Location"
            value={inspectionData.location || null}
            onChange={(location) => {
              if (location) {
                // Update property with GPS coordinates
                updateInspectionData({
                  location,
                  property: {
                    ...inspectionData.property,
                    latitude: location.coordinates.latitude,
                    longitude: location.coordinates.longitude,
                  },
                });
              }
            }}
            geocodeAddress
            showMap
            disabled={disabled}
          />
        </FormSection>
      </ScrollView>
    );
  };

  // Render Condition Assessment step
  const renderConditionAssessmentStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Overall Property Condition" subtitle="General condition assessment"><>

          <ConditionRatingInput
            label="Overall Condition"
            value={inspectionData.condition.overall}
            onChange={(value) => {
              updateInspectionData({
                condition: {
                  ...inspectionData.condition,
                  overall: value,
                },
              });
            }}
            required
            disabled={disabled}
          />
        </FormSection>

        <FormSection
</> title="Exterior Condition" subtitle="External elements assessment">
          <ConditionRatingInput
            label="Exterior"
            value={inspectionData.condition.exterior}
            onChange={(value) => {
              updateInspectionData({
                condition: {
                  ...inspectionData.condition,
                  exterior: value,
                },
              });
            }}
            required
            disabled={disabled}
          />

          <ConditionRatingInput
            label="Roof"
            value={inspectionData.condition.roof}
            onChange={(value) => {
              updateInspectionData({
                condition: {
                  ...inspectionData.condition,
                  roof: value,
                },
              });
            }}
            required
            disabled={disabled}
          /><>


          <ConditionRatingInput
            label="Foundation"
            value={inspectionData.condition.foundation}
            onChange={(value) => {
              updateInspectionData({
                condition: {
                  ...inspectionData.condition,
                  foundation: value,
                },
              });
            }}
            required
            disabled={disabled}
          />
        </FormSection>

        <FormSection
</> title="Interior Condition" subtitle="Internal elements assessment">
          <ConditionRatingInput
            label="Interior"
            value={inspectionData.condition.interior}
            onChange={(value) => {
              updateInspectionData({
                condition: {
                  ...inspectionData.condition,
                  interior: value,
                },
              });
            }}
            required
            disabled={disabled}
          />

          <ConditionRatingInput
            label="Systems (HVAC, Plumbing, Electrical)"
            value={inspectionData.condition.systems}
            onChange={(value) => {
              updateInspectionData({
                condition: {
                  ...inspectionData.condition,
                  systems: value,
                },
              });
            }}
            required
            disabled={disabled}
          />
        </FormSection>
      </ScrollView>
    );
  };

  // Render Measurements step
  const renderMeasurementsStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Room Measurements" subtitle="Capture room dimensions">
          <RoomMeasurement
            label="Room Dimensions"
            dimensions={inspectionData.rooms}
            onDimensionsChange={(dimensions) => {
              updateInspectionData({
                rooms: dimensions,
              });
            }}
            disabled={disabled}
          />
        </FormSection>
      </ScrollView>
    );
  };

  // Render Features step
  const renderFeaturesStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Major Features" subtitle="Primary property features">
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}><>

              <ToggleSwitch
                label="Garage"
                value={inspectionData.features.garage}
                onToggle={(value) => {
                  updateInspectionData({
                    features: {
                      ...inspectionData.features,
                      garage: value,
                    },
                    property: {
                      ...inspectionData.property,
                      hasGarage: value,
                    },
                  });
                }}
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.featureItem}><>

              <ToggleSwitch
                label="Pool"
                value={inspectionData.features.pool}
                onToggle={(value) => {
                  updateInspectionData({
                    features: {
                      ...inspectionData.features,
                      pool: value,
                    },
                    property: {
                      ...inspectionData.property,
                      hasPool: value,
                    },
                  });
                }}
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.featureItem}><>

              <ToggleSwitch
                label="Fireplace"
                value={inspectionData.features.fireplace}
                onToggle={(value) => {
                  updateInspectionData({
                    features: {
                      ...inspectionData.features,
                      fireplace: value,
                    },
                  });
                }}
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.featureItem}><>

              <ToggleSwitch
                label="Basement"
                value={inspectionData.features.basement}
                onToggle={(value) => {
                  updateInspectionData({
                    features: {
                      ...inspectionData.features,
                      basement: value,
                    },
                  });
                }}
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.featureItem}><>

              <ToggleSwitch
                label="Central A/C"
                value={inspectionData.features.centralAir}
                onToggle={(value) => {
                  updateInspectionData({
                    features: {
                      ...inspectionData.features,
                      centralAir: value,
                    },
                  });
                }}
                disabled={disabled}
              />
            </View>

            <View
</> style={styles.featureItem}>
              <ToggleSwitch
                label="Renovated"
                value={inspectionData.features.renovated}
                onToggle={(value) => {
                  updateInspectionData({
                    features: {
                      ...inspectionData.features,
                      renovated: value,
                    },
                  });
                }}
                disabled={disabled}
              />
            </View>
          </View>
        </FormSection>

        <FormSection title="Additional Features" subtitle="Other property amenities">
          <View style={styles.checkboxGrid}>
            {ADDITIONAL_FEATURES.map((feature) => (
              <View key={feature.key} style={styles.checkboxItem}>
                <Checkbox
                  label={feature.label}
                  checked={!!inspectionData.features[feature.key]}
                  onCheck={(checked) => {
                    updateInspectionData({
                      features: {
                        ...inspectionData.features,
                        [feature.key]: checked,
                      },
                    });
                  }}
                  disabled={disabled}
                />
              </View>
            ))}
          </View>
        </FormSection>
      </ScrollView>
    );
  };

  // Render Photos step
  const renderPhotosStep = () => {
    // This is a placeholder for the Photo capture functionality
    // Actual implementation would include camera access and photo management
    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Property Photos" subtitle="Capture and organize photos"><>

          <Text style={styles.photoInstructions}>
            Photos can be captured using the camera button below. Each photo will be automatically
            organized by category.
          </Text>

          <View
</> style={styles.photoCategories}>
            <TouchableOpacity style={styles.photoCategory} disabled={disabled}>
              <MaterialCommunityIcons name="home-outline" size={32} color="#3498db" /><>

              <Text style={styles.photoCategoryLabel}>Front</Text>
              <Text
</> style={styles.photoCount}>{inspectionData.photos.front.length} Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoCategory} disabled={disabled}>
              <MaterialCommunityIcons name="home-export-outline" size={32} color="#3498db" /><>

              <Text style={styles.photoCategoryLabel}>Rear</Text>
              <Text
</> style={styles.photoCount}>{inspectionData.photos.rear.length} Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoCategory} disabled={disabled}>
              <MaterialCommunityIcons name="sofa" size={32} color="#3498db" /><>

              <Text style={styles.photoCategoryLabel}>Interior</Text>
              <Text
</> style={styles.photoCount}>{inspectionData.photos.interior.length} Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoCategory} disabled={disabled}>
              <MaterialCommunityIcons name="alert" size={32} color="#3498db" /><>

              <Text style={styles.photoCategoryLabel}>Damages</Text>
              <Text
</> style={styles.photoCount}>{inspectionData.photos.damages.length} Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoCategory} disabled={disabled}>
              <MaterialCommunityIcons name="image-multiple" size={32} color="#3498db" /><>

              <Text style={styles.photoCategoryLabel}>Other</Text>
              <Text
</> style={styles.photoCount}>{inspectionData.photos.other.length} Photos</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cameraButton, disabled && styles.disabledButton]}
            disabled={disabled}
          >
            <MaterialCommunityIcons name="camera" size={32} color="white" />
            <Text style={styles.cameraButtonText}>Capture Photo</Text>
          </TouchableOpacity>

          <Text style={styles.photoNote}>
            Note: Photos will be automatically enhanced and synchronized when online.
          </Text>
        </FormSection>
      </ScrollView>
    );
  };

  // Render Notes step
  const renderNotesStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Voice Notes" subtitle="Record observations and comments">
          <VoiceNotes
            label="Property Observations"
            notes={inspectionData.notes}
            onNotesChange={(notes) => {
              updateInspectionData({
                notes,
              });
            }}
            transcribeNotes
            disabled={disabled}
          />
        </FormSection>
      </ScrollView>
    );
  };

  // Render Sketches step
  const renderSketchesStep = () => {
    // Get first sketch or create a new one if none exists
    const currentSketch = inspectionData.sketches.length > 0 ? inspectionData.sketches[0] : null;

    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Property Sketches" subtitle="Create floor plans and sketches">
          <SketchTool
            label="Floor Plan"
            sketch={currentSketch}
            onSketchChange={(sketch) => {
              const updatedSketches = currentSketch
                ? inspectionData.sketches.map((s) => (s.id === sketch.id ? sketch : s))
                : [...inspectionData.sketches, sketch];

              updateInspectionData({
                sketches: updatedSketches,
              });
            }}
            height={400}
            presetTemplates={ROOM_TEMPLATES}
            disabled={disabled}
          />
        </FormSection>
      </ScrollView>
    );
  };

  // Render Summary step
  const renderSummaryStep = () => {
    // Calculate completion percentage
    const requiredSteps = visibleSteps.filter((step) => step.required);
    const completedRequiredSteps = requiredSteps.filter(
      (step) => inspectionData.completedSteps[step.key]
    );
    const completionPercentage = Math.round(
      (completedRequiredSteps.length / requiredSteps.length) * 100
    );

    // Calculate inspection duration
    const startTime = new Date(inspectionData.startTime);
    const endTime = inspectionData.endTime ? new Date(inspectionData.endTime) : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    return (
      <ScrollView style={styles.stepContent}>
        <FormSection title="Inspection Summary" subtitle="Review and complete inspection">
          <View style={styles.summaryHeader}>
            <View style={styles.summaryProgress}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
              </View>
              <Text style={styles.progressText}>Complete</Text>
            </View>

            <View style={styles.summaryDuration}>
              <MaterialCommunityIcons name="clock-outline" size={32} color="#7f8c8d" /><>

              <Text style={styles.durationValue}>{durationMinutes} min</Text>
              <Text
</> style={styles.durationLabel}>Duration</Text>
            </View>
          </View>

          <View style={styles.summaryDetails}><>

            <Text style={styles.summaryTitle}>Property Details</Text>

            <View
</> style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Address:</Text>
              <Text
</> style={styles.summaryValue}>
                {inspectionData.property.address}, {inspectionData.property.city},{" "}
                {inspectionData.property.state} {inspectionData.property.zipCode}
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Property Type:</Text>
              <Text
</> style={styles.summaryValue}>
                {PROPERTY_TYPES.find((t) => t.value === inspectionData.property.propertyType)
                  ?.label || "Not specified"}
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Size:</Text>
              <Text
</> style={styles.summaryValue}>
                {inspectionData.property.squareFeet?.toLocaleString() || "Not specified"} sq ft
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Bedrooms/Bathrooms:</Text>
              <Text
</> style={styles.summaryValue}>
                {inspectionData.property.bedrooms || "N/A"} beds,{" "}
                {inspectionData.property.bathrooms || "N/A"} baths
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Year Built:</Text>
              <Text
</> style={styles.summaryValue}>
                {inspectionData.property.yearBuilt || "Not specified"}
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Overall Condition:</Text>
              <Text
</> style={styles.summaryValue}>{inspectionData.condition.overall}</Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Rooms Measured:</Text>
              <Text
</> style={styles.summaryValue}>{inspectionData.rooms.length}</Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Photos Taken:</Text>
              <Text
</> style={styles.summaryValue}>
                {Object.values(inspectionData.photos).reduce(
                  (sum, photos) => sum + photos.length,
                  0
                )}
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Voice Notes:</Text>
              <Text
</> style={styles.summaryValue}>{inspectionData.notes.length}</Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Key Features:</Text>
              <Text
</> style={styles.summaryValue}>
                {Object.entries(inspectionData.features)
                  .filter(([_, value]) => !!value)
                  .map(([key]) => {
                    // Convert from camelCase to Title Case
                    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
                  })
                  .join(", ") || "None specified"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.completeButton, disabled && styles.disabledButton]}
            onPress={handleComplete}
            disabled={disabled || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                <Text style={styles.completeButtonText}>Complete Inspection</Text>
              </>
            )}
          </TouchableOpacity>
        </FormSection>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header */}
      <View style={styles.header}><>

        <Text style={[styles.headerTitle, headerStyle]}>Property Inspection</Text>

        <View
</> style={styles.progressContainer}>
          <View style={styles.progressBar}><>

            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text
</> style={styles.progressText}>{Math.round(progress * 100)}% Complete</Text>
        </View>
      </View>

      {/* Steps Indicator */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsIndicator}>
        {visibleSteps.map((step /* , index */) => (
          <TouchableOpacity
            key={step.key}
            style={[
              styles.stepButton,
              currentStep === step.key && styles.activeStepButton,
              inspectionData.completedSteps[step.key] && styles.completedStepButton,
              disabled && styles.disabledStepButton,
            ]}
            onPress={() => navigateToStep(step.key)}
            disabled={disabled}
          >
            <MaterialCommunityIcons
              name={
                currentStep === step.key
                  ? step.icon
                  : inspectionData.completedSteps[step.key]
                    ? "check-circle"
                    : step.icon
              }
              size={24}
              color={
                currentStep === step.key
                  ? "#fff"
                  : inspectionData.completedSteps[step.key]
                    ? "#27ae60"
                    : "#7f8c8d"
              }
            />
            <Text
              style={[
                styles.stepButtonText,
                currentStep === step.key && styles.activeStepButtonText,
                inspectionData.completedSteps[step.key] && styles.completedStepButtonText,
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
            {step.required && (
              <View style={styles.requiredStep}>
                <Text style={styles.requiredStepText}>*</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Step Content */}
      <Animated.View
        style={[
          styles.stepContentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {renderStepContent()}
      </Animated.View>

      {/* Navigation Controls */}
      <View style={styles.navigationControls}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            (visibleSteps.findIndex((step) => step.key === currentStep) === 0 || disabled) &&
              styles.disabledNavButton,
          ]}
          onPress={handlePreviousStep}
          disabled={visibleSteps.findIndex((step) => step.key === currentStep) === 0 || disabled}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>
            {visibleSteps.findIndex((step) => step.key === currentStep) + 1} of{" "}
            {visibleSteps.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, disabled && styles.disabledNavButton]}
          onPress={handleNextStep}
          disabled={disabled}
        ><>

          <Text style={styles.navButtonText}>
            {visibleSteps.findIndex((step) => step.key === currentStep) === visibleSteps.length - 1
              ? "Complete"
              : "Next"}
          </Text>
          <MaterialCommunityIcons
</>
            name={
              visibleSteps.findIndex((step) => step.key === currentStep) === visibleSteps.length - 1
                ? "check-circle"
                : "chevron-right"
            }
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#3498db",
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#fff",
  },
  stepsIndicator: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  stepButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    minWidth: 80,
  },
  activeStepButton: {
    backgroundColor: "#3498db",
  },
  completedStepButton: {
    backgroundColor: "#e1f5fe",
  },
  disabledStepButton: {
    opacity: 0.7,
  },
  stepButtonText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
    textAlign: "center",
  },
  activeStepButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  completedStepButtonText: {
    color: "#27ae60",
  },
  requiredStep: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  requiredStepText: {
    fontSize: 16,
    color: "#e74c3c",
    fontWeight: "bold",
  },
  stepContentContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  navigationControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  prevButton: {
    backgroundColor: "#95a5a6",
  },
  nextButton: {
    backgroundColor: "#3498db",
  },
  disabledNavButton: {
    backgroundColor: "#bdc3c7",
  },
  navButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
    marginRight: 4,
  },
  stepIndicator: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  stepIndicatorText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  rowFields: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -6,
  },
  fieldHalf: {
    flex: 1,
    paddingHorizontal: 6,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  featureItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  checkboxItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  photoInstructions: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 16,
    lineHeight: 20,
  },
  photoCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  photoCategory: {
    width: "30%",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  photoCategoryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 8,
  },
  photoCount: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  cameraButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  photoNote: {
    fontSize: 12,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  summaryProgress: {
    alignItems: "center",
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3498db",
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  summaryDuration: {
    alignItems: "center",
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  durationLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  summaryDetails: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27ae60",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 16,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
});
