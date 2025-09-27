/**
 * Property Valuation Engine
 * Integrated BCBSDataEngine capabilities for Terrafusion OS
 *
 * Features:
 * - Multiple ML models (Linear Regression, LightGBM, Neural Network, Ensemble)
 * - Advanced feature engineering and selection
 * - GIS integration and spatial analysis
 * - Comparable property analysis
 * - Confidence scoring and prediction intervals
 */
import { EventEmitter } from 'events';
export interface PropertyData {
    id?: string;
    mls_id?: string;
    parcel_id?: string;
    apn?: string;
    address: string;
    city: string;
    county: string;
    state: string;
    zip_code: string;
    neighborhood?: string;
    latitude?: number;
    longitude?: number;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    total_rooms?: number;
    square_feet: number;
    lot_size?: number;
    year_built: number;
    stories?: number;
    basement?: string;
    garage?: string;
    garage_spaces?: number;
    pool?: boolean;
    view?: string;
    construction_type?: string;
    roof_type?: string;
    foundation_type?: string;
    list_price?: number;
    last_sale_price?: number;
    last_sale_date?: Date;
    assessment_year?: number;
}
export interface ValuationResult {
    property_id: string;
    estimated_value: number;
    confidence_score: number;
    prediction_interval_low: number;
    prediction_interval_high: number;
    model_name: string;
    model_version: string;
    model_r2_score: number;
    valuation_date: Date;
    feature_importance: Record<string, number>;
    top_features: string[];
    comparable_properties: string[];
    location_factor: number;
    size_factor: number;
    condition_factor: number;
    market_factor: number;
    market_insights: string[];
    risk_factors: string[];
    recommendations: string[];
}
export interface ModelConfiguration {
    model_type: 'linear' | 'lightgbm' | 'neural_network' | 'ensemble';
    feature_selection_method: 'auto' | 'f_regression' | 'mutual_info' | 'rfe' | 'random_forest';
    normalize_features: boolean;
    use_gis: boolean;
    linear_params?: {
        regularization?: 'ridge' | 'lasso' | 'elastic_net';
        alpha?: number;
    };
    lightgbm_params?: {
        num_leaves?: number;
        learning_rate?: number;
        n_estimators?: number;
        max_depth?: number;
    };
    neural_network_params?: {
        hidden_layers?: number[];
        dropout_rate?: number;
        learning_rate?: number;
        epochs?: number;
    };
    ensemble_params?: {
        models?: string[];
        weights?: number[];
    };
}
export declare class PropertyValuationEngine extends EventEmitter {
    private models;
    private featureStats;
    private isInitialized;
    private trainingData;
    private gisFeatures;
    constructor();
    /**
     * Initialize the valuation engine
     */
    initialize(): Promise<void>;
    /**
     * Initialize engine components
     */
    private initializeEngine;
    /**
     * Load pre-trained ML models
     */
    private loadPretrainedModels;
    /**
     * Create linear regression model
     */
    private createLinearModel;
    /**
     * Create neural network model
     */
    private createNeuralNetworkModel;
    /**
     * Create fallback models
     */
    private createFallbackModels;
    /**
     * Initialize GIS features for Benton County
     */
    private initializeBentonCountyGIS;
    /**
     * Initialize comprehensive GIS features
     */
    private initializeGISFeatures;
    /**
     * Load training data for comparable analysis
     */
    private loadTrainingData;
    /**
     * Generate sample training data for demonstration
     */
    private generateSampleTrainingData;
    /**
     * Calculate feature statistics for normalization
     */
    private calculateFeatureStatistics;
    /**
     * Perform property valuation
     */
    valuateProperty(property: PropertyData, config?: ModelConfiguration): Promise<ValuationResult>;
    /**
     * Extract and engineer features from property data
     */
    private extractFeatures;
    /**
     * Get GIS-based features
     */
    private getGISFeatures;
    /**
     * Normalize features using calculated statistics
     */
    private normalizeFeatures;
    /**
     * Get model prediction
     */
    private getModelPrediction;
    /**
     * Get linear model prediction
     */
    private getLinearPrediction;
    /**
     * Get neural network prediction
     */
    private getNeuralNetworkPrediction;
    /**
     * Get LightGBM prediction (simulated)
     */
    private getLightGBMPrediction;
    /**
     * Get ensemble prediction
     */
    private getEnsemblePrediction;
    /**
     * Fallback prediction using simple heuristics
     */
    private getFallbackPrediction;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
    /**
     * Calculate data completeness score
     */
    private calculateDataCompleteness;
    /**
     * Calculate prediction intervals
     */
    private calculatePredictionIntervals;
    /**
     * Find comparable properties
     */
    private findComparableProperties;
    /**
     * Calculate feature importance
     */
    private calculateFeatureImportance;
    /**
     * Get top features by importance
     */
    private getTopFeatures;
    /**
     * Calculate location factor
     */
    private calculateLocationFactor;
    /**
     * Calculate size factor
     */
    private calculateSizeFactor;
    /**
     * Calculate condition factor
     */
    private calculateConditionFactor;
    /**
     * Calculate market factor
     */
    private calculateMarketFactor;
    /**
     * Generate market insights
     */
    private generateMarketInsights;
    /**
     * Identify risk factors
     */
    private identifyRiskFactors;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get model R2 score
     */
    private getModelR2Score;
    /**
     * Get engine status
     */
    getEngineStatus(): {
        initialized: boolean;
        models_loaded: number;
        training_properties: number;
        gis_features: number;
        feature_stats: number;
    };
}
export declare const propertyValuationEngine: PropertyValuationEngine;
//# sourceMappingURL=PropertyValuationEngine.d.ts.map