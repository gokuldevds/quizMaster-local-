import React from 'react';

const ConfirmModal = ({ isOpen, title = 'Are you sure?', message, onCancel, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', blur = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${blur ? 'backdrop-blur-sm' : ''}`}
      style={
        blur
          ? { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }
          : undefined
      }
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-6">{message}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
