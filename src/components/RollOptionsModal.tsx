import React from "react";
import { Modal, Button, Stack } from "@mantine/core";
import { FilmRoll } from "../interfaces";
import { CameraPlus, Export } from "@phosphor-icons/react";

interface RollOptionsModalProps {
  opened: boolean;
  onClose: () => void;
  roll: FilmRoll;
  onAddPhotoWithImage: (roll: FilmRoll) => void;
  onFinishRoll: (roll: FilmRoll) => void;
}

const RollOptionsModal: React.FC<RollOptionsModalProps> = ({
  opened,
  onClose,
  roll,
  onAddPhotoWithImage,
  onFinishRoll,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Roll Options" centered>
      <Stack>
        <Button
          size="xl"
          variant="filled"
          color="green"
          onClick={() => {
            onAddPhotoWithImage(roll);
            onClose();
          }}
          style={{ display: "flex", alignItems: "center" }}
        >
          <CameraPlus size={24} style={{ marginRight: "10px" }} />
          Add Photo with Image
        </Button>
        <Button
          size="xl"
          variant="filled"
          color="blue"
          onClick={() => {
            onFinishRoll(roll);
            onClose();
          }}
          style={{ display: "flex", alignItems: "center" }}
        >
          <Export size={24} style={{ marginRight: "10px" }} />
          Finish Roll
        </Button>
      </Stack>
    </Modal>
  );
};

export default RollOptionsModal;
