import { Toaster } from "react-hot-toast";

// All toasts in this app are fired via utils/toast.jsx's toast.custom()
// helpers, which render fully custom JSX — so this just needs to host and
// position them, with no toastOptions styling to fight react-hot-toast's own
// internal styling over (see utils/toast.jsx for why that fight existed).
const AppToaster = () => <Toaster position="bottom-right" gutter={10} />;

export default AppToaster;
