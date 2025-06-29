import React, { useState, useEffect } from 'react';
import { nigeriaStatesLGAs } from '../../data/nigeriaStatesLGAs';
interface Step2CompanyInfoProps {
  onContinue: () => void;
  onBack: () => void;
  updateFormData: (data: any) => void;
  formData: any;
}

const InputField: React.FC<{ label: string, name: string, value: string, placeholder: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, optional?: boolean }> = ({ label, name, value, placeholder, onChange, type = 'text', optional = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {optional && <span className="text-gray-500">(optional)</span>}
    </label>
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50" />
  </div>
);

const SelectField: React.FC<{ label: string, name: string, value: string, placeholder: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }> = ({ label, name, value, placeholder, onChange, children }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <select name={name} value={value} onChange={onChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-500">
            <option value="">{placeholder}</option>
            {children}
        </select>
    </div>
);

const Step2CompanyInfo: React.FC<Step2CompanyInfoProps> = ({ onContinue, onBack, updateFormData, formData }) => {
  // Set up state for the selected state and corresponding LGAs
  const [selectedState, setSelectedState] = useState<string>(formData.company_state || nigeriaStatesLGAs[0].state);
  const [availableLgas, setAvailableLgas] = useState<string[]>([]);

  useEffect(() => {
    // When selectedState changes, update available LGAs
    const found = nigeriaStatesLGAs.find(s => s.state === selectedState);
    setAvailableLgas(found ? found.lgas : []);
    // If the selected LGA is not in the new list, reset it
    if (!found?.lgas.includes(formData.company_lga)) {
      updateFormData({ company_lga: '' });
    }
    // eslint-disable-next-line
  }, [selectedState]);

  useEffect(() => {
    // If formData.company_state changes from outside, update selectedState
    if (formData.company_state && formData.company_state !== selectedState) {
      setSelectedState(formData.company_state);
    }
    // eslint-disable-next-line
  }, [formData.company_state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
    if (e.target.name === 'company_state') {
      setSelectedState(e.target.value);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Tell us about your company</h2>
      <div className="p-8">
        <InputField label="First Choice" name="p_company_name_one" value={formData.p_company_name_one} onChange={handleChange} placeholder="Enter company name" />
        <InputField label="Second Choice" name="p_company_name_two" value={formData.p_company_name_two} onChange={handleChange} placeholder="Enter company name" />
        <InputField label="Third Choice" name="p_company_name_three" value={formData.p_company_name_three} onChange={handleChange} placeholder="Enter company name" />
        <InputField label="Nature of business" name="nature_of_business" value={formData.nature_of_business} onChange={handleChange} placeholder="Enter nature of business" />
        <SelectField label="Company state" name="company_state" value={selectedState} onChange={handleChange} placeholder="Select state">
          {nigeriaStatesLGAs.map(stateObj => (
            <option key={stateObj.state} value={stateObj.state}>{stateObj.state}</option>
          ))}
        </SelectField>
        <SelectField label="Company LGA" name="company_lga" value={formData.company_lga} onChange={handleChange} placeholder="Select LGA">
          <option value="" disabled>Select LGA</option>
          {availableLgas.map(lga => (
            <option key={lga} value={lga}>{lga}</option>
          ))}
        </SelectField>
        <InputField label="Company city" name="company_city" value={formData.company_city} onChange={handleChange} placeholder="Enter city" />
        <InputField label="Company street name" name="company_street_name" value={formData.company_street_name} onChange={handleChange} placeholder="Enter street name" />
        <InputField label="Street Number" name="company_street_number" value={formData.company_street_number} onChange={handleChange} placeholder="Enter street number" />
        <InputField label="Company email" name="company_email" value={formData.company_email} onChange={handleChange} placeholder="Enter valid company email" type="email" />
        <InputField label="Business commencement date" name="biz_commence_date" value={formData.biz_commence_date} onChange={handleChange} placeholder="Select date" type="date" />
      </div>
      <div className="mt-8 flex justify-between items-center">
        <button onClick={onBack} className="text-gray-600 font-semibold hover:text-purple-600">
          Go back
        </button>
        <button
          onClick={onContinue}
          className="px-12 py-3 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step2CompanyInfo;
