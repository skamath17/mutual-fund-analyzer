// src/app/page.tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Mutual Fund Analyzer</h1>
      <Button>Get Started</Button>
    </div>
  );
}
