import React, { useState } from 'react';
import { Calculator, DollarSign, HomeIcon, Building, User, Subtitles, ArrowRight  } from '@mui/icons-material';

// Valuation methods
const valuationMethods = [
  {
    id: 'sales-comparison',
    name: 'Sales Comparison Approach',
    description: 'Values properties based on recent sales of similar properties in the area.',
    formula: 'Base value of comparable properties with adjustments for differences',
    best_for: 'Residential properties, condos, and vacant land in areas with sufficient similar recent sales'
  },
  {
    id: 'income',
    name: 'Income Approach',
    description: 'Values properties based on the income they generate or could potentially generate.',
    formula: 'Net Operating Income (NOI) ÷ Capitalization Rate',
    best_for: 'Income-producing properties such as multi-family, commercial, or office buildings'
  },
  {
    id: 'cost',
    name: 'Cost Approach',
    description: 'Values properties based on the cost to rebuild the structure plus the value of the land.',
    formula: 'Land Value + (Construction Cost - Depreciation)',
    best_for: 'New or unique properties with few comparables, special use properties, or buildings with significant improvements'
  },
  {
    id: 'gross-rent-multiplier',
    name: 'Gross Rent Multiplier',
    description: 'A simple method that uses the relationship between a property\'s price and its gross rental income.',
    formula: 'Gross Rent Multiplier (GRM) × Annual Gross Rental Income',
    best_for: 'Rental properties, quick estimates, or preliminary analysis'
  }
];

const ValuationCalculator = () => {
  // State for form data
  const [formData, setFormData] = useState({
    propertyType: 'single-family',
    squareFeet: '',
    bedrooms: '',
    bathrooms: '',
    location: '',
    yearBuilt: '',
    lotSize: '',
    qualityGrade: 'average',
    rentalIncome: '',
    operatingExpenses: '',
    grm: '10',
    constructionCost: '',
    landValue: '',
    depreciation: '',
    selectedMethod: 'sales-comparison',
    comparables: [
      { value: '', adjustments: '0' },
      { value: '', adjustments: '0' },
      { value: '', adjustments: '0' }
    ]
  });
  
  // State for calculation result
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset result when form changes
    if (showResult) {
      setShowResult(false);
    }
  };
  
  // Handle comparable change
  const handleComparableChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newComparables = [...prev.comparables];
      newComparables[index] = {
        ...newComparables[index],
        [field]: value
      };
      return {
        ...prev,
        comparables: newComparables
      };
    });
    
    // Reset result when form changes
    if (showResult) {
      setShowResult(false);
    }
  };
  
  // Calculate valuation based on selected method
  const calculateValuation = () => {
    let calculatedValue = 0;
    
    switch (formData.selectedMethod) {
      case 'sales-comparison':
        // Sales Comparison Approach
        const comparableValues = formData.comparables
          .filter(comp => comp.value)
          .map(comp => ({
            value: parseFloat(comp.value),
            adjustments: parseFloat(comp.adjustments)
          }));
        
        if (comparableValues.length === 0) {
          alert('Please enter at least one comparable property value');
          return;
        }
        
        // Calculate adjusted values
        const adjustedValues = comparableValues.map(comp => comp.value + comp.adjustments);
        // Take the average of adjusted values
        calculatedValue = adjustedValues.reduce((sum, val) => sum + val, 0) / adjustedValues.length;
        break;
        
      case 'income':
        // Income Approach
        const rentalIncome = parseFloat(formData.rentalIncome);
        const operatingExpenses = parseFloat(formData.operatingExpenses);
        const capRate = 0.06; // 6% cap rate (could be variable)
        
        if (!rentalIncome) {
          alert('Please enter rental income');
          return;
        }
        
        // Calculate NOI (Net Operating Income)
        const noi = rentalIncome - (operatingExpenses || 0);
        // Apply cap rate
        calculatedValue = noi / capRate;
        break;
        
      case 'cost':
        // Cost Approach
        const constructionCost = parseFloat(formData.constructionCost);
        const landValue = parseFloat(formData.landValue);
        const depreciation = parseFloat(formData.depreciation);
        
        if (!constructionCost || !landValue) {
          alert('Please enter construction cost and land value');
          return;
        }
        
        // Apply cost approach formula
        calculatedValue = landValue + (constructionCost - (depreciation || 0));
        break;
        
      case 'gross-rent-multiplier':
        // Gross Rent Multiplier
        const annualRentalIncome = parseFloat(formData.rentalIncome);
        const grm = parseFloat(formData.grm);
        
        if (!annualRentalIncome || !grm) {
          alert('Please enter rental income and GRM');
          return;
        }
        
        // Apply GRM formula
        calculatedValue = annualRentalIncome * grm;
        break;
    }
    
    setResult(calculatedValue);
    setShowResult(true);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Determine what fields to show based on selected method
  const renderMethodFields = () => {
    switch (formData.selectedMethod) {
      case 'sales-comparison':
        return (
          <div className="space-y-6">
            <div><>

              <h3 className="text-lg font-semibold mb-3">Comparable Properties</h3>
              <p
</> className="text-gray-600 mb-4">
                Enter the values of similar properties that have recently sold in the area, 
                along with any adjustments needed to account for differences.
              </p>
              
              {formData.comparables.map((comp /* , index */) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border border-gray-200 rounded-md">
                  <div><>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comparable {index + 1} Value
                    </label>
                    <div
</> className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
</>
                        type="text"
                        value={comp.value}
                        onChange={(e) => handleComparableChange(index, 'value', e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="500000"
                      />
                    </div>
                  </div>
                  
                  <div><>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adjustments (+/-)
                    </label>
                    <div
</> className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
</>
                        type="text"
                        value={comp.adjustments}
                        onChange={(e) => handleComparableChange(index, 'adjustments', e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="25000"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'income':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Rental Income
                </label>
                <div
</> className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
</>
                    type="text"
                    name="rentalIncome"
                    value={formData.rentalIncome}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Operating Expenses
                </label>
                <div
</> className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
</>
                    type="text"
                    name="operatingExpenses"
                    value={formData.operatingExpenses}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md"><>

              <h4 className="text-sm font-medium text-blue-700 mb-2">Income Approach Information</h4>
              <p
</> className="text-sm text-blue-600">
                This calculation uses a 6% capitalization rate, which is typical for residential rental properties.
                The formula is: (Annual Rental Income - Operating Expenses) ÷ 0.06
              </p>
            </div>
          </div>
        );
        
      case 'cost':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Land Value
                </label>
                <div
</> className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
</>
                    type="text"
                    name="landValue"
                    value={formData.landValue}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="150000"
                  />
                </div>
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Construction Cost
                </label>
                <div
</> className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
</>
                    type="text"
                    name="constructionCost"
                    value={formData.constructionCost}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="350000"
                  />
                </div>
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depreciation
                </label>
                <div
</> className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
</>
                    type="text"
                    name="depreciation"
                    value={formData.depreciation}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'gross-rent-multiplier':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Rental Income
                </label>
                <div
</> className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
</>
                    type="text"
                    name="rentalIncome"
                    value={formData.rentalIncome}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="36000"
                  />
                </div>
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gross Rent Multiplier (GRM)
                </label>
                <input
</>
                  type="text"
                  name="grm"
                  value={formData.grm}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md"><>

              <h4 className="text-sm font-medium text-blue-700 mb-2">GRM Information</h4>
              <p
</> className="text-sm text-blue-600">
                Typical GRM values range from 8-12 depending on the location and property type. 
                Higher values indicate higher property values relative to rental income.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div>
      <div className="mb-6"><>

        <h1 className="text-3xl font-bold gradient-heading">Property Valuation Calculator</h1>
        <p
</> className="text-gray-600 mt-1">
          Estimate property values using different appraisal methods
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6"><>

          <h2 className="text-xl font-semibold mb-4">Select Valuation Method</h2>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valuationMethods.map(method => (
              <div key={method.id} className="relative">
                <input
                  type="radio"
                  id={method.id}
                  name="selectedMethod"
                  value={method.id}
                  className="peer absolute opacity-0 w-0 h-0"
                  checked={formData.selectedMethod === method.id}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor={method.id}
                  className="block p-4 border rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-900">{method.name}</h3>
                    {formData.selectedMethod === method.id && (
                      <div className="text-blue-500">
                        <Calculator size={20} />
                      </div>
                    )}
                  </div><>

                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                  <div
</> className="mt-3 text-xs text-gray-500">
                    <div><span className="font-medium">Formula:</span> {method.formula}</div>
                    <div className="mt-1"><span className="font-medium">Best for:</span> {method.best_for}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6"><>

          <h2 className="text-xl font-semibold mb-4">Property Information</h2>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
</>
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              ><>

                <option value="single-family">Single Family</option>
                <option
</> value="multi-family">Multi-Family</option><>

                <option value="condo">Condo</option>
                <option
</> value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>
            
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Square Feet
              </label>
              <input
</>
                type="text"
                name="squareFeet"
                value={formData.squareFeet}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="2000"
              />
            </div>
            
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (City, State)
              </label>
              <input
</>
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Austin, TX"
              />
            </div>
            
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
</>
                type="text"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="3"
              />
            </div>
            
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
</>
                type="text"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="2"
              />
            </div>
            
            <div><>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Built
              </label>
              <input
</>
                type="text"
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="2000"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Valuation Inputs</h2>
          {renderMethodFields()}
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={calculateValuation}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Calculate Property Value
          </button>
        </div>
      </div>
      
      {showResult && result !== null && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6"><>

          <h2 className="text-xl font-semibold mb-4">Valuation Result</h2>
          
          <div
</> className="text-center"><>

            <div className="text-4xl font-bold text-blue-700 mb-2">
              {formatCurrency(result)}
            </div>
            <p
</> className="text-gray-600">
              Estimated property value using the {valuationMethods.find(m => m.id === formData.selectedMethod)?.name}
            </p>
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-md"><>

            <h3 className="text-sm font-medium text-blue-700 mb-2">Important Note</h3>
            <p
</> className="text-sm text-blue-600">
              This is an estimated value for informational purposes only. Professional appraisals consider many additional factors and market conditions. Consult with a licensed appraiser for official valuations.
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-6"><>

        <h2 className="text-xl font-semibold mb-4">Valuation Methodology Guide</h2>
        
        <div
</> className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 p-1 bg-blue-100 rounded-md mr-3"><>

              <HomeIcon size={20} className="text-blue-600" />
            </div>
            <div
</>><>

              <h3 className="font-medium text-gray-900">Sales Comparison Approach</h3>
              <p
</> className="text-sm text-gray-600">
                Best for residential properties in active markets with many comparable sales. 
                This method values your property based on what similar properties in your area have recently sold for, 
                with adjustments for differences in features.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 p-1 bg-green-100 rounded-md mr-3"><>

              <Building size={20} className="text-green-600" />
            </div>
            <div
</>><>

              <h3 className="font-medium text-gray-900">Income Approach</h3>
              <p
</> className="text-sm text-gray-600">
                Ideal for investment properties that generate income. 
                This method determines value based on the property's ability to produce income, 
                using the Net Operating Income (NOI) divided by the capitalization rate.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 p-1 bg-amber-100 rounded-md mr-3"><>

              <Building size={20} className="text-amber-600" />
            </div>
            <div
</>><>

              <h3 className="font-medium text-gray-900">Cost Approach</h3>
              <p
</> className="text-sm text-gray-600">
                Best for unique, newer properties, or those with few comparables.
                This approach estimates what it would cost to rebuild the structure from scratch, 
                plus the value of the land, minus depreciation.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 p-1 bg-purple-100 rounded-md mr-3"><>

              <Calculator size={20} className="text-purple-600" />
            </div>
            <div
</>><>

              <h3 className="font-medium text-gray-900">Gross Rent Multiplier</h3>
              <p
</> className="text-sm text-gray-600">
                A simpler method for rental properties that uses a multiplier applied to the annual rental income.
                While less detailed than other approaches, it provides a quick estimate for investment properties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationCalculator;