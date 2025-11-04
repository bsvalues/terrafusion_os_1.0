import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ApiService } from "../services/ApiService";
import * as Colors from "../constants/Colors";

// Property type definition
interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  parcelId: string;
  valuationHistory?: ValuationEntry[];
  image?: string;
  lastUpdated: string;
  owner?: string;
  taxId?: string;
  zoning?: string;
  floodZone?: string;
  description?: string;
}

// Feature card type definition
interface FeatureCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  screen: string;
  params?: any;
  badge?: string;
  color: string;
}

// Valuation history entry
interface ValuationEntry {
  date: string;
  value: number;
  source: string;
  confidence?: number;
}

// Route params
interface PropertyDetailsRouteParams {
  propertyId: number;
  propertyAddress?: string;
}

const PropertyDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as PropertyDetailsRouteParams;
  const { width } = useWindowDimensions();
  const apiService = ApiService.getInstance();

  // State
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Feature cards
  const features: FeatureCard[] = [
    {
      id: "field_notes",
      title: "Field Notes",
      icon: "file-text",
      description: "Collaborative notes for this property",
      screen: "FieldNotes",
      badge: "New",
      color: Colors.primary,
    },
    {
      id: "photo_enhancement",
      title: "Enhance Photos",
      icon: "image",
      description: "AI-powered photo improvements",
      screen: "PhotoEnhancement",
      color: Colors.info,
    },
    {
      id: "ar_measurement",
      title: "AR Measurement",
      icon: "maximize",
      description: "Measure with augmented reality",
      screen: "ARMeasurement",
      color: Colors.success,
    },
    {
      id: "report_generation",
      title: "Generate Report",
      icon: "file",
      description: "Create appraisal report",
      screen: "ReportGeneration",
      color: Colors.warning,
    },
    {
      id: "property_comparison",
      title: "Compare",
      icon: "bar-chart-2",
      description: "Compare with similar properties",
      screen: "PropertyComparison",
      color: "#9C27B0",
    },
    {
      id: "property_share",
      title: "Share",
      icon: "share-2",
      description: "Share property details securely",
      screen: "PropertyShare",
      color: Colors.accent,
    },
  ];

  // Load property data
  useEffect(() => {
    loadProperty();
  }, [params.propertyId]);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: params.propertyAddress || "Property Details",
    });
  }, [navigation, params.propertyAddress]);

  // Load property data
  const loadProperty = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(`/api/properties/${params.propertyId}`);

      if (response) {
        setProperty(response);
      }
    } catch (error) {
      console.error("Error loading property details:", error);

      // For demo purposes, set some sample data if API fails
      setProperty({
        id: params.propertyId,
        address: params.propertyAddress || "123 Main Street",
        city: "Springfield",
        state: "IL",
        zipCode: "12345",
        propertyType: "Single Family",
        bedrooms: 4,
        bathrooms: 2.5,
        squareFeet: 2400,
        yearBuilt: 1995,
        lotSize: 0.25,
        parcelId: "ABC123456",
        lastUpdated: new Date().toISOString(),
        owner: "John Smith",
        taxId: "123-45-6789",
        zoning: "Residential",
        floodZone: "X",
        description:
          "Beautiful single family home in a quiet neighborhood with recent renovations and modern appliances.",
        valuationHistory: [
          { date: "2023-01-15", value: 420000, source: "County Tax Assessment" },
          { date: "2022-06-10", value: 405000, source: "Appraisal" },
          { date: "2021-12-05", value: 380000, source: "Market Analysis" },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadProperty();
  };

  // Navigate to feature
  const navigateToFeature = (feature: FeatureCard) => {
    if (!property) return;

    let params = { ...feature.params };

    switch (feature.screen) {
      case "FieldNotes":
        params = {
          ...params,
          parcelId: property.parcelId,
          propertyAddress: property.address,
        };
        break;
      case "PhotoEnhancement":
      case "ARMeasurement":
      case "ReportGeneration":
      case "PropertyShare":
        params = {
          ...params,
          propertyId: property.id,
          propertyAddress: property.address,
        };
        break;
      case "PropertyComparison":
        params = {
          ...params,
          propertyIds: [property.id],
        };
        break;
    }

    navigation.navigate(feature.screen as never, params as never);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render feature card
  const renderFeatureCard = (feature: FeatureCard /* , index */: number) => (
    <TouchableOpacity
      key={feature.id}
      style={[
        styles.featureCard,
        { backgroundColor: feature.color + "10" }, // 10% opacity
      ]}
      onPress={() => navigateToFeature(feature)}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}><>

        <Feather name={feature.icon as any} size={24} color={Colors.white} />
      </View>
      <Text
</> style={styles.featureTitle}>{feature.title}</Text>
      {feature.badge && (
        <View style={styles.featureBadge}>
          <Text style={styles.featureBadgeText}>{feature.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render valuation history item
  const renderValuationHistoryItem = (entry: ValuationEntry /* , index */: number) => (
    <View key={index} style={styles.valuationItem}>
      <View style={styles.valuationDateContainer}><>

        <Text style={styles.valuationDate}>{formatDate(entry.date)}</Text>
        <Text
</> style={styles.valuationSource}>{entry.source}</Text>
      </View>
      <Text style={styles.valuationValue}>{formatCurrency(entry.value)}</Text>
    </View>
  );

  // If loading, show loading indicator
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  // If no property, show error
  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={Colors.errorText} /><>

        <Text style={styles.errorTitle}>Property Not Found</Text>
        <Text
</> style={styles.errorMessage}>
          We couldn't find the property you're looking for. Please try again later.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Property Image */}
      <View style={styles.imageContainer}>
        {property.image ? (
          <Image source={{ uri: property.image }} style={styles.propertyImage} resizeMode="cover" />
        ) : (
          <View style={styles.propertyImagePlaceholder}>
            <Feather name="home" size={64} color={Colors.textLight} />
          </View>
        )}
        <View style={styles.propertyTypeTag}>
          <Text style={styles.propertyTypeText}>{property.propertyType}</Text>
        </View>
      </View>

      {/* Property Details */}
      <View style={styles.detailsContainer}><>

        <Text style={styles.propertyAddress}>{property.address}</Text>
        <Text
</> style={styles.propertyLocation}>
          {property.city}, {property.state} {property.zipCode}
        </Text>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>{features.map(renderFeatureCard)}</View>

        {/* Property Specs */}
        <View style={styles.section}><>

          <Text style={styles.sectionTitle}>Property Specifications</Text>
          <View
</> style={styles.propertySpecs}>
            <View style={styles.propertySpecItem}>
              <Feather name="home" size={16} color={Colors.textLight} /><>

              <Text style={styles.propertySpecLabel}>Area</Text>
              <Text
</> style={styles.propertySpecValue}>{property.squareFeet} sq ft</Text>
            </View>
            <View style={styles.propertySpecItem}>
              <Feather name="map" size={16} color={Colors.textLight} /><>

              <Text style={styles.propertySpecLabel}>Lot Size</Text>
              <Text
</> style={styles.propertySpecValue}>{property.lotSize} acres</Text>
            </View>
            <View style={styles.propertySpecItem}>
              <Feather name="calendar" size={16} color={Colors.textLight} /><>

              <Text style={styles.propertySpecLabel}>Year Built</Text>
              <Text
</> style={styles.propertySpecValue}>{property.yearBuilt}</Text>
            </View>
            <View style={styles.propertySpecItem}>
              <Feather name="bed" size={16} color={Colors.textLight} /><>

              <Text style={styles.propertySpecLabel}>Bedrooms</Text>
              <Text
</> style={styles.propertySpecValue}>{property.bedrooms}</Text>
            </View>
            <View style={styles.propertySpecItem}>
              <Feather name="droplet" size={16} color={Colors.textLight} /><>

              <Text style={styles.propertySpecLabel}>Bathrooms</Text>
              <Text
</> style={styles.propertySpecValue}>{property.bathrooms}</Text>
            </View>
            <View style={styles.propertySpecItem}>
              <Feather name="hash" size={16} color={Colors.textLight} /><>

              <Text style={styles.propertySpecLabel}>Parcel ID</Text>
              <Text
</> style={styles.propertySpecValue}>{property.parcelId}</Text>
            </View>
          </View>
        </View>

        {/* Additional Details */}
        {(property.owner || property.taxId || property.zoning || property.floodZone) && (
          <View style={styles.section}><>

            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View
</> style={styles.additionalDetails}>
              {property.owner && (
                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Owner:</Text>
                  <Text
</> style={styles.detailValue}>{property.owner}</Text>
                </View>
              )}
              {property.taxId && (
                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Tax ID:</Text>
                  <Text
</> style={styles.detailValue}>{property.taxId}</Text>
                </View>
              )}
              {property.zoning && (
                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Zoning:</Text>
                  <Text
</> style={styles.detailValue}>{property.zoning}</Text>
                </View>
              )}
              {property.floodZone && (
                <View style={styles.detailRow}><>

                  <Text style={styles.detailLabel}>Flood Zone:</Text>
                  <Text
</> style={styles.detailValue}>{property.floodZone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Property Description */}
        {property.description && (
          <View style={styles.section}><>

            <Text style={styles.sectionTitle}>Description</Text>
            <Text
</> style={styles.description}>{property.description}</Text>
          </View>
        )}

        {/* Valuation History */}
        {property.valuationHistory && property.valuationHistory.length > 0 && (
          <View style={styles.section}><>

            <Text style={styles.sectionTitle}>Valuation History</Text>
            <View
</> style={styles.valuationHistory}>
              {property.valuationHistory.map(renderValuationHistoryItem)}
            </View>
          </View>
        )}

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>Last updated: {formatDate(property.lastUpdated)}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.errorText,
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  imageContainer: {
    height: 240,
    position: "relative",
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  propertyImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightPrimary,
  },
  propertyTypeTag: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  propertyTypeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  detailsContainer: {
    padding: 20,
  },
  propertyAddress: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 24,
  },
  featureCard: {
    width: "31%",
    margin: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  featureBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.accent,
    borderRadius: 10,
  },
  featureBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.white,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  propertySpecs: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  propertySpecItem: {
    width: "33%",
    paddingHorizontal: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  propertySpecLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  propertySpecValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 2,
  },
  additionalDetails: {
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: Colors.textLight,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  valuationHistory: {
    borderRadius: 8,
  },
  valuationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  valuationDateContainer: {
    flex: 1,
  },
  valuationDate: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  valuationSource: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  valuationValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.success,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
});

export default PropertyDetailsScreen;
