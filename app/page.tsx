import type { Metadata } from "next";
import HomePageComponent from "./components/HomePage";

export const metadata: Metadata = {
  title: "SeukSeuk - Online Document Signing",
  description: "Upload, sign, and share documents online with ease",
};

export default function HomePage() {
  return <HomePageComponent />;
}
