// Library.tsx
import React, { useState } from "react";
import { useRolls } from "../contexts/useRolls";
import { useNavigate } from "react-router-dom";
import PulseLoader from "react-spinners/PulseLoader";
import { v4 as uuidv4 } from "uuid";
import { FilmRoll, Photo } from "../interfaces";
import { Box, Text, Button } from "@mantine/core";
import RollOptionsModal from "../components/RollOptionsModal";
import RollList from "../components/RollList";
import { useLongPress } from "@uidotdev/usehooks";

const Library: React.FC = () => {
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<FilmRoll | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    activeRolls,
    developedRolls,
    completedRolls,
    addPhotoToRoll,
    moveRoll,
    isLoading,
    loadingRolls,
  } = useRolls();

  const navigate = useNavigate();

  const handleAddPhoto = (roll: FilmRoll) => {
    const handleLocationSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      const newPhoto: Photo = {
        id: uuidv4(),
        location: { latitude, longitude },
        date: new Date().toISOString(),
      };

      addPhotoToRoll(roll.id, newPhoto);
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
      const newPhoto: Photo = {
        id: uuidv4(),
        location: { latitude: 0, longitude: 0 },
        date: new Date().toISOString(),
      };

      addPhotoToRoll(roll.id, newPhoto);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      const newPhoto: Photo = {
        id: uuidv4(),
        location: { latitude: 0, longitude: 0 },
        date: new Date().toISOString(),
      };

      addPhotoToRoll(roll.id, newPhoto);
    }
  };

  const handleFinishRoll = (roll: FilmRoll) => {
    moveRoll(roll.id, "active", "developed");
  };

  const handleCompleteRoll = (roll: FilmRoll) => {
    moveRoll(roll.id, "developed", "completed");
  };

  const openRollOptionsModal = (roll: FilmRoll) => {
    setSelectedRoll(roll);
    setModalOpened(true);
  };

  const longPressEventHandlers = useLongPress(
    () => {
      if (selectedRoll) {
        openRollOptionsModal(selectedRoll);
      }
    },
    {
      threshold: 150,
    }
  );

  const handleButtonClick = (roll: FilmRoll) => {
    setSelectedRoll(roll);
    handleAddPhoto(roll);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const handleUploadEnd = () => {
    setIsUploading(false);
  };

  if (isLoading) {
    return (
      <Box className="h-svh flex flex-col mx-auto justify-center items-center">
        <PulseLoader color="#69DB7C" loading size={10} />
        <Text className="text-neutral-500 mt-4">Loading rolls...</Text>
      </Box>
    );
  }

  const noRollsAvailable =
    activeRolls.length === 0 &&
    developedRolls.length === 0 &&
    completedRolls.length === 0;

  if (noRollsAvailable) {
    return (
      <Box className="h-svh flex flex-col mx-auto justify-center items-center">
        <h2 className="text-2xl font-bold mb-16">No Rolls Available</h2>
        <Button
          onClick={() => navigate("/tabs/add")}
          className="w-32"
          variant="light"
          color="green"
        >
          Add
        </Button>
      </Box>
    );
  }

  return (
    <Box className="max-w-lg mx-auto p-4">
      <RollList
        title="Active"
        rolls={activeRolls}
        stage="active"
        loadingRolls={loadingRolls}
        isUploading={isUploading}
        onAddPhoto={handleButtonClick}
        onFinishRoll={handleFinishRoll}
        longPressEventHandlers={longPressEventHandlers}
      />

      <RollList
        title="Develop"
        rolls={developedRolls}
        stage="developed"
        loadingRolls={loadingRolls}
        onAddPhoto={handleButtonClick}
        onFinishRoll={handleCompleteRoll}
      />

      <RollList
        title="Completed"
        rolls={completedRolls}
        stage="completed"
        loadingRolls={loadingRolls}
        onAddPhoto={handleButtonClick}
        onFinishRoll={handleCompleteRoll}
      />

      {selectedRoll && (
        <RollOptionsModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          roll={selectedRoll}
          onFinishRoll={handleFinishRoll}
          onUploadStart={handleUploadStart}
          onUploadEnd={handleUploadEnd}
        />
      )}
    </Box>
  );
};

export default Library;
