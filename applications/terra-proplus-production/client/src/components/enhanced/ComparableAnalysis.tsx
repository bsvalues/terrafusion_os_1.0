import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  PlusCircle,
  Trash2,
  Edit2,
  Save,
  Warning
 } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// Define interfaces for our data types
interface Comparable {
  id: number;
  appraisalId: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  lotSize: string | null;
  yearBuilt: number;
  salePrice: number;
  saleDate: string;
  distance: number;
  notes: string | null;
  adjustedValue: number | null;
  createdAt: string;
}

interface Adjustment {
  id: number;
  comparableId: number;
  featureName: string;
  description: string | null;
  amount: number;
  isAdditive: boolean;
  createdAt: string;
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  lotSize: string | null;
  yearBuilt: number;
}

interface ComparableAnalysisProps {
  appraisalId: number;
  propertyId: number;
}

// Form for adding/editing adjustments
interface AdjustmentFormData {
  featureName: string;
  description: string;
  amount: number | '';
  isAdditive: boolean;
}

const ComparableAnalysis: React.FC<ComparableAnalysisProps> = ({ appraisalId, propertyId }) => {
  // State for comparable selection and adjustments
  const [selectedComparable, setSelectedComparable] = useState<Comparable | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormData>({
    featureName: '',
    description: '',
    amount: '',
    isAdditive: true
  });
  const [isAdjustmentFormVisible, setIsAdjustmentFormVisible] = useState(false);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch subject property
  const { data: property } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch property');
      return response.json() as Promise<Property>;
    }
  });

  // Fetch comparables for this appraisal
  const { 
    data: comparables,
    isLoading: isLoadingComparables,
    refetch: refetchComparables
  } = useQuery({
    queryKey: [`/api/comparables?appraisalId=${appraisalId}`],
    queryFn: async () => {
      const response = await fetch(`/api/comparables?appraisalId=${appraisalId}`);
      if (!response.ok) throw new Error('Failed to fetch comparables');
      return response.json() as Promise<Comparable[]>;
    }
  });

  // Fetch adjustments for selected comparable
  const {
    data: adjustments,
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments
  } = useQuery({
    queryKey: [`/api/adjustments?comparableId=${selectedComparable?.id || 0}`],
    queryFn: async () => {
      if (!selectedComparable) return [];
      
      const response = await fetch(`/api/adjustments?comparableId=${selectedComparable.id}`);
      if (!response.ok) throw new Error('Failed to fetch adjustments');
      return response.json() as Promise<Adjustment[]>;
    },
    enabled: !!selectedComparable
  });

  // Set first comparable as selected when data loads
  useEffect(() => {
    if (comparables && comparables.length > 0 && !selectedComparable) {
      setSelectedComparable(comparables[0]);
    }
  }, [comparables, selectedComparable]);

  // Handle adjustment form submission
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedComparable) {
      setError('No comparable selected');
      return;
    }
    
    if (adjustmentForm.featureName.trim() === '') {
      setError('Feature name is required');
      return;
    }
    
    if (adjustmentForm.amount === '') {
      setError('Adjustment amount is required');
      return;
    }
    
    const adjustmentData = {
      comparableId: selectedComparable.id,
      featureName: adjustmentForm.featureName,
      description: adjustmentForm.description || null,
      amount: Number(adjustmentForm.amount),
      isAdditive: adjustmentForm.isAdditive
    };
    
    try {
      // Determine if we're adding or updating
      const isEditing = editingAdjustmentId !== null;
      const url = isEditing 
        ? `/api/adjustments/${editingAdjustmentId}`
        : '/api/adjustments';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adjustmentData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'add'} adjustment`);
      }
      
      // Reset form and fetch updated adjustments
      setAdjustmentForm({
        featureName: '',
        description: '',
        amount: '',
        isAdditive: true
      });
      setEditingAdjustmentId(null);
      setIsAdjustmentFormVisible(false);
      refetchAdjustments();
      
      // Update adjusted value for the comparable
      await updateComparableAdjustedValue(selectedComparable.id);
      
    } catch (err) {
      console.error('Error saving adjustment:', err);
      setError('Failed to save adjustment. Please try again.');
    }
  };

  // Delete an adjustment
  const handleDeleteAdjustment = async (adjustmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this adjustment?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/adjustments/${adjustmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete adjustment');
      }
      
      // Refetch adjustments after deletion
      refetchAdjustments();
      
      // Update adjusted value for the comparable
      if (selectedComparable) {
        await updateComparableAdjustedValue(selectedComparable.id);
      }
      
    } catch (err) {
      console.error('Error deleting adjustment:', err);
      setError('Failed to delete adjustment. Please try again.');
    }
  };

  // Edit an adjustment
  const handleEditAdjustment = (adjustment: Adjustment) => {
    setAdjustmentForm({
      featureName: adjustment.featureName,
      description: adjustment.description || '',
      amount: adjustment.amount,
      isAdditive: adjustment.isAdditive
    });
    setEditingAdjustmentId(adjustment.id);
    setIsAdjustmentFormVisible(true);
  };

  // Calculate and update the adjusted value for a comparable
  const updateComparableAdjustedValue = async (comparableId: number) => {
    try {
      // Fetch all adjustments for this comparable
      const response = await fetch(`/api/adjustments?comparableId=${comparableId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch adjustments');
      }
      
      const compareAdjustments = await response.json() as Adjustment[];
      
      // Find the comparable
      const comparable = comparables?.find(c => c.id === comparableId);
      if (!comparable) {
        throw new Error('Comparable not found');
      }
      
      // Calculate adjusted value
      let adjustedValue = comparable.salePrice;
      
      for (const adjustment of compareAdjustments) {
        if (adjustment.isAdditive) {
          adjustedValue += adjustment.amount;
        } else {
          adjustedValue -= adjustment.amount;
        }
      }
      
      // Update the comparable with the new adjusted value
      const updateResponse = await fetch(`/api/comparables/${comparableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adjustedValue })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update comparable');
      }
      
      // Refetch comparables to update the UI
      refetchComparables();
      
    } catch (err) {
      console.error('Error updating adjusted value:', err);
      setError('Failed to update adjusted value. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate total adjustments
  const calculateTotalAdjustments = () => {
    if (!adjustments) return 0;
    
    return adjustments.reduce((total, adjustment) => {
      return adjustment.isAdditive 
        ? total + adjustment.amount 
        : total - adjustment.amount;
    }, 0);
  };

  if (isLoadingComparables) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!comparables || comparables.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700">
        <div className="flex">
          <Warning className="h-6 w-6 mr-2" />
          <p>No comparables have been added to this appraisal yet.</p>
        </div>
        <Link 
          to={`/comparables/new?appraisalId=${appraisalId}`} 
          className="inline-flex items-center mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Comparable
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <div className="flex">
            <Warning className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Comparable selection */}
      <div className="bg-white rounded-lg shadow-md p-6"><>

        <h2 className="text-xl font-bold mb-4">Comparable Properties</h2>
        
        <div
</> className="flex flex-nowrap space-x-4 overflow-x-auto pb-4">
          {comparables.map(comparable => (
            <div 
              key={comparable.id}
              className={`flex-shrink-0 w-64 border rounded-lg p-4 cursor-pointer transition ${
                selectedComparable?.id === comparable.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedComparable(comparable)}
            >
              <div className="flex justify-between items-start"><>

                <div className="font-medium truncate">{comparable.address}</div>
                <span
</> className="text-xs bg-gray-100 rounded-full px-2 py-1">
                  {comparable.distance} miles
                </span>
              </div><>

              
              <div className="text-sm text-gray-500 mt-1">
                {comparable.city}, {comparable.state}
              </div>
              
              <div
</> className="mt-3 flex justify-between">
                <div className="text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {format(new Date(comparable.saleDate), 'MM/dd/yyyy')}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-sm text-primary">
                  {formatCurrency(comparable.salePrice)}
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex-shrink-0 w-64 border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
            <Link 
              to={`/comparables/new?appraisalId=${appraisalId}`}
              className="text-primary hover:text-primary-dark flex items-center"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Comparable
            </Link>
          </div>
        </div>
      </div>
      
      {/* Comparison table */}
      {selectedComparable && property && (
        <div className="bg-white rounded-lg shadow-md p-6"><>

          <h2 className="text-xl font-bold mb-4">Property Comparison</h2>
          
          <div
</> className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50"><>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                  <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Property</th><>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comparable</th>
                  <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Location */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Location</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.city}, {property.state}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.city}, {selectedComparable.state}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.distance} miles
                  </td>
                </tr>
                
                {/* Property Type */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Property Type</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.propertyType}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.propertyType}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.propertyType === selectedComparable.propertyType ? 'Same' : 'Different'}
                  </td>
                </tr>
                
                {/* Square Feet */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Square Feet</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.squareFeet}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.squareFeet}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Number(selectedComparable.squareFeet) - Number(property.squareFeet)} sq ft
                  </td>
                </tr>
                
                {/* Bedrooms */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bedrooms</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.bedrooms}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.bedrooms}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.bedrooms - property.bedrooms}
                  </td>
                </tr>
                
                {/* Bathrooms */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bathrooms</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.bathrooms}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.bathrooms}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Number(selectedComparable.bathrooms) - Number(property.bathrooms)}
                  </td>
                </tr>
                
                {/* Year Built */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Year Built</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.yearBuilt}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.yearBuilt}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedComparable.yearBuilt - property.yearBuilt} years
                  </td>
                </tr>
                
                {/* Sale Price */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sale Price</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(selectedComparable.salePrice)}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                </tr>
                
                {/* Sale Date */}
                <tr><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sale Date</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(selectedComparable.saleDate), 'MM/dd/yyyy')}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Adjustments section */}
      {selectedComparable && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4"><>

            <h2 className="text-xl font-bold">Adjustments</h2>
            <button
</>
              onClick={() => {
                setIsAdjustmentFormVisible(true);
                setEditingAdjustmentId(null);
                setAdjustmentForm({
                  featureName: '',
                  description: '',
                  amount: '',
                  isAdditive: true
                });
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Adjustment
            </button>
          </div>
          
          {isAdjustmentFormVisible && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50"><>

              <h3 className="text-md font-semibold mb-3">
                {editingAdjustmentId ? 'Edit Adjustment' : 'Add Adjustment'}
              </h3>
              
              <form
</> onSubmit={handleAdjustmentSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="featureName" className="block text-sm font-medium text-gray-700 mb-1">
                      Feature <span className="text-red-500">*</span>
                    </label><>

                    <input
                      type="text"
                      id="featureName"
                      value={adjustmentForm.featureName}
                      onChange={(e) => setAdjustmentForm(prev => ({ ...prev, featureName: e.target.value }))}
                      className="block w-full border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div
</>>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="amount"
                        value={adjustmentForm.amount}
                        onChange={(e) => setAdjustmentForm(prev => ({ 
                          ...prev, 
                          amount: e.target.value === '' ? '' : Number(e.target.value)
                        }))}
                        className="block w-full border-gray-300 rounded-md pl-7"
                        min="0"
                        step="1000"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div><>

                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
</>
                      type="text"
                      id="description"
                      value={adjustmentForm.description}
                      onChange={(e) => setAdjustmentForm(prev => ({ ...prev, description: e.target.value }))}
                      className="block w-full border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adjustment Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4 mt-1">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isAdditive"
                          checked={adjustmentForm.isAdditive}
                          onChange={() => setAdjustmentForm(prev => ({ ...prev, isAdditive: true }))}
                          className="mr-2"
                        />
                        <span className="text-sm flex items-center">
                          <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                          Add to value
                        </span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isAdditive"
                          checked={!adjustmentForm.isAdditive}
                          onChange={() => setAdjustmentForm(prev => ({ ...prev, isAdditive: false }))}
                          className="mr-2"
                        />
                        <span className="text-sm flex items-center">
                          <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                          Subtract from value
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3"><>

                  <button
                    type="button"
                    onClick={() => setIsAdjustmentFormVisible(false)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
</>
                    type="submit"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {editingAdjustmentId ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {isLoadingAdjustments ? (
            <div className="text-center py-4">
              <div className="animate-spin inline-block h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : !adjustments || adjustments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No adjustments have been made yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50"><>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                      <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th><>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adjustments.map(adjustment => (
                      <tr key={adjustment.id}><>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {adjustment.featureName}
                        </td>
                        <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {adjustment.description || '-'}
                        </td><>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(adjustment.amount)}
                        </td>
                        <td
</> className="px-6 py-4 whitespace-nowrap text-sm">
                          {adjustment.isAdditive ? (
                            <span className="text-green-600 flex items-center">
                              <ArrowUp className="h-4 w-4 mr-1" />
                              Addition
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <ArrowDown className="h-4 w-4 mr-1" />
                              Subtraction
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <button
                            onClick={() => handleEditAdjustment(adjustment)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          ><>

                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
</>
                            onClick={() => handleDeleteAdjustment(adjustment.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div><>

                    <p className="text-sm text-gray-600">Original Sale Price</p>
                    <p
</> className="text-xl font-bold">{formatCurrency(selectedComparable.salePrice)}</p>
                  </div>
                  
                  <div><>

                    <p className="text-sm text-gray-600">Total Adjustments</p>
                    <p
</> className="text-xl font-bold">
                      {calculateTotalAdjustments() >= 0 ? '+' : ''}
                      {formatCurrency(calculateTotalAdjustments())}
                    </p>
                  </div>
                  
                  <div><>

                    <p className="text-sm text-gray-600">Adjusted Value</p>
                    <p
</> className="text-xl font-bold text-primary">
                      {formatCurrency((selectedComparable.salePrice || 0) + calculateTotalAdjustments())}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparableAnalysis;