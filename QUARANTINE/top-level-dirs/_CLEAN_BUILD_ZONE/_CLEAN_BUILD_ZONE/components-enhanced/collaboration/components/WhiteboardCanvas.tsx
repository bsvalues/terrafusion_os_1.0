/**
 * Terrafusion OS 1.0 - Whiteboard Canvas Component
 * Government-Grade Collaborative Whiteboard
 * 
 * Real-time collaborative whiteboard with multi-user support,
 * drawing tools, shapes, text, and version control.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useToast } from '../../ui/use-toast';
import {
  CanvasElement,
  CanvasElementType,
  WhiteboardTool,
  WhiteboardParticipant,
  CollaborationUser,
  ElementStyle,
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';

interface WhiteboardCanvasProps {
  sessionId: string;
  currentTool: WhiteboardTool;
  currentUser?: CollaborationUser;
  className?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  onElementCreated?: (element: CanvasElement) => void;
  onElementUpdated?: (element: CanvasElement) => void;
  onElementDeleted?: (elementId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  sessionId,
  currentTool,
  currentUser,
  className = '',
  width = 800,
  height = 600,
  backgroundColor = '#ffffff',
  onElementCreated,
  onElementUpdated,
  onElementDeleted,
}) => {
  const { toast } = useToast();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [overlayContext, setOverlayContext] = useState<CanvasRenderingContext2D | null>(null);
  
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [participants, setParticipants] = useState<WhiteboardParticipant[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(2);

  // Initialize canvas contexts
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    if (canvas && overlayCanvas) {
      const ctx = canvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      
      if (ctx && overlayCtx) {
        setContext(ctx);
        setOverlayContext(overlayCtx);
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        
        // Set background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
    }
  }, [width, height, backgroundColor]);

  // Real-time whiteboard updates
  useEffect(() => {
    const handleWhiteboardUpdated = (data: {
      sessionId: string;
      element: CanvasElement;
      action: 'create' | 'update' | 'delete';
      userId: string;
    }) => {
      if (data.sessionId === sessionId && data.userId !== currentUser?.id) {
        switch (data.action) {
          case 'create':
            setElements(prev => [...prev, data.element]);
            break;
          case 'update':
            setElements(prev => prev.map(el => 
              el.id === data.element.id ? data.element : el
            ));
            break;
          case 'delete':
            setElements(prev => prev.filter(el => el.id !== data.element.id));
            break;
        }
      }
    };

    const handleCursorMove = (data: {
      sessionId: string;
      userId: string;
      cursor: { x: number; y: number };
    }) => {
      if (data.sessionId === sessionId && data.userId !== currentUser?.id) {
        setParticipants(prev => prev.map(p => 
          p.user.id === data.userId 
            ? { ...p, cursor: data.cursor }
            : p
        ));
      }
    };

    collaborationService.on('whiteboard-updated', handleWhiteboardUpdated);
    collaborationService.on('cursor-moved', handleCursorMove);

    return () => {
      collaborationService.off('whiteboard-updated', handleWhiteboardUpdated);
      collaborationService.off('cursor-moved', handleCursorMove);
    };
  }, [sessionId, currentUser?.id]);

  // Redraw canvas when elements change
  useEffect(() => {
    if (!context) return;

    // Clear canvas
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);

    // Draw all elements
    elements.forEach(element => drawElement(context, element));
  }, [context, elements, backgroundColor, width, height]);

  // Draw overlay (cursors, selection, etc.)
  useEffect(() => {
    if (!overlayContext) return;

    overlayContext.clearRect(0, 0, width, height);

    // Draw other users' cursors
    participants.forEach(participant => {
      if (participant.user.id !== currentUser?.id) {
        drawCursor(overlayContext, participant);
      }
    });

    // Draw selection
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        drawSelection(overlayContext, element);
      }
    }
  }, [overlayContext, participants, selectedElement, elements, currentUser?.id, width, height]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentUser) return;

    const pos = getMousePos(e);
    setDragStart(pos);

    switch (currentTool) {
      case WhiteboardTool.PEN:
      case WhiteboardTool.HIGHLIGHTER:
        setIsDrawing(true);
        setCurrentPath([pos]);
        break;

      case WhiteboardTool.ERASER:
        const elementToErase = findElementAtPosition(pos);
        if (elementToErase) {
          deleteElement(elementToErase.id);
        }
        break;

      case WhiteboardTool.SELECT:
        const elementToSelect = findElementAtPosition(pos);
        setSelectedElement(elementToSelect ? elementToSelect.id : null);
        break;

      case WhiteboardTool.TEXT:
        createTextElement(pos);
        break;

      case WhiteboardTool.SHAPE:
        setIsDrawing(true);
        break;
    }
  }, [currentTool, currentUser, getMousePos]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentUser) return;

    const pos = getMousePos(e);

    // Send cursor position to other users
    // In a real implementation, this would be throttled
    if (collaborationService.isConnectedToHub()) {
      // Send cursor update
    }

    if (!isDrawing || !dragStart) return;

    switch (currentTool) {
      case WhiteboardTool.PEN:
      case WhiteboardTool.HIGHLIGHTER:
        setCurrentPath(prev => [...prev, pos]);
        break;

      case WhiteboardTool.SHAPE:
        // Preview shape while drawing
        if (overlayContext) {
          overlayContext.clearRect(0, 0, width, height);
          drawShapePreview(overlayContext, dragStart, pos);
        }
        break;
    }
  }, [currentTool, currentUser, getMousePos, isDrawing, dragStart, overlayContext, width, height]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentUser || !isDrawing) return;

    const pos = getMousePos(e);
    setIsDrawing(false);

    switch (currentTool) {
      case WhiteboardTool.PEN:
      case WhiteboardTool.HIGHLIGHTER:
        if (currentPath.length > 1) {
          createPathElement(currentPath);
        }
        setCurrentPath([]);
        break;

      case WhiteboardTool.SHAPE:
        if (dragStart) {
          createShapeElement(dragStart, pos);
        }
        break;
    }

    setDragStart(null);
  }, [currentTool, currentUser, isDrawing, getMousePos, currentPath, dragStart]);

  // Create path element (pen/highlighter)
  const createPathElement = useCallback((path: Point[]) => {
    if (!currentUser || path.length === 0) return;

    const element: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: CanvasElementType.LINE,
      data: { path },
      position: path[0],
      size: { width: 0, height: 0 }, // Will be calculated
      style: {
        color: currentColor,
        fontSize: currentSize,
        opacity: currentTool === WhiteboardTool.HIGHLIGHTER ? 0.5 : 1,
      },
      createdBy: currentUser.id,
      createdAt: new Date(),
      version: 1,
    };

    // Calculate bounding box
    const minX = Math.min(...path.map(p => p.x));
    const maxX = Math.max(...path.map(p => p.x));
    const minY = Math.min(...path.map(p => p.y));
    const maxY = Math.max(...path.map(p => p.y));

    element.position = { x: minX, y: minY };
    element.size = { width: maxX - minX, height: maxY - minY };

    addElement(element);
  }, [currentUser, currentColor, currentSize, currentTool]);

  // Create shape element
  const createShapeElement = useCallback((start: Point, end: Point) => {
    if (!currentUser) return;

    const element: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: CanvasElementType.SHAPE,
      data: { 
        shape: 'rectangle', // Could be configurable
        startPoint: start,
        endPoint: end,
      },
      position: {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
      },
      size: {
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      },
      style: {
        color: currentColor,
        borderWidth: currentSize,
        backgroundColor: 'transparent',
      },
      createdBy: currentUser.id,
      createdAt: new Date(),
      version: 1,
    };

    addElement(element);
  }, [currentUser, currentColor, currentSize]);

  // Create text element
  const createTextElement = useCallback((position: Point) => {
    if (!currentUser) return;

    const text = prompt('Enter text:');
    if (!text) return;

    const element: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: CanvasElementType.TEXT,
      data: { text },
      position,
      size: { width: 100, height: 20 }, // Approximate, would be measured
      style: {
        color: currentColor,
        fontSize: 16,
        fontFamily: 'Arial',
      },
      createdBy: currentUser.id,
      createdAt: new Date(),
      version: 1,
    };

    addElement(element);
  }, [currentUser, currentColor]);

  // Add element to canvas
  const addElement = useCallback((element: CanvasElement) => {
    setElements(prev => [...prev, element]);
    onElementCreated?.(element);

    // Send to other users
    if (collaborationService.isConnectedToHub()) {
      // Send element creation
    }
  }, [onElementCreated]);

  // Delete element
  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    onElementDeleted?.(elementId);

    // Send to other users
    if (collaborationService.isConnectedToHub()) {
      // Send element deletion
    }
  }, [onElementDeleted]);

  // Find element at position
  const findElementAtPosition = useCallback((pos: Point): CanvasElement | null => {
    // Check elements in reverse order (top to bottom)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      
      if (pos.x >= element.position.x && 
          pos.x <= element.position.x + element.size.width &&
          pos.y >= element.position.y && 
          pos.y <= element.position.y + element.size.height) {
        return element;
      }
    }
    
    return null;
  }, [elements]);

  // Draw single element
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    ctx.save();

    // Apply styles
    if (element.style.color) {
      ctx.strokeStyle = element.style.color;
      ctx.fillStyle = element.style.color;
    }
    if (element.style.fontSize) {
      ctx.lineWidth = element.style.fontSize;
    }
    if (element.style.opacity) {
      ctx.globalAlpha = element.style.opacity;
    }

    switch (element.type) {
      case CanvasElementType.LINE:
        if (element.data.path) {
          ctx.beginPath();
          const path = element.data.path as Point[];
          ctx.moveTo(path[0].x, path[0].y);
          path.forEach(point => ctx.lineTo(point.x, point.y));
          ctx.stroke();
        }
        break;

      case CanvasElementType.SHAPE:
        ctx.strokeRect(
          element.position.x,
          element.position.y,
          element.size.width,
          element.size.height
        );
        break;

      case CanvasElementType.TEXT:
        if (element.style.fontSize && element.style.fontFamily) {
          ctx.font = `${element.style.fontSize}px ${element.style.fontFamily}`;
        }
        ctx.fillText(
          element.data.text || '',
          element.position.x,
          element.position.y + (element.style.fontSize || 16)
        );
        break;

      case CanvasElementType.STICKY_NOTE:
        // Draw sticky note background
        ctx.fillStyle = element.style.backgroundColor || '#ffeb3b';
        ctx.fillRect(
          element.position.x,
          element.position.y,
          element.size.width,
          element.size.height
        );
        
        // Draw text
        ctx.fillStyle = element.style.color || '#000';
        if (element.style.fontSize && element.style.fontFamily) {
          ctx.font = `${element.style.fontSize}px ${element.style.fontFamily}`;
        }
        
        // Word wrap text (simplified)
        const words = (element.data.text || '').split(' ');
        let line = '';
        let y = element.position.y + 20;
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > element.size.width - 10 && line !== '') {
            ctx.fillText(line, element.position.x + 5, y);
            line = word + ' ';
            y += 20;
          } else {
            line = testLine;
          }
        });
        
        ctx.fillText(line, element.position.x + 5, y);
        break;
    }

    ctx.restore();
  }, []);

  // Draw cursor for other users
  const drawCursor = useCallback((ctx: CanvasRenderingContext2D, participant: WhiteboardParticipant) => {
    ctx.save();
    
    const { x, y } = participant.cursor;
    
    // Draw cursor pointer
    ctx.fillStyle = participant.color || '#000';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10, y + 10);
    ctx.lineTo(x + 5, y + 10);
    ctx.lineTo(x, y + 15);
    ctx.closePath();
    ctx.fill();
    
    // Draw user name
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 15, y, participant.user.name.length * 8, 20);
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText(participant.user.name, x + 17, y + 14);
    
    ctx.restore();
  }, []);

  // Draw selection box
  const drawSelection = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    ctx.save();
    
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.strokeRect(
      element.position.x - 5,
      element.position.y - 5,
      element.size.width + 10,
      element.size.height + 10
    );
    
    // Draw resize handles
    const handles = [
      { x: element.position.x - 5, y: element.position.y - 5 },
      { x: element.position.x + element.size.width + 5, y: element.position.y - 5 },
      { x: element.position.x - 5, y: element.position.y + element.size.height + 5 },
      { x: element.position.x + element.size.width + 5, y: element.position.y + element.size.height + 5 },
    ];
    
    ctx.fillStyle = '#0066cc';
    ctx.setLineDash([]);
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x - 3, handle.y - 3, 6, 6);
    });
    
    ctx.restore();
  }, []);

  // Draw shape preview
  const drawShapePreview = useCallback((ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    ctx.save();
    
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.setLineDash([3, 3]);
    
    const width = end.x - start.x;
    const height = end.y - start.y;
    
    ctx.strokeRect(start.x, start.y, width, height);
    
    ctx.restore();
  }, [currentColor, currentSize]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setElements([]);
    if (context) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }
  }, [context, backgroundColor, width, height]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 border rounded"
        style={{ background: backgroundColor }}
      />
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ pointerEvents: 'all' }}
      />
      
      {/* Toolbar could be added here */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="w-6 h-6 border-none rounded"
        />
        <input
          type="range"
          min="1"
          max="20"
          value={currentSize}
          onChange={(e) => setCurrentSize(parseInt(e.target.value))}
          className="w-20"
        />
        <button
          onClick={clearCanvas}
          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default WhiteboardCanvas;