import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  FlatList,
  Modal,
  Switch,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { BarChart, LineChart, PieChart, ContributionGraph } from "react-native-chart-kit";
import { DataTable } from "react-native-paper";
import MapView, { Marker, Circle } from "react-native-maps";
import AnimatedSparkline from "../components/AnimatedSparkline";

import {
  PropertyComparisonService,
  ComparisonDashboardConfig,
  ComparisonResult,
  ComparisonMetricType,
  ChartType,
  VisualizationMode,
} from "../services/PropertyComparisonService";
import { ComparableService } from "../services/ComparableService";
import PropertyValueTrend from "../components/PropertyValueTrend";
import { ValueHistoryPeriod, ValueHistoryType } from "../services/PropertyValueHistoryService";

const screenWidth = Dimensions.get("window").width;

/**
 * PropertyComparisonDashboard
 *
 * A dashboard screen for one-click property comparison
 */
const PropertyComparisonDashboard: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property ID from route params
  const propertyId = route.params?.propertyId || "property_123";

  // Services
  const comparisonService = PropertyComparisonService.getInstance();
  const comparableService = ComparableService.getInstance();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [property, setProperty] = useState<any>(null);
  const [comparables, setComparables] = useState<any[]>([]);
  const [dashboards, setDashboards] = useState<ComparisonDashboardConfig[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<ComparisonDashboardConfig | null>(
    null
  );
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [savedResults, setSavedResults] = useState<ComparisonResult[]>([]);
  const [reconciledValue, setReconciledValue] = useState<string>("");
  const [reconciledNotes, setReconciledNotes] = useState<string>("");

  // Modal state
  const [showDashboardModal, setShowDashboardModal] = useState<boolean>(false);
  const [showReconciledValueModal, setShowReconciledValueModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showSavedResultsModal, setShowSavedResultsModal] = useState<boolean>(false);
  const [showPropertyModal, setShowPropertyModal] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Refs
  const mapRef = useRef<MapView>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Initialize service
        comparisonService.initialize({
          maxCacheSize: 10 * 1024 * 1024, // 10 MB
          defaultCacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
          fieldWeights: {
            location: 0.3,
            size: 0.2,
            propertyType: 0.15,
            yearBuilt: 0.1,
            bedrooms: 0.1,
            bathrooms: 0.1,
            condition: 0.05,
          },
          defaultMetrics: [
            ComparisonMetricType.PRICE,
            ComparisonMetricType.PRICE_PER_SQFT,
            ComparisonMetricType.SQUARE_FOOTAGE,
            ComparisonMetricType.BEDROOMS,
            ComparisonMetricType.BATHROOMS,
            ComparisonMetricType.YEAR_BUILT,
          ],
          defaultChartType: ChartType.BAR,
          defaultVisualizationMode: VisualizationMode.CHART,
        });

        // Load property
        // In a real app, this would come from a property service
        // For this demo, we'll use the getProperty method from the comparison service
        const property = await comparisonService["getProperty"](propertyId);
        setProperty(property);

        // Load dashboards
        const dashboards = await comparisonService.getDashboards();
        setDashboards(dashboards);

        // Set default dashboard
        const defaultDashboard = await comparisonService.getDefaultDashboard();
        setSelectedDashboard(defaultDashboard);

        // Load saved comparison results
        const results = await comparisonService.getComparisonResults(propertyId);
        setSavedResults(results);

        // Load most recent result if available
        if (results.length > 0) {
          setComparisonResult(results[0]);
        }
      } catch (error) {
        console.error("Error loading comparison data:", error);
        Alert.alert("Error", "Failed to load comparison data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [propertyId]);

  // Handle one-click comparison
  const handleOneClickComparison = async () => {
    try {
      if (!selectedDashboard) {
        Alert.alert("Error", "Please select a dashboard");
        return;
      }

      setIsComparing(true);

      // Perform one-click comparison
      const result = await comparisonService.oneClickComparison(propertyId, {
        maxComparables: 5,
        dashboardId: selectedDashboard.id,
        similarityThreshold: 0.6,
        maxDistance: 5, // miles
      });

      // Set result
      setComparisonResult(result);

      // Reload saved results
      const results = await comparisonService.getComparisonResults(propertyId);
      setSavedResults(results);

      // Load comparables
      try {
        const comparableProperties = await Promise.all(
          result.comparablePropertyIds.map((id) => comparisonService["getProperty"](id))
        );
        setComparables(comparableProperties);
      } catch (error) {
        console.error("Error loading comparable properties:", error);
      }

      // Show success message
      Alert.alert("Success", "Property comparison completed");
    } catch (error) {
      console.error("Error in one-click comparison:", error);
      Alert.alert("Error", "Failed to perform property comparison");
    } finally {
      setIsComparing(false);
    }
  };

  // Handle save reconciled value
  const handleSaveReconciledValue = async () => {
    try {
      if (!comparisonResult) return;

      const valueNum = parseFloat(reconciledValue.replace(/[^0-9.]/g, ""));

      if (isNaN(valueNum) || valueNum <= 0) {
        Alert.alert("Error", "Please enter a valid reconciled value");
        return;
      }

      // Save reconciled value
      const success = await comparisonService.saveReconciledValue(
        comparisonResult.id,
        valueNum,
        reconciledNotes
      );

      if (success) {
        // Reload result
        const updatedResult = await comparisonService.getComparisonResult(comparisonResult.id);
        if (updatedResult) {
          setComparisonResult(updatedResult);
        }

        // Close modal
        setShowReconciledValueModal(false);

        // Show success message
        Alert.alert("Success", "Reconciled value saved successfully");
      } else {
        Alert.alert("Error", "Failed to save reconciled value");
      }
    } catch (error) {
      console.error("Error saving reconciled value:", error);
      Alert.alert("Error", "Failed to save reconciled value");
    }
  };

  // Handle dashboard select
  const handleDashboardSelect = async (dashboard: ComparisonDashboardConfig) => {
    setSelectedDashboard(dashboard);
    setShowDashboardModal(false);
  };

  // Handle load saved result
  const handleLoadSavedResult = async (result: ComparisonResult) => {
    try {
      setShowSavedResultsModal(false);

      setIsLoading(true);

      // Set result
      setComparisonResult(result);

      // Load comparables
      try {
        const comparableProperties = await Promise.all(
          result.comparablePropertyIds.map((id) => comparisonService["getProperty"](id))
        );
        setComparables(comparableProperties);
      } catch (error) {
        console.error("Error loading comparable properties:", error);
      }
    } catch (error) {
      console.error("Error loading saved result:", error);
      Alert.alert("Error", "Failed to load saved result");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle property select
  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  // Format number as currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Get color for difference
  const getDifferenceColor = (diff: number): string => {
    if (diff > 0) return "#2ecc71"; // Green for positive
    if (diff < 0) return "#e74c3c"; // Red for negative
    return "#7f8c8d"; // Gray for no difference
  };

  // Render header
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><>

          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text
</> style={styles.headerTitle}>Property Comparison</Text>

        {comparisonResult && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSavedResultsModal(true)}
          >
            <MaterialCommunityIcons name="history" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render property card
  const renderPropertyCard = () => {
    if (!property) return null;

    return (
      <View style={styles.propertyCard}>
        <View style={styles.propertyCardHeader}><>

          <Text style={styles.propertyCardTitle}>Subject Property</Text>

          <TouchableOpacity
</>
            style={styles.propertyMoreButton}
            onPress={() => handlePropertySelect(property)}
          >
            <MaterialCommunityIcons name="information" size={20} color="#3498db" />
          </TouchableOpacity>
        </View><>


        <Text style={styles.propertyAddress}>{property.address}</Text>
        <Text
</> style={styles.propertyLocation}>
          {property.city}, {property.state} {property.zipCode}
        </Text>

        <View style={styles.propertyDetails}>
          <View style={styles.propertyDetail}>
            <MaterialCommunityIcons name="cash" size={16} color="#3498db" />
            <Text style={styles.propertyDetailText}>{formatCurrency(property.price)}</Text>
          </View>

          <View style={styles.propertyDetail}>
            <MaterialCommunityIcons name="home-floor-0" size={16} color="#3498db" />
            <Text style={styles.propertyDetailText}>
              {formatNumber(property.squareFootage)} sq ft
            </Text>
          </View>

          <View style={styles.propertyDetail}>
            <MaterialCommunityIcons name="bed" size={16} color="#3498db" />
            <Text style={styles.propertyDetailText}>
              {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
            </Text>
          </View>

          <View style={styles.propertyDetail}>
            <MaterialCommunityIcons name="shower" size={16} color="#3498db" />
            <Text style={styles.propertyDetailText}>
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </Text>
          </View>
        </View>

        {/* Property Value Trend */}
        <View style={styles.valueTrendContainer}>
          <PropertyValueTrend
            propertyId={propertyId}
            width={screenWidth - 64}
            height={200}
            showHeader={true}
            showDetails={true}
            valueTypes={[
              ValueHistoryType.MARKET,
              ValueHistoryType.APPRAISED,
              ValueHistoryType.ASSESSED,
              ValueHistoryType.AUTOMATED,
            ]}
            period={ValueHistoryPeriod.YEAR_3}
          />
        </View>
      </View>
    );
  };

  // Render dashboard selector
  const renderDashboardSelector = () => {
    return (
      <View style={styles.section}><>

        <Text style={styles.sectionTitle}>Comparison Dashboard</Text>

        <TouchableOpacity
</>
          style={styles.dashboardSelector}
          onPress={() => setShowDashboardModal(true)}
        >
          <View style={styles.selectedDashboard}>
            <MaterialCommunityIcons name="view-dashboard" size={24} color="#3498db" />
            <Text style={styles.selectedDashboardName}>
              {selectedDashboard ? selectedDashboard.name : "Select a dashboard"}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={24} color="#7f8c8d" />
        </TouchableOpacity>

        {selectedDashboard && (
          <Text style={styles.dashboardDescription}>{selectedDashboard.description}</Text>
        )}
      </View>
    );
  };

  // Render comparison button
  const renderComparisonButton = () => {
    return (
      <TouchableOpacity
        style={[styles.comparisonButton, isComparing && styles.comparisonButtonDisabled]}
        onPress={handleOneClickComparison}
        disabled={isComparing || !selectedDashboard}
      >
        {isComparing ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.comparisonButtonText}>Comparing...</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#fff" />
            <Text style={styles.comparisonButtonText}>One-Click Comparison</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render comparison results
  const renderComparisonResults = () => {
    if (!comparisonResult || !property) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}><>

          <Text style={styles.sectionTitle}>Comparison Results</Text>

          <TouchableOpacity
</> style={styles.detailsButton} onPress={() => setShowDetailsModal(true)}>
            <MaterialCommunityIcons name="table" size={16} color="#3498db" />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        </View>

        {selectedDashboard?.visualizationMode === VisualizationMode.CHART && renderChartView()}
        {selectedDashboard?.visualizationMode === VisualizationMode.TABLE && renderTableView()}
        {selectedDashboard?.visualizationMode === VisualizationMode.MAP && renderMapView()}
        {selectedDashboard?.visualizationMode === VisualizationMode.GRID && renderGridView()}

        {/* Reconciled Value Section */}
        <View style={styles.reconciledValueSection}>
          <Text style={styles.reconciledValueTitle}>Reconciled Value</Text>

          {comparisonResult.valueReconciliation ? (
            <View style={styles.reconciledValueContent}><>

              <Text style={styles.reconciledValue}>
                {formatCurrency(comparisonResult.valueReconciliation.reconciledValue)}
              </Text>

              <View
</> style={styles.valueRangeContainer}><>

                <Text style={styles.valueRangeLabel}>Value Range:</Text>
                <Text
</> style={styles.valueRange}>
                  {formatCurrency(comparisonResult.valueReconciliation.minValue)} -{" "}
                  {formatCurrency(comparisonResult.valueReconciliation.maxValue)}
                </Text>
              </View>

              {comparisonResult.valueReconciliation.notes && (
                <View style={styles.reconciledNotes}><>

                  <Text style={styles.reconciledNotesLabel}>Notes:</Text>
                  <Text
</> style={styles.reconciledNotesText}>
                    {comparisonResult.valueReconciliation.notes}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.editReconciledValueButton}
                onPress={() => {
                  setReconciledValue(
                    comparisonResult.valueReconciliation!.reconciledValue.toString()
                  );
                  setReconciledNotes(comparisonResult.valueReconciliation!.notes || "");
                  setShowReconciledValueModal(true);
                }}
              >
                <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                <Text style={styles.editReconciledValueButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reconciledValueEmpty}><>

              <Text style={styles.reconciledValueEmptyText}>No reconciled value set</Text>

              <TouchableOpacity
</>
                style={styles.setReconciledValueButton}
                onPress={() => {
                  // Set initial value to average of comparable prices
                  const priceMetric = comparisonResult.metricResults.find(
                    (m) => m.type === ComparisonMetricType.PRICE
                  );
                  if (priceMetric) {
                    const prices = priceMetric.comparableValues
                      .map((cv) => cv.value)
                      .filter((v) => typeof v === "number");

                    if (prices.length > 0) {
                      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                      setReconciledValue(avgPrice.toString());
                    } else {
                      setReconciledValue(property.price.toString());
                    }
                  } else {
                    setReconciledValue(property.price.toString());
                  }

                  setReconciledNotes("");
                  setShowReconciledValueModal(true);
                }}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                <Text style={styles.setReconciledValueButtonText}>Set Value</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Similarity Scores Section */}
        <View style={styles.similarityScoresSection}><>

          <Text style={styles.similarityScoresTitle}>Similarity Scores</Text>

          <FlatList
</>
            data={comparisonResult.similarityScores}
            keyExtractor={(item) => item.propertyId}
            renderItem={({ item }) => {
              const comparable = comparables.find((c) => c.id === item.propertyId);
              if (!comparable) return null;

              return (
                <TouchableOpacity
                  style={styles.similarityScoreItem}
                  onPress={() => handlePropertySelect(comparable)}
                >
                  <View style={styles.similarityScoreHeader}><>

                    <Text style={styles.similarityScoreAddress} numberOfLines={1}>
                      {comparable.address}
                    </Text>
                    <View
</>
                      style={[
                        styles.similarityScoreBadge,
                        {
                          backgroundColor:
                            item.score >= 0.8
                              ? "#2ecc71"
                              : item.score >= 0.6
                                ? "#f39c12"
                                : "#e74c3c",
                        },
                      ]}
                    >
                      <Text style={styles.similarityScoreBadgeText}>
                        {Math.round(item.score * 100)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.similarityScoreCategories}>
                    {item.categoryScores.map((category /* , index */) => (
                      <View key={index} style={styles.similarityScoreCategory}><>

                        <Text style={styles.similarityScoreCategoryName}>{category.category}:</Text>
                        <View
</>
                          style={[
                            styles.similarityScoreCategoryValue,
                            {
                              backgroundColor:
                                category.score >= 0.8
                                  ? "#2ecc71"
                                  : category.score >= 0.6
                                    ? "#f39c12"
                                    : "#e74c3c",
                              width: `${Math.round(category.score * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Property Value Mini Trend */}
                  <View style={styles.miniTrendContainer}>
                    <AnimatedSparkline
                      data={[
                        comparable.price * 0.7,
                        comparable.price * 0.75,
                        comparable.price * 0.8,
                        comparable.price * 0.85,
                        comparable.price * 0.9,
                        comparable.price * 0.95,
                        comparable.price * 0.98,
                        comparable.price,
                        comparable.price * 1.05,
                      ]}
                      width={120}
                      height={40}
                      lineWidth={1.5}
                      showArea={true}
                      showDots={true}
                      trend={true}
                      color={
                        comparable.price > property.price
                          ? "#e74c3c"
                          : comparable.price < property.price
                            ? "#2ecc71"
                            : "#3498db"
                      }
                      highlightLast={true}
                      animated={true}
                      animationDuration={1500}
                      formatValue={(value) => formatCurrency(value)}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
            style={styles.similarityScoresList}
            scrollEnabled={false}
          />
        </View>
      </View>
    );
  };

  // Render chart view
  const renderChartView = () => {
    if (!comparisonResult || !property) return null;

    // Find price metric
    const priceMetric = comparisonResult.metricResults.find(
      (m) => m.type === ComparisonMetricType.PRICE
    );

    if (!priceMetric) return null;

    // Prepare chart data
    const propertyNames = ["Subject", ...comparables.map((c) => c.address.split(" ")[0])];
    const propertyValues = [property.price, ...priceMetric.comparableValues.map((cv) => cv.value)];

    const chartData = {
      labels: propertyNames,
      datasets: [
        {
          data: propertyValues,
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
        },
      ],
    };

    const chartConfig = {
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.7,
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
      formatYLabel: (value: string) => formatCurrency(parseInt(value, 10)),
    };

    return (
      <View style={styles.chartContainer}><>

        <Text style={styles.chartTitle}>Price Comparison</Text>

        <ScrollView
</>
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <BarChart
            data={chartData}
            width={Math.max(screenWidth - 32, chartData.labels.length * 80)}
            height={240}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero={true}
            showBarTops={true}
            showValuesOnTopOfBars={true}
            withInnerLines={true}
            yAxisLabel="$"
            yAxisSuffix=""
          />
        </ScrollView>

        {/* Price Per Sq Ft Chart */}
        {renderPricePerSqFtChart()}
      </View>
    );
  };

  // Render price per sq ft chart
  const renderPricePerSqFtChart = () => {
    if (!comparisonResult || !property) return null;

    // Find price per sq ft metric
    const pricePerSqFtMetric = comparisonResult.metricResults.find(
      (m) => m.type === ComparisonMetricType.PRICE_PER_SQFT
    );

    if (!pricePerSqFtMetric) return null;

    // Prepare chart data
    const propertyNames = ["Subject", ...comparables.map((c) => c.address.split(" ")[0])];
    const propertyValues = [
      property.pricePerSqFt,
      ...pricePerSqFtMetric.comparableValues.map((cv) => cv.value),
    ];

    const chartData = {
      labels: propertyNames,
      datasets: [
        {
          data: propertyValues,
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
        },
      ],
    };

    const chartConfig = {
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.7,
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
      formatYLabel: (value: string) => "$" + value,
    };

    return (
      <View style={styles.chartContainer}><>

        <Text style={styles.chartTitle}>Price Per Sq Ft</Text>

        <ScrollView
</>
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <BarChart
            data={chartData}
            width={Math.max(screenWidth - 32, chartData.labels.length * 80)}
            height={240}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero={true}
            showBarTops={true}
            showValuesOnTopOfBars={true}
            withInnerLines={true}
            yAxisSuffix="/sqft"
          />
        </ScrollView>
      </View>
    );
  };

  // Render table view
  const renderTableView = () => {
    if (!comparisonResult || !property || !comparables || comparables.length === 0) return null;

    return (
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <DataTable style={styles.dataTable}>
            <DataTable.Header>
              <DataTable.Title style={styles.tableHeaderCell}>Feature</DataTable.Title>
              <DataTable.Title style={styles.tableHeaderCell}>Subject</DataTable.Title>
              {comparables.map((comp /* , index */) => (
                <DataTable.Title key={index} style={styles.tableHeaderCell}>
                  Comp {index + 1}
                </DataTable.Title>
              ))}
            </DataTable.Header>

            {comparisonResult.metricResults.map((metric /* , index */) => {
              let formatterFn: (val: any) => string;

              switch (metric.type) {
                case ComparisonMetricType.PRICE:
                  formatterFn = (val) => formatCurrency(val);
                  break;
                case ComparisonMetricType.PRICE_PER_SQFT:
                  formatterFn = (val) => "$" + formatNumber(val) + "/sqft";
                  break;
                case ComparisonMetricType.SQUARE_FOOTAGE:
                case ComparisonMetricType.LOT_SIZE:
                  formatterFn = (val) => formatNumber(val);
                  break;
                default:
                  formatterFn = (val) => String(val);
              }

              const metricName =
                selectedDashboard?.metrics.find((m) => m.type === metric.type)?.displayName ||
                metric.type;

              return (
                <DataTable.Row key={index}>
                  <DataTable.Cell style={styles.tableCell}>{metricName}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    {formatterFn(metric.subjectValue)}
                  </DataTable.Cell>
                  {metric.comparableValues.map((cv, cvIndex) => (
                    <DataTable.Cell key={cvIndex} style={styles.tableCell}>
                      <View>
                        <Text>{formatterFn(cv.value)}</Text>
                        {metric.type !== ComparisonMetricType.CONDITION &&
                          metric.type !== ComparisonMetricType.QUALITY &&
                          typeof cv.percentDifference === "number" && (
                            <Text style={{ color: getDifferenceColor(cv.percentDifference) }}>
                              {cv.percentDifference >= 0 ? "+" : ""}
                              {cv.percentDifference.toFixed(1)}%
                            </Text>
                          )}
                      </View>
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              );
            })}

            {/* Adjustment Row */}
            {selectedDashboard?.metrics.some((m) => m.type === ComparisonMetricType.ADJUSTMENT) && (
              <DataTable.Row>
                <DataTable.Cell style={[styles.tableCell, styles.tableTotalCell]}>
                  Net Adjustments
                </DataTable.Cell>
                <DataTable.Cell style={[styles.tableCell, styles.tableTotalCell]}>-</DataTable.Cell>
                {comparables.map((comp /* , index */) => (
                  <DataTable.Cell key={index} style={[styles.tableCell, styles.tableTotalCell]}>
                    {/* In a real app, this would be the sum of all adjustments */}
                    $0
                  </DataTable.Cell>
                ))}
              </DataTable.Row>
            )}

            {/* Adjusted Value Row */}
            {selectedDashboard?.metrics.some(
              (m) => m.type === ComparisonMetricType.RECONCILED_VALUE
            ) && (
              <DataTable.Row>
                <DataTable.Cell style={[styles.tableCell, styles.tableTotalCell]}>
                  Adjusted Value
                </DataTable.Cell>
                <DataTable.Cell style={[styles.tableCell, styles.tableTotalCell]}>-</DataTable.Cell>
                {comparables.map((comp /* , index */) => (
                  <DataTable.Cell key={index} style={[styles.tableCell, styles.tableTotalCell]}>
                    {formatCurrency(comp.price)}
                  </DataTable.Cell>
                ))}
              </DataTable.Row>
            )}
          </DataTable>
        </ScrollView>
      </View>
    );
  };

  // Render map view
  const renderMapView = () => {
    if (!property || !comparables || comparables.length === 0) return null;

    // Calculate region
    const latitudes = [property.latitude, ...comparables.map((c) => c.latitude)];
    const longitudes = [property.longitude, ...comparables.map((c) => c.longitude)];

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.2 + 0.01,
      longitudeDelta: (maxLng - minLng) * 1.2 + 0.01,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} initialRegion={region}>
          {/* Subject Property Marker */}
          <Marker
            coordinate={{
              latitude: property.latitude,
              longitude: property.longitude,
            }}
            pinColor="red"
            title="Subject Property"
            description={property.address}
          />

          {/* Comparable Property Markers */}
          {comparables.map((comp /* , index */) => (
            <Marker
              key={index}
              coordinate={{
                latitude: comp.latitude,
                longitude: comp.longitude,
              }}
              pinColor="blue"
              title={`Comparable ${index + 1}`}
              description={`${comp.address} - ${formatCurrency(comp.price)}`}
            />
          ))}

          {/* Circle around subject property */}
          <Circle
            center={{
              latitude: property.latitude,
              longitude: property.longitude,
            }}
            radius={1000} // 1 km
            strokeWidth={1}
            strokeColor="rgba(52, 152, 219, 0.5)"
            fillColor="rgba(52, 152, 219, 0.1)"
          />
        </MapView>
      </View>
    );
  };

  // Render grid view
  const renderGridView = () => {
    if (!comparisonResult || !property || !selectedDashboard?.layout) return null;

    return (
      <View style={styles.gridContainer}>
        {selectedDashboard.layout.items.map((item /* , index */) => {
          const metric = comparisonResult.metricResults.find((m) => m.type === item.metricType);
          if (!metric) return null;

          const metricConfig = selectedDashboard.metrics.find((m) => m.type === item.metricType);
          if (!metricConfig) return null;

          return (
            <View
              key={index}
              style={[
                styles.gridItem,
                {
                  gridRow: `${item.row + 1} / span ${item.rowSpan}`,
                  gridColumn: `${item.column + 1} / span ${item.columnSpan}`,
                },
              ]}
            >
              <Text style={styles.gridItemTitle}>{metricConfig.displayName}</Text>

              {metricConfig.chartType === ChartType.BAR && (
                <View style={styles.gridItemChart}>
                  {/* Mini bar chart */}
                  <View style={styles.miniBarChart}>
                    <View style={styles.miniBarChartBar}>
                      <View
                        style={[
                          styles.miniBarChartBarFill,
                          {
                            width: "100%",
                            backgroundColor: "#3498db",
                          },
                        ]}
                      >
                        <Text style={styles.miniBarChartLabel}>
                          {metric.type === ComparisonMetricType.PRICE
                            ? formatCurrency(metric.subjectValue)
                            : metric.type === ComparisonMetricType.PRICE_PER_SQFT
                              ? "$" + formatNumber(metric.subjectValue) + "/sqft"
                              : formatNumber(metric.subjectValue)}
                        </Text>
                      </View>
                    </View>

                    {metric.comparableValues.map((cv, cvIndex) => (
                      <View key={cvIndex} style={styles.miniBarChartBar}>
                        <View
                          style={[
                            styles.miniBarChartBarFill,
                            {
                              width: `${Math.min(100, (cv.value / metric.subjectValue) * 100)}%`,
                              backgroundColor: getDifferenceColor(cv.percentDifference),
                            },
                          ]}
                        >
                          <Text style={styles.miniBarChartLabel}>
                            {metric.type === ComparisonMetricType.PRICE
                              ? formatCurrency(cv.value)
                              : metric.type === ComparisonMetricType.PRICE_PER_SQFT
                                ? "$" + formatNumber(cv.value) + "/sqft"
                                : formatNumber(cv.value)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // Render dashboard modal
  const renderDashboardModal = () => {
    return (
      <Modal
        visible={showDashboardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDashboardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Select Dashboard</Text>
              <TouchableOpacity
</> onPress={() => setShowDashboardModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={dashboards}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dashboardItem,
                    selectedDashboard?.id === item.id && styles.dashboardItemSelected,
                  ]}
                  onPress={() => handleDashboardSelect(item)}
                >
                  <View style={styles.dashboardItemIcon}><>

                    <MaterialCommunityIcons
                      name={
                        item.visualizationMode === VisualizationMode.CHART
                          ? "chart-bar"
                          : item.visualizationMode === VisualizationMode.TABLE
                            ? "table"
                            : item.visualizationMode === VisualizationMode.MAP
                              ? "map"
                              : "view-grid"
                      }
                      size={24}
                      color={selectedDashboard?.id === item.id ? "#fff" : "#3498db"}
                    />
                  </View>

                  <View
</> style={styles.dashboardItemContent}><>

                    <Text
                      style={[
                        styles.dashboardItemName,
                        selectedDashboard?.id === item.id && styles.dashboardItemNameSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
</>
                      style={[
                        styles.dashboardItemDescription,
                        selectedDashboard?.id === item.id &&
                          styles.dashboardItemDescriptionSelected,
                      ]}
                    >
                      {item.description}
                    </Text>
                  </View>

                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              style={styles.dashboardsList}
              contentContainerStyle={styles.dashboardsListContent}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDashboardModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render reconciled value modal
  const renderReconciledValueModal = () => {
    return (
      <Modal
        visible={showReconciledValueModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReconciledValueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Set Reconciled Value</Text>
              <TouchableOpacity
</> onPress={() => setShowReconciledValueModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}><>

              <Text style={styles.modalLabel}>Reconciled Value</Text>
              <TextInput
</>
                style={styles.valueInput}
                value={reconciledValue}
                onChangeText={setReconciledValue}
                keyboardType="decimal-pad"
                placeholder="Enter value"
              /><>


              <Text style={styles.modalLabel}>Notes</Text>
              <TextInput
</>
                style={styles.notesInput}
                value={reconciledNotes}
                onChangeText={setReconciledNotes}
                placeholder="Enter notes (optional)"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowReconciledValueModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveReconciledValue}>
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render details modal
  const renderDetailsModal = () => {
    if (!comparisonResult) return null;

    return (
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Detailed Comparison</Text>
              <TouchableOpacity
</> onPress={() => setShowDetailsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View><>


            <ScrollView style={styles.modalScrollView}>
              {/* Render table view regardless of selected dashboard */}
              {renderTableView()}
            </ScrollView>

            <TouchableOpacity
</> style={styles.modalButton} onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render saved results modal
  const renderSavedResultsModal = () => {
    return (
      <Modal
        visible={showSavedResultsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSavedResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Saved Comparisons</Text>
              <TouchableOpacity
</> onPress={() => setShowSavedResultsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {savedResults.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <MaterialCommunityIcons name="database-off" size={48} color="#bdc3c7" />
                <Text style={styles.noResultsText}>No saved comparisons</Text>
              </View>
            ) : (
              <FlatList
                data={savedResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const dashboard = dashboards.find((d) => d.id === item.dashboardId);

                  return (
                    <TouchableOpacity
                      style={styles.savedResultItem}
                      onPress={() => handleLoadSavedResult(item)}
                    >
                      <View style={styles.savedResultHeader}><>

                        <Text style={styles.savedResultTimestamp}>
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                        <Text
</> style={styles.savedResultDashboard}>
                          {dashboard?.name || "Unknown Dashboard"}
                        </Text>
                      </View>

                      <View style={styles.savedResultDetails}><>

                        <Text style={styles.savedResultProperty}>
                          Subject: {property?.address || item.subjectPropertyId}
                        </Text>
                        <Text
</> style={styles.savedResultComparables}>
                          {item.comparablePropertyIds.length} comparables
                        </Text>
                      </View>

                      {item.valueReconciliation && (
                        <View style={styles.savedResultReconciled}><>

                          <Text style={styles.savedResultReconciledLabel}>Reconciled:</Text>
                          <Text
</> style={styles.savedResultReconciledValue}>
                            {formatCurrency(item.valueReconciliation.reconciledValue)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                style={styles.savedResultsList}
                contentContainerStyle={styles.savedResultsListContent}
              />
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSavedResultsModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render property modal
  const renderPropertyModal = () => {
    if (!selectedProperty) return null;

    return (
      <Modal
        visible={showPropertyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPropertyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Property Details</Text>
              <TouchableOpacity
</> onPress={() => setShowPropertyModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.propertyDetailHeader}><>

                <Text style={styles.propertyDetailAddress}>{selectedProperty.address}</Text>
                <Text
</> style={styles.propertyDetailLocation}>
                  {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                </Text>
              </View>

              <View style={styles.propertyDetailSection}><>

                <Text style={styles.propertyDetailSectionTitle}>Basic Information</Text>

                <View
</> style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Price:</Text>
                  <Text
</> style={styles.propertyDetailValue}>
                    {formatCurrency(selectedProperty.price)}
                  </Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Price per Sq Ft:</Text>
                  <Text
</> style={styles.propertyDetailValue}>
                    ${selectedProperty.pricePerSqFt}/sqft
                  </Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Property Type:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.propertyType}</Text>
                </View>
              </View>

              <View style={styles.propertyDetailSection}><>

                <Text style={styles.propertyDetailSectionTitle}>Characteristics</Text>

                <View
</> style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Bedrooms:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.bedrooms}</Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Bathrooms:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.bathrooms}</Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Square Footage:</Text>
                  <Text
</> style={styles.propertyDetailValue}>
                    {formatNumber(selectedProperty.squareFootage)} sq ft
                  </Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Lot Size:</Text>
                  <Text
</> style={styles.propertyDetailValue}>
                    {formatNumber(selectedProperty.lotSize)} sq ft
                  </Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Year Built:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.yearBuilt}</Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Garage Spaces:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.garageSpaces}</Text>
                </View>
              </View>

              <View style={styles.propertyDetailSection}><>

                <Text style={styles.propertyDetailSectionTitle}>Condition & Quality</Text>

                <View
</> style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Condition:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.condition}</Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Quality:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.quality}</Text>
                </View>

                <View style={styles.propertyDetailItem}><>

                  <Text style={styles.propertyDetailLabel}>Days on Market:</Text>
                  <Text
</> style={styles.propertyDetailValue}>{selectedProperty.daysOnMarket}</Text>
                </View>
              </View>

              {selectedProperty.id !== property?.id && (
                <View style={styles.propertyDetailSection}><>

                  <Text style={styles.propertyDetailSectionTitle}>Distance</Text>

                  <View
</> style={styles.propertyDetailItem}><>

                    <Text style={styles.propertyDetailLabel}>Distance from Subject:</Text>
                    <Text
</> style={styles.propertyDetailValue}>
                      {selectedProperty.distance.toFixed(2)} miles
                    </Text>
                  </View>
                </View>
              )}

              {/* Map View */}
              <View style={styles.propertyDetailMap}>
                <MapView
                  style={styles.propertyDetailMapView}
                  initialRegion={{
                    latitude: selectedProperty.latitude,
                    longitude: selectedProperty.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: selectedProperty.latitude,
                      longitude: selectedProperty.longitude,
                    }}
                    pinColor={selectedProperty.id === property?.id ? "red" : "blue"}
                  />
                </MapView>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPropertyModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading comparison data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <ScrollView style={styles.content}>
        {renderPropertyCard()}
        {renderDashboardSelector()}
        {renderComparisonResults()}
      </ScrollView>

      {/* Comparison button */}
      {renderComparisonButton()}

      {/* Modals */}
      {renderDashboardModal()}
      {renderReconciledValueModal()}
      {renderDetailsModal()}
      {renderSavedResultsModal()}
      {renderPropertyModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  valueTrendContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 16,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  propertyCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  propertyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  propertyCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  propertyMoreButton: {
    padding: 4,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  propertyDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  propertyDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  propertyDetailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#3498db",
    marginLeft: 4,
  },
  dashboardSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedDashboard: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedDashboardName: {
    marginLeft: 12,
    fontSize: 16,
  },
  dashboardDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 20,
  },
  comparisonButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  comparisonButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  comparisonButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  tableContainer: {
    marginBottom: 24,
  },
  dataTable: {
    backgroundColor: "#fff",
  },
  tableHeaderCell: {
    minWidth: 100,
  },
  tableCell: {
    minWidth: 100,
  },
  tableTotalCell: {
    backgroundColor: "#f8f9fa",
  },
  mapContainer: {
    height: 300,
    marginBottom: 24,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridGap: 8,
    marginBottom: 24,
  },
  gridItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  gridItemChart: {
    flex: 1,
  },
  miniBarChart: {
    flex: 1,
  },
  miniBarChartBar: {
    height: 24,
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    marginBottom: 4,
  },
  miniBarChartBarFill: {
    height: "100%",
    borderRadius: 4,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  miniBarChartLabel: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  reconciledValueSection: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
  },
  reconciledValueTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  reconciledValueContent: {
    alignItems: "center",
  },
  reconciledValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2ecc71",
    marginBottom: 8,
  },
  valueRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  valueRangeLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginRight: 4,
  },
  valueRange: {
    fontSize: 14,
  },
  reconciledNotes: {
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    marginBottom: 16,
    width: "100%",
  },
  reconciledNotesLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  reconciledNotesText: {
    fontSize: 14,
  },
  editReconciledValueButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editReconciledValueButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  reconciledValueEmpty: {
    alignItems: "center",
  },
  reconciledValueEmptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  setReconciledValueButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  setReconciledValueButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  similarityScoresSection: {
    marginBottom: 24,
  },
  similarityScoresTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  similarityScoresList: {
    marginTop: 8,
  },
  similarityScoreItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  similarityScoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  similarityScoreAddress: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  similarityScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  similarityScoreBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  similarityScoreCategories: {
    marginTop: 4,
  },
  similarityScoreCategory: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  similarityScoreCategoryName: {
    width: 100,
    fontSize: 12,
    color: "#7f8c8d",
  },
  similarityScoreCategoryValue: {
    height: 8,
    borderRadius: 4,
  },
  miniTrendContainer: {
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalScrollView: {
    maxHeight: 500,
    padding: 16,
  },
  modalButton: {
    backgroundColor: "#3498db",
    padding: 16,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  dashboardsList: {
    maxHeight: 400,
  },
  dashboardsListContent: {
    padding: 16,
  },
  dashboardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  dashboardItemSelected: {
    backgroundColor: "#3498db",
  },
  dashboardItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dashboardItemContent: {
    flex: 1,
  },
  dashboardItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  dashboardItemNameSelected: {
    color: "#fff",
  },
  dashboardItemDescription: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  dashboardItemDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  defaultBadge: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  valueInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  modalCancelButtonText: {
    color: "#7f8c8d",
  },
  modalSaveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 4,
  },
  modalSaveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 16,
  },
  savedResultsList: {
    maxHeight: 400,
  },
  savedResultsListContent: {
    padding: 16,
  },
  savedResultItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  savedResultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  savedResultTimestamp: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  savedResultDashboard: {
    fontSize: 12,
    color: "#3498db",
  },
  savedResultDetails: {
    marginBottom: 8,
  },
  savedResultProperty: {
    fontSize: 14,
    fontWeight: "500",
  },
  savedResultComparables: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  savedResultReconciled: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f6f3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  savedResultReconciledLabel: {
    fontSize: 14,
    color: "#2ecc71",
    marginRight: 4,
  },
  savedResultReconciledValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2ecc71",
  },
  propertyDetailHeader: {
    marginBottom: 16,
  },
  propertyDetailAddress: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  propertyDetailLocation: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  propertyDetailSection: {
    marginBottom: 16,
  },
  propertyDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  propertyDetailItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  propertyDetailLabel: {
    width: 120,
    fontSize: 14,
    color: "#7f8c8d",
  },
  propertyDetailValue: {
    flex: 1,
    fontSize: 14,
  },
  propertyDetailMap: {
    height: 200,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  propertyDetailMapView: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default PropertyComparisonDashboard;
