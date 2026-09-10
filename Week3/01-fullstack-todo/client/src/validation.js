// The rules the forms check before anything is sent. They deliberately match
// the Mongoose schema on the server: the server is the one that counts, but
// checking here means a typo is caught without a round trip, and the message
// appears next to the field that caused it.

export function validateName(name) {
  if (!name.trim()) return "Your name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return "";
}

export function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return "Enter a valid email address.";
  return "";
}

export function validatePassword(password) {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return "";
}

export function validateTitle(title) {
  if (!title.trim()) return "A task needs a title.";
  if (title.trim().length < 2) return "Title must be at least 2 characters.";
  if (title.trim().length > 120) return "Title cannot be longer than 120 characters.";
  return "";
}

export function validateDescription(description) {
  if (description.length > 500) return "Description cannot be longer than 500 characters.";
  return "";
}

// An object of field -> message, with the empty ones dropped. A form is
// valid when this comes back empty.
export function collectErrors(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message));
}
