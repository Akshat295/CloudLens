const FREQUENCY_OPTIONS = ["hourly", "daily", "weekly"];

const FREQUENCY_MS = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

const isValidFrequency = (frequency) => FREQUENCY_OPTIONS.includes(frequency);

const computeNextRun = (frequency, from = new Date()) => new Date(from.getTime() + FREQUENCY_MS[frequency]);

module.exports = {
  FREQUENCY_OPTIONS,
  isValidFrequency,
  computeNextRun,
};
