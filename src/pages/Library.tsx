// Library.tsx
import React, { useState } from "react";
import { useRolls } from "../contexts/useRolls";
import { useNavigate } from "react-router-dom";
import PulseLoader from "react-spinners/PulseLoader";
import { v4 as uuidv4 } from "uuid";
import { FilmRoll, Photo } from "../interfaces";
import { Box, Text, RingProgress, Center, Button } from "@mantine/core";
import {
  FilmStrip,
  Camera,
  Folder,
  CameraRotate,
  Plus,
  Check,
} from "@phosphor-icons/react";
import { formatDateToLong } from "../utils/dateUtils";
import RollOptionsModal from "../components/RollOptionsModal";
import { useLongPress } from "@uidotdev/usehooks";

const Library: React.FC = () => {
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<FilmRoll | null>(null);

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

  const handleAddPhotoWithImage = (roll: FilmRoll) => {
    console.log("Adding photo with image to roll:", roll);
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
      <h2 className="text-2xl font-bold mb-4">Active</h2>
      <div className="grid gap-4">
        {activeRolls.map((roll, index) => (
          <Box
            key={index}
            className="flex items-center justify-between flex-row p-4 border border-neutral-500 rounded-lg"
          >
            <Box className="flex flex-row items-center">
              <RingProgress
                size={50}
                thickness={3}
                roundCaps
                label={
                  <Center>
                    <Text className="text-lg font-semibold text-green-400">
                      {(roll.photos?.length || 0) + 1}
                    </Text>
                  </Center>
                }
                sections={[
                  {
                    value:
                      (((roll.photos?.length || 0) + 1) / roll.exposures) * 100,
                    color: "#69DB7C",
                  },
                ]}
              />
              <Box className="flex flex-col items-start px-4 justify-center">
                <Text className="text-lg font-semibold leading-tight text-neutral-300 -mt-1">
                  {roll.name || formatDateToLong(roll.dateCreated)}
                </Text>
                <Box className="flex flex-row w-full items-center justify-start">
                  <FilmStrip size={16} color="#737373" weight="regular" />
                  <Text className="pl-2 text-xs text-neutral-500 leading-tight">
                    {`${roll.filmBrand} ${roll.filmName} ${roll.iso}`}
                  </Text>
                </Box>
                <Box className="flex flex-row w-full items-center justify-start">
                  <Camera size={16} color="#737373" weight="regular" />
                  <Text className="pl-2 text-xs text-neutral-500 leading-tight">
                    {roll.camera}
                  </Text>
                </Box>
              </Box>
            </Box>

            {loadingRolls[roll.id] || roll.isLoading ? (
              <Button
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                variant="light"
                color="#69DB7C"
              >
                <PulseLoader color="#69DB7C" loading size={6} />
              </Button>
            ) : (
              <Button
                className="w-14 h-14 rounded-xl"
                variant="light"
                color="#69DB7C"
                onClick={() => handleButtonClick(roll)}
                {...longPressEventHandlers}
              >
                <Plus size={30} color="#69DB7C" weight="bold" />
              </Button>
            )}
          </Box>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-8">Develop</h2>
      <div className="grid gap-4">
        {developedRolls.map((roll, index) => (
          <Box
            key={index}
            className="flex items-center justify-between flex-row p-4 border border-neutral-500 rounded-lg"
          >
            <Box className="flex flex-row items-center">
              <RingProgress
                size={50}
                thickness={3}
                label={
                  <Center>
                    <CameraRotate size={20} color="#F59F00" weight="regular" />
                  </Center>
                }
                sections={[
                  {
                    value: 100,
                    color: "#F59F00",
                  },
                ]}
              />
              <Box className="flex flex-col items-start px-4 justify-center">
                <Text className="text-lg font-semibold leading-tight text-neutral-300 -mt-1">
                  {roll.name}
                </Text>
                <Box className="flex flex-row w-full items-center justify-start">
                  <FilmStrip size={16} color="#737373" weight="regular" />
                  <Text className="pl-2 text-xs text-neutral-500 leading-tight">
                    {`${roll.filmBrand} ${roll.filmName} ${roll.iso}`}
                  </Text>
                </Box>
                <Box className="flex flex-row w-full items-center justify-start">
                  <Camera size={16} color="#737373" weight="regular" />
                  <Text className="pl-2 text-xs text-neutral-500 leading-tight">
                    {roll.camera}
                  </Text>
                </Box>
              </Box>
            </Box>
            {loadingRolls[roll.id] || roll.isLoading ? (
              <Button
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                variant="light"
                color="#F59F00"
              >
                <PulseLoader color="#F59F00" loading size={6} />
              </Button>
            ) : (
              <Button
                className="w-14 h-14 rounded-xl"
                variant="light"
                color="#F59F00"
                onClick={() => handleCompleteRoll(roll)}
              >
                <Check size={30} color="#F59F00" weight="bold" />
              </Button>
            )}
          </Box>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-8">Completed</h2>
      <div className="grid gap-4">
        {completedRolls.map((roll, index) => (
          <Box
            key={index}
            className="flex items-center justify-between flex-row p-4 border border-neutral-500 rounded-lg"
          >
            <Box className="flex flex-row items-center">
              <RingProgress
                size={50}
                thickness={3}
                label={
                  <Center>
                    <Folder size={20} color="#228BE6" weight="regular" />
                  </Center>
                }
                sections={[
                  {
                    value: 100,
                    color: "#228BE6",
                  },
                ]}
              />
              <Box className="flex flex-col items-start px-4 justify-center">
                <Text className="text-lg font-semibold leading-tight text-neutral-300 -mt-1">
                  {roll.name}
                </Text>
                <Box className="flex flex-row w-full items-center justify-start">
                  <FilmStrip size={16} color="#737373" weight="regular" />
                  <Text className="pl-2 text-xs text-neutral-500 leading-tight">
                    {`${roll.filmBrand} ${roll.filmName} ${roll.iso}`}
                  </Text>
                </Box>
                <Box className="flex flex-row w-full items-center justify-start">
                  <Camera size={16} color="#737373" weight="regular" />
                  <Text className="pl-2 text-xs text-neutral-500 leading-tight">
                    {roll.camera}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </div>

      {selectedRoll && (
        <RollOptionsModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          roll={selectedRoll}
          onAddPhotoWithImage={handleAddPhotoWithImage}
          onFinishRoll={handleFinishRoll}
        />
      )}
    </Box>
  );
};

export default Library;
