import type { Metadata } from "next";
import HomePageComponent from "./components/HomePage";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomePageComponent />;
}
