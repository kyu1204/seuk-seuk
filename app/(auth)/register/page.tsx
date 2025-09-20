import type { Metadata } from "next";
import RegisterPage from "./RegisterPage";

export const metadata: Metadata = {
  title: "SeukSeuk - Register",
  description: "Create a new SeukSeuk account",
};

export default function Register() {
  return <RegisterPage />;
}
