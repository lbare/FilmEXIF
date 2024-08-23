export const formatDateToLong = (isoDateString: string) => {
  const date = new Date(isoDateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
