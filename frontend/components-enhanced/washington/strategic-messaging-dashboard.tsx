"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const segments = [
  {
    id: "small",
    name: "Small Counties",
    icon: "🏘️",
    targetCounties: 2847,
    conversionRate: 18.4,
    upfrontCost: "$0",
    interestScore: 87,
    headline: "Right-Sized Revolution",
    hook: "Big County Power, Small County Price",
    triggers: ["Limited resources, small teams", "No IT team required", "1-day deployment"],
    color: "from-primary to-transcend",
  },
  {
    id: "large",
    name: "Large Counties",
    icon: "🏙️",
    targetCounties: 143,
    conversionRate: 22.7,
    upfrontCost: "$2.3M",
    interestScore: 92,
    headline: "Transform Millions",
    hook: "Metrics-Driven Transformation at Scale",
    triggers: ["Complex operations at scale", "Proven ROI metrics", "156 departments unified"],
    color: "from-accent to-green-500",
  },
  {
    id: "technical",
    name: "Technical Counties",
    icon: "💻",
    targetCounties: 67,
    conversionRate: 31.2,
    upfrontCost: "API",
    interestScore: 94,
    headline: "API-First Government",
    hook: "Enterprise-Grade, Developer-Approved",
    triggers: ["GraphQL API architecture", "SOC2 certified security", "Cloud-native deployment"],
    color: "from-transcend to-primary",
  },
  {
    id: "traditional",
    name: "Traditional Counties",
    icon: "🏛️",
    targetCounties: 892,
    conversionRate: 14.8,
    upfrontCost: "12mo",
    interestScore: 76,
    headline: "Trusted Transformation",
    hook: "Your Neighbors' Success Story",
    triggers: ["Peer testimonials prominent", "Zero downtime migration", "Full training included"],
    color: "from-yellow-500 to-orange-500",
  },
]

export function StrategicMessagingDashboard() {
  const [metrics, setMetrics] = useState({
    smallEngagement: 87,
    largeMetrics: 92,
    technicalAPI: 94,
    traditionalTrust: 76,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        smallEngagement: Math.max(70, Math.min(100, prev.smallEngagement + (Math.random() - 0.5) * 4)),
        largeMetrics: Math.max(80, Math.min(100, prev.largeMetrics + (Math.random() - 0.5) * 3)),
        technicalAPI: Math.max(85, Math.min(100, prev.technicalAPI + (Math.random() - 0.5) * 2)),
        traditionalTrust: Math.max(60, Math.min(90, prev.traditionalTrust + (Math.random() - 0.5) * 5)),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleCampaignLaunch = (segmentId: string) => {
    console.log(`Launching campaign for ${segmentId} segment`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark/95 to-primary/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">
            <span className="bg-gradient-to-r from-primary via-transcend to-accent bg-clip-text text-transparent">
              Strategic Messaging Command Center
            </span>
          </h1>
          <p className="text-white/70 text-lg">Real-time segmentation and message optimization</p>
        </div>

        {/* Segment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-transcend/30 transition-all duration-300 hover:transform hover:-translate-y-2"
            >
              <div className="flex justify-between items-start mb-4"><>

                <div className="text-3xl">{segment.icon}</div>
                <Badge
</> className={`bg-gradient-to-r ${segment.color} text-white`}>{segment.name}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/30 rounded-lg p-3 text-center"><>

                  <div className="text-lg font-bold text-transcend">{segment.targetCounties.toLocaleString()}</div>
                  <div
</> className="text-xs text-white/60">Target Counties</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center"><>

                  <div className="text-lg font-bold text-accent">{segment.conversionRate}%</div>
                  <div
</> className="text-xs text-white/60">Conversion Rate</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center"><>

                  <div className="text-lg font-bold text-primary">{segment.upfrontCost}</div>
                  <div
</> className="text-xs text-white/60">Upfront Cost</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center"><>

                  <div className="text-lg font-bold text-accent">{segment.interestScore}%</div>
                  <div
</> className="text-xs text-white/60">Interest Score</div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3 mb-4"><>

                <div className="font-semibold text-transcend text-sm mb-1">{segment.headline}</div>
                <div
</> className="text-xs text-white/70 italic">"{segment.hook}"</div>
              </div>

              <ul className="space-y-1 mb-4">
                {segment.triggers.map((trigger, idx) => (
                  <li key={idx} className="text-xs text-white/60 flex items-center gap-2">
                    <span className="text-transcend">→</span>
                    {trigger}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full bg-gradient-to-r ${segment.color} hover:opacity-80`}
                onClick={() => handleCampaignLaunch(segment.id)}
              >
                Launch Campaign
              </Button>
            </div>
          ))}
        </div>

        {/* Performance Matrix */}
        <div className="bg-black/60 backdrop-blur-sm border border-transcend/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-transcend to-accent bg-clip-text text-transparent">
              🎯 Real-Time Performance Matrix
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/30 rounded-lg p-4 text-center border border-primary/20"><>

              <div className="text-2xl font-black text-primary mb-2">{metrics.smallEngagement.toFixed(0)}%</div>
              <div
</> className="text-sm text-white/60">Small County Engagement</div>
              <div className="flex justify-center mt-2">
                <div
                  className={`w-2 h-2 rounded-full ${metrics.smallEngagement > 85 ? "bg-green-500" : metrics.smallEngagement > 75 ? "bg-yellow-500" : "bg-red-500"} animate-pulse`}
                ></div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center border border-accent/20"><>

              <div className="text-2xl font-black text-accent mb-2">{metrics.largeMetrics.toFixed(0)}%</div>
              <div
</> className="text-sm text-white/60">Large County Metrics</div>
              <div className="flex justify-center mt-2">
                <div
                  className={`w-2 h-2 rounded-full ${metrics.largeMetrics > 90 ? "bg-green-500" : metrics.largeMetrics > 80 ? "bg-yellow-500" : "bg-red-500"} animate-pulse`}
                ></div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center border border-transcend/20"><>

              <div className="text-2xl font-black text-transcend mb-2">{metrics.technicalAPI.toFixed(0)}%</div>
              <div
</> className="text-sm text-white/60">Technical API Interest</div>
              <div className="flex justify-center mt-2">
                <div
                  className={`w-2 h-2 rounded-full ${metrics.technicalAPI > 90 ? "bg-green-500" : metrics.technicalAPI > 80 ? "bg-yellow-500" : "bg-red-500"} animate-pulse`}
                ></div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center border border-yellow-500/20"><>

              <div className="text-2xl font-black text-yellow-500 mb-2">{metrics.traditionalTrust.toFixed(0)}%</div>
              <div
</> className="text-sm text-white/60">Traditional Trust Score</div>
              <div className="flex justify-center mt-2">
                <div
                  className={`w-2 h-2 rounded-full ${metrics.traditionalTrust > 80 ? "bg-green-500" : metrics.traditionalTrust > 70 ? "bg-yellow-500" : "bg-red-500"} animate-pulse`}
                ></div>
              </div>
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="bg-gradient-to-r from-primary/10 to-transcend/10 rounded-2xl p-6"><>

            <h3 className="text-lg font-semibold text-transcend mb-4">💡 Strategic Insights</h3>
            <div
</> className="space-y-3 text-sm">
              <div className="text-white/80">
                <strong>Small Counties:</strong> "Right-Sized Revolution" messaging showing 3.2× higher engagement than
                generic messaging
              </div>
              <div className="text-white/80">
                <strong>Large Counties:</strong> $2.3M savings metric drives 45% more conversions than percentage-based
                claims
              </div>
              <div className="text-white/80">
                <strong>Technical Counties:</strong> API documentation views correlate 0.89 with conversion probability
              </div>
              <div className="text-white/80">
                <strong>Traditional Counties:</strong> Testimonial videos increase trust score by 34% on average
              </div>
              <div className="text-accent font-semibold animate-pulse">
                <strong>🚀 Recommendation:</strong> Increase testimonial content for Traditional segment - currently
                underperforming by 18%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
