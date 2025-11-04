import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AnimatedSparkline from "./AnimatedSparkline";
import {
  PropertyValueHistoryService,
  ValueHistoryType,
  ValueHistoryPeriod,
  ValueHistoryInterval,
  ValueHistorySeries,
} from "../services/PropertyValueHistoryService";

interface PropertyValueTrendProps {
  propertyId: string;
  width?: number;
  height?: number;
  showHeader?: boolean;
  showDetails?: boolean;
  valueTypes?: ValueHistoryType[];
  period?: ValueHistoryPeriod;
  onValueUpdate?: (value: number) => void;
}

const PropertyValueTrend: React.FC<PropertyValueTrendProps> = ({
  propertyId,
  width = 300,
  height = 160,
  showHeader = true,
  showDetails = true,
  valueTypes = [ValueHistoryType.MARKET, ValueHistoryType.APPRAISED],
  period = ValueHistoryPeriod.YEAR_3,
  onValueUpdate,
}) => {
  // Service
  const valueHistoryService = PropertyValueHistoryService.getInstance();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [valueSummary, setValueSummary] = useState<{
    currentValue: number;
    historicalChange: number;
    forecastedChange: number;
    lastUpdated: string;
    confidence: number;
    series: ValueHistorySeries[];
  } | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<ValueHistorySeries | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Load property value data
  useEffect(() => {
    loadPropertyValueData();
  }, [propertyId, period]);

  // Load property value data
  const loadPropertyValueData = async () => {
    try {
      setIsLoading(true);

      // Initialize service
      valueHistoryService.initialize({
        defaultRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
        defaultColors: {
          [ValueHistoryType.ASSESSED]: "#3498db",
          [ValueHistoryType.MARKET]: "#2ecc71",
          [ValueHistoryType.APPRAISED]: "#f39c12",
          [ValueHistoryType.LISTING]: "#e74c3c",
          [ValueHistoryType.SOLD]: "#9b59b6",
          [ValueHistoryType.AUTOMATED]: "#1abc9c",
          [ValueHistoryType.FORECASTED]: "#34495e",
          [ValueHistoryType.CUSTOM]: "#95a5a6",
        },
        maxHistoryPoints: 100,
        autoGenerateStatistics: true,
      });

      // Fetch value history for each type
      await Promise.all(
        valueTypes.map((type) =>
          valueHistoryService.fetchValueHistory(
            propertyId,
            type,
            period,
            period === ValueHistoryPeriod.DAYS_30
              ? ValueHistoryInterval.DAY
              : period === ValueHistoryPeriod.DAYS_90
                ? ValueHistoryInterval.WEEK
                : period === ValueHistoryPeriod.DAYS_180
                  ? ValueHistoryInterval.WEEK
                  : period === ValueHistoryPeriod.YEAR_1
                    ? ValueHistoryInterval.MONTH
                    : ValueHistoryInterval.MONTH
          )
        )
      );

      // If no data available, generate mock data for demo
      const existingSeries = await valueHistoryService.getValueHistorySeries(propertyId);

      if (existingSeries.length === 0) {
        for (const type of valueTypes) {
          switch (type) {
            case ValueHistoryType.MARKET:
              await valueHistoryService.generateMockValueHistory(
                propertyId,
                type,
                500000,
                36,
                0.03
              );
              break;
            case ValueHistoryType.APPRAISED:
              await valueHistoryService.generateMockValueHistory(
                propertyId,
                type,
                480000,
                12,
                0.02
              );
              break;
            case ValueHistoryType.ASSESSED:
              await valueHistoryService.generateMockValueHistory(
                propertyId,
                type,
                450000,
                36,
                0.01
              );
              break;
            case ValueHistoryType.AUTOMATED:
              await valueHistoryService.generateMockValueHistory(
                propertyId,
                type,
                490000,
                36,
                0.04
              );
              break;
            case ValueHistoryType.FORECASTED:
              await valueHistoryService.generateMockValueHistory(
                propertyId,
                type,
                520000,
                12,
                0.03
              );
              break;
            default:
              break;
          }
        }
      }

      // Get value summary
      const summary = await valueHistoryService.getPropertyValueSummary(propertyId);
      setValueSummary(summary);

      // Set selected series to highest priority
      if (summary.series.length > 0) {
        setSelectedSeries(summary.series[0]);
      }

      // Notify parent of current value
      if (onValueUpdate) {
        onValueUpdate(summary.currentValue);
      }
    } catch (error) {
      console.error("Error loading property value data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadPropertyValueData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle series select
  const handleSeriesSelect = (series: ValueHistorySeries) => {
    setSelectedSeries(series);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  // Format date
  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading value trends...</Text>
      </View>
    );
  }

  // Render no data state
  if (!valueSummary || !selectedSeries) {
    return (
      <View style={[styles.container, { width, height }]}>
        <MaterialCommunityIcons name="chart-line-variant" size={48} color="#bdc3c7" /><>

        <Text style={styles.noDataText}>No value history available</Text>
        <TouchableOpacity
</> style={styles.refreshButton} onPress={handleRefresh}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get data points as values array for the sparkline
  const dataValues = selectedSeries.dataPoints.map((dp) => dp.value);

  // Get color for percentage change
  const getChangeColor = (change: number): string => {
    if (change > 0) return "#2ecc71";
    if (change < 0) return "#e74c3c";
    return "#7f8c8d";
  };

  return (
    <View style={[styles.container, { width }]}>
      {/* Header */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}><>

            <Text style={styles.headerTitle}>Property Value Trend</Text>
            <Text
</> style={styles.lastUpdated}>
              Last updated: {new Date(valueSummary.lastUpdated).toLocaleDateString()}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Current Value */}
      <View style={styles.valueContainer}><>

        <Text style={styles.valueLabel}>Current Value</Text>
        <Text
</> style={styles.valueAmount}>{formatCurrency(valueSummary.currentValue)}</Text>
        <View style={styles.changeContainer}><>

          <Text
            style={[styles.changeValue, { color: getChangeColor(valueSummary.historicalChange) }]}
          >
            {formatPercentage(valueSummary.historicalChange)}
          </Text>
          <Text
</> style={styles.changePeriod}>Past {getPeriodText(period)}</Text>
        </View>

        {valueSummary.confidence > 0 && (
          <View style={styles.confidenceContainer}>
            <View style={[styles.confidenceBar, { width: `${valueSummary.confidence * 100}%` }]} />
            <Text style={styles.confidenceText}>
              {Math.round(valueSummary.confidence * 100)}% Confidence
            </Text>
          </View>
        )}
      </View>

      {/* Series Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seriesSelector}>
        {valueSummary.series.map((series) => (
          <TouchableOpacity
            key={series.id}
            style={[
              styles.seriesButton,
              selectedSeries?.id === series.id && styles.seriesButtonSelected,
              { borderColor: series.color },
            ]}
            onPress={() => handleSeriesSelect(series)}
          >
            <Text
              style={[
                styles.seriesButtonText,
                selectedSeries?.id === series.id && styles.seriesButtonTextSelected,
                selectedSeries?.id === series.id && { color: series.color },
              ]}
            >
              {series.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sparkline */}
      <View style={styles.sparklineContainer}>
        <AnimatedSparkline
          data={dataValues}
          width={width - 32}
          height={120}
          color={selectedSeries.color}
          lineWidth={2}
          showDots={dataValues.length < 24}
          showArea={true}
          animated={true}
          animationDuration={1500}
          highlightLast={true}
          formatValue={formatCurrency}
        />

        {/* X-axis labels */}
        <View style={styles.timeLabels}><>

          <Text style={styles.timeLabel}>
            {selectedSeries.dataPoints.length > 0
              ? formatDate(selectedSeries.dataPoints[0].date)
              : ""}
          </Text>
          <Text
</> style={styles.timeLabel}>
            {selectedSeries.dataPoints.length > 0
              ? formatDate(selectedSeries.dataPoints[selectedSeries.dataPoints.length - 1].date)
              : ""}
          </Text>
        </View>
      </View>

      {/* Details Button */}
      {showDetails && (
        <TouchableOpacity style={styles.detailsButton} onPress={() => setShowDetailModal(true)}>
          <MaterialCommunityIcons name="chart-box-outline" size={16} color="#3498db" />
          <Text style={styles.detailsButtonText}>View Detailed Charts</Text>
        </TouchableOpacity>
      )}

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Value History</Text>
              <TouchableOpacity
</> onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Overview */}
              <View style={styles.modalSection}><>

                <Text style={styles.modalSectionTitle}>Current Value</Text>
                <Text
</> style={styles.modalValueLarge}>
                  {formatCurrency(valueSummary.currentValue)}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}><>

                    <Text style={styles.statLabel}>Historical Change</Text>
                    <Text
</>
                      style={[
                        styles.statValue,
                        { color: getChangeColor(valueSummary.historicalChange) },
                      ]}
                    >
                      {formatPercentage(valueSummary.historicalChange)}
                    </Text>
                  </View>

                  {valueSummary.forecastedChange !== 0 && (
                    <View style={styles.statItem}><>

                      <Text style={styles.statLabel}>Forecast Change</Text>
                      <Text
</>
                        style={[
                          styles.statValue,
                          { color: getChangeColor(valueSummary.forecastedChange) },
                        ]}
                      >
                        {formatPercentage(valueSummary.forecastedChange)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.statItem}><>

                    <Text style={styles.statLabel}>Confidence</Text>
                    <Text
</> style={styles.statValue}>
                      {Math.round(valueSummary.confidence * 100)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* All Series Charts */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Value History</Text>

                {valueSummary.series.map((series) => (
                  <View key={series.id} style={styles.seriesChart}>
                    <View style={styles.seriesChartHeader}><>

                      <Text style={styles.seriesChartTitle}>{series.name}</Text>
                      <View
</> style={[styles.seriesIndicator, { backgroundColor: series.color }]} />
                    </View>

                    <AnimatedSparkline
                      data={series.dataPoints.map((dp) => dp.value)}
                      width={width - 64}
                      height={150}
                      color={series.color}
                      lineWidth={2}
                      showDots={series.dataPoints.length < 24}
                      showArea={true}
                      showAxes={true}
                      showLabels={true}
                      animated={true}
                      animationDuration={1500}
                      highlightLast={true}
                      formatValue={formatCurrency}
                    />

                    <View style={styles.seriesStats}>
                      <View style={styles.seriesStat}><>

                        <Text style={styles.seriesStatLabel}>Min</Text>
                        <Text
</> style={styles.seriesStatValue}>
                          {formatCurrency(series.statistics?.min || 0)}
                        </Text>
                      </View>

                      <View style={styles.seriesStat}><>

                        <Text style={styles.seriesStatLabel}>Max</Text>
                        <Text
</> style={styles.seriesStatValue}>
                          {formatCurrency(series.statistics?.max || 0)}
                        </Text>
                      </View>

                      <View style={styles.seriesStat}><>

                        <Text style={styles.seriesStatLabel}>Change</Text>
                        <Text
</>
                          style={[
                            styles.seriesStatValue,
                            { color: getChangeColor(series.statistics?.changePercent || 0) },
                          ]}
                        >
                          {formatPercentage(series.statistics?.changePercent || 0)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dataPoints}><>

                      <Text style={styles.dataPointsTitle}>Data Points</Text>
                      <FlatList
</>
                        data={series.dataPoints.slice().reverse()}
                        keyExtractor={(item /* , index */) => `${item.date}-${index}`}
                        renderItem={({ item }) => (
                          <View style={styles.dataPoint}><>

                            <Text style={styles.dataPointDate}>{item.date}</Text>
                            <Text
</> style={styles.dataPointValue}>{formatCurrency(item.value)}</Text>
                            <Text style={styles.dataPointSource}>{item.source || "Unknown"}</Text>
                          </View>
                        )}
                        style={styles.dataPointsList}
                        scrollEnabled={false}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowDetailModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Helper to get human-readable period text
const getPeriodText = (period: ValueHistoryPeriod): string => {
  switch (period) {
    case ValueHistoryPeriod.DAYS_30:
      return "30 days";
    case ValueHistoryPeriod.DAYS_90:
      return "3 months";
    case ValueHistoryPeriod.DAYS_180:
      return "6 months";
    case ValueHistoryPeriod.YEAR_1:
      return "year";
    case ValueHistoryPeriod.YEAR_3:
      return "3 years";
    case ValueHistoryPeriod.YEAR_5:
      return "5 years";
    case ValueHistoryPeriod.YEAR_10:
      return "10 years";
    case ValueHistoryPeriod.MAX:
      return "all time";
    default:
      return "period";
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#7f8c8d",
  },
  noDataText: {
    marginTop: 8,
    color: "#7f8c8d",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  valueContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  valueAmount: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 4,
  },
  changePeriod: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  confidenceContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "#ecf0f1",
    borderRadius: 2,
    marginTop: 8,
    position: "relative",
  },
  confidenceBar: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 2,
  },
  confidenceText: {
    position: "absolute",
    top: 4,
    right: 0,
    fontSize: 10,
    color: "#7f8c8d",
  },
  seriesSelector: {
    flexDirection: "row",
    marginBottom: 16,
    maxHeight: 40,
  },
  seriesButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  seriesButtonSelected: {
    backgroundColor: "#f8f9fa",
  },
  seriesButtonText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  seriesButtonTextSelected: {
    fontWeight: "bold",
  },
  sparklineContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  timeLabels: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  timeLabel: {
    fontSize: 10,
    color: "#7f8c8d",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  detailsButtonText: {
    fontSize: 12,
    color: "#3498db",
    marginLeft: 4,
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
    maxHeight: "90%",
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
  modalBody: {
    padding: 16,
    maxHeight: 500,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalValueLarge: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  statItem: {
    minWidth: 100,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  seriesChart: {
    marginBottom: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
  },
  seriesChartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seriesChartTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  seriesIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  seriesStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  seriesStat: {
    alignItems: "center",
  },
  seriesStatLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  seriesStatValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dataPoints: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  dataPointsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dataPointsList: {
    maxHeight: 200,
  },
  dataPoint: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dataPointDate: {
    flex: 1,
    fontSize: 12,
  },
  dataPointValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  dataPointSource: {
    flex: 1,
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "right",
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
});

export default PropertyValueTrend;
