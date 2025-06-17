import React from 'react';

interface StepperProps {
  currentStep: number;
}

const CacStepper: React.FC<StepperProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Verification' },
    { number: 2, title: 'Company Info' },
    { number: 3, title: 'Personal Info' },
  ];

  return (
    <div className="flex items-center justify-center w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${currentStep >= step.number ? 'bg-purple-600' : 'bg-gray-300'}`}>
                {currentStep > step.number ? (
                  <span>&#10003;</span>
                ) : (
                  step.number
                )}
              </div>
              <p className={`text-sm ${currentStep >= step.number ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
                Step {step.number}
              </p>
              <p className={`text-xs ${currentStep >= step.number ? 'text-purple-600' : 'text-gray-400'}`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.number ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CacStepper;
