import { useState } from "react";
import { useRolls } from "../contexts/useRolls";
import { Box, Text, RingProgress, Center, Button } from "@mantine/core";
import { Plus } from "@phosphor-icons/react";
import { FilmRoll, Photo } from "../interfaces";
import { FilmStrip, Camera, Check, CameraRotate } from "@phosphor-icons/react";
import PulseLoader from "react-spinners/PulseLoader";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

const Library = () => {
  const { activeRolls, developedRolls, completedRolls, addPhotoToRoll } =
    useRolls();
  const [loadingRolls, setLoadingRolls] = useState<{ [key: string]: boolean }>(
    {}
  );

  const navigate = useNavigate();

  const addPhoto = (roll: FilmRoll) => {
    setLoadingRolls((prev) => ({ ...prev, [roll.id]: true }));

    const handleLocationSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      const newPhoto: Photo = {
        id: uuidv4(),
        location: {
          latitude,
          longitude,
        },
        date: new Date().toISOString(),
      };

      addPhotoToRoll(roll.id, newPhoto);
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
      const newPhoto: Photo = {
        id: uuidv4(),
        location: {
          latitude: 0,
          longitude: -10,
        },
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
        location: {
          latitude: -10,
          longitude: 0,
        },
        date: new Date().toISOString(),
      };

      addPhotoToRoll(roll.id, newPhoto);
    }

    setLoadingRolls((prev) => ({ ...prev, [roll.id]: false }));
  };

  if (
    activeRolls.length === 0 &&
    developedRolls.length === 0 &&
    completedRolls.length === 0
  ) {
    return (
      <Box className="h-svh flex flex-col mx-auto justify-center items-center">
        <h2 className="text-2xl font-bold mb-16">No Rolls Available</h2>
        <Button onClick={() => navigate("/tabs/add")} className="w-32">
          Add
        </Button>
      </Box>
    );
  }

  return (
    <Box className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Active Rolls</h2>
      <div className="grid gap-4">
        {activeRolls.length > 0 ? (
          activeRolls.map((roll, index) => (
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
                      <Text className="text-lg font-semibold">
                        {roll.photos.length + 1}
                      </Text>
                    </Center>
                  }
                  sections={[
                    {
                      value: ((roll.photos.length + 1) / roll.exposures) * 100,
                      color: "blue",
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
              {loadingRolls[roll.id] ? (
                <Button
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  variant="light"
                >
                  <PulseLoader color="#74c0fc" loading size={6} />
                </Button>
              ) : (
                <Button
                  className="w-14 h-14 rounded-xl"
                  variant="light"
                  onClick={() => addPhoto(roll)}
                >
                  <Plus size={30} color="#74c0fc" />
                </Button>
              )}
            </Box>
          ))
        ) : (
          <Text className="text-center text-neutral-500">
            No active rolls available.
          </Text>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-8">Develop</h2>
      <div className="grid gap-4">
        {developedRolls.length > 0 ? (
          developedRolls.map((roll, index) => (
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
                      <CameraRotate
                        size={18}
                        color="#fab005"
                        weight="regular"
                      />
                    </Center>
                  }
                  sections={[
                    {
                      value: 100,
                      color: "yellow",
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
          ))
        ) : (
          <Text className="text-center text-neutral-500">
            No rolls need developing.
          </Text>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-8">Completed</h2>
      <div className="grid gap-4">
        {completedRolls.length > 0 ? (
          completedRolls.map((roll, index) => (
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
                      <Check size={18} color="#40c057" weight="bold" />
                    </Center>
                  }
                  sections={[
                    {
                      value: 100,
                      color: "green",
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
          ))
        ) : (
          <Text className="text-center text-neutral-500">
            No completed rolls available.
          </Text>
        )}
      </div>
    </Box>
  );
};

export default Library;
