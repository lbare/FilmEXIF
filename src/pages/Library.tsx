import { useState } from "react";
import { useRolls } from "../contexts/useRolls";
import { Box, Text, RingProgress, Center, Button } from "@mantine/core";
import { Plus } from "@phosphor-icons/react";
import { FilmRoll } from "../interfaces";
import { FilmStrip, Camera } from "@phosphor-icons/react";
import PulseLoader from "react-spinners/PulseLoader";

const Library = () => {
  const { rolls, addPhotoToRoll } = useRolls();
  const [loadingRolls, setLoadingRolls] = useState<{ [key: string]: boolean }>(
    {}
  );

  const addPhoto = (roll: FilmRoll) => {
    setLoadingRolls((prev) => ({ ...prev, [roll.id]: true }));

    const handleLocationSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      const newPhoto = {
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
      const newPhoto = {
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
      const newPhoto = {
        location: {
          latitude: -10,
          longitude: 0,
        },
        date: new Date().toISOString(),
      };

      addPhotoToRoll(roll.id, newPhoto);
    }
    setTimeout(() => {
      setLoadingRolls((prev) => ({ ...prev, [roll.id]: false }));
    }, 1000);
  };

  return (
    <Box className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Active Rolls</h2>
      <div className="grid gap-4">
        {rolls.length > 0 ? (
          rolls.map((roll, index) => (
            <>
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
                      { value: roll.photos.length + 1 / 0.36, color: "blue" },
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
            </>
          ))
        ) : (
          <Text className="text-center text-neutral-500">
            No rolls available.
          </Text>
        )}
      </div>
    </Box>
  );
};

export default Library;
