import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Svg, Path, Circle, G, Line, LinearGradient, Stop, Rect, Defs } from "react-native-svg";

interface AnimatedSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  showAxes?: boolean;
  showLabels?: boolean;
  formatYLabel?: (value: number) => string;
  formatXLabel?: (index: number, value: number) => string;
  style?: any;
  animated?: boolean;
  animationDuration?: number;
  highlightLast?: boolean;
  trend?: boolean;
  formatValue?: (value: number) => string;
}

const AnimatedSparkline: React.FC<AnimatedSparklineProps> = ({
  data,
  width = 150,
  height = 50,
  color = "#3498db",
  lineWidth = 2,
  showDots = false,
  showArea = false,
  showAxes = false,
  showLabels = false,
  formatYLabel = (value) => value.toString(),
  formatXLabel = (index, value) => index.toString(),
  style = {},
  animated = true,
  animationDuration = 1000,
  highlightLast = true,
  trend = true,
  formatValue = (value) => value.toString(),
}) => {
  // Animation progress
  const animationProgress = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [interactive, setInteractive] = useState<boolean>(false);

  // Start animation when component mounts
  useEffect(() => {
    if (animated) {
      // Initial line drawing animation
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: animationDuration,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        // Once line is drawn, start pulsing animation for the last dot
        if (highlightLast) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnimation, {
                toValue: 1.3,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnimation, {
                toValue: 1,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          ).start();
        }
      });
    } else {
      animationProgress.setValue(1);
    }

    return () => {
      // Cleanup animations
      pulseAnimation.stopAnimation();
      animationProgress.stopAnimation();
    };
  }, [data, animated, animationDuration, animationProgress, highlightLast, pulseAnimation]);

  // If no data or only one point, return empty view
  if (!data || data.length === 0) {
    return <View style={[styles.container, { width, height }, style]} />;
  }

  if (data.length === 1) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <Svg width={width} height={height}>
          <Circle cx={width / 2} cy={height / 2} r={lineWidth * 2} fill={color} />
        </Svg>
      </View>
    );
  }

  // Calculate min and max values
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);

  // Calculate drawing area
  const padding = showLabels ? 20 : showAxes ? 10 : 0;
  const drawingWidth = width - padding * 2;
  const drawingHeight = height - padding * 2;

  // Calculate scaling factors
  const xScale = drawingWidth / (data.length - 1);
  const yScale = maxValue > minValue ? drawingHeight / (maxValue - minValue) : drawingHeight;

  // Generate line path
  let linePath = "";
  let areaPath = "";

  data.forEach((value /* , index */) => {
    const x = padding + index * xScale;
    const y = height - padding - (value - minValue) * yScale;

    if (index === 0) {
      linePath += `M ${x},${y} `;
      areaPath += `M ${x},${height - padding} L ${x},${y} `;
    } else {
      linePath += `L ${x},${y} `;
      areaPath += `L ${x},${y} `;
    }
  });

  // Complete area path
  areaPath += `L ${padding + (data.length - 1) * xScale},${height - padding} Z`;

  // Determine trend (increasing or decreasing)
  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const isTrendUp = lastValue > firstValue;
  const trendColor = isTrendUp ? "#2ecc71" : "#e74c3c";
  const actualColor = trend ? trendColor : color;

  // Format last value
  const lastValueFormatted = formatValue(lastValue);

  // Convert data points for touch interaction
  const touchablePoints = data.map((value /* , index */) => {
    return {
      value,
      x: padding + index * xScale,
      y: height - padding - (value - minValue) * yScale,
    };
  });

  // Handle touch on sparkline
  const handlePress = (event) => {
    if (!interactive) return;

    const { locationX } = event.nativeEvent;
    const closestPointIndex = touchablePoints.reduce((closest, point /* , index */) => {
      const distance = Math.abs(point.x - locationX);
      if (distance < Math.abs(touchablePoints[closest].x - locationX)) {
        return index;
      }
      return closest;
    }, 0);

    setHoveredPoint(closestPointIndex);
  };

  return (
    <Pressable
      style={[styles.container, { width, height }, style]}
      onPress={handlePress}
      onLongPress={() => setInteractive(!interactive)}
    >
      <Svg width={width} height={height}>
        {/* Define gradients */}
        <Defs>
          {/* Area fill gradient */}
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={actualColor} stopOpacity="0.8" />
            <Stop offset="1" stopColor={actualColor} stopOpacity="0.1" />
          </LinearGradient>

          {/* Line gradient */}
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={isTrendUp ? "#2ecc71" : "#e74c3c"} stopOpacity="0.8" />
            <Stop offset="1" stopColor={actualColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Draw axes if needed */}
        {showAxes && (
          <G>
            {/* Y axis */}
            <Line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              stroke="#ccc"
              strokeWidth={1}
            />
            {/* X axis */}
            <Line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="#ccc"
              strokeWidth={1}
            />
          </G>
        )}

        {/* Draw area under the line with gradient if needed */}
        {showArea && (
          <AnimatedPath
            d={areaPath}
            fill="url(#areaGradient)"
            fillOpacity={0.6}
            animationProgress={animationProgress}
          />
        )}

        {/* Draw line with enhanced styling */}
        <AnimatedPath
          d={linePath}
          stroke="url(#lineGradient)"
          strokeWidth={lineWidth}
          fill="none"
          animationProgress={animationProgress}
          strokeDasharray={trend && isTrendUp ? [1, 0] : []}
          strokeLinecap="round"
          strokeOpacity={1}
        />

        {/* Horizontal reference line at most recent value */}
        {trend && (
          <Line
            x1={padding}
            y1={height - padding - (lastValue - minValue) * yScale}
            x2={width - padding}
            y2={height - padding - (lastValue - minValue) * yScale}
            stroke={actualColor}
            strokeWidth={0.5}
            strokeDasharray={[2, 2]}
            opacity={0.4}
          />
        )}

        {/* Draw dots if needed */}
        {showDots &&
          data.map((value /* , index */) => {
            const x = padding + index * xScale;
            const y = height - padding - (value - minValue) * yScale;
            const isHighlighted =
              hoveredPoint === index || (index === data.length - 1 && highlightLast);

            return (
              <AnimatedCircle
                key={index}
                cx={x}
                cy={y}
                r={lineWidth}
                fill={isHighlighted ? actualColor : "#fff"}
                stroke={actualColor}
                strokeWidth={1}
                animationProgress={animationProgress}
                isLast={index === data.length - 1}
                isHighlighted={isHighlighted}
              />
            );
          })}

        {/* Value tooltip for hovered point */}
        {interactive && hoveredPoint !== null && (
          <G>
            <Rect
              x={touchablePoints[hoveredPoint].x - 40}
              y={touchablePoints[hoveredPoint].y - 25}
              width={80}
              height={20}
              rx={4}
              fill="rgba(0,0,0,0.7)"
            />
            <Path
              d={`M${touchablePoints[hoveredPoint].x},${touchablePoints[hoveredPoint].y - 5} L${touchablePoints[hoveredPoint].x - 5},${touchablePoints[hoveredPoint].y - 10} L${touchablePoints[hoveredPoint].x + 5},${touchablePoints[hoveredPoint].y - 10} Z`}
              fill="rgba(0,0,0,0.7)"
            />
            <Text
              x={touchablePoints[hoveredPoint].x}
              y={touchablePoints[hoveredPoint].y - 12}
              textAnchor="middle"
              fontSize={10}
              fill="#fff"
            >
              {formatValue(data[hoveredPoint])}
            </Text>
          </G>
        )}
      </Svg>

      {/* Labels */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <View style={styles.yLabelsContainer}><>

            <Text style={styles.label}>{formatYLabel(maxValue)}</Text>
            <Text
</> style={styles.label}>{formatYLabel(minValue)}</Text>
          </View>
          <View style={styles.xLabelsContainer}><>

            <Text style={styles.label}>{formatXLabel(0, data[0])}</Text>
            <Text
</> style={styles.label}>{formatXLabel(data.length - 1, data[data.length - 1])}</Text>
          </View>
        </View>
      )}

      {/* Trend indicator and last value */}
      {trend && (
        <View
          style={[
            styles.trendContainer,
            isTrendUp ? styles.trendContainerUp : styles.trendContainerDown,
          ]}
        ><>

          <Text style={[styles.trendArrow, { color: "#fff" }]}>{isTrendUp ? "↑" : "↓"}</Text>
          <Text
</> style={[styles.trendValue, { color: "#fff" }]}>{lastValueFormatted}</Text>
        </View>
      )}

      {interactive && (
        <View style={styles.interactiveIndicator}>
          <Text style={styles.interactiveText}>Interactive</Text>
        </View>
      )}
    </Pressable>
  );
};

// Animated SVG components
const AnimatedPath = ({ d, stroke, strokeWidth, fill, fillOpacity, animationProgress }) => {
  const strokeDasharray = useRef([0, 0]);

  if (fill === "none") {
    // For line path
    const pathRef = useRef(null);

    useEffect(() => {
      if (pathRef.current) {
        try {
          const length = pathRef.current.getTotalLength();
          strokeDasharray.current = [length, length];
        } catch (e) {
          console.error("Error measuring path length:", e);
        }
      }
    }, [d]);

    const strokeDashoffset = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [strokeDasharray.current[0] || 0, 0],
    });

    return (
      <Path
        ref={pathRef}
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
        strokeDasharray={strokeDasharray.current}
        strokeDashoffset={strokeDashoffset}
      />
    );
  } else {
    // For area path
    const opacity = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, fillOpacity || 1],
    });

    return <Path d={d} fill={fill} fillOpacity={opacity} />;
  }
};

const AnimatedCircle = ({
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth,
  animationProgress,
  isLast,
  isHighlighted,
}) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Basic entry animation scale
  const scale = animationProgress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0.8, 1],
  });

  // Additional pulse animation for the last dot
  useEffect(() => {
    if (isLast) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.5,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      pulseAnimation.stopAnimation();
    };
  }, [isLast, pulseAnimation]);

  const radius = isLast ? r * 1.5 : r;
  const combinedScale = isLast ? Animated.multiply(scale, pulseAnimation) : scale;

  // Add glow effect for the last point
  if (isLast) {
    return (
      <G>
        {/* Glow effect */}
        <Defs>
          <LinearGradient id="pointGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity="0.8" />
            <Stop offset="1" stopColor={stroke} stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Glow circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius * 2.5}
          fill="url(#pointGlow)"
          opacity={0.4}
          style={{ transform: [{ scale: combinedScale }] }}
        />

        {/* Main circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth * 1.5}
          style={{ transform: [{ scale: combinedScale }] }}
        />
      </G>
    );
  }

  // Regular points
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ transform: [{ scale }] }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  labelsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  yLabelsContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  xLabelsContainer: {
    position: "absolute",
    left: 20,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 8,
    color: "#7f8c8d",
  },
  trendContainer: {
    position: "absolute",
    top: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  trendContainerUp: {
    backgroundColor: "rgba(46, 204, 113, 0.9)",
  },
  trendContainerDown: {
    backgroundColor: "rgba(231, 76, 60, 0.9)",
  },
  trendArrow: {
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 2,
  },
  trendValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  interactiveIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  interactiveText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "500",
  },
});

export default AnimatedSparkline;
