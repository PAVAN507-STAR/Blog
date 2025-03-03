// SignOutRedirect.jsx
import { useClerk } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

const SignOutRedirect = () => {
  const { signOut } = useClerk();
  useEffect(() => {
    signOut();
  }, [signOut]);
  return <Navigate to="/sign-in" replace />;
};

export default SignOutRedirect;
