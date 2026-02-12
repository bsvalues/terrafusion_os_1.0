import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#1a2332] to-[#0b1020]">
      <Card className="w-full max-w-md mx-4 bg-black/30 border-[#00ffee]/30 backdrop-blur-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-[#00ffee]" />
            <h1 className="text-2xl font-bold text-[#00ffee]">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-white/80">
            The quantum pathway you're seeking doesn't exist in this reality dimension.
          </p>

          <Link href="/">
            <button className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0099ff] to-[#00ffee] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
              <Home className="w-4 h-4" />
              Return to Quantum Laboratory
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
