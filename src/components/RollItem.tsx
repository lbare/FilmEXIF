import React from "react";
import { Box, Text, RingProgress, Center, Button, Menu } from "@mantine/core";
import {
  FilmStrip,
  Camera,
  CameraRotate,
  CameraPlus,
  MapPinPlus,
  Export,
  Folder,
  Plus,
  Check,
  IconProps,
} from "@phosphor-icons/react";
import PulseLoader from "react-spinners/PulseLoader";
import { FilmRoll } from "../interfaces";
import { formatDateToLong } from "../utils/dateUtils";

interface RollItemProps {
  roll: FilmRoll;
  stage: "active" | "developed" | "completed";
  isLoading: boolean;
  onAddPhoto?: (roll: FilmRoll) => void;
  onFinishRoll?: (roll: FilmRoll) => void;
  onCompleteRoll?: (roll: FilmRoll) => void;
}

const stageConfig = {
  active: {
    color: "#69DB7C",
    icon: (props: IconProps) => <Camera size={20} {...props} />,
    actionButton: (
      roll: FilmRoll,
      isLoading: boolean,
      onAddPhoto?: (roll: FilmRoll) => void,
      onFinishRoll?: (roll: FilmRoll) => void
    ) => {
      if (isLoading) {
        return (
          <Button
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            variant="light"
            color="green"
          >
            <PulseLoader color="#69DB7C" loading size={6} />
          </Button>
        );
      }

      return (
        <Menu>
          <Menu.Target>
            <Button
              className="w-14 h-14 rounded-xl"
              variant="light"
              color="green"
            >
              <Plus size={30} color="#69DB7C" weight="bold" />
            </Button>
          </Menu.Target>
          <Menu.Dropdown className="flex flex-col justify-between items-end">
            <Menu.Item onClick={() => onAddPhoto && onAddPhoto(roll)}>
              <MapPinPlus size={32} color="#69DB7C" />
            </Menu.Item>
            <Menu.Item onClick={() => onAddPhoto && onAddPhoto(roll)}>
              <CameraPlus size={32} color="#69DB7C" />
            </Menu.Item>
            <Menu.Item onClick={() => onFinishRoll && onFinishRoll(roll)}>
              <Export size={32} color="#69DB7C" />
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      );
    },
    progressValue: (roll: FilmRoll) =>
      (((roll.photos?.length || 0) + 1) / roll.exposures) * 100,
    progressLabel: (roll: FilmRoll) => (
      <Text className="text-lg font-semibold text-green-400">
        {(roll.photos?.length || 0) + 1}
      </Text>
    ),
  },
  developed: {
    color: "#F59F00",
    icon: (props: IconProps) => <CameraRotate size={20} {...props} />,
    actionButton: (
      roll: FilmRoll,
      isLoading: boolean,
      onCompleteRoll?: (roll: FilmRoll) => void
    ) => {
      if (isLoading) {
        return (
          <Button
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            variant="light"
            color="yellow"
          >
            <PulseLoader color="#F59F00" loading size={6} />
          </Button>
        );
      }

      return (
        <Button
          className="w-14 h-14 rounded-xl"
          variant="light"
          color="yellow"
          onClick={() => onCompleteRoll && onCompleteRoll(roll)}
        >
          <Check size={30} color="#F59F00" weight="bold" />
        </Button>
      );
    },
    progressValue: () => 100,
    progressLabel: () => (
      <CameraRotate size={20} color="#F59F00" weight="regular" />
    ),
  },
  completed: {
    color: "#228BE6",
    icon: (props: IconProps) => <Folder size={20} {...props} />,
    actionButton: () => null,
    progressValue: () => 100,
    progressLabel: () => <Folder size={20} color="#228BE6" weight="regular" />,
  },
};

const RollItem: React.FC<RollItemProps> = ({
  roll,
  stage,
  isLoading,
  onAddPhoto,
  onFinishRoll,
  onCompleteRoll,
}) => {
  const config = stageConfig[stage];

  return (
    <Box className="flex items-center justify-between flex-row p-4 border border-neutral-500 rounded-lg">
      <Box className="flex flex-row items-center">
        <RingProgress
          size={50}
          thickness={3}
          roundCaps
          label={<Center>{config.progressLabel(roll)}</Center>}
          sections={[
            {
              value: config.progressValue(roll),
              color: config.color,
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
      {stage === "active"
        ? config.actionButton(roll, isLoading, onAddPhoto, onFinishRoll)
        : stage === "developed"
        ? config.actionButton(roll, isLoading, onCompleteRoll)
        : config.actionButton(roll, isLoading)}
    </Box>
  );
};

export default RollItem;
