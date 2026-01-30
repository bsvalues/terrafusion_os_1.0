import { useCallback, useEffect, useState } from 'react';

interface GestureData {
  type: 'pinch' | 'swipe' | 'tap' | 'rotate';
  scale?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  rotation?: number;
  position?: { x: number; y: number };
  deltaX?: number;
  deltaY?: number;
}

interface GestureControlOptions {
  canvas: HTMLCanvasElement | null;
  onGesture: (gesture: GestureData) => void;
  sensitivity?: number;
}

interface GestureControlHook {
  gestureData: GestureData | null;
  isGestureActive: boolean;
  enableGestures: () => void;
  disableGestures: () => void;
}

export const useGestureControl = ({
  canvas,
  onGesture,
  sensitivity = 1.0,
}: GestureControlOptions): GestureControlHook => {
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [gestureData, setGestureData] = useState<GestureData | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  // Touch gesture state
  const [touches, setTouches] = useState<Touch[]>([]);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialRotation, setInitialRotation] = useState<number | null>(null);

  // Calculate distance between two touches
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate rotation between two touches
  const getTouchRotation = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!isEnabled || !canvas) return;

      event.preventDefault();
      const touchList = Array.from(event.touches);
      setTouches(touchList);
      setIsGestureActive(true);

      if (touchList.length === 2) {
        const distance = getTouchDistance(touchList[0], touchList[1]);
        const rotation = getTouchRotation(touchList[0], touchList[1]);
        setInitialDistance(distance);
        setInitialRotation(rotation);
      }
    },
    [isEnabled, canvas, getTouchDistance, getTouchRotation]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isEnabled || !canvas || !isGestureActive) return;

      event.preventDefault();
      const touchList = Array.from(event.touches);

      if (touchList.length === 2 && initialDistance && initialRotation !== null) {
        // Pinch/zoom gesture
        const currentDistance = getTouchDistance(touchList[0], touchList[1]);
        const scale = (currentDistance / initialDistance) * sensitivity;

        // Rotation gesture
        const currentRotation = getTouchRotation(touchList[0], touchList[1]);
        const rotation = ((currentRotation - initialRotation) * sensitivity) % 360;

        const gesture: GestureData = {
          type: 'pinch',
          scale,
          rotation,
        };

        setGestureData(gesture);
        onGesture(gesture);
      } else if (touchList.length === 1 && touches.length === 1) {
        // Swipe gesture
        const touch = touchList[0];
        const prevTouch = touches[0];

        const deltaX = (touch.clientX - prevTouch.clientX) * sensitivity;
        const deltaY = (touch.clientY - prevTouch.clientY) * sensitivity;

        let direction: 'up' | 'down' | 'left' | 'right' = 'up';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        const gesture: GestureData = {
          type: 'swipe',
          direction,
          deltaX,
          deltaY,
          position: { x: touch.clientX, y: touch.clientY },
        };

        setGestureData(gesture);
        onGesture(gesture);
      }

      setTouches(touchList);
    },
    [
      isEnabled,
      canvas,
      isGestureActive,
      initialDistance,
      initialRotation,
      touches,
      getTouchDistance,
      getTouchRotation,
      sensitivity,
      onGesture,
    ]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!isEnabled || !canvas) return;

      event.preventDefault();
      const touchList = Array.from(event.touches);

      if (touchList.length === 0) {
        setIsGestureActive(false);
        setInitialDistance(null);
        setInitialRotation(null);
        setGestureData(null);
      } else if (touchList.length === 1 && touches.length > 1) {
        // Tap gesture (quick touch end)
        const gesture: GestureData = {
          type: 'tap',
          position: { x: touchList[0].clientX, y: touchList[0].clientY },
        };

        setGestureData(gesture);
        onGesture(gesture);
      }

      setTouches(touchList);
    },
    [isEnabled, canvas, touches, onGesture]
  );

  // Mouse wheel for zoom
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!isEnabled || !canvas) return;

      event.preventDefault();
      const scale = event.deltaY > 0 ? 0.9 : 1.1;

      const gesture: GestureData = {
        type: 'pinch',
        scale,
        position: { x: event.clientX, y: event.clientY },
      };

      setGestureData(gesture);
      onGesture(gesture);
    },
    [isEnabled, canvas, onGesture]
  );

  // Set up event listeners
  useEffect(() => {
    if (!canvas || !isEnabled) return;

    const element = canvas;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [canvas, isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  const enableGestures = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableGestures = useCallback(() => {
    setIsEnabled(false);
    setIsGestureActive(false);
    setGestureData(null);
  }, []);

  return {
    gestureData,
    isGestureActive,
    enableGestures,
    disableGestures,
  };
};

export default useGestureControl;
