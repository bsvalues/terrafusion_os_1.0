import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Building2, Calendar, DollarSign, FileText  } from '@mui/icons-material';

interface AppraisalFormValues {
  purpose: string;
  inspectionDate: string;
  effectiveDate: string;
  reportType: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  lenderName: string;
  loanNumber: string;
  intendedUse: string;
  valuationMethod: string;
  scopeOfWork: string;
  notes: string;
}

export const AppraisalForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AppraisalFormValues>({
    purpose: 'Purchase',
    inspectionDate: new Date().toISOString().slice(0, 10),
    effectiveDate: new Date().toISOString().slice(0, 10),
    reportType: 'Full',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    lenderName: '',
    loanNumber: '',
    intendedUse: 'Mortgage financing',
    valuationMethod: 'Sales Comparison',
    scopeOfWork: 'Complete property inspection and market analysis',
    notes: ''
  });

  // Parse property ID from query params if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const propId = params.get('propertyId');
    if (propId) {
      setPropertyId(propId);
    }
  }, [location]);

  // Fetch property details if we have a property ID
  useEffect(() => {
    if (propertyId) {
      setLoading(true);
      fetch(`/api/properties/${propertyId}`)
        .then(response => response.json())
        .then(data => {
          setProperty(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching property:', error);
          setLoading(false);
        });
    }
  }, [propertyId]);

  // Fetch appraisal data if editing an existing appraisal
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/appraisals/${id}`)
        .then(response => response.json())
        .then(data => {
          setFormValues({
            purpose: data.purpose || 'Purchase',
            inspectionDate: data.inspectionDate ? new Date(data.inspectionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            effectiveDate: data.effectiveDate ? new Date(data.effectiveDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            reportType: data.reportType || 'Full',
            clientName: data.clientName || '',
            clientEmail: data.clientEmail || '',
            clientPhone: data.clientPhone || '',
            lenderName: data.lenderName || '',
            loanNumber: data.loanNumber || '',
            intendedUse: data.intendedUse || 'Mortgage financing',
            valuationMethod: data.valuationMethod || 'Sales Comparison',
            scopeOfWork: data.scopeOfWork || 'Complete property inspection and market analysis',
            notes: data.notes || ''
          });
          
          // Set property if available
          if (data.propertyId) {
            setPropertyId(data.propertyId.toString());
            
            // Fetch property details
            fetch(`/api/properties/${data.propertyId}`)
              .then(response => response.json())
              .then(propertyData => {
                setProperty(propertyData);
                setLoading(false);
              })
              .catch(error => {
                console.error('Error fetching property:', error);
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        })
        .catch(error => {
          console.error('Error fetching appraisal:', error);
          setLoading(false);
        });
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyId) {
      alert('Please select a property to appraise');
      return;
    }
    
    setSubmitting(true);
    
    const appraisalData = {
      ...formValues,
      propertyId: parseInt(propertyId),
      // In a real application, the appraiser ID would come from authentication
      appraiserId: 1
    };
    
    const url = id ? `/api/appraisals/${id}` : '/api/appraisals';
    const method = id ? 'PUT' : 'POST';
    
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appraisalData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setSubmitting(false);
        navigate(`/appraisals/${data.id}`);
      })
      .catch(error => {
        console.error('Error saving appraisal:', error);
        setSubmitting(false);
        alert('Error saving appraisal. Please try again.');
      });
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/appraisals" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Appraisals</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div><>

          <h1 className="text-3xl font-bold">{id ? 'Edit Appraisal' : 'New Appraisal'}</h1>
          <p
</> className="text-gray-600 mt-1">
            {id ? 'Update appraisal information' : 'Create a new property appraisal'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <Building2 size={20} className="mr-2 text-blue-500" />
                Subject Property
              </h2>
            </div>
            <div className="p-6">
              {property ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div><>

                      <h3 className="text-lg font-medium">{property.address}</h3>
                      <p
</> className="text-gray-600">{property.city}, {property.state} {property.zipCode}</p>
                    </div>
                    <Link 
                      to={`/properties/${property.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Property Details
                    </Link>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 p-2 rounded"><>

                      <span className="text-gray-500">Property Type:</span>
                      <div
</> className="font-medium">{property.propertyType}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded"><>

                      <span className="text-gray-500">Year Built:</span>
                      <div
</> className="font-medium">{property.yearBuilt || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded"><>

                      <span className="text-gray-500">Square Feet:</span>
                      <div
</> className="font-medium">{property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="shrink-0">
                        <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3"><>

                        <h3 className="text-sm font-medium text-yellow-800">No property selected</h3>
                        <div
</> className="mt-2 text-sm text-yellow-700">
                          <p>Please select a property from the properties list before creating an appraisal.</p>
                        </div>
                        <div className="mt-4">
                          <Link
                            to="/properties"
                            className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                          >
                            Go to Properties List →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appraisal Information Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText size={20} className="mr-2 text-green-500" />
                Appraisal Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><>

                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose of Appraisal
                    </label>
                    <select
</>
                      id="purpose"
                      name="purpose"
                      value={formValues.purpose}
                      onChange={handleInputChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    ><>

                      <option value="Purchase">Purchase</option>
                      <option
</> value="Refinance">Refinance</option><>

                      <option value="Home Equity">Home Equity</option>
                      <option
</> value="Estate Planning">Estate Planning</option><>

                      <option value="Tax Assessment">Tax Assessment</option>
                      <option
</> value="Other">Other</option>
                    </select>
                  </div>

                  <div><>

                    <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Inspection Date
                    </label>
                    <input
</>
                      type="date"
                      id="inspectionDate"
                      name="inspectionDate"
                      value={formValues.inspectionDate}
                      onChange={handleInputChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div><>

                    <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Effective Date
                    </label>
                    <input
</>
                      type="date"
                      id="effectiveDate"
                      name="effectiveDate"
                      value={formValues.effectiveDate}
                      onChange={handleInputChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div><>

                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                      Report Type
                    </label>
                    <select
</>
                      id="reportType"
                      name="reportType"
                      value={formValues.reportType}
                      onChange={handleInputChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    ><>

                      <option value="Full">Full Appraisal</option>
                      <option
</> value="Limited">Limited Appraisal</option><>

                      <option value="Hybrid">Hybrid Appraisal</option>
                      <option
</> value="Desktop">Desktop Appraisal</option>
                    </select>
                  </div>

                  <div><>

                    <label htmlFor="valuationMethod" className="block text-sm font-medium text-gray-700 mb-1">
                      Valuation Method
                    </label>
                    <select
</>
                      id="valuationMethod"
                      name="valuationMethod"
                      value={formValues.valuationMethod}
                      onChange={handleInputChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    ><>

                      <option value="Sales Comparison">Sales Comparison</option>
                      <option
</> value="Income">Income Approach</option><>

                      <option value="Cost">Cost Approach</option>
                      <option
</> value="Multiple">Multiple Approaches</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div><>

                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name
                    </label>
                    <input
</>
                      type="text"
                      id="clientName"
                      name="clientName"
                      value={formValues.clientName}
                      onChange={handleInputChange}
                      placeholder="Enter client name"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div><>

                    <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Client Email
                    </label>
                    <input
</>
                      type="email"
                      id="clientEmail"
                      name="clientEmail"
                      value={formValues.clientEmail}
                      onChange={handleInputChange}
                      placeholder="Enter client email"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div><>

                    <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Client Phone
                    </label>
                    <input
</>
                      type="text"
                      id="clientPhone"
                      name="clientPhone"
                      value={formValues.clientPhone}
                      onChange={handleInputChange}
                      placeholder="Enter client phone"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div><>

                    <label htmlFor="lenderName" className="block text-sm font-medium text-gray-700 mb-1">
                      Lender Name (if applicable)
                    </label>
                    <input
</>
                      type="text"
                      id="lenderName"
                      name="lenderName"
                      value={formValues.lenderName}
                      onChange={handleInputChange}
                      placeholder="Enter lender name"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div><>

                    <label htmlFor="loanNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Number (if applicable)
                    </label>
                    <input
</>
                      type="text"
                      id="loanNumber"
                      name="loanNumber"
                      value={formValues.loanNumber}
                      onChange={handleInputChange}
                      placeholder="Enter loan number"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div><>

                  <label htmlFor="intendedUse" className="block text-sm font-medium text-gray-700 mb-1">
                    Intended Use
                  </label>
                  <input
</>
                    type="text"
                    id="intendedUse"
                    name="intendedUse"
                    value={formValues.intendedUse}
                    onChange={handleInputChange}
                    placeholder="Enter intended use"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div><>

                  <label htmlFor="scopeOfWork" className="block text-sm font-medium text-gray-700 mb-1">
                    Scope of Work
                  </label>
                  <textarea
</>
                    id="scopeOfWork"
                    name="scopeOfWork"
                    value={formValues.scopeOfWork}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe the scope of work"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div><>

                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
</>
                    id="notes"
                    name="notes"
                    value={formValues.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter any additional notes"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4"><>

            <Link
              to="/appraisals"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
</>
              type="submit"
              disabled={submitting || !propertyId}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                submitting || !propertyId
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
</> className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save size={18} className="mr-2" />
                  {id ? 'Update Appraisal' : 'Create Appraisal'}
                </span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};