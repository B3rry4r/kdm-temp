// import React, { useState } from 'react';
import { CloseSVG } from '../../assets/icons/icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  width?: string;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, width = 'w-96', children }) => {


  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 w-full bg-[rgba(0,0,0,0.5)] max-sm:p-3 overflow-y-scroll h-full  backdrop-blur-sm z-1000 flex items-center justify-center">
      <div className={`bg-white px-8 py-6 relative rounded-2xl shadow-lg ${width}`}>        
        <div className="flex relative justify-between items-center mb-4">
          {children ? null : <div />}
          <button className="cursor-pointer absolute right-0 top-5 min-w-5 min-h-5" onClick={onClose}>
            <CloseSVG />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;