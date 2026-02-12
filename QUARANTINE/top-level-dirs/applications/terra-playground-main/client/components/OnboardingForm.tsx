import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface OnboardingFormProps {
  onSubmit: (data: any) => Promise<void>;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onSubmit }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    countyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    implementationDate: '',
    features: [''],
    customizations: ['']
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (
    index: number,
    value: string,
    field: 'features' | 'customizations'
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item))
    }));
  };

  const addArrayItem = (field: 'features' | 'customizations') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index: number, field: 'features' | 'customizations') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-lg`}
      onSubmit={handleSubmit}
    >
<>
      <h2
        className={`text-2xl font-bold mb-6 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        County Onboarding Information
      </h2>

      <div
</> className="space-y-4">
        <div>
<>
          <label
            className={`block mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            County Name
          </label>
          <input
</>
            type="text"
            name="countyName"
            value={formData.countyName}
            onChange={handleInputChange}
            required
            className={`w-full p-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
        </div>

        <div>
<>
          <label
            className={`block mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Contact Name
          </label>
          <input
</>
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleInputChange}
            required
            className={`w-full p-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
        </div>

        <div>
<>
          <label
            className={`block mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Contact Email
          </label>
          <input
</>
            type="email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            required
            className={`w-full p-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
        </div>

        <div>
<>
          <label
            className={`block mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Contact Phone
          </label>
          <input
</>
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            required
            className={`w-full p-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
        </div>

        <div>
<>
          <label
            className={`block mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Implementation Date
          </label>
          <input
</>
            type="date"
            name="implementationDate"
            value={formData.implementationDate}
            onChange={handleInputChange}
            required
            className={`w-full p-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
        </div>

        <div>
          <label
            className={`block mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Features
          </label>
          {formData.features.map((feature /* , index */) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={feature}
                onChange={e => handleArrayInputChange(index, e.target.value, 'features')}
                className={`flex-1 p-2 rounded border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => removeArrayItem(index, 'features')}
                className={`p-2 rounded ${
                  theme === 'dark'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('features')}
            className={`mt-2 p-2 rounded ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            Add Feature
          </button>
        </div>

        <div>
          <label
            className={`block mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Customizations
          </label>
          {formData.customizations.map((customization /* , index */) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={customization}
                onChange={e =>
                  handleArrayInputChange(index, e.target.value, 'customizations')
                }
                className={`flex-1 p-2 rounded border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => removeArrayItem(index, 'customizations')}
                className={`p-2 rounded ${
                  theme === 'dark'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('customizations')}
            className={`mt-2 p-2 rounded ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            Add Customization
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`mt-6 w-full p-3 rounded ${
          theme === 'dark'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-green-500 hover:bg-green-600'
        } text-white font-semibold ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Generating PDF...' : 'Generate Onboarding PDF'}
      </button>
    </motion.form>
  );
}; 