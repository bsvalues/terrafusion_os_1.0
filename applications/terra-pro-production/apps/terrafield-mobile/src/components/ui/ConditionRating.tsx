import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Property condition ratings
 */
export enum ConditionRating {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  AVERAGE = "AVERAGE",
  FAIR = "FAIR",
  POOR = "POOR",
}

// Rating option configuration
interface RatingOption {
  value: ConditionRating;
  label: string;
  icon: string;
  color: string;
  description: string;
}

// Props for the condition rating component
interface ConditionRatingInputProps {
  label: string;
  value: ConditionRating | null;
  onChange: (value: ConditionRating) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  showDescriptions?: boolean;
  disabled?: boolean;
}

// Rating option configurations
const RATING_OPTIONS: RatingOption[] = [
  {
    value: ConditionRating.EXCELLENT,
    label: "Excellent",
    icon: "star",
    color: "#2ecc71",
    description: "New or recently renovated with high-end finishes",
  },
  {
    value: ConditionRating.GOOD,
    label: "Good",
    icon: "star-outline",
    color: "#27ae60",
    description: "Well maintained with minor wear and tear",
  },
  {
    value: ConditionRating.AVERAGE,
    label: "Average",
    icon: "star-half-full",
    color: "#f39c12",
    description: "Functional with typical wear for age",
  },
  {
    value: ConditionRating.FAIR,
    label: "Fair",
    icon: "alert-circle-outline",
    color: "#e67e22",
    description: "Some deferred maintenance, requires updates",
  },
  {
    value: ConditionRating.POOR,
    label: "Poor",
    icon: "alert-circle",
    color: "#e74c3c",
    description: "Significant repairs needed, major deficiencies",
  },
];

/**
 * ConditionRatingInput component
 * A specialized input for property condition ratings with visual indicators
 */
export const ConditionRatingInput: React.FC<ConditionRatingInputProps> = ({
  label,
  value,
  onChange,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  showDescriptions = true,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <View style={styles.ratingContainer}>
        {RATING_OPTIONS.map((option /* , index */) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.ratingOption,
              value === option.value && styles.selectedOption,
              disabled && styles.disabledOption,
            ]}
            onPress={() => !disabled && onChange(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={option.icon}
              size={28}
              color={value === option.value ? option.color : "#bdc3c7"}
            />
            <Text
              style={[
                styles.ratingLabel,
                value === option.value && { color: option.color, fontWeight: "bold" },
                disabled && styles.disabledText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showDescriptions && value && (
        <View style={styles.descriptionContainer}>
          <Text
            style={[
              styles.description,
              { color: RATING_OPTIONS.find((opt) => opt.value === value)?.color },
            ]}
          >
            {RATING_OPTIONS.find((opt) => opt.value === value)?.description}
          </Text>
        </View>
      )}

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * ConditionRatingBadge component
 * Shows the property condition as a badge
 */
export const ConditionRatingBadge: React.FC<{
  value: ConditionRating;
  size?: "small" | "medium" | "large";
}> = ({ value, size = "medium" }) => {
  const option = RATING_OPTIONS.find((opt) => opt.value === value) || RATING_OPTIONS[2]; // Default to average

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: option.color },
        size === "small" && styles.badgeSmall,
        size === "large" && styles.badgeLarge,
      ]}
    >
      <MaterialCommunityIcons
        name={option.icon}
        size={size === "small" ? 12 : size === "large" ? 20 : 16}
        color="white"
      />
      <Text
        style={[
          styles.badgeText,
          size === "small" && styles.badgeTextSmall,
          size === "large" && styles.badgeTextLarge,
        ]}
      >
        {option.label}
      </Text>
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
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 8,
  },
  ratingOption: {
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  selectedOption: {
    backgroundColor: "#f0f8ff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  disabledOption: {
    opacity: 0.5,
  },
  ratingLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
    textAlign: "center",
  },
  disabledText: {
    color: "#bdc3c7",
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f39c12",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  badgeLarge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  badgeTextSmall: {
    fontSize: 10,
  },
  badgeTextLarge: {
    fontSize: 16,
  },
});
