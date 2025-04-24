import quotationsData from '../data/quotations.json';

/**
 * Returns a random quotation from the quotations collection
 * @returns {Object} An object containing quote and source properties
 */
export function getRandomQuotation() {
  const quotations = quotationsData;
  const randomIndex = Math.floor(Math.random() * quotations.length);
  return quotations[randomIndex];
}

/**
 * Returns a quotation based on the current date (changes daily)
 * @returns {Object} An object containing quote and source properties
 */
export function getDailyQuotation() {
  const quotations = quotationsData;
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const index = dayOfYear % quotations.length;
  return quotations[index];
}

/**
 * Helper function to get the day of the year (0-365)
 * @param {Date} date - The date to get the day of the year for
 * @returns {number} The day of the year (0-365)
 */
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
