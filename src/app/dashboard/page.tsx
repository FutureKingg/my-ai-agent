import React from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App from "../App";

export default function DashboardPage() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <App />
      </EventProvider>
    </TranscriptProvider>
  );
}
