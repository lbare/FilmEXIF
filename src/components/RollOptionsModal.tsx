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
        const img = new Image();
        img.src = reader.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDimension = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.floor((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.floor((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedImage = canvas.toDataURL("image/jpeg", 0.8);
            addPhotoToRoll(
              roll.id,
              {
                id: `photo-${Date.now()}`,
                date: new Date().toISOString(),
                location: { latitude: 0, longitude: 0 },
              },
              resizedImage
            );
          }

          onClose();
        };
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
