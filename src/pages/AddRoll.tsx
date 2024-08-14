import { Button, TextInput, Box, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FilmRoll } from "../interfaces";

const AddRoll = () => {
  const form = useForm<FilmRoll>({
    initialValues: {
      camera: "",
      brand: "",
      name: "",
      iso: 400,
      exposures: 36,
      photos: [],
    },
  });

  const handleSubmit = (values: FilmRoll) => {
    console.log("Form Submitted with values:", values);
  };

  return (
    <Box className="m-2 max-w-lg mx-auto px-4">
      <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
        <TextInput label="Camera" {...form.getInputProps("camera")} />
        <TextInput label="Film Brand" {...form.getInputProps("brand")} />
        <TextInput label="Film Name" {...form.getInputProps("name")} />
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
        />

        <Button type="submit">Submit</Button>
      </form>
    </Box>
  );
};

export default AddRoll;
