import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  useEffect(() => {
    const verifyPaymentAndSubmit = async () => {
      const params = new URLSearchParams(location.search);
      const status = params.get('status');
      const tx_ref = params.get('tx_ref');

      if (status && tx_ref) {
        if (status.toLowerCase() === 'successful' || status.toLowerCase() === 'completed') {
          const savedData = sessionStorage.getItem('cac_form_data');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Restore text data, user will need to re-upload files
            setFormData(prev => ({ ...prev, ...parsedData }));
            showAlert('Payment successful! Please re-upload your documents to finalize your registration.', 'info');
            sessionStorage.setItem('cac_payment_verified', 'true');
            // Clean URL params
            navigate(location.pathname, { replace: true });
          } else {
            showAlert('Could not find saved form data after payment.', 'error');
          }
        } else {
          showAlert('Payment was not successful. Please try again.', 'error');
        }
        // Clean URL params
        navigate(location.pathname, { replace: true });
      }
    };

    verifyPaymentAndSubmit();
  }, [location.search, navigate, showAlert]);

  const handleFinalSubmit = async () => {
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
      setShowSuccessModal(true);
    } catch (error: any) {
            console.error('Registration error:', error);
      showAlert(error.response?.data?.message || 'An error occurred during registration.', 'error');
    } finally {
      setIsSubmitting(false);
      sessionStorage.removeItem('cac_form_data');
      sessionStorage.removeItem('cac_payment_verified');
    }
  };

  const handleSubmit = async () => {
    if (!isStep3Valid()) {
        showAlert('Please fill out all required personal info fields.', 'error');
        return;
    }

    if (sessionStorage.getItem('cac_payment_verified') === 'true') {
      handleFinalSubmit();
      return;
    }

    if (!user) {
      showAlert('You must be logged in to proceed.', 'error');
      return;
    }

    // Save text data to sessionStorage, excluding file objects
    const { nin_slip, passport, signature, other_document, ...dataToSave } = formData;
    sessionStorage.setItem('cac_form_data', JSON.stringify(dataToSave));

    const paymentPayload = {
      amount: 1000, // This can be changed later
      redirect_url: window.location.href,
      email: user.email,
      phone: user.phone,
      name: `${user.firstname} ${user.lastname}`,
    };

    try {
      setIsSubmitting(true);
      const response = await apiClient4.post('/payment/link', paymentPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.link) {
        window.location.href = response.data.link;
      } else {
        showAlert('Could not initiate payment. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      showAlert(error.response?.data?.message || 'An error occurred while initiating payment.', 'error');
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
        {currentStep === 3 && <Step3PersonalInfo onSubmit={sessionStorage.getItem('cac_payment_verified') === 'true' ? handleFinalSubmit : handleSubmit} onBack={handleBack} updateFormData={updateFormData} formData={formData} isSubmitting={isSubmitting} />}
      </div>
      </div>
      {showSuccessModal && <SuccessModal onClose={() => { setShowSuccessModal(false); navigate('/cac-registration', { replace: true }); setCurrentStep(1); setFormData({ nin_slip: null, passport: null, signature: null, other_document: null, p_company_name_one: '', p_company_name_two: '', p_company_name_three: '', nature_of_business: '', company_street_name: '', company_street_number: '', company_city: '', company_state: '', company_email: '', biz_commence_date: '', state_code: '', surname_of_prop: '', first_name_of_prop: '', other_name_of_prop: '', phone_of_prop: '', email_of_prop: '', p_street_name: '', street_number_of_prop: '', gender_of_prop: '', city_of_prop: '', state_of_prop: '', lga_of_prop: '', postal_code_of_prop: '', service_address_of_prop: '', date_of_birth_of_prop: '', nationality_of_prop: 'NG' }); }} />}
    </div>
  );
};

const SuccessModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful</h2>
      <p className="text-gray-600 mb-6">
        Thank you for registering your business name. The Corporate Affairs Commission (CAC) will contact you via email once your certificate is ready. Please note that the registration process may take up to one month to complete.
      </p>
      <button
        onClick={onClose}
        className="w-full bg-[#FFD600] hover:bg-[#FFB800] text-black font-bold py-3 px-4 rounded-lg transition duration-300"
      >
        Go Back to Registration
      </button>
    </div>
  </div>
);

export default CacRegistration;
