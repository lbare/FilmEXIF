import React, { useState, useEffect } from "react";
import PhotoButton from "./PhotoButton";

interface CameraRollProps {
  name: string;
}

const CameraRoll: React.FC<CameraRollProps> = ({ name }) => {
  const [photos, setPhotos] = useState<any[]>(() => {
    // Retrieve photos from localStorage
    const savedPhotos = localStorage.getItem(`photos-${name}`);
    return savedPhotos ? JSON.parse(savedPhotos) : [];
  });

  const addPhoto = (photo: any) => {
    const newPhotos = [...photos, photo];
    setPhotos(newPhotos);
    // Save photos to localStorage
    localStorage.setItem(`photos-${name}`, JSON.stringify(newPhotos));
  };

  useEffect(() => {
    // Save photos to localStorage when photos state changes
    localStorage.setItem(`photos-${name}`, JSON.stringify(photos));
  }, [photos, name]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-4">
      <h2 className="text-xl font-bold mb-2">{name}</h2>
      <PhotoButton onAddPhoto={addPhoto} />
      <ul className="mt-2">
        {photos.map((photo, index) => (
          <li key={index} className="text-sm">
            {JSON.stringify(photo)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CameraRoll;
