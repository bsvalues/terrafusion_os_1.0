import React, { Component, ErrorInfo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ErrorSeverity, useErrorReporting } from "./ErrorReporting";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the error reporting system
    this.setState({
      errorInfo,
    });

    // Report the error to the error service
    if (this.props.reportError) {
      this.props.reportError(error, ErrorSeverity.CRITICAL, this.props.componentName || "Unknown", {
        componentStack: errorInfo.componentStack,
      });
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#e74c3c" /><>

            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text
</> style={styles.errorMessage}>
              {this.state.error?.message || "An unexpected error occurred"}
            </Text>

            <ScrollView style={styles.errorDetails}><>

              <Text style={styles.errorDetailsTitle}>Error Details:</Text>
              <Text
</> style={styles.errorStack}>
                {this.state.error?.stack || "No stack trace available"}
              </Text>

              {this.state.errorInfo && (
                <><>

                  <Text style={styles.errorDetailsTitle}>Component Stack:</Text>
                  <Text
</> style={styles.errorStack}>{this.state.errorInfo.componentStack}</Text>
                </>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.reportButton} onPress={this.props.showErrorConsole}>
                <MaterialCommunityIcons name="bug" size={20} color="#fff" />
                <Text style={styles.buttonText}>View Error Console</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={this.resetError}>
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Wrap the class component with the error reporting context
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  const { reportError, showErrorConsole } = useErrorReporting();

  return (
    <ErrorBoundaryClass {...props} reportError={reportError} showErrorConsole={showErrorConsole} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 20,
  },
  errorDetails: {
    width: "100%",
    maxHeight: 200,
    backgroundColor: "#ecf0f1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#e74c3c",
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  reportButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 0.16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 8,
  },
  resetButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ErrorBoundary;
