
-- Required Lua libraries
S57Lib = require('S57Lib')
S100Lib = require('S100Lib')

-- Dictionary of featureCode to ConversionFunctions
FeatureConversionFunctions = require('S101To57FeatureConversionFunctions')

-- Conversion entry point that host calls
ConversionMain =  require('ConversionMain')

-- Expose Log, so host can log to the same log stream
Log = require('Log')

-- Override any converson function with the featureCode
-- ConversionFunctions.QualityOfNonBathymetricData = Custom_function_for_converting_QualityOfNonBathymetricData