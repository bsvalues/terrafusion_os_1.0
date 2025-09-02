/**
 * AR Viewer Component for CostForge AI Champion
 * 
 * Provides augmented reality visualization capabilities for building models
 * with cost information overlay using A-Frame and AR.js.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Camera, Download, RotateCcw, ZoomIn  } from '@mui/icons-material';

// Declare A-Frame types for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-entity': any;
      'a-marker': any;
      'a-box': any;
      'a-plane': any;
      'a-text': any;
      'a-camera': any;
      'a-light': any;
    }
  }
}

interface ARViewerProps {
  buildingData: any;
  calculationResult: any;
  onError?: (error: string) => void;
}

interface ARContent {
  scene: any;
  assets: any;
  interactions: any[];
}

const ARViewer: React.FC<ARViewerProps> = ({ 
  buildingData, 
  calculationResult, 
  onError 
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [isARSupported, setIsARSupported] = useState<boolean>(false);
  const [arContent, setArContent] = useState<ARContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);

  // Check AR support and load content
  useEffect(() => {
    checkARSupport();
    generateARContent();
  }, [buildingData, calculationResult]);

  // Load A-Frame and AR.js scripts
  useEffect(() => {
    loadARScripts();
  }, []);

  const checkARSupport = () => {
    // Check for WebXR or WebRTC support
    const hasWebXR = 'xr' in navigator;
    const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    setIsARSupported(hasWebXR || hasGetUserMedia);
    
    if (!hasGetUserMedia) {
      setError('Camera access is required for AR functionality. Please enable camera permissions.');
    }
  };

  const loadARScripts = () => {
    // Check if scripts are already loaded
    if (document.querySelector('script[src*="aframe"]')) {
      return;
    }

    // Load A-Frame
    const aframeScript = document.createElement('script');
    aframeScript.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
    aframeScript.onload = () => {
      // Load AR.js after A-Frame
      const arScript = document.createElement('script');
      arScript.src = 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js';
      document.head.appendChild(arScript);
    };
    document.head.appendChild(aframeScript);
  };

  const generateARContent = async () => {
    try {
      setIsLoading(true);
      
      // Generate AR content via backend API
      const response = await fetch('/api/visualization/ar/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buildingData,
          costData: calculationResult,
          markerType: 'hiro',
          targetPlatform: 'web'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate AR content: ${response.statusText}`);
      }

      const data = await response.json();
      setArContent(data.arContent);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AR content';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  };

  const handleTakeScreenshot = () => {
    if (sceneRef.current) {
      const scene = sceneRef.current.querySelector('a-scene');
      if (scene && (scene as any).components?.screenshot) {
        (scene as any).components.screenshot.capture('perspective');
      } else {
        // Fallback: canvas screenshot
        const canvas = scene?.querySelector('canvas');
        if (canvas) {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ar-building-${Date.now()}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          });
        }
      }
    }
  };

  const handleResetView = () => {
    if (sceneRef.current) {
      const camera = sceneRef.current.querySelector('[camera]');
      if (camera) {
        (camera as any).setAttribute('position', '0 0 0');
        (camera as any).setAttribute('rotation', '0 0 0');
      }
    }
  };

  if (error) {
    return (
      <Alert className="mb-4">
        <Camera className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8"><>

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span
</> className="ml-3">Generating AR content...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isARSupported) {
    return (
      <Alert>
        <Camera className="h-4 w-4" />
        <AlertDescription>
          AR is not supported on this device or browser. Please try using a device with camera access and WebXR support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {showInstructions && (
        <Alert>
          <Camera className="h-4 w-4" />
          <AlertDescription>
            Point your camera at a flat surface or use the default marker. The building model will appear with cost information.
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => setShowInstructions(false)}
            >
              Got it
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between"><>

            <span>AR Building Visualization</span>
            <div
</> className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleTakeScreenshot}><>

                <Download className="h-4 w-4 mr-1" />
                Screenshot
              </Button>
              <Button
</> variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset View
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Interactive 3D building model with cost breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={sceneRef}
            className="relative w-full h-96 bg-black rounded-lg overflow-hidden"
            style={{ minHeight: '400px' }}
          >
            {arContent && (
              <a-scene
                embedded
                arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
                vr-mode-ui="enabled: false"
                renderer="logarithmicDepthBuffer: true;"
              >
                {/* Assets */}
                <a-assets>
                  <a-marker-camera preset="hiro"></a-marker-camera>
                </a-assets>

                {/* AR Marker and Content */}
                <a-marker
                  preset="hiro"
                  raycaster="objects: .clickable"
                  emitevents="true"
                  cursor="fuse: false; rayOrigin: mouse;"
                >
                  {/* Building Model */}
                  <a-box
                    class="clickable"
                    position="0 0.5 0"
                    width={Math.sqrt(buildingData.squareFootage) / 200}
                    height={(buildingData.floors || 1) * 0.3}
                    depth={Math.sqrt(buildingData.squareFootage) / 200}
                    color="#4CC3D9"
                    shadow="cast: true"
                    animation="property: rotation; to: 0 360 0; loop: true; dur: 20000"
                  ></a-box>

                  {/* Cost Information Display */}
                  <a-text
                    position="0 2 0"
                    align="center"
                    color="white"
                    value={`${buildingData.buildingType}\n${buildingData.squareFootage.toLocaleString()} sq ft\n$${calculationResult.totalCost.toLocaleString()}`}
                    geometry="primitive: plane; width: 4; height: 1.5"
                    material="color: rgba(0,0,0,0.7)"
                  ></a-text>

                  {/* Interactive Cost Breakdown */}
                  {calculationResult.breakdown && Object.entries(calculationResult.breakdown).map(([category, cost] /* , index */) => {
                    const angle = (index * 360) / Object.keys(calculationResult.breakdown).length;
                    const radians = (angle * Math.PI) / 180;
                    const radius = 1.5;
                    const x = Math.cos(radians) * radius;
                    const z = Math.sin(radians) * radius;

                    return (
                      <a-text
                        key={category}
                        position={`${x} 0.1 ${z}`}
                        align="center"
                        color="#FFD700"
                        value={`${category}\n$${(cost as number).toLocaleString()}`}
                        scale="0.5 0.5 0.5"
                      ></a-text>
                    );
                  })}

                  {/* Ground Plane */}
                  <a-plane
                    position="0 0 0"
                    rotation="-90 0 0"
                    width="4"
                    height="4"
                    color="#7BC8A4"
                    shadow="receive: true"
                    opacity="0.7"
                  ></a-plane>
                </a-marker>

                {/* Camera */}
                <a-entity camera look-controls wasd-controls="enabled: false"></a-entity>

                {/* Lighting */}
                <a-light type="ambient" color="#404040"></a-light>
                <a-light type="directional" position="0 1 1" shadow="cast: true"></a-light>
              </a-scene>
            )}
          </div>

          {/* AR Instructions */}
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1"><>

              <li>Allow camera access when prompted</li>
                            <li
</>>Point your camera at the Hiro marker or a flat surface</li><>

              <li>Move your device around to view the building from different angles</li>
                            <li
</>>Tap the building model to interact with cost information</li>
            </ul>
          </div>

          {/* Building Information Summary */}
          <div className="mt-4 p-4 bg-muted rounded-lg"><>

            <h3 className="font-medium mb-2">Building Summary</h3>
            <div
</> className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {buildingData.buildingType}
              </div>
              <div>
                <span className="font-medium">Size:</span> {buildingData.squareFootage.toLocaleString()} sq ft
              </div>
              <div>
                <span className="font-medium">Region:</span> {buildingData.region}
              </div>
              <div>
                <span className="font-medium">Total Cost:</span> ${calculationResult.totalCost.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ARViewer;