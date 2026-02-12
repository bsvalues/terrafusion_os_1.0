import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Slider from "@react-native-community/slider";

import {
  ComparableService,
  ComparableProperty,
  SubjectProperty,
  ComparableSearchCriteria,
  MarketTrend,
  AdjustmentFactor,
} from "../services/ComparableService";

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Filter options
 */
interface FilterOptions {
  radius: number;
  maxResults: number;
  minSalePrice: number;
  maxSalePrice: number;
  minSqFt: number;
  maxSqFt: number;
  includeActive: boolean;
  includePending: boolean;
  onlyVerified: boolean;
  saleDateRange: number; // Months
  sortBy: "distance" | "date" | "price" | "similarity";
  sortDirection: "asc" | "desc";
}

/**
 * Default filter options
 */
const DEFAULT_FILTERS: FilterOptions = {
  radius: 1.0,
  maxResults: 10,
  minSalePrice: 0,
  maxSalePrice: 10000000,
  minSqFt: 0,
  maxSqFt: 10000,
  includeActive: false,
  includePending: false,
  onlyVerified: true,
  saleDateRange: 12, // Last 12 months
  sortBy: "similarity",
  sortDirection: "desc",
};

/**
 * ComparableSearchScreen
 *
 * A screen for searching and comparing comparable properties
 */
const ComparableSearchScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property from route params
  const propertyData = route.params?.property;

  // Service
  const comparableService = ComparableService.getInstance();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [subjectProperty, setSubjectProperty] = useState<SubjectProperty | null>(null);
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [selectedComparable, setSelectedComparable] = useState<ComparableProperty | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showMarketTrendsModal, setShowMarketTrendsModal] = useState<boolean>(false);
  const [showAdjustmentsModal, setShowAdjustmentsModal] = useState<boolean>(false);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [adjustmentFactors, setAdjustmentFactors] = useState<AdjustmentFactor[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState<boolean>(false);
  const [isLoadingAdjustments, setIsLoadingAdjustments] = useState<boolean>(false);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Initialize comparable service
        comparableService.initialize({
          apiUrl: "https://api.appraisalcore.replit.app/api/comparables",
          cacheResults: true,
          cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
          offlineMode: false,
          maxRadius: 5.0,
          minSimilarityScore: 0.5,
          applyTimeAdjustments: true,
        });

        // Set subject property from route params or create a default one
        if (propertyData) {
          const subject: SubjectProperty = {
            id: propertyData.id || "subject_property",
            address: propertyData.address || "",
            city: propertyData.city || "",
            state: propertyData.state || "",
            postalCode: propertyData.postalCode || "",
            country: propertyData.country || "USA",
            squareFootage: propertyData.squareFootage || 2000,
            lotSize: propertyData.lotSize || 5000,
            bedrooms: propertyData.bedrooms || 3,
            bathrooms: propertyData.bathrooms || 2,
            yearBuilt: propertyData.yearBuilt || 2000,
            propertyType: propertyData.propertyType || "Single Family",
            constructionQuality: propertyData.constructionQuality,
            condition: propertyData.condition,
            amenities: propertyData.amenities,
            locationQuality: propertyData.locationQuality,
            viewQuality: propertyData.viewQuality,
            latitude: propertyData.latitude,
            longitude: propertyData.longitude,
          };

          setSubjectProperty(subject);

          // Set default price range based on property
          if (propertyData.estimatedValue) {
            const estValue = propertyData.estimatedValue;
            setFilters((prev) => ({
              ...prev,
              minSalePrice: Math.max(0, estValue * 0.7),
              maxSalePrice: estValue * 1.3,
            }));
          }

          // Set default square footage range
          if (propertyData.squareFootage) {
            const sqft = propertyData.squareFootage;
            setFilters((prev) => ({
              ...prev,
              minSqFt: Math.max(0, sqft * 0.7),
              maxSqFt: sqft * 1.3,
            }));
          }

          // Load adjustment factors
          loadAdjustmentFactors(subject);

          // Load market trends
          if (subject.city && subject.state) {
            loadMarketTrends(subject);
          }

          // Perform initial search
          searchComparables(subject);
        } else {
          // Create default subject property for demo
          const defaultSubject: SubjectProperty = {
            id: "subject_property",
            address: "123 Main St",
            city: "Anytown",
            state: "CA",
            postalCode: "90210",
            country: "USA",
            squareFootage: 2000,
            lotSize: 5000,
            bedrooms: 3,
            bathrooms: 2,
            yearBuilt: 2000,
            propertyType: "Single Family",
          };

          setSubjectProperty(defaultSubject);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing comparable search:", error);
        setIsLoading(false);
        Alert.alert("Error", "Failed to initialize comparable search");
      }
    };

    initialize();
  }, [propertyData]);

  // Load market trends
  const loadMarketTrends = async (subject: SubjectProperty) => {
    if (!subject.city || !subject.state) return;

    try {
      setIsLoadingTrends(true);

      const trends = await comparableService.getMarketTrends(
        { city: subject.city, state: subject.state },
        12
      );

      setMarketTrends(trends);
    } catch (error) {
      console.error("Error loading market trends:", error);
    } finally {
      setIsLoadingTrends(false);
    }
  };

  // Load adjustment factors
  const loadAdjustmentFactors = async (subject: SubjectProperty) => {
    try {
      setIsLoadingAdjustments(true);

      const location =
        subject.city && subject.state ? { city: subject.city, state: subject.state } : undefined;

      const factors = await comparableService.getAdjustmentFactors(location);

      setAdjustmentFactors(factors);
    } catch (error) {
      console.error("Error loading adjustment factors:", error);
    } finally {
      setIsLoadingAdjustments(false);
    }
  };

  // Search comparables
  const searchComparables = async (subject: SubjectProperty) => {
    if (!subject) return;

    try {
      setIsSearching(true);

      // Prepare search criteria
      const searchCriteria: Partial<ComparableSearchCriteria> = {
        subjectProperty: subject,
        radius: filters.radius,
        maxResults: filters.maxResults,
        saleDate: {
          from: getDateMonthsAgo(filters.saleDateRange).toISOString(),
          to: new Date().toISOString(),
        },
        priceRange: {
          min: filters.minSalePrice,
          max: filters.maxSalePrice,
        },
        squareFootageRange: {
          min: filters.minSqFt,
          max: filters.maxSqFt,
        },
        includeActive: filters.includeActive,
        includePending: filters.includePending,
        onlyVerified: filters.onlyVerified,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      };

      // Perform search
      const results = await comparableService.findComparables(searchCriteria);

      // Apply adjustments to results
      const adjustedResults = results.map((comp) =>
        comparableService.applyAdjustments(comp, subject, adjustmentFactors)
      );

      setComparables(adjustedResults);
      setIsSearching(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error searching comparables:", error);
      setIsSearching(false);
      setIsLoading(false);
      Alert.alert("Error", "Failed to search for comparable properties");
    }
  };

  // Get date X months ago
  const getDateMonthsAgo = (months: number): Date => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  };

  // Handle filter change
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    setShowFiltersModal(false);

    if (subjectProperty) {
      searchComparables(subjectProperty);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Handle view comparable
  const handleViewComparable = (comparable: ComparableProperty) => {
    setSelectedComparable(comparable);
    setShowDetailModal(true);
  };

  // Handle save comparable
  const handleSaveComparable = async (comparable: ComparableProperty) => {
    try {
      const saved = await comparableService.saveComparable(comparable);

      if (saved) {
        Alert.alert("Success", "Comparable property saved successfully");
      } else {
        Alert.alert("Error", "Failed to save comparable property");
      }
    } catch (error) {
      console.error("Error saving comparable:", error);
      Alert.alert("Error", "Failed to save comparable property");
    }
  };

  // Render header
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><>

          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text
</> style={styles.headerTitle}>Comparable Properties</Text>

        <TouchableOpacity style={styles.filtersButton} onPress={() => setShowFiltersModal(true)}>
          <MaterialCommunityIcons name="filter-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render subject property
  const renderSubjectProperty = () => {
    if (!subjectProperty) return null;

    return (
      <View style={styles.subjectContainer}>
        <View style={styles.subjectHeader}><>

          <Text style={styles.subjectTitle}>Subject Property</Text>
          <TouchableOpacity
</>
            style={styles.marketTrendsButton}
            onPress={() => setShowMarketTrendsModal(true)}
          >
            <MaterialCommunityIcons name="chart-line" size={16} color="#fff" />
            <Text style={styles.marketTrendsText}>Market Trends</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subjectDetails}><>

          <Text style={styles.subjectAddress}>{subjectProperty.address}</Text>
          <Text
</> style={styles.subjectLocation}>
            {subjectProperty.city}, {subjectProperty.state} {subjectProperty.postalCode}
          </Text>

          <View style={styles.subjectSpecs}>
            <View style={styles.subjectSpec}>
              <MaterialCommunityIcons name="home-floor-0" size={16} color="#3498db" />
              <Text style={styles.subjectSpecText}>
                {subjectProperty.squareFootage.toLocaleString()} sq ft
              </Text>
            </View>

            <View style={styles.subjectSpec}>
              <MaterialCommunityIcons name="bed" size={16} color="#3498db" />
              <Text style={styles.subjectSpecText}>
                {subjectProperty.bedrooms} {subjectProperty.bedrooms === 1 ? "bed" : "beds"}
              </Text>
            </View>

            <View style={styles.subjectSpec}>
              <MaterialCommunityIcons name="shower" size={16} color="#3498db" />
              <Text style={styles.subjectSpecText}>
                {subjectProperty.bathrooms} {subjectProperty.bathrooms === 1 ? "bath" : "baths"}
              </Text>
            </View>
          </View>

          <View style={styles.subjectSpecs}>
            <View style={styles.subjectSpec}>
              <MaterialCommunityIcons name="calendar" size={16} color="#3498db" />
              <Text style={styles.subjectSpecText}>Built {subjectProperty.yearBuilt}</Text>
            </View>

            <View style={styles.subjectSpec}>
              <MaterialCommunityIcons name="home" size={16} color="#3498db" />
              <Text style={styles.subjectSpecText}>{subjectProperty.propertyType}</Text>
            </View>

            {subjectProperty.condition && (
              <View style={styles.subjectSpec}>
                <MaterialCommunityIcons name="home-check" size={16} color="#3498db" />
                <Text style={styles.subjectSpecText}>{subjectProperty.condition}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render comparables list
  const renderComparablesList = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Searching for comparables...</Text>
        </View>
      );
    }

    if (comparables.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="home-search" size={48} color="#bdc3c7" /><>

          <Text style={styles.emptyText}>No comparable properties found</Text>
          <Text
</> style={styles.emptySubtext}>Try adjusting your search filters</Text>
          <TouchableOpacity
            style={styles.filtersButtonEmpty}
            onPress={() => setShowFiltersModal(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={20} color="#fff" />
            <Text style={styles.filtersButtonText}>Adjust Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={comparables}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.comparableItem}
            onPress={() => handleViewComparable(item)}
          >
            <View style={styles.comparableHeader}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  {comparableService.formatCurrency(item.salePrice)}
                </Text>
              </View>
              {item.adjustedPrice && (
                <View style={styles.adjustedPriceBadge}>
                  <Text style={styles.adjustedPriceText}>
                    Adjusted: {comparableService.formatCurrency(item.adjustedPrice)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.comparableContent}>
              <View style={styles.comparableImageContainer}>
                {item.photos && item.photos.length > 0 ? (
                  <Image
                    source={{ uri: item.photos[0] }}
                    style={styles.comparableImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <MaterialCommunityIcons name="home" size={32} color="#bdc3c7" />
                  </View>
                )}
                {item.similarityScore !== undefined && (
                  <View
                    style={[
                      styles.similarityBadge,
                      {
                        backgroundColor:
                          item.similarityScore >= 0.8
                            ? "#2ecc71"
                            : item.similarityScore >= 0.6
                              ? "#f39c12"
                              : "#e74c3c",
                      },
                    ]}
                  >
                    <Text style={styles.similarityText}>
                      {Math.round(item.similarityScore * 100)}% Match
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.comparableInfo}><>

                <Text style={styles.comparableAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                <Text
</> style={styles.comparableLocation}>
                  {item.city}, {item.state} {item.postalCode}
                </Text>

                <View style={styles.comparableSpecs}><>

                  <Text style={styles.comparableSpecText}>
                    {item.squareFootage.toLocaleString()} sq ft
                  </Text>
                  <Text
</> style={styles.comparableSpecText}>{item.bedrooms} bed</Text>
                  <Text style={styles.comparableSpecText}>{item.bathrooms} bath</Text>
                </View>

                <View style={styles.comparableFooter}>
                  <Text style={styles.comparableDate}>
                    Sold {comparableService.formatDate(item.saleDate)}
                  </Text>
                  {item.distance !== undefined && (
                    <Text style={styles.comparableDistance}>
                      {item.distance.toFixed(1)} miles away
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        style={styles.comparablesList}
        contentContainerStyle={styles.comparablesContent}
      />
    );
  };

  // Render filters modal
  const renderFiltersModal = () => {
    return (
      <Modal
        visible={showFiltersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.filtersModal}>
            <View style={styles.filtersHeader}><>

              <Text style={styles.filtersTitle}>Search Filters</Text>
              <TouchableOpacity
</> onPress={() => setShowFiltersModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersContent}>
              {/* Radius filter */}
              <View style={styles.filterSection}><>

                <Text style={styles.filterLabel}>
                  Search Radius: {filters.radius.toFixed(1)} miles
                </Text>
                <Slider
</>
                  style={styles.slider}
                  value={filters.radius}
                  onValueChange={(value) => handleFilterChange("radius", value)}
                  minimumValue={0.5}
                  maximumValue={5}
                  step={0.5}
                  minimumTrackTintColor="#3498db"
                  maximumTrackTintColor="#bdc3c7"
                  thumbTintColor="#3498db"
                />
                <View style={styles.sliderValues}><>

                  <Text style={styles.sliderMinValue}>0.5</Text>
                  <Text
</> style={styles.sliderMaxValue}>5 miles</Text>
                </View>
              </View>

              {/* Price Range filter */}
              <View style={styles.filterSection}><>

                <Text style={styles.filterLabel}>
                  Price Range: {comparableService.formatCurrency(filters.minSalePrice)} -{" "}
                  {comparableService.formatCurrency(filters.maxSalePrice)}
                </Text>
                <View
</> style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    value={filters.minSalePrice.toString()}
                    onChangeText={(text) =>
                      handleFilterChange("minSalePrice", Number(text.replace(/[^0-9]/g, "")))
                    }
                    keyboardType="numeric"
                    placeholder="Min Price"
                  /><>

                  <Text style={styles.priceSeparator}>to</Text>
                  <TextInput
</>
                    style={styles.priceInput}
                    value={filters.maxSalePrice.toString()}
                    onChangeText={(text) =>
                      handleFilterChange("maxSalePrice", Number(text.replace(/[^0-9]/g, "")))
                    }
                    keyboardType="numeric"
                    placeholder="Max Price"
                  />
                </View>
              </View>

              {/* Square Footage Range filter */}
              <View style={styles.filterSection}><>

                <Text style={styles.filterLabel}>
                  Square Footage: {filters.minSqFt.toLocaleString()} -{" "}
                  {filters.maxSqFt.toLocaleString()} sq ft
                </Text>
                <View
</> style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    value={filters.minSqFt.toString()}
                    onChangeText={(text) =>
                      handleFilterChange("minSqFt", Number(text.replace(/[^0-9]/g, "")))
                    }
                    keyboardType="numeric"
                    placeholder="Min Sq Ft"
                  /><>

                  <Text style={styles.priceSeparator}>to</Text>
                  <TextInput
</>
                    style={styles.priceInput}
                    value={filters.maxSqFt.toString()}
                    onChangeText={(text) =>
                      handleFilterChange("maxSqFt", Number(text.replace(/[^0-9]/g, "")))
                    }
                    keyboardType="numeric"
                    placeholder="Max Sq Ft"
                  />
                </View>
              </View>

              {/* Sale Date Range filter */}
              <View style={styles.filterSection}><>

                <Text style={styles.filterLabel}>
                  Sale Date Range: Last {filters.saleDateRange} months
                </Text>
                <Slider
</>
                  style={styles.slider}
                  value={filters.saleDateRange}
                  onValueChange={(value) => handleFilterChange("saleDateRange", value)}
                  minimumValue={3}
                  maximumValue={36}
                  step={3}
                  minimumTrackTintColor="#3498db"
                  maximumTrackTintColor="#bdc3c7"
                  thumbTintColor="#3498db"
                />
                <View style={styles.sliderValues}><>

                  <Text style={styles.sliderMinValue}>3 months</Text>
                  <Text
</> style={styles.sliderMaxValue}>36 months</Text>
                </View>
              </View>

              {/* Max Results filter */}
              <View style={styles.filterSection}><>

                <Text style={styles.filterLabel}>Maximum Results: {filters.maxResults}</Text>
                <Slider
</>
                  style={styles.slider}
                  value={filters.maxResults}
                  onValueChange={(value) => handleFilterChange("maxResults", value)}
                  minimumValue={5}
                  maximumValue={20}
                  step={5}
                  minimumTrackTintColor="#3498db"
                  maximumTrackTintColor="#bdc3c7"
                  thumbTintColor="#3498db"
                />
                <View style={styles.sliderValues}><>

                  <Text style={styles.sliderMinValue}>5 results</Text>
                  <Text
</> style={styles.sliderMaxValue}>20 results</Text>
                </View>
              </View>

              {/* Sort options */}
              <View style={styles.filterSection}><>

                <Text style={styles.filterLabel}>Sort By</Text>
                <View
</> style={styles.sortOptions}>
                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      filters.sortBy === "similarity" && styles.selectedSortOption,
                    ]}
                    onPress={() => handleFilterChange("sortBy", "similarity")}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sortBy === "similarity" && styles.selectedSortOptionText,
                      ]}
                    >
                      Similarity
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      filters.sortBy === "distance" && styles.selectedSortOption,
                    ]}
                    onPress={() => handleFilterChange("sortBy", "distance")}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sortBy === "distance" && styles.selectedSortOptionText,
                      ]}
                    >
                      Distance
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      filters.sortBy === "price" && styles.selectedSortOption,
                    ]}
                    onPress={() => handleFilterChange("sortBy", "price")}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sortBy === "price" && styles.selectedSortOptionText,
                      ]}
                    >
                      Price
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      filters.sortBy === "date" && styles.selectedSortOption,
                    ]}
                    onPress={() => handleFilterChange("sortBy", "date")}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sortBy === "date" && styles.selectedSortOptionText,
                      ]}
                    >
                      Date
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sortDirectionContainer}><>

                  <Text style={styles.sortDirectionLabel}>Sort Direction:</Text>
                  <View
</> style={styles.sortDirectionOptions}>
                    <TouchableOpacity
                      style={[
                        styles.sortDirectionOption,
                        filters.sortDirection === "asc" && styles.selectedSortOption,
                      ]}
                      onPress={() => handleFilterChange("sortDirection", "asc")}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          filters.sortDirection === "asc" && styles.selectedSortOptionText,
                        ]}
                      >
                        Ascending
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sortDirectionOption,
                        filters.sortDirection === "desc" && styles.selectedSortOption,
                      ]}
                      onPress={() => handleFilterChange("sortDirection", "desc")}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          filters.sortDirection === "desc" && styles.selectedSortOptionText,
                        ]}
                      >
                        Descending
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Toggle options */}
              <View style={styles.filterSection}>
                <View style={styles.toggleOption}><>

                  <Text style={styles.toggleLabel}>Include Active Listings</Text>
                  <Switch
</>
                    value={filters.includeActive}
                    onValueChange={(value) => handleFilterChange("includeActive", value)}
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={filters.includeActive ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.toggleOption}><>

                  <Text style={styles.toggleLabel}>Include Pending Sales</Text>
                  <Switch
</>
                    value={filters.includePending}
                    onValueChange={(value) => handleFilterChange("includePending", value)}
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={filters.includePending ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.toggleOption}><>

                  <Text style={styles.toggleLabel}>Only Verified Sales</Text>
                  <Switch
</>
                    value={filters.onlyVerified}
                    onValueChange={(value) => handleFilterChange("onlyVerified", value)}
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={filters.onlyVerified ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.filtersFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedComparable) return null;

    return (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}><>

              <Text style={styles.detailTitle}>Comparable Details</Text>
              <TouchableOpacity
</> onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
              {/* Photos carousel */}
              <View style={styles.detailPhotos}>
                {selectedComparable.photos && selectedComparable.photos.length > 0 ? (
                  <Image
                    source={{ uri: selectedComparable.photos[0] }}
                    style={styles.detailPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.detailPlaceholderPhoto}>
                    <MaterialCommunityIcons name="home" size={48} color="#bdc3c7" />
                  </View>
                )}

                {selectedComparable.similarityScore !== undefined && (
                  <View
                    style={[
                      styles.detailSimilarityBadge,
                      {
                        backgroundColor:
                          selectedComparable.similarityScore >= 0.8
                            ? "#2ecc71"
                            : selectedComparable.similarityScore >= 0.6
                              ? "#f39c12"
                              : "#e74c3c",
                      },
                    ]}
                  >
                    <Text style={styles.detailSimilarityText}>
                      {Math.round(selectedComparable.similarityScore * 100)}% Match
                    </Text>
                  </View>
                )}
              </View>

              {/* Price section */}
              <View style={styles.detailSection}><>

                <Text style={styles.detailSectionTitle}>Price Information</Text>
                <View
</> style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Sale Price:</Text>
                  <Text
</> style={styles.detailValue}>
                    {comparableService.formatCurrency(selectedComparable.salePrice)}
                  </Text>
                </View>

                {selectedComparable.timeAdjustedValue && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>Time-Adjusted Value:</Text>
                    <Text
</> style={styles.detailValue}>
                      {comparableService.formatCurrency(selectedComparable.timeAdjustedValue)}
                    </Text>
                  </View>
                )}

                {selectedComparable.adjustedPrice && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>Adjusted Price:</Text>
                    <Text
</> style={styles.detailValue}>
                      {comparableService.formatCurrency(selectedComparable.adjustedPrice)}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Sale Date:</Text>
                  <Text
</> style={styles.detailValue}>
                    {comparableService.formatDate(selectedComparable.saleDate)}
                  </Text>
                </View>

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Price per Sq Ft:</Text>
                  <Text
</> style={styles.detailValue}>
                    {comparableService.formatCurrency(
                      selectedComparable.salePrice / selectedComparable.squareFootage
                    )}
                    /sq ft
                  </Text>
                </View>
              </View>

              {/* Property details section */}
              <View style={styles.detailSection}><>

                <Text style={styles.detailSectionTitle}>Property Details</Text>
                <View
</> style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text
</> style={styles.detailValue}>{selectedComparable.address}</Text>
                </View>

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text
</> style={styles.detailValue}>
                    {selectedComparable.city}, {selectedComparable.state}{" "}
                    {selectedComparable.postalCode}
                  </Text>
                </View>

                {selectedComparable.distance !== undefined && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>Distance:</Text>
                    <Text
</> style={styles.detailValue}>
                      {selectedComparable.distance.toFixed(1)} miles away
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Square Footage:</Text>
                  <Text
</> style={styles.detailValue}>
                    {selectedComparable.squareFootage.toLocaleString()} sq ft
                  </Text>
                </View>

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Lot Size:</Text>
                  <Text
</> style={styles.detailValue}>
                    {selectedComparable.lotSize.toLocaleString()} sq ft
                  </Text>
                </View>

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Bedrooms:</Text>
                  <Text
</> style={styles.detailValue}>{selectedComparable.bedrooms}</Text>
                </View>

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Bathrooms:</Text>
                  <Text
</> style={styles.detailValue}>{selectedComparable.bathrooms}</Text>
                </View>

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Year Built:</Text>
                  <Text
</> style={styles.detailValue}>{selectedComparable.yearBuilt}</Text>
                </View>

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Property Type:</Text>
                  <Text
</> style={styles.detailValue}>{selectedComparable.propertyType}</Text>
                </View>

                {selectedComparable.condition && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>Condition:</Text>
                    <Text
</> style={styles.detailValue}>{selectedComparable.condition}</Text>
                  </View>
                )}

                {selectedComparable.constructionQuality && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>Construction Quality:</Text>
                    <Text
</> style={styles.detailValue}>{selectedComparable.constructionQuality}</Text>
                  </View>
                )}

                {selectedComparable.amenities && selectedComparable.amenities.length > 0 && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>Amenities:</Text>
                    <Text
</> style={styles.detailValue}>
                      {selectedComparable.amenities.join(", ")}
                    </Text>
                  </View>
                )}
              </View>

              {/* Adjustments section */}
              {selectedComparable.adjustments && selectedComparable.adjustments.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Adjustments</Text>

                  {selectedComparable.adjustments.map((adjustment /* , index */) => (
                    <View key={index} style={styles.adjustmentRow}>
                      <View style={styles.adjustmentHeader}><>

                        <Text style={styles.adjustmentName}>{adjustment.name}</Text>
                        <Text
</>
                          style={[
                            styles.adjustmentAmount,
                            { color: adjustment.amount >= 0 ? "#2ecc71" : "#e74c3c" },
                          ]}
                        >
                          {adjustment.amount >= 0 ? "+" : ""}
                          {comparableService.formatCurrency(adjustment.amount)}
                        </Text>
                      </View>
                      <Text style={styles.adjustmentReason}>{adjustment.reason}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Source section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Source Information</Text>

                {selectedComparable.source && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>Source:</Text>
                    <Text
</> style={styles.detailValue}>{selectedComparable.source}</Text>
                  </View>
                )}

                {selectedComparable.mlsNumber && (
                  <View style={styles.detailRow}><>

                    <Text style={styles.detailLabel}>MLS Number:</Text>
                    <Text
</> style={styles.detailValue}>{selectedComparable.mlsNumber}</Text>
                  </View>
                )}

                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Date Added:</Text>
                  <Text
</> style={styles.detailValue}>
                    {comparableService.formatDate(selectedComparable.dateAdded)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.adjustmentsButton}
                onPress={() => {
                  setShowAdjustmentsModal(true);
                  setShowDetailModal(false);
                }}
              >
                <MaterialCommunityIcons name="calculator" size={16} color="#fff" />
                <Text style={styles.adjustmentsButtonText}>View Adjustments</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveComparable(selectedComparable)}
              >
                <MaterialCommunityIcons name="content-save" size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Save Comparable</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render market trends modal
  const renderMarketTrendsModal = () => {
    return (
      <Modal
        visible={showMarketTrendsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMarketTrendsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.trendsModal}>
            <View style={styles.trendsHeader}><>

              <Text style={styles.trendsTitle}>Market Trends</Text>
              <TouchableOpacity
</> onPress={() => setShowMarketTrendsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {isLoadingTrends ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading market trends...</Text>
              </View>
            ) : marketTrends.length === 0 ? (
              <View style={styles.emptyTrendsContainer}>
                <MaterialCommunityIcons name="chart-line" size={48} color="#bdc3c7" /><>

                <Text style={styles.emptyTrendsText}>No market trend data available</Text>
                <Text
</> style={styles.emptyTrendsSubtext}>
                  Market trend data may not be available for this location
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.trendsContent}>
                <View style={styles.trendsLocation}>
                  <Text style={styles.trendsLocationText}>
                    {subjectProperty?.city}, {subjectProperty?.state}
                  </Text>
                </View>

                <View style={styles.trendsSummary}>
                  <View style={styles.trendSummaryItem}><>

                    <Text style={styles.trendSummaryLabel}>Current Median Price</Text>
                    <Text
</> style={styles.trendSummaryValue}>
                      {comparableService.formatCurrency(marketTrends[0].medianPrice)}
                    </Text>
                  </View>

                  <View style={styles.trendSummaryItem}><>

                    <Text style={styles.trendSummaryLabel}>Annual Change</Text>
                    <Text
</>
                      style={[
                        styles.trendSummaryValue,
                        {
                          color: marketTrends[0].percentChange >= 0 ? "#2ecc71" : "#e74c3c",
                        },
                      ]}
                    >
                      {marketTrends[0].percentChange >= 0 ? "+" : ""}
                      {marketTrends[0].percentChange.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.trendSummaryItem}><>

                    <Text style={styles.trendSummaryLabel}>Avg Days on Market</Text>
                    <Text
</> style={styles.trendSummaryValue}>{marketTrends[0].avgDaysOnMarket}</Text>
                  </View>
                </View>

                <Text style={styles.trendsSectionTitle}>Monthly Trends</Text>

                {marketTrends.map((trend /* , index */) => (
                  <View key={index} style={styles.trendItem}>
                    <View style={styles.trendHeader}><>

                      <Text style={styles.trendPeriod}>{trend.period}</Text>
                      <Text
</>
                        style={[
                          styles.trendChange,
                          { color: trend.percentChange >= 0 ? "#2ecc71" : "#e74c3c" },
                        ]}
                      >
                        {trend.percentChange >= 0 ? "+" : ""}
                        {trend.percentChange.toFixed(1)}%
                      </Text>
                    </View>

                    <View style={styles.trendDetails}>
                      <View style={styles.trendDetail}><>

                        <Text style={styles.trendDetailLabel}>Median Price</Text>
                        <Text
</> style={styles.trendDetailValue}>
                          {comparableService.formatCurrency(trend.medianPrice)}
                        </Text>
                      </View>

                      <View style={styles.trendDetail}><>

                        <Text style={styles.trendDetailLabel}>Price/Sq Ft</Text>
                        <Text
</> style={styles.trendDetailValue}>
                          {comparableService.formatCurrency(trend.pricePerSqFt)}/ft²
                        </Text>
                      </View>

                      <View style={styles.trendDetail}><>

                        <Text style={styles.trendDetailLabel}>Inventory</Text>
                        <Text
</> style={styles.trendDetailValue}>{trend.inventory}</Text>
                      </View>

                      <View style={styles.trendDetail}><>

                        <Text style={styles.trendDetailLabel}>Sales Volume</Text>
                        <Text
</> style={styles.trendDetailValue}>{trend.salesVolume}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMarketTrendsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render adjustments modal
  const renderAdjustmentsModal = () => {
    if (!selectedComparable || !subjectProperty) return null;

    return (
      <Modal
        visible={showAdjustmentsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAdjustmentsModal(false);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.adjustmentsModal}>
            <View style={styles.adjustmentsHeader}><>

              <Text style={styles.adjustmentsTitle}>Adjustments</Text>
              <TouchableOpacity
</>
                onPress={() => {
                  setShowAdjustmentsModal(false);
                  setShowDetailModal(true);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.adjustmentsContent}>
              <View style={styles.adjustmentsInfo}>
                <Text style={styles.adjustmentsDescription}>
                  Adjustments reflect differences between the subject property and the comparable
                  property. Positive adjustments increase the comparable's value, while negative
                  adjustments decrease it.
                </Text>
              </View>

              <View style={styles.adjustmentsSummary}>
                <View style={styles.adjustmentsSummaryItem}><>

                  <Text style={styles.adjustmentsSummaryLabel}>Sale Price</Text>
                  <Text
</> style={styles.adjustmentsSummaryValue}>
                    {comparableService.formatCurrency(selectedComparable.salePrice)}
                  </Text>
                </View>

                <View style={styles.adjustmentsSummaryItem}><>

                  <Text style={styles.adjustmentsSummaryLabel}>Total Adjustments</Text>
                  <Text
</>
                    style={[
                      styles.adjustmentsSummaryValue,
                      {
                        color:
                          (selectedComparable.adjustedPrice || 0) - selectedComparable.salePrice >=
                          0
                            ? "#2ecc71"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    {(selectedComparable.adjustedPrice || 0) - selectedComparable.salePrice >= 0
                      ? "+"
                      : ""}
                    {comparableService.formatCurrency(
                      (selectedComparable.adjustedPrice || 0) - selectedComparable.salePrice
                    )}
                  </Text>
                </View>

                <View style={styles.adjustmentsSummaryItem}><>

                  <Text style={styles.adjustmentsSummaryLabel}>Adjusted Price</Text>
                  <Text
</> style={styles.adjustmentsSummaryValue}>
                    {comparableService.formatCurrency(
                      selectedComparable.adjustedPrice || selectedComparable.salePrice
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.comparisonTable}><>

                <Text style={styles.comparisonTableTitle}>Property Comparison</Text>

                <View
</> style={styles.comparisonHeader}><>

                  <Text style={styles.comparisonHeaderCell}>Feature</Text>
                  <Text
</> style={styles.comparisonHeaderCell}>Subject</Text><>

                  <Text style={styles.comparisonHeaderCell}>Comparable</Text>
                  <Text
</> style={styles.comparisonHeaderCell}>Adjustment</Text>
                </View>

                {/* Square Footage comparison */}
                <View style={styles.comparisonRow}><>

                  <Text style={styles.comparisonCell}>Square Footage</Text>
                  <Text
</> style={styles.comparisonCell}>
                    {subjectProperty.squareFootage.toLocaleString()}
                  </Text><>

                  <Text style={styles.comparisonCell}>
                    {selectedComparable.squareFootage.toLocaleString()}
                  </Text>
                  <Text
</>
                    style={[
                      styles.comparisonCell,
                      {
                        color:
                          selectedComparable.adjustments?.find((a) => a.name === "Square Footage")
                            ?.amount >= 0
                            ? "#2ecc71"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    {selectedComparable.adjustments?.find((a) => a.name === "Square Footage")
                      ? comparableService.formatCurrency(
                          selectedComparable.adjustments.find((a) => a.name === "Square Footage")!
                            .amount
                        )
                      : "-"}
                  </Text>
                </View>

                {/* Bedrooms comparison */}
                <View style={styles.comparisonRow}><>

                  <Text style={styles.comparisonCell}>Bedrooms</Text>
                  <Text
</> style={styles.comparisonCell}>{subjectProperty.bedrooms}</Text><>

                  <Text style={styles.comparisonCell}>{selectedComparable.bedrooms}</Text>
                  <Text
</>
                    style={[
                      styles.comparisonCell,
                      {
                        color:
                          selectedComparable.adjustments?.find((a) => a.name === "Bedrooms")
                            ?.amount >= 0
                            ? "#2ecc71"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    {selectedComparable.adjustments?.find((a) => a.name === "Bedrooms")
                      ? comparableService.formatCurrency(
                          selectedComparable.adjustments.find((a) => a.name === "Bedrooms")!.amount
                        )
                      : "-"}
                  </Text>
                </View>

                {/* Bathrooms comparison */}
                <View style={styles.comparisonRow}><>

                  <Text style={styles.comparisonCell}>Bathrooms</Text>
                  <Text
</> style={styles.comparisonCell}>{subjectProperty.bathrooms}</Text><>

                  <Text style={styles.comparisonCell}>{selectedComparable.bathrooms}</Text>
                  <Text
</>
                    style={[
                      styles.comparisonCell,
                      {
                        color:
                          selectedComparable.adjustments?.find((a) => a.name === "Bathrooms")
                            ?.amount >= 0
                            ? "#2ecc71"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    {selectedComparable.adjustments?.find((a) => a.name === "Bathrooms")
                      ? comparableService.formatCurrency(
                          selectedComparable.adjustments.find((a) => a.name === "Bathrooms")!.amount
                        )
                      : "-"}
                  </Text>
                </View>

                {/* Year Built comparison */}
                <View style={styles.comparisonRow}><>

                  <Text style={styles.comparisonCell}>Year Built</Text>
                  <Text
</> style={styles.comparisonCell}>{subjectProperty.yearBuilt}</Text><>

                  <Text style={styles.comparisonCell}>{selectedComparable.yearBuilt}</Text>
                  <Text
</>
                    style={[
                      styles.comparisonCell,
                      {
                        color:
                          selectedComparable.adjustments?.find((a) => a.name === "Age/Year Built")
                            ?.amount >= 0
                            ? "#2ecc71"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    {selectedComparable.adjustments?.find((a) => a.name === "Age/Year Built")
                      ? comparableService.formatCurrency(
                          selectedComparable.adjustments.find((a) => a.name === "Age/Year Built")!
                            .amount
                        )
                      : "-"}
                  </Text>
                </View>

                {/* Lot Size comparison */}
                <View style={styles.comparisonRow}><>

                  <Text style={styles.comparisonCell}>Lot Size</Text>
                  <Text
</> style={styles.comparisonCell}>
                    {subjectProperty.lotSize.toLocaleString()}
                  </Text><>

                  <Text style={styles.comparisonCell}>
                    {selectedComparable.lotSize.toLocaleString()}
                  </Text>
                  <Text
</>
                    style={[
                      styles.comparisonCell,
                      {
                        color:
                          selectedComparable.adjustments?.find((a) => a.name === "Lot Size")
                            ?.amount >= 0
                            ? "#2ecc71"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    {selectedComparable.adjustments?.find((a) => a.name === "Lot Size")
                      ? comparableService.formatCurrency(
                          selectedComparable.adjustments.find((a) => a.name === "Lot Size")!.amount
                        )
                      : "-"}
                  </Text>
                </View>

                {/* Condition comparison */}
                {(subjectProperty.condition || selectedComparable.condition) && (
                  <View style={styles.comparisonRow}><>

                    <Text style={styles.comparisonCell}>Condition</Text>
                    <Text
</> style={styles.comparisonCell}>{subjectProperty.condition || "-"}</Text><>

                    <Text style={styles.comparisonCell}>{selectedComparable.condition || "-"}</Text>
                    <Text
</>
                      style={[
                        styles.comparisonCell,
                        {
                          color:
                            selectedComparable.adjustments?.find((a) => a.name === "Condition")
                              ?.amount >= 0
                              ? "#2ecc71"
                              : "#e74c3c",
                        },
                      ]}
                    >
                      {selectedComparable.adjustments?.find((a) => a.name === "Condition")
                        ? comparableService.formatCurrency(
                            selectedComparable.adjustments.find((a) => a.name === "Condition")!
                              .amount
                          )
                        : "-"}
                    </Text>
                  </View>
                )}
              </View>

              {/* All adjustments list */}
              {selectedComparable.adjustments && selectedComparable.adjustments.length > 0 && (
                <View style={styles.allAdjustmentsSection}>
                  <Text style={styles.allAdjustmentsTitle}>All Adjustments</Text>

                  {selectedComparable.adjustments.map((adjustment /* , index */) => (
                    <View key={index} style={styles.adjustmentDetailItem}>
                      <View style={styles.adjustmentDetailHeader}><>

                        <Text style={styles.adjustmentDetailName}>{adjustment.name}</Text>
                        <Text
</>
                          style={[
                            styles.adjustmentDetailAmount,
                            { color: adjustment.amount >= 0 ? "#2ecc71" : "#e74c3c" },
                          ]}
                        >
                          {adjustment.amount >= 0 ? "+" : ""}
                          {comparableService.formatCurrency(adjustment.amount)}
                        </Text>
                      </View>
                      <Text style={styles.adjustmentDetailReason}>{adjustment.reason}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowAdjustmentsModal(false);
                setShowDetailModal(true);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
        <Text style={styles.loadingText}>Loading comparable search...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Subject Property */}
      {renderSubjectProperty()}

      {/* Results Count */}
      <View style={styles.resultsHeader}><>

        <Text style={styles.resultsCount}>
          {comparables.length} {comparables.length === 1 ? "Comparable" : "Comparables"} Found
        </Text>

        <TouchableOpacity
</>
          style={styles.refreshButton}
          onPress={() => subjectProperty && searchComparables(subjectProperty)}
          disabled={isSearching}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={16}
            color={isSearching ? "#bdc3c7" : "#3498db"}
          />
          <Text style={[styles.refreshText, { color: isSearching ? "#bdc3c7" : "#3498db" }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comparables List */}
      {renderComparablesList()}

      {/* Modals */}
      {renderFiltersModal()}
      {renderDetailModal()}
      {renderMarketTrendsModal()}
      {renderAdjustmentsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    justifyContent: "space-between",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginLeft: 12,
  },
  filtersButton: {
    padding: 4,
  },
  subjectContainer: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  marketTrendsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  marketTrendsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  subjectDetails: {
    paddingHorizontal: 16,
  },
  subjectAddress: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  subjectLocation: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  subjectSpecs: {
    flexDirection: "row",
    marginBottom: 8,
  },
  subjectSpec: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  subjectSpecText: {
    fontSize: 14,
    marginLeft: 6,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshText: {
    fontSize: 14,
    marginLeft: 4,
  },
  comparablesList: {
    flex: 1,
  },
  comparablesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  comparableItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comparableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  priceBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceText: {
    color: "#fff",
    fontWeight: "bold",
  },
  adjustedPriceBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adjustedPriceText: {
    color: "#fff",
    fontSize: 12,
  },
  comparableContent: {
    flexDirection: "row",
    padding: 12,
  },
  comparableImageContainer: {
    width: 120,
    height: 90,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  comparableImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  similarityBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: "center",
  },
  similarityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  comparableInfo: {
    flex: 1,
  },
  comparableAddress: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  comparableLocation: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 6,
  },
  comparableSpecs: {
    flexDirection: "row",
    marginBottom: 8,
  },
  comparableSpecText: {
    fontSize: 12,
    marginRight: 8,
  },
  comparableFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  comparableDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  comparableDistance: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#7f8c8d",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginBottom: 16,
  },
  filtersButtonEmpty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  filtersButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  filtersModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  filtersContent: {
    padding: 16,
    maxHeight: 500,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderValues: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderMinValue: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  sliderMaxValue: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  priceInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceSeparator: {
    marginHorizontal: 8,
    color: "#7f8c8d",
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSortOption: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  sortOptionText: {
    fontSize: 14,
  },
  selectedSortOptionText: {
    color: "#fff",
  },
  sortDirectionContainer: {
    marginTop: 12,
  },
  sortDirectionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  sortDirectionOptions: {
    flexDirection: "row",
  },
  sortDirectionOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginRight: 8,
  },
  toggleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
  },
  filtersFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  resetButtonText: {
    color: "#7f8c8d",
  },
  applyButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  detailModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailContent: {
    maxHeight: 500,
  },
  detailPhotos: {
    height: 200,
    position: "relative",
  },
  detailPhoto: {
    width: "100%",
    height: "100%",
  },
  detailPlaceholderPhoto: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  detailSimilarityBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  detailSimilarityText: {
    color: "#fff",
    fontWeight: "bold",
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: "#7f8c8d",
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  adjustmentRow: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
    marginBottom: 8,
  },
  adjustmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  adjustmentName: {
    fontWeight: "500",
  },
  adjustmentAmount: {
    fontWeight: "500",
  },
  adjustmentReason: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  detailFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  adjustmentsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  adjustmentsButtonText: {
    color: "#fff",
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ecc71",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: "#fff",
    marginLeft: 8,
  },
  trendsModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
  },
  trendsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  trendsContent: {
    padding: 16,
    maxHeight: 500,
  },
  trendsLocation: {
    alignItems: "center",
    marginBottom: 16,
  },
  trendsLocationText: {
    fontSize: 16,
    fontWeight: "500",
  },
  trendsSummary: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  trendSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  trendSummaryLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
    textAlign: "center",
  },
  trendSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  trendsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  trendItem: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  trendPeriod: {
    fontSize: 14,
    fontWeight: "500",
  },
  trendChange: {
    fontSize: 14,
    fontWeight: "500",
  },
  trendDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  trendDetail: {
    width: "50%",
    marginBottom: 8,
  },
  trendDetailLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  trendDetailValue: {
    fontSize: 14,
  },
  emptyTrendsContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyTrendsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#7f8c8d",
  },
  emptyTrendsSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#3498db",
    padding: 16,
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  adjustmentsModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
  },
  adjustmentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  adjustmentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  adjustmentsContent: {
    padding: 16,
    maxHeight: 500,
  },
  adjustmentsInfo: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  adjustmentsDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  adjustmentsSummary: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  adjustmentsSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  adjustmentsSummaryLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
    textAlign: "center",
  },
  adjustmentsSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  comparisonTable: {
    marginBottom: 24,
  },
  comparisonTableTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  comparisonHeaderCell: {
    flex: 1,
    padding: 12,
    fontWeight: "bold",
    fontSize: 14,
  },
  comparisonRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  comparisonCell: {
    flex: 1,
    padding: 12,
    fontSize: 14,
  },
  allAdjustmentsSection: {
    marginBottom: 16,
  },
  allAdjustmentsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  adjustmentDetailItem: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  adjustmentDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  adjustmentDetailName: {
    fontWeight: "500",
  },
  adjustmentDetailAmount: {
    fontWeight: "500",
  },
  adjustmentDetailReason: {
    fontSize: 12,
    color: "#7f8c8d",
  },
});

export default ComparableSearchScreen;
