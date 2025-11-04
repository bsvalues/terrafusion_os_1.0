import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookMarked, Braces, Code, Route  } from '@mui/icons-material';

export function RouteDebugger() {
  const [location, setLocation] = useLocation();
  const [customRoute, setCustomRoute] = useState("");
  const [routeHistory, setRouteHistory] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Common routes to test
  const testRoutes = [
    "/",
    "/urar",
    "/urar/1001",
    "/legal-urar",
    "/legal-urar/1001",
    "/shap-viewer",
    "/ws-test",
    "/comps",
    "/settings",
  ];

  // Add current location to history when it changes
  useEffect(() => {
    setRouteHistory((prev) => {
      // Don't add duplicates in sequence
      if (prev.length > 0 && prev[prev.length - 1] === location) {
        return prev;
      }
      // Keep last 10 routes
      const newHistory = [...prev, location];
      return newHistory.slice(-10);
    });
  }, [location]);

  // Handle route navigation
  const navigateTo = (route: string) => {
    console.log(`Navigating to: ${route}`);
    setLocation(route);
  };

  // Custom route handler
  const handleCustomRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoute) {
      navigateTo(customRoute);
      setCustomRoute("");
    }
  };

  return (
    <Card className="mt-8 border-dashed border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="text-md font-medium flex items-center text-yellow-800 dark:text-yellow-200">
          <Route className="h-4 w-4 mr-2" />
          Route Debugger
          <span className="ml-2 text-xs">(click to {isExpanded ? "collapse" : "expand"})</span>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Braces className="h-4 w-4" /><>

              <span className="font-mono">Current location:</span>
              <code
</> className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded font-mono text-sm">
                {location}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {testRoutes.map((route) => (
                <Button
                  key={route}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${location === route ? "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/40" : ""}`}
                  onClick={() => navigateTo(route)}
                >
                  {route}
                </Button>
              ))}
            </div>

            <form onSubmit={handleCustomRoute} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter custom route (e.g. /custom-page)"
                value={customRoute}
                onChange={(e) => setCustomRoute(e.target.value)}
                className="text-xs"
              />
              <Button type="submit" variant="default" size="sm">
                Go
              </Button>
            </form>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <BookMarked className="h-4 w-4" />
                <span>Recent route history:</span>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded text-sm font-mono">
                {routeHistory.map((route, i) => (
                  <div key={i} className="flex items-center gap-2"><>

                    <span>{i + 1}.</span>
                    <span
</>
                      className="cursor-pointer hover:underline"
                      onClick={() => navigateTo(route)}
                    >
                      {route}
                    </span>
                    {i === routeHistory.length - 1 && (
                      <span className="ml-1 text-xs bg-green-100 dark:bg-green-900/40 px-1 rounded-sm">
                        current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
