import React from 'react';

// Spójny modal potwierdzenia (zamiast natywnego window.confirm).
const ConfirmModal = ({
    open,
    title = 'Potwierdź akcję',
    message,
    confirmLabel = 'Potwierdź',
    cancelLabel = 'Anuluj',
    danger = true,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="btn-cancel" onClick={onCancel}>{cancelLabel}</button>
                    <button className={danger ? 'btn-delete' : 'btn-save'} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
