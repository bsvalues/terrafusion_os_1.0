/**
 * Elite Performance Indicator Component
 * Real-time display of championship performance metrics
 */
import { useEliteQuantumPerformance } from '../../hooks/useEliteQuantumPerformance';

export function ElitePerformanceIndicator() {
  const { metrics, excellenceLevel, governmentGrade } = useEliteQuantumPerformance();

  return (
    <div className='tf-elite-performance-indicator'>
      <div className={`tf-performance-badge tf-${excellenceLevel.toLowerCase()}`}>
        <span className='tf-fps-display'>{metrics.animationFps}fps</span>
        <span className='tf-latency-display'>{metrics.interactionLatency.toFixed(1)}ms</span>
        <span className='tf-consciousness-display'>{metrics.consciousnessScore}%</span>
      </div>
      {governmentGrade && (
        <div className='tf-government-certification'>✓ GOVERNMENT GRADE EXCELLENCE</div>
      )}
    </div>
  );
}

export default ElitePerformanceIndicator;
