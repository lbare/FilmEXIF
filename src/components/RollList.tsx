import React from "react";
import { Box, Text } from "@mantine/core";
import RollItem from "./RollItem";
import { FilmRoll } from "../interfaces";

interface RollListProps {
  title: string;
  rolls: FilmRoll[];
  stage: "active" | "developed" | "completed";
  loadingRolls: { [key: string]: boolean };
  onAddPhoto: (roll: FilmRoll) => void;
  onFinishRoll: (roll: FilmRoll) => void;
  onCompleteRoll?: (roll: FilmRoll) => void;
  openRollOptionsModal: (roll: FilmRoll) => void;
}

const RollList: React.FC<RollListProps> = ({
  title,
  rolls,
  stage,
  loadingRolls,
  onAddPhoto,
  onFinishRoll,
  onCompleteRoll,
  openRollOptionsModal,
}) => {
  return (
    <Box>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid gap-4">
        {rolls.length > 0 ? (
          rolls.map((roll) => (
            <RollItem
              key={roll.id}
              roll={roll}
              stage={stage}
              isLoading={loadingRolls[roll.id] || roll.isLoading || false}
              onAddPhoto={() => onAddPhoto(roll)}
              onFinishRoll={() => onFinishRoll(roll)}
              onCompleteRoll={
                onCompleteRoll ? () => onCompleteRoll(roll) : undefined
              }
              openRollOptionsModal={openRollOptionsModal}
            />
          ))
        ) : (
          <Text className="text-center text-neutral-500">
            No {title.toLowerCase()} rolls available.
          </Text>
        )}
      </div>
    </Box>
  );
};

export default RollList;
