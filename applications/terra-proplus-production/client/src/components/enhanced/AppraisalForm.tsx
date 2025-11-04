import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, 
  Calendar, 
  DollarSign, 
  Building,
  User,
  Warning
 } from '@mui/icons-material';
import { format } from 'date-fns';
import { wsClient, WebSocketMessageType } from '../../lib/websocket';

// Define form data interface
interface AppraisalFormData {
  propertyId: number;
  appraiserId: number;
  status: string;
  purpose: string;
  marketValue: number | '';
  valuationMethod: string;
  effectiveDate: string;
  reportDate: string;
}

// Define user and property interfaces
interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  squareFeet: string;
  bedrooms: number;
  bathrooms: string;
}

const AppraisalForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<AppraisalFormData>({
    propertyId: 0,
    appraiserId: 0,
    status: 'in_progress',
    purpose: 'refinance',
    marketValue: '',
    valuationMethod: 'sales_comparison',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    reportDate: format(new Date(), 'yyyy-MM-dd')
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch properties for dropdown
  const { data: properties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json() as Promise<Property[]>;
    }
  });

  // Fetch users (appraisers) for dropdown
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      // In a real application, this would fetch from an API
      // For now, we'll return mock data
      return [
        { id: 1, firstName: 'John', lastName: 'Appraiser', role: 'appraiser' },
        { id: 2, firstName: 'Jane', lastName: 'Reviewer', role: 'reviewer' }
      ] as User[];
    }
  });

  // Fetch existing appraisal data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchAppraisal = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/appraisals/${id}`);
          if (!response.ok) throw new Error('Failed to fetch appraisal');
          
          const data = await response.json();
          setFormData({
            propertyId: data.propertyId,
            appraiserId: data.appraiserId,
            status: data.status || 'in_progress',
            purpose: data.purpose || 'refinance',
            marketValue: data.marketValue || '',
            valuationMethod: data.valuationMethod || 'sales_comparison',
            effectiveDate: data.effectiveDate ? format(new Date(data.effectiveDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            reportDate: data.reportDate ? format(new Date(data.reportDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
          });
        } catch (err) {
          setError('Error loading appraisal data. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAppraisal();
    }
  }, [id, isEditing]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.propertyId) {
      setError('Please select a property');
      return;
    }
    
    if (!formData.appraiserId) {
      setError('Please select an appraiser');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare data for submission
      const appraisalData = {
        ...formData,
        marketValue: formData.marketValue === '' ? null : Number(formData.marketValue)
      };
      
      // Determine if it's a create or update operation
      const url = isEditing ? `/api/appraisals/${id}` : '/api/appraisals';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appraisalData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} appraisal`);
      }
      
      const savedAppraisal = await response.json();
      
      // Send WebSocket notification
      wsClient.sendMessage(
        WebSocketMessageType.APPRAISAL_UPDATED, 
        {
          id: savedAppraisal.id,
          action: isEditing ? 'updated' : 'created',
          status: savedAppraisal.status
        }
      );
      
      setSuccess(true);
      
      // Redirect to appraisal detail page
      setTimeout(() => {
        navigate(`/appraisals/${savedAppraisal.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error saving appraisal:', err);
      setError('Failed to save appraisal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate the current status of form completion
  const calculateCompletion = (): number => {
    let fields = 0;
    let completed = 0;
    
    // Count required fields
    fields += 5; // propertyId, appraiserId, status, effectiveDate, purpose
    
    // Count completed fields
    if (formData.propertyId > 0) completed++;
    if (formData.appraiserId > 0) completed++;
    if (formData.status) completed++;
    if (formData.effectiveDate) completed++;
    if (formData.purpose) completed++;
    
    return Math.round((completed / fields) * 100);
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Appraisal' : 'New Appraisal'}
      </h2>
      
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between mb-1"><>

          <span className="text-sm font-medium">Completion</span>
          <span
</> className="text-sm font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <div className="flex">
            <Warning className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
          <div className="flex">
            <ClipboardCheck className="h-5 w-5 mr-2" />
            <span>Appraisal successfully {isEditing ? 'updated' : 'created'}!</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property and Appraiser Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
              Property <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId || ''}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md pr-10"
                required
              >
                <option value="">Select a property</option>
                {properties?.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.address}, {property.city}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="appraiserId" className="block text-sm font-medium text-gray-700 mb-1">
              Appraiser <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="appraiserId"
                name="appraiserId"
                value={formData.appraiserId || ''}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md pr-10"
                required
              >
                <option value="">Select an appraiser</option>
                {users?.filter(user => user.role === 'appraiser').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Purpose and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Purpose <span className="text-red-500">*</span>
            </label>
            <select
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md"
              required
            ><>

              <option value="refinance">Refinance</option>
              <option
</> value="purchase">Purchase</option><>

              <option value="estate">Estate</option>
              <option
</> value="tax_appeal">Tax Appeal</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md"
              required
            ><>

              <option value="in_progress">In Progress</option>
              <option
</> value="review_pending">Review Pending</option><>

              <option value="revision_needed">Revision Needed</option>
              <option
</> value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {/* Valuation Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><>

            <label htmlFor="marketValue" className="block text-sm font-medium text-gray-700 mb-1">
              Market Value
            </label>
            <div
</> className="relative">
              <input
                type="number"
                id="marketValue"
                name="marketValue"
                value={formData.marketValue === null ? '' : formData.marketValue}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md pl-7"
                min="0"
                step="1000"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div><>

            <label htmlFor="valuationMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Valuation Method
            </label>
            <select
</>
              id="valuationMethod"
              name="valuationMethod"
              value={formData.valuationMethod}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md"
            ><>

              <option value="sales_comparison">Sales Comparison</option>
              <option
</> value="income">Income Approach</option><>

              <option value="cost">Cost Approach</option>
              <option
</> value="combined">Combined Methods</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                id="effectiveDate"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Date Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><>

            <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-1">
              Report Date
            </label>
            <div
</> className="relative">
              <input
                type="date"
                id="reportDate"
                name="reportDate"
                value={formData.reportDate}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
</> className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <ClipboardCheck className="h-5 w-5 mr-2" />
                {isEditing ? 'Update Appraisal' : 'Create Appraisal'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppraisalForm;