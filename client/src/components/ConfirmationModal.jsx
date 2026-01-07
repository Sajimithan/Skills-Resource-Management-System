import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    message,
    type = 'success', // 'success', 'error', 'confirm'
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    const isConfirmType = type === 'confirm';
    const isError = type === 'error';

    return (
        <div
            className="fixed inset-0 bg-black-50 flex items-center justify-center z-1000 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-surface p-8 rounded-lg max-w-md animate-fade-in shadow-xl border border-primary/30">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${isError
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-green-500/20 border-green-500/50'
                        }`}>
                        {isError ? (
                            <AlertCircle size={32} className="text-red-400" />
                        ) : (
                            <CheckCircle size={32} className="text-green-400" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-2">
                        {isConfirmType ? 'Confirm Action' : isError ? 'Error' : 'Success!'}
                    </h3>
                    <p className="text-text-muted mb-6">{message}</p>

                    <div className="flex gap-3">
                        {isConfirmType ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="btn btn-secondary rounded-full px-6"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="btn btn-primary rounded-full px-6"
                                >
                                    {confirmText}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="btn btn-primary rounded-full px-8"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
