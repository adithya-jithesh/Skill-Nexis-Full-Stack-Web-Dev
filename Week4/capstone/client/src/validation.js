// The rules the forms check before anything is sent. They match the Mongoose
// schema deliberately: the server is the one that decides, but a typo caught
// here saves a round trip and shows the message under the field that caused
// it.

export function validateName(name) {
  if (!name.trim()) return "Your name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  if (name.trim().length > 60) return "Name cannot be longer than 60 characters.";
  return "";
}

export function validateUsername(username) {
  const value = username.trim();

  if (!value) return "Pick a username.";
  if (value.length < 3) return "Username must be at least 3 characters.";
  if (value.length > 20) return "Username cannot be longer than 20 characters.";
  // The same pattern as the schema: it ends up in URLs, so nothing that would
  // need escaping is allowed.
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return "Letters, numbers and underscores only.";
  }
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

export function validateBio(bio) {
  if (bio.length > 160) return "Bio cannot be longer than 160 characters.";
  return "";
}

// An object of field -> message with the empty ones dropped. A form is valid
// when this comes back empty.
export function collectErrors(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message));
}
