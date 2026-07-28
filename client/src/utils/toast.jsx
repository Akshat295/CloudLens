import toast from "react-hot-toast";
import ToastCard from "../components/ToastCard";

// toast.success()/toast.error() style their message via react-hot-toast's own
// internal wrapper, which is styled through dynamically-injected CSS-in-JS
// (goober) at runtime — that stylesheet loads after Tailwind's, so on equal
// specificity it silently wins, which is what caused toast text to render
// black-on-black-ish in dark mode regardless of the `dark:` classes passed
// via toastOptions. toast.custom() renders our own JSX (ToastCard) with no
// library styling involved at all, so there's nothing left to fight.
export const showSuccessToast = (message) =>
  toast.custom((t) => <ToastCard t={t} variant="success" message={message} />);

export const showErrorToast = (message) =>
  toast.custom((t) => <ToastCard t={t} variant="error" message={message} />);

export const showInfoToast = (message) =>
  toast.custom((t) => <ToastCard t={t} variant="info" message={message} />);
