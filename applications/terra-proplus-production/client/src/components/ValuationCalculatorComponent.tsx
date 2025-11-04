import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber } from '../lib/utils';

// Define interfaces for our data structures
interface SubjectProperty {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  condition: string;
  basePricePerSqFt: number;
}

interface AdjustmentFactor {
  id: string;
  name: string;
  description: string;
  adjustmentType: 'percentage' | 'fixed';
  defaultValue: number;
  rangeMin: number;
  rangeMax: number;
  step: number;
  enabled: boolean;
  value: number;
}

interface ValuationHistory {
  id: number;
  value: number;
  timestamp: Date;
  adjustments: {
    percentageTotal: number;
    fixedTotal: number;
    totalAmount: number;
  };
  isCurrent: boolean;
}

const ValuationCalculatorComponent = () => {
  // State for the subject property
  const [properties, setProperties] = useState<SubjectProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [subjectProperty, setSubjectProperty] = useState<SubjectProperty>({
    id: 1,
    address: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    propertyType: 'Single Family',
    squareFeet: 2450,
    bedrooms: 3,
    bathrooms: 2.5,
    yearBuilt: 2005,
    lotSize: 8500,
    condition: 'Average',
    basePricePerSqFt: 350
  });
  
  // State for adjustment factors
  const [adjustmentFactors, setAdjustmentFactors] = useState<AdjustmentFactor[]>([
    {
      id: 'location',
      name: 'Location Quality',
      description: 'Adjustment based on the quality of the neighborhood and location',
      adjustmentType: 'percentage',
      defaultValue: 5,
      rangeMin: -20,
      rangeMax: 20,
      step: 1,
      enabled: true,
      value: 5
    },
    {
      id: 'condition',
      name: 'Property Condition',
      description: 'Adjustment based on the condition of the property',
      adjustmentType: 'percentage',
      defaultValue: 0,
      rangeMin: -15,
      rangeMax: 15,
      step: 1,
      enabled: true,
      value: 0
    },
    {
      id: 'age',
      name: 'Age Adjustment',
      description: 'Adjustment based on the age of the property',
      adjustmentType: 'percentage',
      defaultValue: -2.5,
      rangeMin: -10,
      rangeMax: 5,
      step: 0.5,
      enabled: true,
      value: -2.5
    },
    {
      id: 'lotSize',
      name: 'Lot Size Premium',
      description: 'Adjustment for lot size differences',
      adjustmentType: 'percentage',
      defaultValue: 2,
      rangeMin: -5,
      rangeMax: 15,
      step: 0.5,
      enabled: true,
      value: 2
    },
    {
      id: 'roomCount',
      name: 'Room Count Adjustment',
      description: 'Adjustment for bedroom/bathroom differences',
      adjustmentType: 'fixed',
      defaultValue: 15000,
      rangeMin: -30000,
      rangeMax: 50000,
      step: 5000,
      enabled: true,
      value: 15000
    },
    {
      id: 'construction',
      name: 'Quality of Construction',
      description: 'Adjustment based on construction quality and materials',
      adjustmentType: 'percentage',
      defaultValue: 0,
      rangeMin: -10,
      rangeMax: 10,
      step: 1,
      enabled: false,
      value: 0
    },
    {
      id: 'amenities',
      name: 'Amenities Adjustment',
      description: 'Adjustment for special features and amenities',
      adjustmentType: 'fixed',
      defaultValue: 0,
      rangeMin: -20000,
      rangeMax: 50000,
      step: 5000,
      enabled: false,
      value: 0
    },
    {
      id: 'market',
      name: 'Market Trend Adjustment',
      description: 'Adjustment for market trends over time',
      adjustmentType: 'percentage',
      defaultValue: 3,
      rangeMin: -5,
      rangeMax: 10,
      step: 0.5,
      enabled: true,
      value: 3
    }
  ]);
  
  // State for valuation results
  const [baseValue, setBaseValue] = useState<number>(0);
  const [totalAdjustmentPercent, setTotalAdjustmentPercent] = useState<number>(0);
  const [totalAdjustmentFixed, setTotalAdjustmentFixed] = useState<number>(0);
  const [totalAdjustmentAmount, setTotalAdjustmentAmount] = useState<number>(0);
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [pricePerSqFt, setPricePerSqFt] = useState<number>(0);
  
  // State for valuation history
  const [valuationHistory, setValuationHistory] = useState<ValuationHistory[]>([]);
  
  // Fetch properties from API
  useEffect(() => {
    // In a real implementation, this would be an API call
    // For demo purposes, we'll use mock data
    const mockProperties: SubjectProperty[] = [
      {
        id: 1,
        address: '123 Main Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        propertyType: 'Single Family',
        squareFeet: 2450,
        bedrooms: 3,
        bathrooms: 2.5,
        yearBuilt: 2005,
        lotSize: 8500,
        condition: 'Average',
        basePricePerSqFt: 350
      },
      {
        id: 2,
        address: '456 Oak Avenue',
        city: 'Austin',
        state: 'TX',
        zipCode: '78704',
        propertyType: 'Condo',
        squareFeet: 1750,
        bedrooms: 2,
        bathrooms: 2,
        yearBuilt: 2010,
        lotSize: 0,
        condition: 'Good',
        basePricePerSqFt: 425
      },
      {
        id: 3,
        address: '789 Elm Drive',
        city: 'Austin',
        state: 'TX',
        zipCode: '78745',
        propertyType: 'Single Family',
        squareFeet: 3200,
        bedrooms: 4,
        bathrooms: 3.5,
        yearBuilt: 2018,
        lotSize: 10500,
        condition: 'Excellent',
        basePricePerSqFt: 380
      },
      {
        id: 4,
        address: '101 Pine Road',
        city: 'Austin',
        state: 'TX',
        zipCode: '78735',
        propertyType: 'Townhouse',
        squareFeet: 1950,
        bedrooms: 3,
        bathrooms: 2,
        yearBuilt: 2000,
        lotSize: 2500,
        condition: 'Fair',
        basePricePerSqFt: 320
      }
    ];
    
    setProperties(mockProperties);
    setSelectedPropertyId(1);
  }, []);
  
  // Calculate valuation whenever relevant inputs change
  useEffect(() => {
    calculateValuation();
  }, [subjectProperty, adjustmentFactors]);
  
  // Update subject property when selection changes
  useEffect(() => {
    if (selectedPropertyId) {
      const selected = properties.find(p => p.id === selectedPropertyId);
      if (selected) {
        setSubjectProperty(selected);
      }
    }
  }, [selectedPropertyId, properties]);
  
  // Handler for property selection change
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedPropertyId(id);
  };
  
  // Handler for property field changes
  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setSubjectProperty(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
    }));
  };
  
  // Handler for adjustment factor toggle
  const handleAdjustmentToggle = (id: string) => {
    setAdjustmentFactors(prev => 
      prev.map(factor => 
        factor.id === id ? { ...factor, enabled: !factor.enabled } : factor
      )
    );
  };
  
  // Handler for adjustment factor value change
  const handleAdjustmentValueChange = (id: string, value: number) => {
    setAdjustmentFactors(prev => 
      prev.map(factor => 
        factor.id === id ? { ...factor, value } : factor
      )
    );
  };
  
  // Reset all adjustment factors to default values
  const handleResetAdjustments = () => {
    setAdjustmentFactors(prev => 
      prev.map(factor => ({
        ...factor,
        value: factor.defaultValue
      }))
    );
  };
  
  // Calculate property valuation
  const calculateValuation = () => {
    // Calculate base value
    const base = subjectProperty.squareFeet * subjectProperty.basePricePerSqFt;
    setBaseValue(base);
    
    // Calculate adjustments
    let percentTotal = 0;
    let fixedTotal = 0;
    
    adjustmentFactors.forEach(factor => {
      if (factor.enabled) {
        if (factor.adjustmentType === 'percentage') {
          percentTotal += factor.value;
        } else {
          fixedTotal += factor.value;
        }
      }
    });
    
    setTotalAdjustmentPercent(percentTotal);
    setTotalAdjustmentFixed(fixedTotal);
    
    // Calculate total adjustment amount
    const percentAdjustment = base * (percentTotal / 100);
    const totalAdjustment = percentAdjustment + fixedTotal;
    setTotalAdjustmentAmount(totalAdjustment);
    
    // Calculate estimated value
    const total = base + totalAdjustment;
    setEstimatedValue(total);
    
    // Calculate price per square foot
    const ppsf = total / subjectProperty.squareFeet;
    setPricePerSqFt(ppsf);
    
    // Add to history
    addToHistory(total, percentTotal, fixedTotal, totalAdjustment);
  };
  
  // Add valuation to history
  const addToHistory = (value: number, percentTotal: number, fixedTotal: number, totalAmount: number) => {
    // Mark all existing history items as not current
    const updatedHistory = valuationHistory.map(item => ({
      ...item,
      isCurrent: false
    }));
    
    // Add new history item
    const newHistoryItem: ValuationHistory = {
      id: Date.now(),
      value,
      timestamp: new Date(),
      adjustments: {
        percentageTotal: percentTotal,
        fixedTotal: fixedTotal,
        totalAmount: totalAmount
      },
      isCurrent: true
    };
    
    // Add to history (limit to 5 items)
    setValuationHistory([newHistoryItem, ...updatedHistory].slice(0, 5));
  };
  
  // Save valuation (would typically send to API)
  const handleSaveValuation = () => {
    // In a real implementation, this would save to an API
    alert(`Valuation of ${formatCurrency(estimatedValue)} saved successfully!`);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8"><>

          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
            Valuation Calculator
          </h1>
          <p
</> className="text-gray-600">Calculate and adjust property valuations with precision</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm font-bold">P</span>
                  Property Information
                </h2>
              </div>
              
              <div className="p-6">
                <div className="mb-6"><>

                  <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Property
                  </label>
                  <select
</>
                    id="propertySelect"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedPropertyId || ''}
                    onChange={handlePropertyChange}
                  >
                    <option value="">-- Select a property --</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.address}, {property.city}, {property.state}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><>

                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
</>
                      type="text"
                      id="address"
                      name="address"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.address}
                      onChange={handlePropertyInputChange}
                    />
                  </div>
                  
                  <div><>

                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
</>
                      type="text"
                      id="city"
                      name="city"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.city}
                      onChange={handlePropertyInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div><>

                    <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <select
</>
                      id="propertyType"
                      name="propertyType"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.propertyType}
                      onChange={handlePropertyInputChange}
                    ><>

                      <option>Single Family</option>
                      <option
</>>Condo</option><>

                      <option>Multi-Family</option>
                      <option
</>>Townhouse</option>
                      <option>Land</option>
                    </select>
                  </div>
                  
                  <div><>

                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
</>
                      id="condition"
                      name="condition"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.condition}
                      onChange={handlePropertyInputChange}
                    ><>

                      <option>Poor</option>
                      <option
</>>Fair</option><>

                      <option>Average</option>
                      <option
</>>Good</option>
                      <option>Excellent</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div><>

                    <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700 mb-2">
                      Square Feet
                    </label>
                    <input
</>
                      type="number"
                      id="squareFeet"
                      name="squareFeet"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.squareFeet}
                      onChange={handlePropertyInputChange}
                    />
                  </div>
                  
                  <div><>

                    <label htmlFor="basePricePerSqFt" className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price Per Sq.Ft.
                    </label>
                    <input
</>
                      type="number"
                      id="basePricePerSqFt"
                      name="basePricePerSqFt"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.basePricePerSqFt}
                      onChange={handlePropertyInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div><>

                    <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
</>
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.bedrooms}
                      onChange={handlePropertyInputChange}
                      step={0.5}
                    />
                  </div>
                  
                  <div><>

                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <input
</>
                      type="number"
                      id="bathrooms"
                      name="bathrooms"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.bathrooms}
                      onChange={handlePropertyInputChange}
                      step={0.5}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div><>

                    <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-2">
                      Year Built
                    </label>
                    <input
</>
                      type="number"
                      id="yearBuilt"
                      name="yearBuilt"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.yearBuilt}
                      onChange={handlePropertyInputChange}
                    />
                  </div>
                  
                  <div><>

                    <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 mb-2">
                      Lot Size (sq.ft.)
                    </label>
                    <input
</>
                      type="number"
                      id="lotSize"
                      name="lotSize"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subjectProperty.lotSize}
                      onChange={handlePropertyInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Adjustment Factors Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center mr-2 text-sm font-bold">A</span>
                  Adjustment Factors
                </h2>
              </div>
              
              <div className="p-6">
                {adjustmentFactors.map(factor => (
                  <div 
                    key={factor.id} 
                    className={`border rounded-lg p-4 mb-4 ${factor.enabled ? 'border-blue-200 bg-gray-50' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center"><>

                        <button
                          className="text-gray-500 mr-2 hover:text-gray-700 focus:outline-none"
                          onClick={() => handleAdjustmentToggle(factor.id)}
                        >
                          {factor.enabled ? '-' : '+'}
                        </button>
                        <span
</> className="font-medium">{factor.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        factor.adjustmentType === 'percentage' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {factor.adjustmentType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </span>
                    </div>
                    
                    {factor.enabled && (
                      <><>

                        <p className="text-sm text-gray-600 mb-3">{factor.description}</p>
                        <div
</> className="flex items-center">
                          <input
                            type="range"
                            min={factor.rangeMin}
                            max={factor.rangeMax}
                            step={factor.step}
                            value={factor.value}
                            onChange={(e) => handleAdjustmentValueChange(factor.id, parseFloat(e.target.value))}
                            className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="relative w-24 ml-4">
                            <input
                              type="number"
                              value={factor.value}
                              onChange={(e) => handleAdjustmentValueChange(factor.id, parseFloat(e.target.value) || 0)}
                              min={factor.rangeMin}
                              max={factor.rangeMax}
                              step={factor.step}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              {factor.adjustmentType === 'percentage' ? '%' : '$'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-end space-x-4 mt-6"><>

                  <button
                    onClick={handleResetAdjustments}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset Adjustments
                  </button>
                  <button
</>
                    onClick={calculateValuation}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Recalculate
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Valuation Summary Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm font-bold">V</span>
                  Valuation Summary
                </h2>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center py-3 border-b border-gray-200"><>

                  <span className="text-gray-600">Base Value:</span>
                  <span
</> className="font-medium">{formatCurrency(baseValue)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200"><>

                  <span className="text-gray-600">Adjustments:</span>
                  <span
</> className={`font-medium ${totalAdjustmentAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalAdjustmentAmount >= 0 ? '+' : ''}{formatCurrency(totalAdjustmentAmount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3"><>

                  <span className="text-gray-800 font-semibold">Estimated Value:</span>
                  <span
</> className="text-blue-900 text-xl font-bold">{formatCurrency(estimatedValue)}</span>
                </div><>

                
                <div className="text-right text-sm text-gray-600 mt-1">
                  {formatCurrency(pricePerSqFt, false)} per sq.ft.
                </div>
                
                <div
</> className="border-t border-gray-200 my-4 pt-4">
                  <h3 className="text-base font-medium mb-3">Value History</h3>
                  
                  {valuationHistory.map((history /* , index */) => (
                    <div 
                      key={history.id} 
                      className={`py-2 px-3 mb-2 rounded-md ${history.isCurrent ? 'bg-blue-50 text-blue-800 font-medium' : ''}`}
                    >
                      {formatCurrency(history.value)} {history.isCurrent && '(Current)'}
                    </div>
                  ))}
                  
                  {valuationHistory.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No valuation history yet</p>
                  )}
                </div><>

                
                <button
                  onClick={handleSaveValuation}
                  className="w-full mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Valuation
                </button>
                
                <button
</>
                  className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create New Appraisal
                </button>
              </div>
            </div>
            
            {/* Property Summary Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm font-bold">P</span>
                  Property Summary
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-2">
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">Address:</span>
                    <span
</> className="text-sm font-medium">{subjectProperty.address}</span>
                  </div>
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">City, State:</span>
                    <span
</> className="text-sm font-medium">{subjectProperty.city}, {subjectProperty.state}</span>
                  </div>
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">Type:</span>
                    <span
</> className="text-sm font-medium">{subjectProperty.propertyType}</span>
                  </div>
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">Size:</span>
                    <span
</> className="text-sm font-medium">{formatNumber(subjectProperty.squareFeet)} sq.ft.</span>
                  </div>
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">Bedrooms:</span>
                    <span
</> className="text-sm font-medium">{subjectProperty.bedrooms}</span>
                  </div>
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">Bathrooms:</span>
                    <span
</> className="text-sm font-medium">{subjectProperty.bathrooms}</span>
                  </div>
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">Year Built:</span>
                    <span
</> className="text-sm font-medium">{subjectProperty.yearBuilt}</span>
                  </div>
                  <div className="flex"><>

                    <span className="w-28 text-sm text-gray-600">Condition:</span>
                    <span
</> className="text-sm font-medium">{subjectProperty.condition}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationCalculatorComponent;