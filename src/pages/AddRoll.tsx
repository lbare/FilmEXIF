import { Button, TextInput, Box, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FilmRoll } from "../interfaces";
import { useNavigate } from "react-router-dom";
import { useRolls } from "../contexts/useRolls";
import { v4 as uuidv4 } from "uuid";

const AddRoll = () => {
  const form = useForm<FilmRoll>({
    initialValues: {
      id: "",
      name: "",
      camera: "",
      filmBrand: "",
      filmName: "",
      iso: 400,
      exposures: 36,
      photos: [],
    },
    validate: {
      name: (value) => (value ? null : "Name is required"),
      camera: (value) => (value ? null : "Camera is required"),
      filmBrand: (value) => (value ? null : "Film Brand is required"),
      filmName: (value) => (value ? null : "Film Name is required"),
      iso: (value) => (value ? null : "ISO Rating is required"),
    },
  });

  const navigate = useNavigate();
  const { addRoll } = useRolls();

  const handleSubmit = (values: FilmRoll) => {
    values.id = uuidv4();
    addRoll(values, "activeRolls");
    form.reset();
    navigate("/tabs/library");
  };

  return (
    <Box className="flex flex-col w-full my-4 items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Add New Roll</h2>
      <form
        onSubmit={form.onSubmit(handleSubmit)}
        className="space-y-4 w-11/12 md:w-1/3"
      >
        <TextInput
          label="Name"
          {...form.getInputProps("name")}
          error={form.errors.name}
        />
        <TextInput
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          label="Camera"
          {...form.getInputProps("camera")}
          error={form.errors.camera}
        />
        <TextInput
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          label="Film Brand"
          {...form.getInputProps("filmBrand")}
          error={form.errors.filmBrand}
        />
        <TextInput
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          label="Film Name"
          {...form.getInputProps("filmName")}
          error={form.errors.filmName}
        />
        <Select
          label="ISO Rating"
          placeholder="Select ISO"
          data={[
            { value: "100", label: "100" },
            { value: "160", label: "160" },
            { value: "200", label: "200" },
            { value: "400", label: "400" },
            { value: "800", label: "800" },
            { value: "1600", label: "1600" },
          ]}
          {...form.getInputProps("iso")}
          value={form.values.iso.toString()}
          error={form.errors.iso}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Box>
  );
};

export default AddRoll;
