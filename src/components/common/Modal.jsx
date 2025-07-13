import React from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'confirm', 'info'
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-8 h-8 text-success" />;
      case 'error':
        return <XCircleIcon className="w-8 h-8 text-error" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-8 h-8 text-warning" />;
      case 'confirm':
        return <ExclamationTriangleIcon className="w-8 h-8 text-warning" />;
      default:
        return <InformationCircleIcon className="w-8 h-8 text-info" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success':
        return 'btn-success';
      case 'error':
        return 'btn-error';
      case 'warning':
        return 'btn-warning';
      case 'confirm':
        return 'btn-error';
      default:
        return 'btn-primary';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="text-base text-base-content">{message}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-base-300">
          {(showCancel || type === 'confirm') && (
            <button
              onClick={onClose}
              className="btn btn-ghost"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`btn ${getButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
