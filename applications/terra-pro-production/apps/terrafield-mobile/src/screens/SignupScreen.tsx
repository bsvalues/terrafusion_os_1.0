import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import * as Colors from "../constants/Colors";

const SignupScreen = () => {
  const navigation = useNavigation<any>();
  const { register, isLoading, error } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Form validation
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Clear errors when inputs change
  useEffect(() => {
    if (fullName) setFullNameError("");
    if (email) setEmailError("");
    if (username) setUsernameError("");
    if (password) setPasswordError("");
    if (confirmPassword) setConfirmPasswordError("");
  }, [fullName, email, username, password, confirmPassword]);

  // Validate form
  const validateForm = () => {
    let isValid = true;

    // Validate full name
    if (!fullName.trim()) {
      setFullNameError("Full name is required");
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Invalid email format");
        isValid = false;
      }
    }

    // Validate username
    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    } else if (username.length < 4) {
      setUsernameError("Username must be at least 4 characters");
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  // Handle registration
  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register({
        fullName,
        email,
        username,
        password,
      });
    } catch (err) {
      Alert.alert("Registration Error", "Failed to register. Please try again.");
    }
  };

  // Navigate to login screen
  const handleNavigateToLogin = () => {
    navigation.navigate("Login");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleNavigateToLogin}><>

              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text
</> style={styles.headerTitle}>Create Account</Text>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.white} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Signup form */}
          <View style={styles.formContainer}>
            {/* Full Name input */}
            <View style={styles.inputContainer}><>

              <Text style={styles.inputLabel}>Full Name</Text>
              <View
</> style={[styles.inputWrapper, fullNameError ? styles.inputWrapperError : null]}>
                <Ionicons
                  name="person"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textLight}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCorrect={false}
                />
              </View>
              {fullNameError ? <Text style={styles.errorMessage}>{fullNameError}</Text> : null}
            </View>

            {/* Email input */}
            <View style={styles.inputContainer}><>

              <Text style={styles.inputLabel}>Email</Text>
              <View
</> style={[styles.inputWrapper, emailError ? styles.inputWrapperError : null]}>
                <Ionicons name="mail" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              {emailError ? <Text style={styles.errorMessage}>{emailError}</Text> : null}
            </View>

            {/* Username input */}
            <View style={styles.inputContainer}><>

              <Text style={styles.inputLabel}>Username</Text>
              <View
</> style={[styles.inputWrapper, usernameError ? styles.inputWrapperError : null]}>
                <Ionicons name="at" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={Colors.textLight}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {usernameError ? <Text style={styles.errorMessage}>{usernameError}</Text> : null}
            </View>

            {/* Password input */}
            <View style={styles.inputContainer}><>

              <Text style={styles.inputLabel}>Password</Text>
              <View
</> style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={togglePasswordVisibility}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={20}
                    color={Colors.textLight}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorMessage}>{passwordError}</Text> : null}
            </View>

            {/* Confirm Password input */}
            <View style={styles.inputContainer}><>

              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
</>
                style={[
                  styles.inputWrapper,
                  confirmPasswordError ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!confirmPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={toggleConfirmPasswordVisibility}
                >
                  <Ionicons
                    name={confirmPasswordVisible ? "eye-off" : "eye"}
                    size={20}
                    color={Colors.textLight}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorMessage}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginContainer}><>

              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity
</> onPress={handleNavigateToLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and conditions */}
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.white,
    marginLeft: 10,
    fontSize: 14,
    flexShrink: 1,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  visibilityToggle: {
    padding: 10,
  },
  errorMessage: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: Colors.textLight,
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  termsText: {
    color: Colors.textLight,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
});

export default SignupScreen;
