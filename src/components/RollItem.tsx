import React from "react";
import { Box, Text, RingProgress, Center, Button } from "@mantine/core";
import { FilmStrip, Camera, Plus, Check, Folder } from "@phosphor-icons/react";
import PulseLoader from "react-spinners/PulseLoader";
import { FilmRoll } from "../interfaces";
import { formatDateToLong } from "../utils/dateUtils";
import { useLongPress } from "@uidotdev/usehooks";

interface RollItemProps {
  roll: FilmRoll;
  stage: "active" | "developed" | "completed";
  isLoading: boolean;
  onAddPhoto: () => void;
  onFinishRoll: () => void;
  onCompleteRoll?: () => void;
  openRollOptionsModal: (roll: FilmRoll) => void;
}

const RollItem: React.FC<RollItemProps> = ({
  roll,
  stage,
  isLoading,
  onAddPhoto,
  onFinishRoll,
  onCompleteRoll,
  openRollOptionsModal,
}) => {
  const longPressEventHandlers = useLongPress(
    () => openRollOptionsModal(roll),
    {
      threshold: 150,
    }
  );

  const renderActionButton = () => {
    switch (stage) {
      case "active":
        return (
          <Button
            className="w-14 h-14 rounded-xl"
            variant="light"
            color="#69DB7C"
            onClick={onAddPhoto}
            {...longPressEventHandlers}
          >
            <Plus size={30} color="#69DB7C" weight="bold" />
          </Button>
        );
      case "developed":
        return (
          <Button
            className="w-14 h-14 rounded-xl"
            variant="light"
            color="#F59F00"
            onClick={onFinishRoll}
          >
            <Check size={30} color="#F59F00" weight="bold" />
          </Button>
        );
      case "completed":
        return (
          <Button
            className="w-14 h-14 rounded-xl"
            variant="light"
            color="#228BE6"
            onClick={onCompleteRoll}
          >
            <Folder size={30} color="#228BE6" weight="bold" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box className="flex items-center justify-between flex-row p-4 border border-neutral-500 rounded-lg">
      <Box className="flex flex-row items-center">
        <RingProgress
          size={50}
          thickness={3}
          roundCaps
          label={
            <Center>
              {stage === "active" ? (
                <Text className="text-lg font-semibold text-green-400">
                  {(roll.photos?.length || 0) + 1}
                </Text>
              ) : (
                <Folder
                  size={20}
                  color={stage === "developed" ? "#F59F00" : "#228BE6"}
                />
              )}
            </Center>
          }
          sections={[
            {
              value:
                stage === "active"
                  ? (((roll.photos?.length || 0) + 1) / roll.exposures) * 100
                  : 100,
              color:
                stage === "active"
                  ? "#69DB7C"
                  : stage === "developed"
                  ? "#F59F00"
                  : "#228BE6",
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

      {isLoading ? (
        <Button
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          variant="light"
          color="#69DB7C"
        >
          <PulseLoader color="#69DB7C" loading size={6} />
        </Button>
      ) : (
        renderActionButton()
      )}
    </Box>
  );
};

export default RollItem;
