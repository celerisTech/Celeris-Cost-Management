/**
 * Utility to convert numeric amount to Indian Rupee Words representation
 * Handles both Rupees and Paise (e.g., 19999.99 -> "INR Nineteen Thousand Nine Hundred Ninety Nine Rupees and Ninety Nine Paise Only.")
 */
export function numberToWordsINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "INR Zero Rupees Only.";
  }

  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  const num = Math.floor(Math.abs(roundedAmount));
  const paise = Math.round((Math.abs(roundedAmount) - num) * 100);

  if (num === 0 && paise === 0) return "INR Zero Rupees Only.";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertGroup(n) {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "") + " ";
    } else if (n > 0) {
      str += a[n] + " ";
    }
    return str;
  }

  let words = "";
  let temp = num;

  if (temp > 0) {
    const crore = Math.floor(temp / 10000000);
    temp %= 10000000;
    const lakh = Math.floor(temp / 100000);
    temp %= 100000;
    const thousand = Math.floor(temp / 1000);
    temp %= 1000;
    const hundred = temp;

    if (crore > 0) words += convertGroup(crore) + "Crore ";
    if (lakh > 0) words += convertGroup(lakh) + "Lakh ";
    if (thousand > 0) words += convertGroup(thousand) + "Thousand ";
    if (hundred > 0) words += convertGroup(hundred);

    words = words.trim() + " Rupees";
  }

  if (paise > 0) {
    const paiseWords = convertGroup(paise).trim();
    if (words.length > 0) {
      words += ` and ${paiseWords} Paise`;
    } else {
      words = `${paiseWords} Paise`;
    }
  }

  return `INR ${words} Only.`;
}
