import { Link } from "wouter";

export function AIDevBadge() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <Link 
      href="/docs/dev"
      className="fixed bottom-4 right-4 px-4 py-2 bg-yellow-400 text-black font-semibold rounded-full shadow-lg hover:bg-yellow-300 transition"
    >
      ⚙️ AI Dev Guide
    </Link>
  );
}