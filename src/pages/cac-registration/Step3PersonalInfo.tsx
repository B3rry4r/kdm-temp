import React, { useState, useEffect } from 'react';
import { nigeriaStatesLGAs } from '../../data/nigeriaStatesLGAs';

interface Step3PersonalInfoProps {
  onSubmit: () => void;
  onBack: () => void;
  updateFormData: (data: any) => void;
  formData: any;
  isSubmitting: boolean;
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

const Step3PersonalInfo: React.FC<Step3PersonalInfoProps> = ({ onSubmit, onBack, updateFormData, formData, isSubmitting }) => {
  // Nigerian state/LGA logic
  const [selectedState, setSelectedState] = useState<string>(formData.state_of_prop || nigeriaStatesLGAs[0].state);
  const [availableLgas, setAvailableLgas] = useState<string[]>([]);

  useEffect(() => {
    const found = nigeriaStatesLGAs.find(s => s.state === selectedState);
    setAvailableLgas(found ? found.lgas : []);
    if (!found?.lgas.includes(formData.lga_of_prop)) {
      updateFormData({ lga_of_prop: '' });
    }
    // eslint-disable-next-line
  }, [selectedState]);

  useEffect(() => {
    if (formData.state_of_prop && formData.state_of_prop !== selectedState) {
      setSelectedState(formData.state_of_prop);
    }
    // eslint-disable-next-line
  }, [formData.state_of_prop]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
    if (e.target.name === 'state_of_prop') {
      setSelectedState(e.target.value);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Tell us about yourself</h2>
      <div className="p-8">
        <InputField label="State code" name="state_code" value={formData.state_code} onChange={handleChange} placeholder="Enter code code" />
        <InputField label="Surname" name="surname_of_prop" value={formData.surname_of_prop} onChange={handleChange} placeholder="Enter surname" />
        <InputField label="First Name" name="first_name_of_prop" value={formData.first_name_of_prop} onChange={handleChange} placeholder="Enter first name" />
        <InputField label="Other name" name="other_name_of_prop" value={formData.other_name_of_prop} onChange={handleChange} placeholder="Enter other name" optional />
        <InputField label="Phone number" name="phone_of_prop" value={formData.phone_of_prop} onChange={handleChange} placeholder="Enter phone number" type="tel" />
        <InputField label="Email" name="email_of_prop" value={formData.email_of_prop} onChange={handleChange} placeholder="Enter email address" type="email" />
        <SelectField label="Gender" name="gender_of_prop" value={formData.gender_of_prop} onChange={handleChange} placeholder="Select gender"><option value="Male">Male</option><option value="Female">Female</option></SelectField>
        <SelectField label="State" name="state_of_prop" value={selectedState} onChange={handleChange} placeholder="Select state">
          {nigeriaStatesLGAs.map(stateObj => (
            <option key={stateObj.state} value={stateObj.state}>{stateObj.state}</option>
          ))}
        </SelectField>
        <SelectField label="LGA" name="lga_of_prop" value={formData.lga_of_prop} onChange={handleChange} placeholder="Select LGA">
          <option value="" disabled>Select LGA</option>
          {availableLgas.map(lga => (
            <option key={lga} value={lga}>{lga}</option>
          ))}
        </SelectField>
        <InputField label="City" name="city_of_prop" value={formData.city_of_prop} onChange={handleChange} placeholder="Enter city"/>
        <InputField label="Street name" name="p_street_name" value={formData.p_street_name} onChange={handleChange} placeholder="Enter street name" />
        <InputField label="Street Number" name="street_number_of_prop" value={formData.street_number_of_prop} onChange={handleChange} placeholder="Enter street number" />
        <InputField label="Nationality" name="nationality_of_prop" value={formData.nationality_of_prop} onChange={handleChange} placeholder="Enter your nationality" />
        <InputField label="Postal code" name="postal_code_of_prop" value={formData.postal_code_of_prop} onChange={handleChange} placeholder="Enter postal code" />
        <InputField label="Service address" name="service_address_of_prop" value={formData.service_address_of_prop} onChange={handleChange} placeholder="Enter service address" />
        <InputField label="Date of birth" name="date_of_birth_of_prop" value={formData.date_of_birth_of_prop} onChange={handleChange} placeholder="Select date" type="date" />
      </div>
      <div className="mt-8 flex justify-between items-center">
        <button onClick={onBack} className="text-gray-600 font-semibold hover:text-purple-600">
          Go back
        </button>
                <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`px-12 py-3 font-semibold rounded-md ${!isSubmitting ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          {isSubmitting ? 'Submitting...' : 'Register company'}
        </button>
      </div>
    </div>
  );
};

export default Step3PersonalInfo;
