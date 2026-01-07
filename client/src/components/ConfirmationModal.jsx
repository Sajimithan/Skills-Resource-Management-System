import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    message,
    type = 'success', // 'success', 'error', 'confirm'
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    requiresText = '' // If provided, user must type this to enable confirm
}) => {
    const [inputValue, setInputValue] = useState('');

    // Reset input when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setInputValue('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requiresText && inputValue.toLowerCase() !== requiresText.toLowerCase()) return;
        if (onConfirm) onConfirm();
        onClose();
    };

    const isConfirmType = type === 'confirm';
    const isError = type === 'error';
    const isDestructive = !!requiresText;
    const isButtonDisabled = isDestructive && inputValue.toLowerCase() !== requiresText.toLowerCase();

    return (
        <div
            className="fixed inset-0 bg-black-50 flex items-center justify-center z-1000 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-surface p-8 rounded-lg max-w-md animate-fade-in shadow-xl border border-primary/30">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${isError || isDestructive
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-green-500/20 border-green-500/50'
                        }`}>
                        {isError ? (
                            <AlertCircle size={32} className="text-red-400" />
                        ) : isDestructive ? (
                            <Trash2 size={32} className="text-red-400" />
                        ) : (
                            <CheckCircle size={32} className="text-green-400" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-2">
                        {isDestructive ? 'Critical Action' : isConfirmType ? 'Confirm Action' : isError ? 'Error' : 'Success!'}
                    </h3>
                    <p className="text-text-muted mb-6">{message}</p>

                    {isDestructive && (
                        <div className="w-full mb-6 text-left">
                            <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest block mb-1.5 ml-1">
                                Type <span className="text-red-400">"{requiresText}"</span> to confirm
                            </label>
                            <input
                                autoFocus
                                type="text"
                                className="form-input w-full bg-background border-red-500/30 focus:border-red-500/60"
                                placeholder={`Type ${requiresText} here...`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 w-full justify-center">
                        {isConfirmType || isDestructive ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="btn btn-secondary rounded-full px-6 flex-1"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isButtonDisabled}
                                    className={`btn rounded-full px-6 flex-1 transition-all ${isButtonDisabled
                                        ? 'bg-white-5 text-text-muted cursor-not-allowed'
                                        : isDestructive
                                            ? 'btn-danger shadow-lg shadow-red-500/20'
                                            : 'btn-primary'
                                        }`}
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
