import React from "react";
import { Modal, Button, Stack } from "@mantine/core";
import { FilmRoll } from "../interfaces";
import { addPhotoToRollInFirebase } from "../firebase/config";
import { v4 as uuidv4 } from "uuid";

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
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        await addPhotoToRollInFirebase(
          roll.id,
          {
            id: uuidv4(),
            location: { latitude: 0, longitude: 0 },
            date: new Date().toISOString(),
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
