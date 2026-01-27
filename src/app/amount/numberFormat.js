export const formatNumber = (num) =>
  !num || isNaN(num)
    ? ""
    : Number(num).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const handleFormattedNumberChange = (index, e, callback) => {
  const { name, value } = e.target;
  const rawValue = value.replace(/,/g, "");
  if (rawValue === "" || !isNaN(rawValue)) {
    callback(index, {
      target: { name, value: rawValue },
    });
  }
};