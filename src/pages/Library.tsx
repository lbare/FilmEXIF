import { useRolls } from "../contexts/useRolls";
import { Box, Text, RingProgress, Center, Button } from "@mantine/core";
import { Plus } from "@phosphor-icons/react";
import { FilmRoll } from "../interfaces";

const Library = () => {
  const { rolls, addPhotoToRoll } = useRolls();

  const addPhoto = (roll: FilmRoll) => {
    console.log(roll);

    const newPhoto = {
      location: {
        latitude: 0,
        longitude: 0,
      },
      date: new Date().toISOString(),
    };

    addPhotoToRoll(roll.id, newPhoto);
    console.log(rolls);
  };

  return (
    <Box className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Active Rolls</h2>
      <div className="grid gap-4">
        {rolls.length > 0 ? (
          rolls.map((roll, index) => (
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
                <Box className="flex flex-col items-start px-4">
                  <Text className="text-lg font-semibold pr-2">
                    {roll.name}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    {`${roll.filmBrand} ${roll.filmName} ${roll.iso}`}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    {roll.camera}
                  </Text>
                </Box>
              </Box>
              <Button
                className="w-14 h-14 rounded-xl"
                variant="light"
                onClick={() => addPhoto(roll)}
              >
                <Plus size={30} />
              </Button>
            </Box>
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
