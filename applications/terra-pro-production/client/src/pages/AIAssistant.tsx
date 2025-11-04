import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Brain,
  Send,
  Lightbulb,
  BarChart3,
  FileText,
  Search,
  Zap,
  MessageSquare,
  Clock,
  CheckCircle2,
 } from '@mui/icons-material';

export default function AIAssistant() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
          <p
</> className="text-slate-600">Get intelligent insights and automated assistance</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          AI Active
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3
</> className="font-semibold mb-2">Market Analysis</h3>
            <p className="text-sm text-slate-500">Get AI-powered market insights</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3
</> className="font-semibold mb-2">Report Review</h3>
            <p className="text-sm text-slate-500">AI quality check and suggestions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <h3
</> className="font-semibold mb-2">Comp Selection</h3>
            <p className="text-sm text-slate-500">Intelligent comparable search</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h3
</> className="font-semibold mb-2">Auto Valuation</h3>
            <p className="text-sm text-slate-500">AI-powered property valuation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Chat Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center"><>

                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <div
</> className="flex-1">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm">
                        Hello! I'm your AI assistant. I can help you with property valuations,
                        market analysis, comparable searches, and report reviews. What would you
                        like assistance with today?
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Just now</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-xs">
                    <div className="bg-blue-600 text-white rounded-lg p-3">
                      <p className="text-sm">
                        Can you analyze the market trends for Cityville, CA?
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-right">2 minutes ago</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">JD</span>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center"><>

                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <div
</> className="flex-1">
                    <div className="bg-slate-50 rounded-lg p-3"><>

                      <p className="text-sm mb-2">Based on recent sales data for Cityville, CA:</p>
                      <ul
</> className="text-sm space-y-1 ml-4"><>

                        <li>• Median price increased 12.5% over last 6 months</li>
                            <li
</>>• Average days on market: 18 days</li><>

                        <li>• Price per sq ft: $265 (up from $235)</li>
                            <li
</>>• Inventory levels: 2.3 months supply</li>
                      </ul>
                      <p className="text-sm mt-2">
                        The market shows strong appreciation with low inventory. Would you like a
                        detailed comparative analysis?
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">1 minute ago</p>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask the AI assistant anything about properties, valuations, or market analysis..."
                    className="flex-1 min-h-[60px] resize-none"
                  />
                  <Button size="sm" className="px-3">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Market Opportunity</span>
                </div>
                <p className="text-xs text-blue-700">
                  Cityville market showing 15% appreciation - consider higher valuation adjustments
                </p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Comp Suggestion</span>
                </div>
                <p className="text-xs text-green-700">
                  Found 3 new comparable sales within 0.5 miles - review for better accuracy
                </p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Quality Check</span>
                </div>
                <p className="text-xs text-purple-700">
                  Report #APR-2025-001 shows 98% accuracy score - ready for delivery
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent AI Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-600" />
                Recent AI Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3"><>

                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div
</> className="flex-1"><>

                  <div className="text-sm font-medium">Market Analysis</div>
                  <div
</> className="text-xs text-slate-500">Cityville, CA - Completed</div>
                </div>
                <span className="text-xs text-slate-400">2m ago</span>
              </div>

              <div className="flex items-center gap-3"><>

                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div
</> className="flex-1"><>

                  <div className="text-sm font-medium">Comp Search</div>
                  <div
</> className="text-xs text-slate-500">123 Maple St - 24 results</div>
                </div>
                <span className="text-xs text-slate-400">15m ago</span>
              </div>

              <div className="flex items-center gap-3"><>

                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <div
</> className="flex-1"><>

                  <div className="text-sm font-medium">Valuation</div>
                  <div
</> className="text-xs text-slate-500">789 Oak Ave - $485,000</div>
                </div>
                <span className="text-xs text-slate-400">1h ago</span>
              </div>

              <div className="flex items-center gap-3"><>

                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div
</> className="flex-1"><>

                  <div className="text-sm font-medium">Report Review</div>
                  <div
</> className="text-xs text-slate-500">APR-2025-003 - Suggestions</div>
                </div>
                <span className="text-xs text-slate-400">2h ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Commands */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start"><>

                <MessageSquare className="h-4 w-4 mr-2" />
                "Analyze this property"
              </Button>
              <Button
</> variant="outline" size="sm" className="w-full justify-start"><>

                <MessageSquare className="h-4 w-4 mr-2" />
                "Find comparable sales"
              </Button>
              <Button
</> variant="outline" size="sm" className="w-full justify-start"><>

                <MessageSquare className="h-4 w-4 mr-2" />
                "Review my report"
              </Button>
              <Button
</> variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                "Market trends for..."
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
