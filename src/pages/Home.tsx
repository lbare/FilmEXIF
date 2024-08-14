import React, { useEffect } from "react";

const Home: React.FC = () => {
  useEffect(() => console.log("Home mounted"), []);

  return (
    <div className="flex w-screen flex-col items-center">
      <h1 className="text-2xl font-bold my-4">Rolls</h1>
    </div>
  );
};

export default Home;
