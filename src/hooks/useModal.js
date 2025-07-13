import { useState, useCallback } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null
  });

  const showModal = useCallback(({
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onConfirm = null
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel,
      onConfirm
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title, message) => {
    showModal({ title, message, type: 'success' });
  }, [showModal]);

  const showError = useCallback((title, message) => {
    showModal({ title, message, type: 'error' });
  }, [showModal]);

  const showWarning = useCallback((title, message) => {
    showModal({ title, message, type: 'warning' });
  }, [showModal]);

  const showInfo = useCallback((title, message) => {
    showModal({ title, message, type: 'info' });
  }, [showModal]);

  const showConfirm = useCallback((title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
    showModal({ 
      title, 
      message, 
      type: 'confirm', 
      onConfirm, 
      confirmText, 
      cancelText,
      showCancel: true 
    });
  }, [showModal]);

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};
