import React from 'react';

interface Step1VerificationProps {
  onContinue: () => void;
  updateFormData: (data: any) => void;
  formData: any;
}

const FileUploadInput: React.FC<{ label: string, fieldName: string, updateFormData: (data: any) => void, required?: boolean }> = ({ label, fieldName, updateFormData, required = true }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string>('Upload document');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateFormData({ [fieldName]: file });
      setFileName(file.name);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required ? '' : <span className="text-gray-500">(optional)</span>}
    </label>
    <div className="flex items-center justify-between border border-gray-300 rounded-md p-3">
      <span className="text-gray-500 truncate pr-2">{fileName}</span>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <button type="button" onClick={handleClick} className="px-4 py-2 text-sm font-semibold text-purple-600 bg-purple-100 rounded-md hover:bg-purple-200 flex-shrink-0">
        Upload
      </button>
    </div>
  </div>
  )
};


const Step1Verification: React.FC<Step1VerificationProps> = ({ onContinue, updateFormData }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Verify your identity</h2>

      <div className="p-8">
                <FileUploadInput label="Upload NIN Slip (jpeg, .pdf, .png)" fieldName="nin_slip" updateFormData={updateFormData} />
        <FileUploadInput label="Upload passport photograph (jpeg, .pdf, .png)" fieldName="passport" updateFormData={updateFormData} />
        <FileUploadInput label="Upload signature (jpeg, .pdf, .png)" fieldName="signature" updateFormData={updateFormData} />
        <FileUploadInput label="Other documents" fieldName="other_document" updateFormData={updateFormData} required={false} />
      </div>

      <div className="mt-8 flex justify-end">
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

export default Step1Verification;
