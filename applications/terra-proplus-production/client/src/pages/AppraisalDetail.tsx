import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppraisal, useUpdateAppraisal, useDeleteAppraisal } from '../hooks/useAppraisals';
import { useComparables, useCreateComparable } from '../hooks/useComparables';
import { Appraisal, InsertComparable, Comparable } from '../types';
import { format } from 'date-fns';

const APPRAISAL_STATUSES = ['Scheduled', 'In Progress', 'Review', 'Completed', 'Canceled'];
const COMPARABLE_CONDITIONS = ['Excellent', 'Good', 'Average', 'Fair', 'Poor'];
const PROPERTY_TYPES = ['Single Family', 'Condo', 'Multi-Family', 'Townhouse', 'Land', 'Commercial'];

const AppraisalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appraisalId = parseInt(id || '0');
  
  // Fetch appraisal details
  const { 
    data: appraisal, 
    isLoading: isLoadingAppraisal,
    error: appraisalError
  } = useAppraisal(appraisalId);
  
  // Fetch comparables
  const { 
    data: comparables = [], 
    isLoading: isLoadingComparables
  } = useComparables(appraisalId);
  
  // Appraisal update/delete mutations
  const updateAppraisalMutation = useUpdateAppraisal();
  const deleteAppraisalMutation = useDeleteAppraisal();
  const createComparableMutation = useCreateComparable();
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddComparable, setShowAddComparable] = useState(false);
  const [editableAppraisal, setEditableAppraisal] = useState<Appraisal | null>(null);
  
  // New comparable form state
  const [newComparable, setNewComparable] = useState<Partial<InsertComparable>>({
    appraisal_id: appraisalId,
    property_type: 'Single Family',
    condition: 'Good',
    sale_price: 0,
    sale_date: new Date().toISOString().split('T')[0],
  });
  
  // Handle form changes for appraisal editing
  const handleAppraisalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editableAppraisal) return;
    
    const { name, value } = e.target;
    
    if (name === 'market_value') {
      setEditableAppraisal({
        ...editableAppraisal,
        [name]: value === '' ? undefined : Number(value)
      });
    } else if (['inspection_date', 'effective_date'].includes(name)) {
      setEditableAppraisal({
        ...editableAppraisal,
        [name]: value ? new Date(value) : undefined
      });
    } else {
      setEditableAppraisal({
        ...editableAppraisal,
        [name]: value
      });
    }
  };
  
  // Handle form changes for new comparable
  const handleComparableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (['appraisal_id', 'sale_price', 'square_feet', 'bedrooms', 'bathrooms', 'year_built', 'lot_size', 'days_on_market'].includes(name)) {
      setNewComparable({
        ...newComparable,
        [name]: value === '' ? undefined : Number(value)
      });
    } else if (name === 'sale_date') {
      setNewComparable({
        ...newComparable,
        [name]: value ? new Date(value) : undefined
      });
    } else {
      setNewComparable({
        ...newComparable,
        [name]: value
      });
    }
  };
  
  // Start editing
  const startEditing = () => {
    if (appraisal) {
      setEditableAppraisal({...appraisal});
      setIsEditing(true);
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditableAppraisal(null);
  };
  
  // Save appraisal changes
  const saveAppraisalChanges = () => {
    if (!editableAppraisal) return;
    
    updateAppraisalMutation.mutate({
      id: editableAppraisal.id,
      data: editableAppraisal
    }, {
      onSuccess: () => {
        setIsEditing(false);
        setEditableAppraisal(null);
      },
      onError: (error) => {
        console.error('Error updating appraisal:', error);
        alert('Failed to update appraisal. Please try again.');
      }
    });
  };
  
  // Delete appraisal
  const deleteAppraisal = () => {
    if (!appraisal) return;
    
    deleteAppraisalMutation.mutate(appraisal, {
      onSuccess: () => {
        // Navigate back to property details or appraisals list
        if (appraisal.property_id) {
          navigate(`/properties/${appraisal.property_id}`);
        } else {
          navigate('/');
        }
      },
      onError: (error) => {
        console.error('Error deleting appraisal:', error);
        alert('Failed to delete appraisal. Please try again.');
      }
    });
  };
  
  // Create new comparable
  const createComparable = (e: React.FormEvent) => {
    e.preventDefault();
    
    createComparableMutation.mutate(newComparable as InsertComparable, {
      onSuccess: () => {
        setShowAddComparable(false);
        setNewComparable({
          appraisal_id: appraisalId,
          property_type: 'Single Family',
          condition: 'Good',
          sale_price: 0,
          sale_date: new Date().toISOString().split('T')[0]
        });
      },
      onError: (error) => {
        console.error('Error creating comparable:', error);
        alert('Failed to create comparable. Please try again.');
      }
    });
  };
  
  // Calculate adjustments and adjusted values
  const calculateAdjustedValues = (comps: Comparable[]) => {
    if (!appraisal?.property) return comps;
    
    const subject = appraisal.property;
    
    // Deep copy the comparables to avoid mutation
    return comps.map(comp => {
      let adjustments = 0;
      let adjustmentNotes = '';
      
      // Location adjustment (simplified)
      if (comp.city !== subject.city) {
        const locationAdj = 10000; // Example adjustment
        adjustments += locationAdj;
        adjustmentNotes += `Location: ${locationAdj > 0 ? '+' : ''}${locationAdj}\n`;
      }
      
      // Square footage adjustment ($100 per sqft difference)
      if (comp.square_feet && subject.square_feet) {
        const sqftDiff = subject.square_feet - comp.square_feet;
        const sqftAdj = sqftDiff * 100;
        adjustments += sqftAdj;
        adjustmentNotes += `Square Feet: ${sqftAdj > 0 ? '+' : ''}${sqftAdj}\n`;
      }
      
      // Bedrooms adjustment ($10,000 per bedroom)
      if (comp.bedrooms !== undefined && subject.bedrooms !== undefined) {
        const bedroomDiff = subject.bedrooms - comp.bedrooms;
        const bedroomAdj = bedroomDiff * 10000;
        adjustments += bedroomAdj;
        adjustmentNotes += `Bedrooms: ${bedroomAdj > 0 ? '+' : ''}${bedroomAdj}\n`;
      }
      
      // Bathrooms adjustment ($15,000 per bathroom)
      if (comp.bathrooms !== undefined && subject.bathrooms !== undefined) {
        const bathroomDiff = subject.bathrooms - comp.bathrooms;
        const bathroomAdj = bathroomDiff * 15000;
        adjustments += bathroomAdj;
        adjustmentNotes += `Bathrooms: ${bathroomAdj > 0 ? '+' : ''}${bathroomAdj}\n`;
      }
      
      // Age adjustment ($1,000 per year)
      if (comp.year_built && subject.year_built) {
        const ageDiff = subject.year_built - comp.year_built;
        const ageAdj = ageDiff * 1000;
        adjustments += ageAdj;
        adjustmentNotes += `Age: ${ageAdj > 0 ? '+' : ''}${ageAdj}\n`;
      }
      
      // Calculate adjusted price
      const adjustedPrice = comp.sale_price + adjustments;
      
      return {
        ...comp,
        adjusted_price: adjustedPrice,
        adjustment_notes: adjustmentNotes.trim()
      };
    });
  };
  
  // Calculate the reconciled value from comparables
  const calculateReconciledValue = (comps: Comparable[]) => {
    if (comps.length === 0) return 0;
    
    // Get adjusted prices that are valid numbers
    const adjustedPrices = comps
      .map(comp => comp.adjusted_price)
      .filter(price => price !== undefined && !isNaN(price as number)) as number[];
    
    if (adjustedPrices.length === 0) return 0;
    
    // Calculate the average adjusted price
    return Math.round(adjustedPrices.reduce((sum, price) => sum + price, 0) / adjustedPrices.length);
  };
  
  // Loading state
  if (isLoadingAppraisal || isLoadingComparables) {
    return <div className="p-8 flex justify-center">Loading appraisal details...</div>;
  }
  
  // Error state
  if (appraisalError || !appraisal) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"><>

          <p className="font-medium">Error loading appraisal</p>
          <p
</> className="mt-1">The appraisal you're looking for doesn't exist or couldn't be loaded.</p>
          <Link to="/" className="inline-block mt-4 text-red-700 hover:text-red-800 font-medium">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Process comparables with adjustments
  const adjustedComparables = calculateAdjustedValues(comparables);
  const reconciledValue = calculateReconciledValue(adjustedComparables);
  
  // Format dates
  const formattedInspectionDate = appraisal.inspection_date 
    ? format(new Date(appraisal.inspection_date), 'MMM d, yyyy')
    : '—';
  
  const formattedEffectiveDate = appraisal.effective_date
    ? format(new Date(appraisal.effective_date), 'MMM d, yyyy')
    : '—';
  
  const formattedCreatedDate = appraisal.created_at
    ? format(new Date(appraisal.created_at), 'MMM d, yyyy')
    : '—';
  
  return (
    <div className="p-6">
      {/* Appraisal Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            {appraisal.property_id && (
              <Link to={`/properties/${appraisal.property_id}`} className="text-primary hover:text-primary/80">
                ← Back to Property
              </Link>
            )}
            {!appraisal.property_id && (
              <Link to="/" className="text-primary hover:text-primary/80">
                ← Back to Dashboard
              </Link>
            )}<>

            <span className="text-gray-400">|</span>
            <span
</> className="text-gray-500 text-sm">Appraisal ID: {appraisal.id}</span>
          </div><>

          <h1 className="text-3xl font-bold mt-2 text-gray-800">
            Appraisal: {appraisal.property?.address || 'Property #' + appraisal.property_id}
          </h1>
          <p
</> className="text-gray-600">
            {appraisal.purpose} | {appraisal.status} | Created: {formattedCreatedDate}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 space-x-2">
          {!isEditing ? (
            <><>

              <button 
                onClick={startEditing}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Edit Appraisal
              </button>
              <button
</> 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <><>

              <button 
                onClick={saveAppraisalChanges}
                disabled={updateAppraisalMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {updateAppraisalMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
</> 
                onClick={cancelEditing}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"><>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Appraisal Deletion</h3>
            <p
</> className="text-gray-600 mb-6">
              Are you sure you want to delete this appraisal? This action cannot be undone and will also delete all associated comparables and data.
            </p>
            <div className="flex justify-end space-x-3"><>

              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
</> 
                onClick={deleteAppraisal}
                disabled={deleteAppraisalMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {deleteAppraisalMutation.isPending ? 'Deleting...' : 'Delete Appraisal'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Appraisal Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          {isEditing ? (
            // Edit Mode
            <div><>

              <h2 className="text-xl font-semibold mb-4">Edit Appraisal Details</h2>
              <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><>

                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
</>
                    name="status"
                    value={editableAppraisal?.status || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {APPRAISAL_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Purpose</label>
                  <input
</>
                    type="text"
                    name="purpose"
                    value={editableAppraisal?.purpose || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Inspection Date</label>
                  <input
</>
                    type="date"
                    name="inspection_date"
                    value={editableAppraisal?.inspection_date 
                      ? new Date(editableAppraisal.inspection_date).toISOString().split('T')[0] 
                      : ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Effective Date</label>
                  <input
</>
                    type="date"
                    name="effective_date"
                    value={editableAppraisal?.effective_date 
                      ? new Date(editableAppraisal.effective_date).toISOString().split('T')[0] 
                      : ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Report Type</label>
                  <select
</>
                    name="report_type"
                    value={editableAppraisal?.report_type || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  ><>

                    <option value="">Select Report Type</option>
                    <option
</> value="Full">Full</option><>

                    <option value="Limited">Limited</option>
                    <option
</> value="Desktop">Desktop</option><>

                    <option value="Form 1004">Form 1004</option>
                    <option
</> value="Form 1073">Form 1073</option>
                  </select>
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Market Value</label>
                  <input
</>
                    type="number"
                    name="market_value"
                    value={editableAppraisal?.market_value || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    step="1000"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <input
</>
                    type="text"
                    name="client_name"
                    value={editableAppraisal?.client_name || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Client Email</label>
                  <input
</>
                    type="email"
                    name="client_email"
                    value={editableAppraisal?.client_email || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Client Phone</label>
                  <input
</>
                    type="tel"
                    name="client_phone"
                    value={editableAppraisal?.client_phone || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Lender Name</label>
                  <input
</>
                    type="text"
                    name="lender_name"
                    value={editableAppraisal?.lender_name || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Loan Number</label>
                  <input
</>
                    type="text"
                    name="loan_number"
                    value={editableAppraisal?.loan_number || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Valuation Method</label>
                  <select
</>
                    name="valuation_method"
                    value={editableAppraisal?.valuation_method || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  ><>

                    <option value="">Select Method</option>
                    <option
</> value="Sales Comparison">Sales Comparison</option><>

                    <option value="Income">Income</option>
                    <option
</> value="Cost">Cost</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div className="md:col-span-2"><>

                  <label className="block text-sm font-medium mb-1">Intended Use</label>
                  <input
</>
                    type="text"
                    name="intended_use"
                    value={editableAppraisal?.intended_use || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="md:col-span-2"><>

                  <label className="block text-sm font-medium mb-1">Scope of Work</label>
                  <textarea
</>
                    name="scope_of_work"
                    value={editableAppraisal?.scope_of_work || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  ></textarea>
                </div>
                
                <div className="md:col-span-2"><>

                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
</>
                    name="notes"
                    value={editableAppraisal?.notes || ''}
                    onChange={handleAppraisalChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  ></textarea>
                </div>
              </div>
            </div>
          ) : (
            // View Mode
            <div>
              <div className="flex justify-between items-center mb-4"><>

                <h2 className="text-xl font-semibold">Appraisal Details</h2>
                <div
</> className={`px-3 py-1 rounded-full text-sm font-medium 
                  ${appraisal.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    appraisal.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    appraisal.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    appraisal.status === 'Canceled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}`}
                >
                  {appraisal.status}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-x-8">
                <div><>

                  <h3 className="font-medium text-primary mb-3">Appraisal Information</h3>
                  <dl
</> className="space-y-2">
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Purpose:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.purpose}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Inspection Date:</dt>
                      <dd
</> className="font-medium text-gray-900">{formattedInspectionDate}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Effective Date:</dt>
                      <dd
</> className="font-medium text-gray-900">{formattedEffectiveDate}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Report Type:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.report_type || '—'}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Valuation Method:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.valuation_method || '—'}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Market Value:</dt>
                      <dd
</> className="font-medium text-gray-900">
                        {appraisal.market_value ? `$${appraisal.market_value.toLocaleString()}` : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Reconciled Value:</dt>
                      <dd
</> className="font-medium text-green-600">
                        {reconciledValue > 0 ? `$${reconciledValue.toLocaleString()}` : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div><>

                  <h3 className="font-medium text-primary mb-3">Client Information</h3>
                  <dl
</> className="space-y-2">
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Client:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.client_name || '—'}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Client Email:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.client_email || '—'}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Client Phone:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.client_phone || '—'}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Lender:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.lender_name || '—'}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Loan Number:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.loan_number || '—'}</dd>
                    </div>
                    <div className="flex justify-between"><>

                      <dt className="text-gray-500">Intended Use:</dt>
                      <dd
</> className="font-medium text-gray-900">{appraisal.intended_use || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {(appraisal.scope_of_work || appraisal.notes) && (
                <div className="mt-6 border-t pt-4">
                  {appraisal.scope_of_work && (
                    <div className="mb-4"><>

                      <h3 className="font-medium text-primary mb-2">Scope of Work</h3>
                      <p
</> className="text-gray-700 whitespace-pre-line">{appraisal.scope_of_work}</p>
                    </div>
                  )}
                  
                  {appraisal.notes && (
                    <div><>

                      <h3 className="font-medium text-primary mb-2">Notes</h3>
                      <p
</> className="text-gray-700 whitespace-pre-line">{appraisal.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Property Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Subject Property</h2>
          
          {appraisal.property ? (
            <div>
              <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center mb-4">
                <div className="text-6xl text-gray-400">
                  {appraisal.property.property_type === 'Commercial' ? '🏢' : 
                   appraisal.property.property_type === 'Land' ? '🏞️' : 
                   appraisal.property.property_type === 'Multi-Family' ? '🏘️' : '🏠'}
                </div>
              </div><>

              
              <h3 className="font-medium text-lg mb-2">{appraisal.property.address}</h3>
              <p
</> className="text-gray-500 mb-4">
                {appraisal.property.city}, {appraisal.property.state} {appraisal.property.zip_code}
              </p>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>{' '}
                  <span className="font-medium">{appraisal.property.property_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Year Built:</span>{' '}
                  <span className="font-medium">{appraisal.property.year_built || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Square Feet:</span>{' '}
                  <span className="font-medium">
                    {appraisal.property.square_feet ? `${appraisal.property.square_feet.toLocaleString()}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Bed/Bath:</span>{' '}
                  <span className="font-medium">
                    {appraisal.property.bedrooms || 0}/{appraisal.property.bathrooms || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Lot Size:</span>{' '}
                  <span className="font-medium">
                    {appraisal.property.lot_size ? `${appraisal.property.lot_size.toLocaleString()} sqft` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Zoning:</span>{' '}
                  <span className="font-medium">{appraisal.property.zoning || '—'}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link 
                  to={`/properties/${appraisal.property.id}`}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  View Full Property Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md"><>

              <p className="text-gray-500">Property details not available.</p>
              <p
</> className="text-sm text-gray-500 mt-1">The property may have been deleted or is not accessible.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Comparable Sales */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4"><>

          <h2 className="text-xl font-semibold">Comparable Sales</h2>
          <button
</>
            onClick={() => setShowAddComparable(!showAddComparable)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            {showAddComparable ? 'Cancel' : 'Add Comparable'}
          </button>
        </div>
        
        {/* Add Comparable Form */}
        {showAddComparable && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 animate-fade-in"><>

            <h3 className="text-lg font-medium mb-3">Add Comparable Property</h3>
            <form
</> onSubmit={createComparable}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Basic Info */}
                <div><>

                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <input
</>
                    type="text"
                    name="address"
                    value={newComparable.address || ''}
                    onChange={handleComparableChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
</>
                    type="text"
                    name="city"
                    value={newComparable.city || ''}
                    onChange={handleComparableChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div><>

                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input
</>
                      type="text"
                      name="state"
                      value={newComparable.state || ''}
                      onChange={handleComparableChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div><>

                    <label className="block text-sm font-medium mb-1">ZIP *</label>
                    <input
</>
                      type="text"
                      name="zip_code"
                      value={newComparable.zip_code || ''}
                      onChange={handleComparableChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {/* Sale Details */}
                <div><>

                  <label className="block text-sm font-medium mb-1">Sale Price *</label>
                  <input
</>
                    type="number"
                    name="sale_price"
                    value={newComparable.sale_price || ''}
                    onChange={handleComparableChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Sale Date *</label>
                  <input
</>
                    type="date"
                    name="sale_date"
                    value={newComparable.sale_date instanceof Date 
                      ? newComparable.sale_date.toISOString().split('T')[0]
                      : (newComparable.sale_date || '')}
                    onChange={handleComparableChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Days on Market</label>
                  <input
</>
                    type="number"
                    name="days_on_market"
                    value={newComparable.days_on_market || ''}
                    onChange={handleComparableChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                {/* Property Details */}
                <div><>

                  <label className="block text-sm font-medium mb-1">Property Type *</label>
                  <select
</>
                    name="property_type"
                    value={newComparable.property_type || ''}
                    onChange={handleComparableChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {PROPERTY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Square Feet</label>
                  <input
</>
                    type="number"
                    name="square_feet"
                    value={newComparable.square_feet || ''}
                    onChange={handleComparableChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div><>

                    <label className="block text-sm font-medium mb-1">Beds</label>
                    <input
</>
                      type="number"
                      name="bedrooms"
                      value={newComparable.bedrooms || ''}
                      onChange={handleComparableChange}
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div><>

                    <label className="block text-sm font-medium mb-1">Baths</label>
                    <input
</>
                      type="number"
                      name="bathrooms"
                      value={newComparable.bathrooms || ''}
                      onChange={handleComparableChange}
                      min="0"
                      step="0.5"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Year Built</label>
                  <input
</>
                    type="number"
                    name="year_built"
                    value={newComparable.year_built || ''}
                    onChange={handleComparableChange}
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Lot Size (sqft)</label>
                  <input
</>
                    type="number"
                    name="lot_size"
                    value={newComparable.lot_size || ''}
                    onChange={handleComparableChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
</>
                    name="condition"
                    value={newComparable.condition || ''}
                    onChange={handleComparableChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {COMPARABLE_CONDITIONS.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>
                
                {/* Additional Info */}
                <div><>

                  <label className="block text-sm font-medium mb-1">Source</label>
                  <input
</>
                    type="text"
                    name="source"
                    value={newComparable.source || ''}
                    onChange={handleComparableChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., MLS, Tax Records"
                  />
                </div>
                
                <div className="md:col-span-3"><>

                  <label className="block text-sm font-medium mb-1">Adjustment Notes</label>
                  <textarea
</>
                    name="adjustment_notes"
                    value={newComparable.adjustment_notes || ''}
                    onChange={handleComparableChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Note any specific adjustments or comments about this comparable"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={createComparableMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createComparableMutation.isPending ? 'Adding...' : 'Add Comparable'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {adjustedComparables.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md"><>

            <p className="text-gray-500">No comparable properties have been added yet.</p>
            <p
</> className="text-sm text-gray-500 mt-1">Click 'Add Comparable' to start adding sales data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 text-xs">
                <tr><>

                  <th className="py-3 px-3 text-left font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th
</> className="py-3 px-3 text-left font-medium text-gray-500 uppercase tracking-wider">Sale Date</th><>

                  <th className="py-3 px-3 text-left font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                  <th
</> className="py-3 px-3 text-left font-medium text-gray-500 uppercase tracking-wider">Size</th><>

                  <th className="py-3 px-3 text-left font-medium text-gray-500 uppercase tracking-wider">Features</th>
                  <th
</> className="py-3 px-3 text-left font-medium text-gray-500 uppercase tracking-wider">Adjusted Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adjustedComparables.map((comp) => {
                  const formattedSaleDate = comp.sale_date
                    ? format(new Date(comp.sale_date), 'MMM d, yyyy')
                    : '—';
                  
                  return (
                    <tr key={comp.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 whitespace-nowrap"><>

                        <div className="font-medium text-gray-900">{comp.address}</div>
                        <div
</> className="text-xs text-gray-500">{comp.city}, {comp.state}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap"><>

                        <div className="text-sm text-gray-900">{formattedSaleDate}</div>
                        <div
</> className="text-xs text-gray-500">
                          {comp.days_on_market ? `${comp.days_on_market} days on market` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap"><>

                        <div className="text-sm font-medium text-gray-900">
                          ${comp.sale_price.toLocaleString()}
                        </div>
                        <div
</> className="text-xs text-gray-500">
                          {comp.square_feet ? `$${Math.round(comp.sale_price / comp.square_feet)}/sqft` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {comp.square_feet ? `${comp.square_feet.toLocaleString()} sqft` : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap"><>

                        <div className="text-sm text-gray-900">
                          {comp.bedrooms || 0} bed / {comp.bathrooms || 0} bath
                        </div>
                        <div
</> className="text-xs text-gray-500">
                          {comp.year_built ? `Built ${comp.year_built}` : ''} 
                          {comp.condition ? `, ${comp.condition} condition` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {comp.adjusted_price ? (
                          <div><>

                            <div className="text-sm font-medium text-green-600">
                              ${comp.adjusted_price.toLocaleString()}
                            </div>
                            <div
</> className="text-xs text-gray-500">
                              {comp.adjustment_notes ? 'Has adjustments' : 'No adjustments'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">—</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr><>

                  <td colSpan={5} className="py-3 px-3 text-right font-medium">
                    Reconciled Value (Average of Adjusted Prices):
                  </td>
                  <td
</> className="py-3 px-3 text-left font-bold text-green-600">
                    ${reconciledValue.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppraisalDetail;