import React from 'react';
import '../styles/ConfirmModal.css';

interface ConfirmModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ show, onClose, onConfirm }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Resignation</h2>
                <p>Are you sure you want to resign and acknowledge your opponent's win?</p>
                <div className="modal-buttons">
                    <button className="common-button" onClick={onConfirm}>Yes</button>
                    <button className="common-button" onClick={onClose}>No</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
