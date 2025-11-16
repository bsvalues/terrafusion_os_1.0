"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mic, Play, Square, FileText, Volume2, CheckCircle, Clock, Zap  } from '@mui/icons-material'

interface VoiceNote {
  id: string
  transcript: string
  audioUrl: string
  duration: number
  timestamp: string
  confidence: number
  category: "condition" | "measurement" | "observation" | "recommendation"
  processed: boolean
}

export default function VoiceDocumentation() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const mockVoiceNotes: VoiceNote[] = [
      {
        id: "voice-001",
        transcript:
          "Roof condition appears to be in good shape overall. Minor granule loss on south-facing slope, approximately 15% wear. Gutters are clean and properly attached. No visible damage to flashing around chimney area.",
        audioUrl: "/placeholder-audio.mp3",
        duration: 18,
        timestamp: "2025-01-10 14:32:15",
        confidence: 94.2,
        category: "condition",
        processed: true,
      },
      {
        id: "voice-002",
        transcript:
          "Foundation shows minor settling cracks on east wall, approximately 2 feet from corner. Cracks are hairline, less than 1/8 inch wide. No signs of active movement or water intrusion.",
        audioUrl: "/placeholder-audio.mp3",
        duration: 12,
        timestamp: "2025-01-10 14:35:42",
        confidence: 91.8,
        category: "observation",
        processed: true,
      },
      {
        id: "voice-003",
        transcript:
          "Recommend monitoring foundation cracks annually. Consider professional structural evaluation if cracks widen beyond 1/4 inch. Seal existing cracks to prevent water penetration.",
        audioUrl: "/placeholder-audio.mp3",
        duration: 15,
        timestamp: "2025-01-10 14:36:58",
        confidence: 96.5,
        category: "recommendation",
        processed: true,
      },
    ]

    setVoiceNotes(mockVoiceNotes)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const startRecording = () => {
    setIsRecording(true)
    setCurrentTranscript("")
    setRecordingTime(0)
  }

  const stopRecording = () => {
    setIsRecording(false)
    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      const newNote: VoiceNote = {
        id: `voice-${Date.now()}`,
        transcript: "New voice note recorded. Processing speech-to-text conversion...",
        audioUrl: "/placeholder-audio.mp3",
        duration: recordingTime,
        timestamp: new Date().toISOString(),
        confidence: 92.3,
        category: "observation",
        processed: false,
      }

      setVoiceNotes((prev) => [newNote, ...prev])
      setIsProcessing(false)
      setRecordingTime(0)
    }, 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "condition":
        return "bg-blue-100 text-blue-800"
      case "measurement":
        return "bg-green-100 text-green-800"
      case "observation":
        return "bg-yellow-100 text-yellow-800"
      case "recommendation":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "condition":
        return "🏠"
      case "measurement":
        return "📏"
      case "observation":
        return "👁️"
      case "recommendation":
        return "💡"
      default:
        return "📝"
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Mobile Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6" />
            <span className="font-bold">Voice Documentation</span>
          </div>
          <Badge className={isRecording ? "bg-red-500" : "bg-gray-500"}>{isRecording ? "RECORDING" : "READY"}</Badge>
        </div>
      </div>

      {/* Recording Interface */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="text-center space-y-4">
          {isRecording && <div className="text-2xl font-bold text-red-600">{formatTime(recordingTime)}</div>}

          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600"
                disabled={isProcessing}
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                className="w-20 h-20 rounded-full bg-gray-500 hover:bg-gray-600"
              >
                <Square className="h-8 w-8" />
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="text-sm text-gray-600">Tap to stop recording • Speak clearly for best results</div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Zap className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Processing speech...</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Transcript */}
      {isRecording && (
        <div className="p-4 border-b"><>

          <div className="text-sm font-medium mb-2">Live Transcript</div>
          <div
</> className="bg-white border rounded-lg p-3 min-h-[60px]">
            <div className="text-sm text-gray-700">
              {currentTranscript || "Start speaking..."}
              {isRecording && <span className="animate-pulse">|</span>}
            </div>
          </div>
        </div>
      )}

      {/* Voice Notes List */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center"><>

          <h3 className="font-semibold">Voice Notes ({voiceNotes.length})</h3>
          <Button
</> size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        {voiceNotes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2"><>

                  <span className="text-lg">{getCategoryIcon(note.category)}</span>
                  <Badge
</> className={getCategoryColor(note.category)}>{note.category.toUpperCase()}</Badge>
                </div>
                <div className="text-right text-xs text-gray-500"><>

                  <div>{new Date(note.timestamp).toLocaleTimeString()}</div>
                  <div
</>>{formatTime(note.duration)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3"><>

              <div className="text-sm text-gray-700 leading-relaxed">{note.transcript}</div>

              <div
</> className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline"><>

                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                  <div
</> className="text-xs text-gray-500">{note.confidence}% confidence</div>
                </div>

                <div className="flex items-center gap-1">
                  {note.processed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-xs text-gray-500">{note.processed ? "Processed" : "Processing"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {voiceNotes.length === 0 && (
          <div className="text-center py-8">
            <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" /><>

            <div className="text-lg font-medium mb-2">No Voice Notes Yet</div>
            <div
</> className="text-sm text-gray-600">Tap the record button to start documenting your assessment</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t">
        <div className="space-y-3"><>

          <div className="text-sm font-medium">Quick Voice Commands</div>
          <div
</> className="grid grid-cols-2 gap-2"><>

            <Button variant="outline" size="sm" className="text-xs">
              "Note condition..."
            </Button>
            <Button
</> variant="outline" size="sm" className="text-xs">
              "Measure..."
            </Button><>

            <Button variant="outline" size="sm" className="text-xs">
              "Recommend..."
            </Button>
            <Button
</> variant="outline" size="sm" className="text-xs">
              "Observe..."
            </Button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t">
        <Alert>
          <Volume2 className="h-4 w-4" /><>

          <AlertTitle>Voice Recognition Settings</AlertTitle>
          <AlertDescription
</>>
            <div className="mt-2 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Auto-categorize notes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Real-time transcription</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Voice commands enabled</span>
              </label>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
