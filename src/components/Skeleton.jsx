import React from 'react';

// Pasek ładowania (shimmer skeleton).
const Skeleton = ({ width = '100%', height = 14, style }) => (
    <div className="skeleton" style={{ width, height, ...style }} aria-hidden="true" />
);

export default Skeleton;
