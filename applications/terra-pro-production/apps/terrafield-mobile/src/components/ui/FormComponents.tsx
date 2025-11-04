import React, { useState, useEffect, ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Base interface for all form field props
interface BaseFieldProps {
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
}

// TextInput field props
interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

// NumberInput field props
interface NumberFieldProps extends BaseFieldProps {
  value: number | null;
  onChangeValue: (value: number | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  fractionDigits?: number;
}

// Select field props
interface SelectFieldProps extends BaseFieldProps {
  value: string | null;
  onSelect: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

// ToggleSwitch field props
interface ToggleSwitchProps extends BaseFieldProps {
  value: boolean;
  onToggle: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
}

// RadioGroup field props
interface RadioGroupProps extends BaseFieldProps {
  value: string | null;
  onSelect: (value: string) => void;
  options: { label: string; value: string }[];
  direction?: "row" | "column";
}

// Checkbox field props
interface CheckboxProps extends BaseFieldProps {
  checked: boolean;
  onCheck: (checked: boolean) => void;
}

// FormSection props
interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * TextField component - Enhanced text input for mobile forms
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  keyboardType = "default",
  secureTextEntry = false,
  autoCapitalize = "sentences",
  disabled = false,
}) => {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error ? styles.inputError : null,
          disabled ? styles.inputDisabled : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
      />

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * NumberField component - Enhanced numeric input
 */
export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChangeValue,
  placeholder,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  fractionDigits = 0,
  disabled = false,
}) => {
  // Convert number to string for display
  const displayValue =
    value !== null && value !== undefined
      ? fractionDigits > 0
        ? value.toFixed(fractionDigits)
        : value.toString()
      : "";

  // Handle text change
  const handleChangeText = (text: string) => {
    // Remove non-numeric characters except decimal point
    const numericText = text.replace(/[^0-9.]/g, "");

    if (numericText === "" || numericText === ".") {
      onChangeValue(null);
      return;
    }

    let parsedValue = parseFloat(numericText);

    // Apply min/max constraints
    if (min !== undefined && parsedValue < min) {
      parsedValue = min;
    }
    if (max !== undefined && parsedValue > max) {
      parsedValue = max;
    }

    onChangeValue(parsedValue);
  };

  // Handle step increase/decrease
  const handleStepChange = (increment: boolean) => {
    const currentValue = value ?? 0;
    let newValue = increment ? currentValue + step : currentValue - step;

    // Apply min/max constraints
    if (min !== undefined && newValue < min) {
      newValue = min;
    }
    if (max !== undefined && newValue > max) {
      newValue = max;
    }

    onChangeValue(newValue);
  };

  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <View style={styles.numberInputContainer}>
        {prefix && <Text style={styles.affix}>{prefix}</Text>}

        <TextInput
          style={[
            styles.numberInput,
            error ? styles.inputError : null,
            disabled ? styles.inputDisabled : null,
          ]}
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          keyboardType="numeric"
          editable={!disabled}
        />

        {suffix && <Text style={styles.affix}>{suffix}</Text>}

        <TouchableOpacity
          style={[styles.stepButton, disabled ? styles.stepButtonDisabled : null]}
          onPress={() => handleStepChange(false)}
          disabled={disabled || (min !== undefined && (value ?? 0) <= min)}
        ><>

          <MaterialCommunityIcons name="minus" size={16} color={disabled ? "#999" : "#fff"} />
        </TouchableOpacity>

        <TouchableOpacity
</>
          style={[styles.stepButton, disabled ? styles.stepButtonDisabled : null]}
          onPress={() => handleStepChange(true)}
          disabled={disabled || (max !== undefined && (value ?? 0) >= max)}
        >
          <MaterialCommunityIcons name="plus" size={16} color={disabled ? "#999" : "#fff"} />
        </TouchableOpacity>
      </View>

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * SelectField component - Dropdown with options
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onSelect,
  options,
  placeholder = "Select an option",
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get the selected option label
  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? placeholder;

  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.selectButton,
          error ? styles.inputError : null,
          disabled ? styles.inputDisabled : null,
        ]}
        onPress={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
      ><>

        <Text
          style={[
            styles.selectText,
            !value ? styles.placeholderText : null,
            disabled ? styles.disabledText : null,
          ]}
        >
          {selectedLabel}
        </Text>
        <MaterialCommunityIcons
</>
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.optionsContainer}>
          <ScrollView style={styles.optionsScrollView} nestedScrollEnabled={true}>
            {options.map((option /* , index */) => (
              <TouchableOpacity
                key={index}
                style={[styles.optionItem, option.value === value ? styles.selectedOption : null]}
                onPress={() => {
                  onSelect(option.value);
                  setIsExpanded(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.value === value ? styles.selectedOptionText : null,
                  ]}
                >
                  {option.label}
                </Text>
                {option.value === value && (
                  <MaterialCommunityIcons name="check" size={18} color="#3498db" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * ToggleSwitch component - Enhanced toggle switch
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  value,
  onToggle,
  trueLabel = "Yes",
  falseLabel = "No",
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
}) => {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <View style={styles.toggleContainer}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>

        <View style={styles.toggleControl}><>

          <Text
            style={[
              styles.toggleLabel,
              !value ? styles.activeLabelText : styles.inactiveLabelText,
              disabled ? styles.disabledText : null,
            ]}
          >
            {falseLabel}
          </Text>

          <Switch
</>
            value={value}
            onValueChange={!disabled ? onToggle : undefined}
            trackColor={{ false: "#ccc", true: "#b1ddff" }}
            thumbColor={value ? "#3498db" : "#f4f3f4"}
            ios_backgroundColor="#ccc"
            disabled={disabled}
          />

          <Text
            style={[
              styles.toggleLabel,
              value ? styles.activeLabelText : styles.inactiveLabelText,
              disabled ? styles.disabledText : null,
            ]}
          >
            {trueLabel}
          </Text>
        </View>
      </View>

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * RadioGroup component - Enhanced radio button group
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  value,
  onSelect,
  options,
  direction = "column",
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
}) => {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <View
        style={[
          styles.radioContainer,
          direction === "row" ? styles.radioContainerRow : styles.radioContainerColumn,
        ]}
      >
        {options.map((option /* , index */) => (
          <TouchableOpacity
            key={index}
            style={[styles.radioOption, direction === "row" && styles.radioOptionRow]}
            onPress={() => !disabled && onSelect(option.value)}
            disabled={disabled}
          >
            <View
              style={[
                styles.radioButton,
                option.value === value ? styles.radioButtonSelected : null,
                disabled ? styles.radioButtonDisabled : null,
              ]}
            >
              {option.value === value && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[styles.radioLabel, disabled ? styles.disabledText : null]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * Checkbox component - Enhanced checkbox
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onCheck,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
}) => {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => !disabled && onCheck(!checked)}
        disabled={disabled}
      >
        <View
          style={[
            styles.checkbox,
            checked ? styles.checkboxChecked : null,
            disabled ? styles.checkboxDisabled : null,
          ]}
        >
          {checked && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
        </View>

        <View style={styles.checkboxLabelContainer}>
          <Text style={[styles.checkboxLabel, disabled ? styles.disabledText : null, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      </TouchableOpacity>

      {helperText && !error && (
        <Text style={[styles.helperText, styles.checkboxHelperText]}>{helperText}</Text>
      )}

      {error && <Text style={[styles.errorText, styles.checkboxHelperText]}>{error}</Text>}
    </View>
  );
};

/**
 * FormSection component - Collapsible section for forms
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
  collapsible = true,
  defaultCollapsed = false,
  containerStyle,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <View style={[styles.sectionContainer, containerStyle]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => collapsible && setCollapsed(!collapsed)}
        disabled={!collapsible}
      >
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>

        {collapsible && (
          <MaterialCommunityIcons
            name={collapsed ? "chevron-down" : "chevron-up"}
            size={24}
            color="#555"
          />
        )}
      </TouchableOpacity>

      {!collapsed && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  // Field container
  fieldContainer: {
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
  helperText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 4,
  },

  // Text input
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  disabledText: {
    color: "#999",
  },

  // Number input
  numberInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
    minHeight: 48,
    textAlign: "center",
  },
  stepButton: {
    backgroundColor: "#3498db",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  stepButtonDisabled: {
    backgroundColor: "#ccc",
  },
  affix: {
    fontSize: 16,
    color: "#666",
    marginHorizontal: 8,
  },

  // Select field
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    minHeight: 48,
  },
  selectText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  optionsContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: 4,
    maxHeight: 200,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionsScrollView: {
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  selectedOption: {
    backgroundColor: "#f0f8ff",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#3498db",
    fontWeight: "500",
  },

  // Toggle switch
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  activeLabelText: {
    color: "#3498db",
    fontWeight: "500",
  },
  inactiveLabelText: {
    color: "#999",
  },

  // Radio group
  radioContainer: {
    marginTop: 4,
  },
  radioContainerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  radioContainerColumn: {
    flexDirection: "column",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radioOptionRow: {
    marginRight: 16,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    borderColor: "#3498db",
  },
  radioButtonDisabled: {
    borderColor: "#ccc",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3498db",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#3498db",
  },
  checkboxDisabled: {
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
  },
  checkboxHelperText: {
    marginLeft: 34,
  },

  // Section
  sectionContainer: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sectionContent: {
    padding: 16,
  },
});
