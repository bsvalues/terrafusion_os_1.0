import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Layers, Maximize } from "lucide-react";
import { useState } from "react";

const GISMap = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // In a real app, you would implement actual full screen functionality here
    // using the Fullscreen API or a library like react-full-screen
  };

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Property Map</h3>
        <div className="mt-2">
          <div 
            className="relative h-96 rounded overflow-hidden border border-gray-200"
            data-implementation="Implement ArcGIS or Leaflet map here"
          >
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900">GIS Map Integration</p>
                <p className="mt-1 text-sm text-gray-500">Interactive property map with selection and filtering</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Layers className="h-4 w-4 mr-2" />
            Layer Controls
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={toggleFullScreen}
          >
            <Maximize className="h-4 w-4 mr-2" />
            Full Screen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GISMap;
