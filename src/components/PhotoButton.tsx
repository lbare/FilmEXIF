import React from 'react';

interface PhotoButtonProps {
  onAddPhoto: (photo: any) => void;
}

const PhotoButton: React.FC<PhotoButtonProps> = ({ onAddPhoto }) => {
  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const photo = {
          date: new Date(),
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        };
        onAddPhoto(photo);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <button 
      className="px-4 py-2 mt-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      onClick={handleClick}
    >
      Take Photo
    </button>
  );
};

export default PhotoButton;