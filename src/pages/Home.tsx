import React from 'react';
import CameraRoll from '../components/CameraRoll';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold my-4">Active Rolls</h1>
      <CameraRoll name="Camera 1" />
      <CameraRoll name="Camera 2" />
    </div>
  );
};

export default Home;