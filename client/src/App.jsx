import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import LandingPage from "./LandingPage";
import DashboardPage from "./DashboardPage";

// Accessing the Vite env variable
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ClerkWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      navigate={(to) => navigate(to)}
    >
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <DashboardPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ClerkWithRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}