import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Simple component that redirects to the property analysis page
 * when AI valuation or other pages need to go to the property analysis.
 */
const RedirectToProperty = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the property analysis page
    setLocation("/property-analysis");
  }, [setLocation]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center"><>

        <h2 className="text-xl font-semibold mb-2">Redirecting to property analysis...</h2>
        <p
</> className="text-muted-foreground">406 Stardust Ct, Grandview, WA</p>
      </div>
    </div>
  );
};

export default RedirectToProperty;
