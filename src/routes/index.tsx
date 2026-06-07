import { createFileRoute } from "@tanstack/react-router";
import { MatchingBoard } from "@/components/matching/MatchingBoard";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tsamid Matching Board — Smart Volunteer Scheduling" },
      { name: "description", content: "Match volunteers to children at special-needs camps with priority-based scoring, drag-and-drop, and offline-first scheduling." },
      { property: "og:title", content: "Tsamid Matching Board" },
      { property: "og:description", content: "Smart matching & scheduling tool for special-needs camp volunteers." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <MatchingBoard />
      <Toaster richColors position="bottom-right" />
    </>
  );
}
