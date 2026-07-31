const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least one letter, at least one digit, 8-128 characters.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

const isValidEmail = (email) =>
  typeof email === "string" && email.trim().length <= 254 && EMAIL_REGEX.test(email.trim());

const isValidPassword = (password) =>
  typeof password === "string" && PASSWORD_REGEX.test(password);

const isValidFullName = (fullName) =>
  typeof fullName === "string" && fullName.trim().length >= 2 && fullName.trim().length <= 100;

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidFullName,
};
