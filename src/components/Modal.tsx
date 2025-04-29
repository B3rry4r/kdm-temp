import React, { useState } from 'react';
import { CloseSVG } from '../assets/icons/icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  heading: string;
  description: string;
  inputPlaceholder: string;
  buttonText: string;
  onButtonClick: (inputValue: string) => void;
  width?: string;
  isLoading?: boolean;
  error?: string | null;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  heading,
  description,
  inputPlaceholder,
  buttonText,
  onButtonClick,
  width = 'w-96',
  isLoading = false,
  error = null,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleButtonClick = () => {
    onButtonClick(inputValue);
    setInputValue(''); // Clear input after click
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm z-9999 flex items-center justify-center">
      <div className={`bg-white p-6 rounded-lg shadow-lg ${width}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{heading}</h2>
          <button className="cursor-pointer" onClick={() => {
            console.log('Modal close button clicked');
            onClose();
          }}>
            <CloseSVG size={20} color={'gray'} />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">{description}</p>
        <input
          type="text"
          placeholder={inputPlaceholder}
          value={inputValue}
          onChange={(e) => {
            console.log('Modal input changed:', e.target.value);
            setInputValue(e.target.value);
          }}
          className="w-full p-2 rounded-lg mb-4 bg-gray-100 text-[10px] outline-none"
        />
        {error && (
          <p className="text-[#68049B] text-xs mb-4">{error}</p>
        )}
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          className="w-full py-2 bg-[#FFD30F] h-10 text-sm text-gray-800 font-bold cursor-pointer rounded-lg flex justify-center items-center disabled:opacity-50"
        >
          {isLoading ? <div className="loader"></div> : buttonText}
        </button>
      </div>
    </div>
  );
};

export default Modal;