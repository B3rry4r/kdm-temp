import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useAlert } from '../../context/AlertContext/AlertContext';
import CacStepper from './CacStepper';
import Step1Verification from './Step1Verification';
import Step2CompanyInfo from './Step2CompanyInfo';
import Step3PersonalInfo from './Step3PersonalInfo';

const CacRegistration: React.FC = () => {
  const { apiClient4, user, token } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nin_slip: null as File | null,
    passport: null as File | null,
    signature: null as File | null,
    other_document: null as File | null,
    p_company_name_one: '',
    p_company_name_two: '',
    p_company_name_three: '',
    nature_of_business: '',
    company_street_name: '',
    company_street_number: '',
    company_city: '',
    company_state: '',
    company_email: '',
    biz_commence_date: '',
    state_code: '',
    surname_of_prop: '',
    first_name_of_prop: '',
    other_name_of_prop: '',
    phone_of_prop: '',
    email_of_prop: '',
    p_street_name: '',
    street_number_of_prop: '',
    gender_of_prop: '',
    city_of_prop: '',
    state_of_prop: '',
    lga_of_prop: '',
    postal_code_of_prop: '',
    service_address_of_prop: '',
    date_of_birth_of_prop: '',
    nationality_of_prop: 'NG',
  });
      const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep1 = () => {
    const { nin_slip, passport, signature } = formData;
    if (!nin_slip || !passport || !signature) {
      showAlert('Please upload all required documents.', 'error');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const requiredFields = ['p_company_name_one', 'nature_of_business', 'company_state', 'company_city', 'company_street_name', 'company_street_number', 'company_email', 'biz_commence_date'];
    for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
            showAlert(`Please fill out all required company fields.`, 'error');
            return false;
        }
    }
    return true;
  };

  const isStep3Valid = () => {
    const requiredFields = [
      'state_code', 'surname_of_prop', 'first_name_of_prop', 'phone_of_prop',
      'email_of_prop', 'p_street_name', 'street_number_of_prop', 'gender_of_prop', 'city_of_prop',
      'state_of_prop', 'lga_of_prop', 'postal_code_of_prop', 'service_address_of_prop',
      'date_of_birth_of_prop', 'nationality_of_prop'
    ];
    return requiredFields.every(field => !!formData[field as keyof typeof formData]);
  }

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

    const handleContinue = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

      const handleSubmit = async () => {
    if (!isStep3Valid()) {
        showAlert('Please fill out all required personal info fields.', 'error');
        return;
    }
        if (!user) {
      showAlert('You must be logged in to register.', 'error');
      return;
    }

    const data = new FormData();
    data.append('user_id', user.id);

    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        data.append(key, value);
      }
    });

    try {
            setIsSubmitting(true);
      const log = await apiClient4.post('/kmb/cac/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(log);
      showAlert('Company registration submitted successfully!', 'success');
      navigate('/');
    } catch (error: any) {
            console.error('Registration error:', error);
      showAlert(error.response?.data?.message || 'An error occurred during registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-x-scroll pr-12 py-12 px-4 sm:px-6 lg:px-8">
      <div className='max-w-xl'>
      <div className="mb-10">
            <h1 className="text-2xl font-bold text-gray-900">Business Name Registration</h1>
            <p className="mt-4 text-md text-gray-600">Ensure you are registered on the Kudimata app before you proceed with the business name registration</p>
        </div>

      <CacStepper currentStep={currentStep} />

      <div className="mt-12">
        {currentStep === 1 && <Step1Verification onContinue={handleContinue} updateFormData={updateFormData} formData={formData} />}
        {currentStep === 2 && <Step2CompanyInfo onContinue={handleContinue} onBack={handleBack} updateFormData={updateFormData} formData={formData} />}
        {currentStep === 3 && <Step3PersonalInfo onSubmit={handleSubmit} onBack={handleBack} updateFormData={updateFormData} formData={formData} isSubmitting={isSubmitting} />}
      </div>
      </div>
    </div>
  );
};

export default CacRegistration;
