import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { toast } from '../lib/toast';
import Skeleton from '../components/Skeleton';

// Przeglądarka obrazów z R2 (do pola image_url w pytaniach).
const R2ImagePicker = ({ open, onClose, onSelect }) => {
    const [folders, setFolders] = useState([]);
    const [activeFolder, setActiveFolder] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Pobierz listę folderów przy otwarciu
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const loadFolders = async () => {
            try {
                const res = await apiFetch('/api/admin/r2/folders');
                const data = await res.json();
                if (!cancelled && data.success) {
                    setFolders(data.data);
                    if (data.data.length > 0) setActiveFolder(data.data[0]);
                }
            } catch {
                if (!cancelled) toast("Błąd pobierania folderów.", "error");
            }
        };
        loadFolders();
        return () => { cancelled = true; };
    }, [open]);

    // Pobierz obrazy dla aktywnego folderu
    useEffect(() => {
        if (!open || !activeFolder) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`/api/admin/r2/images?prefix=${encodeURIComponent(activeFolder + '/')}`);
                const data = await res.json();
                if (!cancelled) {
                    if (data.success) setImages(data.data);
                    else toast(data.error || "Błąd listowania obrazów.", "error");
                }
            } catch {
                if (!cancelled) toast("Błąd połączenia podczas listowania obrazów.", "error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [open, activeFolder]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
                <header className="section-header-flex">
                    <h3>🖼️ Wybierz obraz z R2</h3>
                    <button className="close-modal" onClick={onClose}>×</button>
                </header>

                {selectedImage ? (
                    <div className="r2-preview">
                        <img src={selectedImage.url} alt={selectedImage.name} />
                        <p className="r2-item-name">{selectedImage.name}</p>
                        <div className="r2-preview-actions">
                            <button className="btn-edit" onClick={() => setSelectedImage(null)}>← Wróć</button>
                            <button className="btn-save" onClick={() => { onSelect(selectedImage.url); onClose(); }}>✅ Wybierz ten obraz</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {folders.map((f) => (
                                <button
                                    key={f}
                                    className={activeFolder === f ? 'btn-save' : 'btn-edit'}
                                    onClick={() => setActiveFolder(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="r2-grid">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} height={90} />
                                ))}
                            </div>
                        ) : images.length === 0 ? (
                            <p className="no-data">Brak obrazów w tym folderze.</p>
                        ) : (
                            <div className="r2-grid">
                                {images.map((img) => (
                                    <div
                                        key={img.key}
                                        className="r2-item"
                                        title={img.name}
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img src={img.url} alt={img.name} loading="lazy" />
                                        <span className="r2-item-name">{img.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default R2ImagePicker;
