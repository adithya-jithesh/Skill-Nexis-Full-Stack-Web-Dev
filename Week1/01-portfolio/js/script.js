/* ============================================================
   Portfolio JavaScript
   1. Responsive navigation toggle
   2. Contact form validation
   ============================================================ */

/* ------------------------------------------------------------
   1. RESPONSIVE NAV TOGGLE
   CSS does the animating; JS only adds/removes a class.
   ------------------------------------------------------------ */
const navToggle = document.getElementById("navToggle");
const navList = document.getElementById("navList");

navToggle.addEventListener("click", () => {
  const isOpen = navList.classList.toggle("is-open");
  navToggle.classList.toggle("is-open", isOpen);
  // accessibility: tell screen readers whether the menu is expanded
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

// Close the menu after tapping a link (otherwise it stays open on mobile)
navList.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navList.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

/* ------------------------------------------------------------
   2. CONTACT FORM VALIDATION
   ------------------------------------------------------------ */
const form = document.getElementById("contactForm");
const successMsg = document.getElementById("formSuccess");

const fields = {
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  message: document.getElementById("message"),
};

const errors = {
  name: document.getElementById("nameError"),
  email: document.getElementById("emailError"),
  message: document.getElementById("messageError"),
};

// Regex: something@something.something - good enough for client-side checks.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function showError(key, message) {
  errors[key].textContent = message;
  fields[key].closest(".form__field").classList.add("has-error");
}

function clearError(key) {
  errors[key].textContent = "";
  fields[key].closest(".form__field").classList.remove("has-error");
}

/**
 * Validates one field. Returns true if it passes.
 */
function validateField(key) {
  const value = fields[key].value.trim();

  if (key === "name") {
    if (value === "") return showError(key, "Name is required."), false;
    if (value.length < 2) return showError(key, "Name must be at least 2 characters."), false;
  }

  if (key === "email") {
    if (value === "") return showError(key, "Email is required."), false;
    if (!EMAIL_PATTERN.test(value)) return showError(key, "Enter a valid email address."), false;
  }

  if (key === "message") {
    if (value === "") return showError(key, "Message is required."), false;
    if (value.length < 10) return showError(key, "Message must be at least 10 characters."), false;
  }

  clearError(key);
  return true;
}

// Live feedback: re-validate a field once the user leaves it
Object.keys(fields).forEach((key) => {
  fields[key].addEventListener("blur", () => validateField(key));
  fields[key].addEventListener("input", () => {
    // only clear a visible error while typing - don't nag mid-word
    if (errors[key].textContent) validateField(key);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading

  // validate ALL fields (don't short-circuit - we want every error shown)
  const results = Object.keys(fields).map(validateField);
  const isValid = results.every(Boolean);

  if (!isValid) {
    successMsg.hidden = true;
    return;
  }

  // In a real app this is where you'd POST to a backend.
  console.log("Form submitted:", {
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    message: fields.message.value.trim(),
  });

  successMsg.hidden = false;
  form.reset();
});
