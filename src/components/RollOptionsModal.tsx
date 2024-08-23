import React from "react";
import { Modal, Button, Group } from "@mantine/core";
import { FilmRoll } from "../interfaces";

interface RollOptionsModalProps {
  opened: boolean;
  onClose: () => void;
  roll: FilmRoll;
  onAddPhoto: (roll: FilmRoll) => void;
  onFinishRoll: (roll: FilmRoll) => void;
}

const RollOptionsModal: React.FC<RollOptionsModalProps> = ({
  opened,
  onClose,
  roll,
  onAddPhoto,
  onFinishRoll,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Roll Options">
      <Group>
        <Button
          variant="light"
          color="green"
          onClick={() => {
            onAddPhoto(roll);
            onClose();
          }}
        >
          Add Another Photo
        </Button>
        <Button
          variant="light"
          color="green"
          onClick={() => {
            onAddPhoto(roll);
            onClose();
          }}
        >
          Add Photo with Camera
        </Button>
        <Button
          variant="light"
          color="green"
          onClick={() => {
            onFinishRoll(roll);
            onClose();
          }}
        >
          Finish Roll
        </Button>
      </Group>
    </Modal>
  );
};

export default RollOptionsModal;
