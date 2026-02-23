import { 
  ClerkProvider, 
  SignedIn, 
  SignedOut, 
  RedirectToSignIn, 
  UserButton,
  SignInButton
} from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import DashboardPage from './DashboardPage';

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
        <Route path="/" element={
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Welcome to My App</h1>
            <SignedOut>
              <SignInButton mode="modal">
                <button style={{ padding: '10px 20px', cursor: 'pointer' }}>
                  Sign In to Access Dashboard
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            </SignedIn>
          </div>
        } />

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
    <BrowserRouter>
      <ClerkWithRoutes />
    </BrowserRouter>
  );
}