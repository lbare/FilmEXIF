import React from "react";
import { Modal, Button, Stack } from "@mantine/core";
import { FilmRoll } from "../interfaces";
import { useRolls } from "../contexts/useRolls";

interface RollOptionsModalProps {
  opened: boolean;
  onClose: () => void;
  roll: FilmRoll;
  onFinishRoll: (roll: FilmRoll) => void;
}

const RollOptionsModal: React.FC<RollOptionsModalProps> = ({
  opened,
  onClose,
  roll,
  onFinishRoll,
}) => {
  const { addPhotoToRoll } = useRolls();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        addPhotoToRoll(
          roll.id,
          {
            id: `photo-${Date.now()}`,
            date: new Date().toISOString(),
            location: { latitude: 0, longitude: 0 },
          },
          base64String
        );
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
