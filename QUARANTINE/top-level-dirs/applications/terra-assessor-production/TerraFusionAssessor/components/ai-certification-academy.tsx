"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Award, Users, BookOpen, CheckCircle, Clock, Star, Trophy, Target, Brain  } from '@mui/icons-material'

interface Course {
  id: string
  title: string
  level: "beginner" | "intermediate" | "advanced" | "expert"
  duration: string
  modules: number
  enrolled: number
  rating: number
  price: number
  category: "ai-fundamentals" | "avm-mastery" | "mobile-assessment" | "integration" | "leadership"
  instructor: string
  description: string
  skills: string[]
}

interface Certification {
  id: string
  name: string
  level: "associate" | "professional" | "expert" | "master"
  requirements: string[]
  validityPeriod: string
  holders: number
  passingScore: number
  examDuration: string
}

export default function AICertificationAcademy() {
  const [selectedTrack, setSelectedTrack] = useState("all")

  const courses: Course[] = [
    {
      id: "ai-fundamentals-101",
      title: "AI Fundamentals for Property Assessment",
      level: "beginner",
      duration: "8 hours",
      modules: 6,
      enrolled: 1247,
      rating: 4.8,
      price: 299,
      category: "ai-fundamentals",
      instructor: "Dr. Sarah Chen, AI Research Director",
      description: "Master the basics of artificial intelligence in property valuation and assessment workflows",
      skills: ["Machine Learning Basics", "Data Analysis", "AI Ethics", "Model Interpretation"],
    },
    {
      id: "avm-mastery-201",
      title: "Advanced AVM Implementation & Optimization",
      level: "intermediate",
      duration: "12 hours",
      modules: 8,
      enrolled: 892,
      rating: 4.9,
      price: 499,
      category: "avm-mastery",
      instructor: "Michael Rodriguez, Senior Data Scientist",
      description: "Deep dive into automated valuation models, training, and performance optimization",
      skills: ["Model Training", "Performance Tuning", "Data Quality", "Validation Techniques"],
    },
    {
      id: "mobile-assessment-301",
      title: "Mobile Field Assessment Mastery",
      level: "advanced",
      duration: "6 hours",
      modules: 4,
      enrolled: 634,
      rating: 4.7,
      price: 399,
      category: "mobile-assessment",
      instructor: "Jennifer Park, Mobile Solutions Architect",
      description: "Comprehensive training on mobile assessment tools, AR measurement, and field workflows",
      skills: ["Mobile Technology", "AR Tools", "Field Procedures", "Data Collection"],
    },
    {
      id: "integration-expert-401",
      title: "Enterprise Integration Architecture",
      level: "expert",
      duration: "16 hours",
      modules: 10,
      enrolled: 423,
      rating: 4.6,
      price: 799,
      category: "integration",
      instructor: "David Kim, Integration Specialist",
      description: "Master complex system integrations, API development, and enterprise architecture",
      skills: ["API Development", "System Architecture", "Data Migration", "Security Protocols"],
    },
    {
      id: "leadership-501",
      title: "AI Leadership for Assessment Directors",
      level: "expert",
      duration: "10 hours",
      modules: 6,
      enrolled: 298,
      rating: 4.9,
      price: 699,
      category: "leadership",
      instructor: "Lisa Thompson, Former County Assessor",
      description: "Strategic leadership in AI adoption, change management, and organizational transformation",
      skills: ["Change Management", "Strategic Planning", "Team Leadership", "ROI Analysis"],
    },
  ]

  const certifications: Certification[] = [
    {
      id: "tfa-associate",
      name: "Terrafusion AI Associate",
      level: "associate",
      requirements: ["Complete AI Fundamentals 101", "Pass Associate Exam", "6 months experience"],
      validityPeriod: "2 years",
      holders: 2847,
      passingScore: 75,
      examDuration: "2 hours",
    },
    {
      id: "tfa-professional",
      name: "Terrafusion AI Professional",
      level: "professional",
      requirements: [
        "TFA Associate Certification",
        "Complete AVM Mastery 201",
        "Pass Professional Exam",
        "1 year experience",
      ],
      validityPeriod: "3 years",
      holders: 1293,
      passingScore: 80,
      examDuration: "3 hours",
    },
    {
      id: "tfa-expert",
      name: "Terrafusion AI Expert",
      level: "expert",
      requirements: [
        "TFA Professional Certification",
        "Complete 2 Advanced Courses",
        "Pass Expert Exam",
        "2 years experience",
      ],
      validityPeriod: "3 years",
      holders: 456,
      passingScore: 85,
      examDuration: "4 hours",
    },
    {
      id: "tfa-master",
      name: "Terrafusion AI Master",
      level: "master",
      requirements: [
        "TFA Expert Certification",
        "Complete Leadership Course",
        "Pass Master Exam",
        "5 years experience",
        "Peer Review",
      ],
      validityPeriod: "5 years",
      holders: 89,
      passingScore: 90,
      examDuration: "6 hours",
    },
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-blue-100 text-blue-800"
      case "advanced":
        return "bg-purple-100 text-purple-800"
      case "expert":
        return "bg-red-100 text-red-800"
      case "associate":
        return "bg-green-100 text-green-800"
      case "professional":
        return "bg-blue-100 text-blue-800"
      case "master":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ai-fundamentals":
        return Brain
      case "avm-mastery":
        return Target
      case "mobile-assessment":
        return Users
      case "integration":
        return BookOpen
      case "leadership":
        return Trophy
      default:
        return BookOpen
    }
  }

  const filteredCourses =
    selectedTrack === "all" ? courses : courses.filter((course) => course.category === selectedTrack)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
<>

        <h1 className="text-4xl font-bold">Terrafusion AI Certification Academy</h1>
        <p
</>

className="text-xl text-gray-600 max-w-3xl mx-auto">
          Master AI-powered property assessment with industry-leading certification programs
        </p>
      </div>

      {/* Academy Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-blue-600" />
<>

            <div className="text-3xl font-bold">5,847</div>
            <div
</>

className="text-sm text-gray-600">Certified Professionals</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-green-600" />
<>

            <div className="text-3xl font-bold">24</div>
            <div
</>

className="text-sm text-gray-600">Training Courses</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-purple-600" />
<>

            <div className="text-3xl font-bold">4</div>
            <div
</>

className="text-sm text-gray-600">Certification Levels</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
<>

            <div className="text-3xl font-bold">4.8</div>
            <div
</>

className="text-sm text-gray-600">Average Rating</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
<>

          <TabsTrigger value="courses">Training Courses</TabsTrigger>
          <TabsTrigger
</>

value="certifications">Certifications</TabsTrigger>
<>

          <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger>
          <TabsTrigger
</>

value="instructors">Expert Instructors</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Course Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap">
<>

                <Button
                  variant={selectedTrack === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTrack("all")}
                >
                  All Courses
                </Button>
                <Button
</>

                  variant={selectedTrack === "ai-fundamentals" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTrack("ai-fundamentals")}
                >
                  AI Fundamentals
                </Button>
<>

                <Button
                  variant={selectedTrack === "avm-mastery" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTrack("avm-mastery")}
                >
                  AVM Mastery
                </Button>
                <Button
</>

                  variant={selectedTrack === "mobile-assessment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTrack("mobile-assessment")}
                >
                  Mobile Assessment
                </Button>
<>

                <Button
                  variant={selectedTrack === "integration" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTrack("integration")}
                >
                  Integration
                </Button>
                <Button
</>

                  variant={selectedTrack === "leadership" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTrack("leadership")}
                >
                  Leadership
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Course Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourses.map((course) => {
              const CategoryIcon = getCategoryIcon(course.category)
              return (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
<>

                        <CategoryIcon className="h-6 w-6" />
                        {course.title}
                      </div>
                      <Badge
</>

className={getLevelColor(course.level)}>{course.level.toUpperCase()}</Badge>
                    </CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span>{course.modules} modules</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{course.enrolled.toLocaleString()} enrolled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{course.rating} rating</span>
                      </div>
                    </div>

                    <div>
<>

                      <div className="text-sm font-medium mb-2">Skills You'll Learn</div>
                      <div
</>

className="flex flex-wrap gap-1">
                        {course.skills.map((skill /* , index */) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
<>

                      <div className="text-2xl font-bold text-blue-600">${course.price}</div>
                      <div
</>

className="flex gap-2">
<>

                        <Button size="sm" variant="outline">
                          Preview
                        </Button>
                        <Button
</>

size="sm">Enroll Now</Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600">Instructor: {course.instructor}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certifications.map((cert) => (
              <Card key={cert.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
<>

                      <Award className="h-6 w-6" />
                      {cert.name}
                    </div>
                    <Badge
</>

className={getLevelColor(cert.level)}>{cert.level.toUpperCase()}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Professional certification for {cert.level}-level AI assessment expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
<>

                      <div className="font-medium">Certified Holders</div>
                      <div
</>

className="text-lg font-bold text-green-600">{cert.holders.toLocaleString()}</div>
                    </div>
                    <div>
<>

                      <div className="font-medium">Validity Period</div>
                      <div
</>

className="text-lg font-bold">{cert.validityPeriod}</div>
                    </div>
                    <div>
<>

                      <div className="font-medium">Passing Score</div>
                      <div
</>

className="text-lg font-bold">{cert.passingScore}%</div>
                    </div>
                    <div>
<>

                      <div className="font-medium">Exam Duration</div>
                      <div
</>

className="text-lg font-bold">{cert.examDuration}</div>
                    </div>
                  </div>

                  <div>
<>

                    <div className="text-sm font-medium mb-2">Requirements</div>
                    <div
</>

className="space-y-1">
                      {cert.requirements.map((req /* , index */) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
<>

                    <Button className="flex-1">Start Certification Path</Button>
                    <Button
</>

variant="outline">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="learning-paths" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
<>

                  <Target className="h-6 w-6 text-blue-600" />
                  Assessment Professional Path
                </CardTitle>
                <CardDescription
</>

</>>Complete learning journey for property assessment professionals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
<>

                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div
</>

</>>
<>

                      <div className="font-medium">AI Fundamentals for Property Assessment</div>
                      <div
</>

className="text-sm text-gray-600">8 hours • Beginner</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
<>

                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div
</>

</>>
<>

                      <div className="font-medium">Advanced AVM Implementation</div>
                      <div
</>

className="text-sm text-gray-600">12 hours • Intermediate</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
<>

                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div
</>

</>>
<>

                      <div className="font-medium">Terrafusion AI Professional Certification</div>
                      <div
</>

className="text-sm text-gray-600">3 hours exam</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
<>

                  <div className="text-sm font-medium text-blue-800">Path Progress</div>
                  <Progress
</>

value={65} className="mt-2" />
                  <div className="text-xs text-blue-600 mt-1">65% Complete</div>
                </div>
                <Button className="w-full">Continue Learning Path</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
<>

                  <Trophy className="h-6 w-6 text-purple-600" />
                  Leadership Excellence Path
                </CardTitle>
                <CardDescription
</>

</>>Strategic leadership training for assessment directors and managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
<>

                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div
</>

</>>
<>

                      <div className="font-medium">AI Leadership for Assessment Directors</div>
                      <div
</>

className="text-sm text-gray-600">10 hours • Expert</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
<>

                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div
</>

</>>
<>

                      <div className="font-medium">Change Management Masterclass</div>
                      <div
</>

className="text-sm text-gray-600">8 hours • Advanced</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
<>

                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div
</>

</>>
<>

                      <div className="font-medium">Terrafusion AI Master Certification</div>
                      <div
</>

className="text-sm text-gray-600">6 hours exam + peer review</div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
<>

                  <div className="text-sm font-medium text-purple-800">Path Progress</div>
                  <Progress
</>

value={25} className="mt-2" />
                  <div className="text-xs text-purple-600 mt-1">25% Complete</div>
                </div>
                <Button className="w-full">Start Leadership Path</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                name: "Dr. Sarah Chen",
                title: "AI Research Director",
                expertise: "Machine Learning, Neural Networks, Property Valuation",
                experience: "15+ years",
                courses: 8,
                students: 12847,
                rating: 4.9,
                bio: "Leading AI researcher with extensive experience in real estate technology and machine learning applications.",
              },
              {
                name: "Michael Rodriguez",
                title: "Senior Data Scientist",
                expertise: "AVM Development, Statistical Modeling, Data Analytics",
                experience: "12+ years",
                courses: 6,
                students: 8934,
                rating: 4.8,
                bio: "Expert in automated valuation models with proven track record in property assessment technology.",
              },
              {
                name: "Jennifer Park",
                title: "Mobile Solutions Architect",
                expertise: "Mobile Development, AR/VR, Field Assessment",
                experience: "10+ years",
                courses: 4,
                students: 5623,
                rating: 4.7,
                bio: "Pioneer in mobile assessment applications and augmented reality measurement tools.",
              },
              {
                name: "Lisa Thompson",
                title: "Former County Assessor",
                expertise: "Assessment Leadership, Change Management, Operations",
                experience: "20+ years",
                courses: 5,
                students: 3456,
                rating: 4.9,
                bio: "Veteran county assessor with deep expertise in organizational transformation and AI adoption.",
              },
            ].map((instructor /* , index */) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
<>

                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {instructor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div
</>

</>>
<>

                      <div>{instructor.name}</div>
                      <div
</>

className="text-sm text-gray-600">{instructor.title}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
<>

                  <p className="text-sm text-gray-700">{instructor.bio}</p>

                  <div
</>

</>>
<>

                    <div className="text-sm font-medium mb-1">Areas of Expertise</div>
                    <div
</>

className="text-sm text-gray-600">{instructor.expertise}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
<>

                      <div className="font-medium">Experience</div>
                      <div
</>

</>>{instructor.experience}</div>
                    </div>
                    <div>
<>

                      <div className="font-medium">Rating</div>
                      <div
</>

className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{instructor.rating}</span>
                      </div>
                    </div>
                    <div>
<>

                      <div className="font-medium">Courses</div>
                      <div
</>

</>>{instructor.courses}</div>
                    </div>
                    <div>
<>

                      <div className="font-medium">Students</div>
                      <div
</>

</>>{instructor.students.toLocaleString()}</div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    View Instructor Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
