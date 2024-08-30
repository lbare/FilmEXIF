import React from "react";
import { Modal, Button, Stack } from "@mantine/core";
import { FilmRoll } from "../interfaces";

interface RollOptionsModalProps {
  opened: boolean;
  onClose: () => void;
  roll: FilmRoll;
  onFinishRoll: (roll: FilmRoll) => void;
  onAddPhotoWithImage: (roll: FilmRoll, image: string) => void;
}

const RollOptionsModal: React.FC<RollOptionsModalProps> = ({
  opened,
  onClose,
  roll,
  onFinishRoll,
  onAddPhotoWithImage,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onAddPhotoWithImage(roll, base64String);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Roll Options" centered>
      <Stack>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          id="camera-input"
          onChange={handleFileChange}
        />
        <label htmlFor="camera-input" style={{ width: "100%" }}>
          <Button
            fullWidth
            size="xl"
            variant="filled"
            color="green"
            component="span"
          >
            Add Photo with Camera
          </Button>
        </label>
        <Button
          fullWidth
          size="xl"
          variant="filled"
          color="red"
          onClick={() => {
            onFinishRoll(roll);
            onClose();
          }}
        >
          Finish Roll
        </Button>
      </Stack>
    </Modal>
  );
};

export default RollOptionsModal;
