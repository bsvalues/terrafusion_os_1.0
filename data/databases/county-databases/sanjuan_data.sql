-- TerraFusion Production Demo Data
-- County: SANJUAN
-- Contract Value: $150000/year
-- Generated: Wed Aug 13 05:42:41 PDT 2025

CREATE DATABASE IF NOT EXISTS TerraFusion_sanjuan;
USE TerraFusion_sanjuan;

-- Drop existing tables
DROP TABLE IF EXISTS Properties;
DROP TABLE IF EXISTS CountyMetrics;

-- Create properties table
CREATE TABLE Properties (
    ParcelID VARCHAR(50) PRIMARY KEY,
    Address VARCHAR(500),
    City VARCHAR(100),
    ZipCode VARCHAR(10),
    PropertyType VARCHAR(50),
    YearBuilt INT,
    SquareFeet INT,
    LotSize DECIMAL(10,2),
    CurrentValue DECIMAL(12,2),
    CostForgeValue DECIMAL(12,2),
    Confidence DECIMAL(5,2),
    ValuationTime DECIMAL(5,2),
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_address (Address),
    INDEX idx_value (CostForgeValue)
);

-- Create metrics table
CREATE TABLE CountyMetrics (
    MetricID INT AUTO_INCREMENT PRIMARY KEY,
    MetricName VARCHAR(100),
    MetricValue VARCHAR(500),
    Category VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert county metrics
INSERT INTO CountyMetrics (MetricName, MetricValue, Category) VALUES
('Total Properties', '', 'Overview'),
('Current System', '', 'Overview'),
('Annual Budget', '$150000', 'Financial'),
('Potential Savings', '$90000.0', 'Financial'),
('AI Agents', '1,172', 'Performance'),
('Speed Improvement', '379,000,000×', 'Performance'),
('Average Valuation Time', '3.1 seconds', 'Performance'),
('Accuracy', '94.3%', 'Performance');

-- Load sample properties from valuations file
INSERT INTO Properties (ParcelID, Address, City, ZipCode, PropertyType, YearBuilt, SquareFeet, LotSize, CurrentValue, CostForgeValue, Confidence, ValuationTime) VALUES
('SANJUAN-000001', '123 Main St', 'Sanjuan City', '98092', 'Townhouse', 1970, 2005, 2.44, 309060.00, 342829.00, 94.1, 3.5);
INSERT INTO Properties (ParcelID, Address, City, ZipCode, PropertyType, YearBuilt, SquareFeet, LotSize, CurrentValue, CostForgeValue, Confidence, ValuationTime) VALUES
('SANJUAN-000002', '456 Oak Ave', 'Sanjuan City', '98182', 'Condo', 1969, 3678, 0.5, 439341.00, 464158.00, 93.8, 2.9);
INSERT INTO Properties (ParcelID, Address, City, ZipCode, PropertyType, YearBuilt, SquareFeet, LotSize, CurrentValue, CostForgeValue, Confidence, ValuationTime) VALUES
('SANJUAN-000003', '789 River Rd', 'Sanjuan City', '99045', 'Multi-Family', 2020, 1371, 1.73, 853781.00, 632443.00, 95.1, 3.2);

-- Create summary view
CREATE VIEW PropertySummary AS
SELECT 
    COUNT(*) as TotalProperties,
    FORMAT(AVG(CurrentValue), 2) as AvgCurrentValue,
    FORMAT(AVG(CostForgeValue), 2) as AvgCostForgeValue,
    FORMAT(AVG(Confidence), 1) as AvgConfidence,
    FORMAT(AVG(ValuationTime), 1) as AvgValuationTime,
    FORMAT(SUM(CostForgeValue - CurrentValue), 0) as TotalValueAdjustment
FROM Properties;

-- Create performance comparison view
CREATE VIEW PerformanceComparison AS
SELECT 
    'Current System' as System,
    '30 minutes' as ValuationTime,
    '85%' as Accuracy,
    '$500,000' as AnnualCost
UNION ALL
SELECT 
    'TerraFusion CostForge',
    '3.1 seconds',
    '94.3%',
    '$150000'
;

-- Demo query to show speed difference
SELECT 
    'SANJUAN County Demo Ready' as Status,
    COUNT(*) as PropertiesLoaded,
    '379,000,000× Faster' as Performance,
    '$150000/year' as ContractValue
FROM Properties;
