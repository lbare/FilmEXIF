import { useRolls } from "../contexts/useRolls";
import { Box, Text, RingProgress, Center } from "@mantine/core";

const Library = () => {
  const { rolls } = useRolls();

  return (
    <Box className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Library</h2>
      <div className="grid gap-4">
        {rolls.length > 0 ? (
          rolls.map((roll, index) =>
            roll.name ? (
              <Box
                key={index}
                className="flex items-center justify-between flex-row p-4 border rounded-lg"
              >
                <Box className="flex flex-row items-center">
                  <Text className="text-lg font-semibold">{roll.name}</Text>
                  <Text className="px-4 text-sm text-neutral-500">
                    {`${roll.filmBrand} ${roll.filmName} ${roll.iso}`}
                  </Text>
                </Box>
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
                  sections={[{ value: 32 / 0.36, color: "blue" }]}
                />
              </Box>
            ) : (
              <Box
                key={index}
                className="flex flex-row p-4 items-center justify-between border rounded-lg shadow"
              >
                <Box>
                  <Text className="text-lg font-semibold">
                    {`${roll.filmBrand} ${roll.filmName} ${roll.iso}`}
                  </Text>
                </Box>
                <RingProgress
                  size={50}
                  thickness={3}
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
              </Box>
            )
          )
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
