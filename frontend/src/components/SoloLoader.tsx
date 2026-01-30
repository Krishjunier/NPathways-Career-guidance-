import React from 'react';

interface SoloLoaderProps {
  size?: 'small' | 'medium' | 'large';
}

const SoloLoader: React.FC<SoloLoaderProps> = ({ size = 'medium' }) => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
};

export default SoloLoader;
