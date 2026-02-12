import { useState, useEffect } from "react";
import { UADConditionRating, UADQualityRating, UADPropertyView } from "@/components/uad/constants";
import { usePropertyData } from "./usePropertyData";

// Map property condition to UAD condition rating
const mapConditionToUAD = (condition: string): UADConditionRating => {
  const conditionMap: Record<string, UADConditionRating> = {
    excellent: UADConditionRating.C1,
    "very good": UADConditionRating.C2,
    good: UADConditionRating.C3,
    average: UADConditionRating.C4,
    fair: UADConditionRating.C5,
    poor: UADConditionRating.C6,
  };

  // Find the closest match or default to C3
  const normalizedCondition = condition?.toLowerCase() || "";
  for (const [key, value] of Object.entries(conditionMap)) {
    if (normalizedCondition.includes(key)) {
      return value;
    }
  }

  return UADConditionRating.C3; // Default to average condition
};

// Map property quality to UAD quality rating
const mapQualityToUAD = (quality: string): UADQualityRating => {
  const qualityMap: Record<string, UADQualityRating> = {
    luxury: UADQualityRating.Q1,
    "high end": UADQualityRating.Q1,
    superior: UADQualityRating.Q2,
    excellent: UADQualityRating.Q2,
    good: UADQualityRating.Q3,
    average: UADQualityRating.Q4,
    fair: UADQualityRating.Q5,
    low: UADQualityRating.Q6,
    basic: UADQualityRating.Q6,
  };

  // Find the closest match or default to Q4
  const normalizedQuality = quality?.toLowerCase() || "";
  for (const [key, value] of Object.entries(qualityMap)) {
    if (normalizedQuality.includes(key)) {
      return value;
    }
  }

  return UADQualityRating.Q4; // Default to average quality
};

// Calculate the effective age based on actual age and condition
const calculateEffectiveAge = (yearBuilt: number, condition: UADConditionRating): number => {
  const currentYear = new Date().getFullYear();
  const actualAge = currentYear - yearBuilt;

  // If no year built, return 0
  if (!yearBuilt || yearBuilt <= 0) {
    return 0;
  }

  // Apply a multiplier based on condition
  const conditionMultipliers: Record<UADConditionRating, number> = {
    [UADConditionRating.C1]: 0.25, // Excellent condition, effective age is much less than actual
    [UADConditionRating.C2]: 0.4,
    [UADConditionRating.C3]: 0.6,
    [UADConditionRating.C4]: 0.8,
    [UADConditionRating.C5]: 1.0, // Poor condition, effective age equals actual age
    [UADConditionRating.C6]: 1.2, // Very poor condition, effective age exceeds actual age
  };

  return Math.round(actualAge * (conditionMultipliers[condition] || 0.7));
};

export interface UADFormDataResult {
  isLoading: boolean;
  error: any;
  formData: Record<string, any>;
  propertyId: number | null;
}

export function useUADFormData(propertyId?: number): UADFormDataResult {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPropertyId, setCurrentPropertyId] = useState<number | null>(null);

  const { useProperty } = usePropertyData();
  const {
    data: property,
    isLoading: isPropertyLoading,
    error: propertyError,
  } = useProperty(propertyId);

  // Process property data into UAD form data
  useEffect(() => {
    if (isPropertyLoading) {
      setIsLoading(true);
      return;
    }

    if (propertyError) {
      setError(propertyError);
      setIsLoading(false);
      return;
    }

    if (!property) {
      setIsLoading(false);
      return;
    }

    try {
      // Convert property data to UAD condition and quality
      const uadCondition = mapConditionToUAD(property.condition || "");
      const uadQuality = mapQualityToUAD(property.constructionQuality || "");
      const yearBuilt = property.yearBuilt ? parseInt(property.yearBuilt.toString()) : 0;
      const effectiveAge = calculateEffectiveAge(yearBuilt, uadCondition);

      // Create the form data
      const mappedFormData = {
        // Subject Property Section
        property_address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zipCode || "",
        county: property.county || "",
        assessors_parcel: property.parcelNumber || "",
        tax_year: property.taxYear || new Date().getFullYear() - 1,
        r_e_taxes: property.annualTaxes || 0,
        legal_description: property.legalDescription || "",
        census_tract: property.censusTract || "",
        map_reference: property.mapReference || "",
        neighborhood_name: property.neighborhood || "",
        occupant: property.occupancyStatus || "Vacant",

        // Improvements Section
        year_built: yearBuilt,
        effective_age: effectiveAge,
        condition: uadCondition,
        quality: uadQuality,
        gross_living_area: property.grossLivingArea
          ? parseInt(property.grossLivingArea.toString())
          : 0,
        basement_area: property.basementArea ? parseInt(property.basementArea.toString()) : 0,
        basement_finish: property.basementFinish || "None",
        bedrooms: property.bedrooms ? parseInt(property.bedrooms.toString()) : 0,
        bathrooms: property.bathrooms ? parseFloat(property.bathrooms.toString()) : 0,

        // Site Section
        site_area: property.lotSize ? parseFloat(property.lotSize.toString()) : 0,
        site_view: property.view || UADPropertyView.N,
        site_shape: property.lotShape || "Regular",

        // Sales Comparison Section (Subject column)
        subject_sales_price: property.lastSalePrice || 0,
        subject_date_of_sale: property.lastSaleDate || "",

        // Include any additional fields from existing formData if available
        ...(property.formData || {}),
      };

      setFormData(mappedFormData);
      setCurrentPropertyId(property.id);
      setIsLoading(false);
      setError(null);
    } catch (e) {
      console.error("Error processing property data for UAD form:", e);
      setError(e);
      setIsLoading(false);
    }
  }, [property, isPropertyLoading, propertyError, propertyId]);

  return {
    isLoading,
    error,
    formData,
    propertyId: currentPropertyId,
  };
}
