"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calculator, TrendingUp, CheckCircle, Clock, Warning, Building, MapPin  } from '@mui/icons-material'

interface AssessmentTask {
  id: string
  parcelNumber: string
  address: string
  propertyType: string
  priority: "high" | "medium" | "low"
  dueDate: string
  status: "pending" | "in_progress" | "completed" | "review"
  assessor: string
  currentValue: number
  proposedValue: number
}

export default function AssessmentWorkflow() {
  const [tasks, setTasks] = useState<AssessmentTask[]>([
    {
      id: "1",
      parcelNumber: "362301-100045",
      address: "123 Wine Country Rd, Prosser, WA",
      propertyType: "Residential",
      priority: "high",
      dueDate: "2025-01-20",
      status: "pending",
      assessor: "Sarah Johnson",
      currentValue: 485000,
      proposedValue: 0,
    },
    {
      id: "2",
      parcelNumber: "362301-200078",
      address: "456 River View Dr, Richland, WA",
      propertyType: "Residential",
      priority: "medium",
      dueDate: "2025-01-25",
      status: "in_progress",
      assessor: "Sarah Johnson",
      currentValue: 325000,
      proposedValue: 335000,
    },
    {
      id: "3",
      parcelNumber: "362301-300012",
      address: "321 Commerce Blvd, Richland, WA",
      propertyType: "Commercial",
      priority: "high",
      dueDate: "2025-01-18",
      status: "review",
      assessor: "Michael Chen",
      currentValue: 700000,
      proposedValue: 725000,
    },
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "in_progress":
        return <Clock className="h-4 w-4" />
      case "review":
        return <Warning className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const totalTasks = tasks.length
  const progressPercentage = (completedTasks / totalTasks) * 100

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Assessment Workflow</h1>
          <p
</> className="text-gray-600">Manage property assessments and valuations</p>
        </div>
        <Button>
          <Calculator className="h-4 w-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{totalTasks}</div>
                <div
</> className="text-sm text-gray-600">Total Assessments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{completedTasks}</div>
                <div
</> className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "pending").length}</div>
                <div
</> className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</div>
                <div
</> className="text-sm text-gray-600">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Progress */}
      <Card>
        <CardHeader><>

          <CardTitle>Assessment Progress</CardTitle>
          <CardDescription
</>>Current status of assessment workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm"><>

              <span>Overall Progress</span>
              <span
</>>
                {completedTasks} of {totalTasks} assessments completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center"><>

                <div className="font-bold text-gray-600">{tasks.filter((t) => t.status === "pending").length}</div>
                <div
</> className="text-gray-500">Pending</div>
              </div>
              <div className="text-center"><>

                <div className="font-bold text-blue-600">{tasks.filter((t) => t.status === "in_progress").length}</div>
                <div
</> className="text-gray-500">In Progress</div>
              </div>
              <div className="text-center"><>

                <div className="font-bold text-purple-600">{tasks.filter((t) => t.status === "review").length}</div>
                <div
</> className="text-gray-500">Under Review</div>
              </div>
              <div className="text-center"><>

                <div className="font-bold text-green-600">{completedTasks}</div>
                <div
</> className="text-gray-500">Completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="active">Active Assessments</TabsTrigger>
          <TabsTrigger
</> value="review">Pending Review</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            {tasks
              .filter((task) => task.status === "pending" || task.status === "in_progress")
              .map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-gray-400" /><>

                          <span className="font-medium">{task.parcelNumber}</span>
                          <Badge
</> className={getPriorityColor(task.priority)}>{task.priority.toUpperCase()}</Badge>
                          <Badge className={getStatusColor(task.status)} variant="outline">
                            {getStatusIcon(task.status)}
                            <span className="ml-1">{task.status.replace("_", " ").toUpperCase()}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600"><>

                          <MapPin className="h-4 w-4" />
                          {task.address}
                        </div>
                        <div
</> className="text-sm text-gray-500">
                          Assigned to: {task.assessor} • Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right space-y-2"><>

                        <div className="text-sm text-gray-600">Current Value</div>
                        <div
</> className="text-lg font-bold">{formatCurrency(task.currentValue)}</div>
                        {task.proposedValue > 0 && (
                          <><>

                            <div className="text-sm text-gray-600">Proposed Value</div>
                            <div
</> className="text-lg font-bold text-blue-600">{formatCurrency(task.proposedValue)}</div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4"><>

                      <Button size="sm">Open Assessment</Button>
                      <Button
</> variant="outline" size="sm">
                        View Property
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <div className="space-y-4">
            {tasks
              .filter((task) => task.status === "review")
              .map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-6">
                    <Alert>
                      <Warning className="h-4 w-4" /><>

                      <AlertTitle>Assessment Ready for Review</AlertTitle>
                      <AlertDescription
</>>
                        <div className="mt-2 space-y-2">
                          <div>
                            <strong>Parcel:</strong> {task.parcelNumber} - {task.address}
                          </div>
                          <div>
                            <strong>Assessor:</strong> {task.assessor}
                          </div>
                          <div className="flex gap-4">
                            <span>
                              <strong>Current:</strong> {formatCurrency(task.currentValue)}
                            </span>
                            <span>
                              <strong>Proposed:</strong> {formatCurrency(task.proposedValue)}
                            </span>
                            <span>
                              <strong>Change:</strong>{" "}
                              <span
                                className={task.proposedValue > task.currentValue ? "text-green-600" : "text-red-600"}
                              >
                                {formatCurrency(task.proposedValue - task.currentValue)} (
                                {(((task.proposedValue - task.currentValue) / task.currentValue) * 100).toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                          <div className="flex gap-2 mt-4"><>

                            <Button size="sm">Approve Assessment</Button>
                            <Button
</> variant="outline" size="sm">
                              Request Changes
                            </Button>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Completed Assessments</CardTitle>
              <CardDescription
</>>Recently completed property assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" /><>

                <p>No completed assessments to display</p>
                <p
</> className="text-sm">Completed assessments will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
