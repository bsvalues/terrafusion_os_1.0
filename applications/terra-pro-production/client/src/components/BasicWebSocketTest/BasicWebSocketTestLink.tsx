import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBasicWebSocket } from "../../contexts/BasicWebSocketContext";

const BasicWebSocketTestLink: React.FC = () => {
  const { connected, usingFallback } = useBasicWebSocket();
  const [statusText, setStatusText] = useState("Disconnected");
  const [reconnectCount, setReconnectCount] = useState(0);

  // Update status text based on connection state
  useEffect(() => {
    if (connected) {
      setStatusText(usingFallback ? "Connected (Fallback)" : "Connected");
      setReconnectCount(0);
    } else {
      setReconnectCount((prev) => {
        const newCount = prev + 1;
        if (newCount === 1) {
          setStatusText("Disconnected");
        } else {
          setStatusText(`Retrying (${newCount})`);
        }
        return newCount;
      });
    }
  }, [connected, usingFallback]);

  // Determine button color state
  const getStateColors = () => {
    if (connected) {
      return usingFallback
        ? { border: "border-blue-500", bg: "bg-blue-500" }
        : { border: "border-green-500", bg: "bg-green-500" };
    }

    if (reconnectCount > 0) {
      return { border: "border-yellow-500", bg: "bg-yellow-500 animate-pulse" };
    }

    return { border: "border-red-500", bg: "bg-red-500" };
  };

  const colors = getStateColors();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/basic-ws-test">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${colors.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${colors.bg}`}></span>
              WS Test
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">WebSocket Status: {statusText}</p>
          {connected && usingFallback && (
            <p className="text-xs text-blue-500">
              Using HTTP polling fallback (WebSocket unavailable)
            </p>
          )}
          {!connected && <p className="text-xs text-gray-500">Attempting to connect...</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BasicWebSocketTestLink;
