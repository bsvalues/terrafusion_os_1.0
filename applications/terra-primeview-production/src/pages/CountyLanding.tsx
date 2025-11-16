
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Map, Bot, TrendingUp, Shield, Clock, DollarSign, Users, CheckCircle, ArrowRight  } from '@mui/icons-material';
import { Link } from "react-router-dom";

const CountyLanding = () => {
  const stats = [
    { label: "Assessment Accuracy", value: "98.4%", increase: "+12%" },
    { label: "Processing Speed", value: "85%", increase: "faster" },
    { label: "Cost Reduction", value: "67%", increase: "savings" },
    { label: "Compliance Rate", value: "99.7%", increase: "+8%" }
  ];

  const features = [
    {
      icon: Bot,
      title: "15+ Specialized AI Agents",
      description: "Purpose-built agents for land valuation, sales validation, compliance monitoring, and more."
    },
    {
      icon: Map,
      title: "Full GIS Integration",
      description: "Seamless integration with existing GIS systems and spatial analysis capabilities."
    },
    {
      icon: Shield,
      title: "State Compliance Guarantee",
      description: "Automated compliance monitoring for all state regulations and DOR requirements."
    },
    {
      icon: Clock,
      title: "Real-time Processing",
      description: "Instant analysis and validation with continuous monitoring and updates."
    },
    {
      icon: DollarSign,
      title: "ROI in 6 Months",
      description: "Proven track record of rapid return on investment through efficiency gains."
    },
    {
      icon: Users,
      title: "Legacy System Support",
      description: "Works with ProVal, CAMA systems, and existing county infrastructure."
    }
  ];

  const testimonials = [
    {
      quote: "Terrafusion reduced our assessment processing time by 80% while improving accuracy.",
      author: "County Assessor",
      location: "Benton County, OR"
    },
    {
      quote: "The AI agents caught compliance issues we would have missed, saving us from audit problems.",
      author: "Chief Deputy Assessor", 
      location: "Marion County, OR"
    },
    {
      quote: "Implementation was seamless. Our staff adapted quickly and loves the efficiency gains.",
      author: "IT Director",
      location: "Washington County, OR"
    }
  ];

  return (  
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Suite
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center"><>

                  <Map className="w-5 h-5 text-white" />
                </div>
                <div
</>><>

                  <h1 className="text-lg font-bold text-white">Terrafusion</h1>
                  <p
</> className="text-cyan-400 text-xs">AI That Understands Land</p>
                </div>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
              Schedule Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto"><>

          <Badge variant="secondary" className="mb-6 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            Revolutionary AI Technology
          </Badge>
          <h1
</> className="text-5xl md:text-6xl font-bold text-white mb-6">
            Transform Your
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {" "}Assessment Operations
            </span>
          </h1><>

          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Terrafusion brings enterprise-grade AI to property assessment, delivering unprecedented 
            accuracy, efficiency, and compliance while seamlessly integrating with your existing systems.
          </p>
          
          <div
</> className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8">
              Get Started Today<>

              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
</> size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">
              Watch Demo Video
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 border-t border-white/10">
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat /* , index */) => (
            <div key={index} className="text-center"><>

              <div className="text-4xl font-bold text-cyan-400 mb-2">{stat.value}</div>
              <div
</> className="text-white font-semibold mb-1">{stat.label}</div>
              <div className="text-green-400 text-sm">{stat.increase}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16"><>

          <h2 className="text-4xl font-bold text-white mb-4">Comprehensive AI Platform</h2>
          <p
</> className="text-slate-300 text-lg max-w-2xl mx-auto">
            Every component designed specifically for property assessment workflows and county operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature /* , index */) => (
            <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><>

                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle
</> className="text-white text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 bg-black/20">
        <div className="text-center mb-16"><>

          <h2 className="text-4xl font-bold text-white mb-4">Trusted by Leading Counties</h2>
          <p
</> className="text-slate-300 text-lg">
            Join the growing number of counties revolutionizing their assessment operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial /* , index */) => (
            <Card key={index} className="bg-white/5 border-white/10">
              <CardContent className="p-6"><>

                <p className="text-white italic mb-4 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div
</> className="border-t border-white/10 pt-4"><>

                  <p className="text-cyan-400 font-semibold">{testimonial.author}</p>
                  <p
</> className="text-slate-400 text-sm">{testimonial.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Implementation Process */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16"><>

          <h2 className="text-4xl font-bold text-white mb-4">Seamless Implementation</h2>
          <p
</> className="text-slate-300 text-lg">
            From setup to full deployment in weeks, not months
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Assessment & Planning", desc: "We analyze your current systems and create a custom implementation plan" },
            { step: "2", title: "Data Integration", desc: "Seamless connection to your existing CAMA, GIS, and legacy systems" },
            { step: "3", title: "AI Training", desc: "Agents are trained on your specific data and assessment practices" },
            { step: "4", title: "Go Live", desc: "Full deployment with ongoing support and continuous optimization" }
          ].map((phase /* , index */) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">{phase.step}</span>
              </div><>

              <h3 className="text-white font-semibold text-lg mb-2">{phase.title}</h3>
              <p
</> className="text-slate-300 text-sm leading-relaxed">{phase.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="container mx-auto px-4 py-20 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12"><>

            <h2 className="text-4xl font-bold text-white mb-4">Calculate Your ROI</h2>
            <p
</> className="text-slate-300 text-lg">
              See how Terrafusion can transform your assessment operations
            </p>
          </div>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div><>

                  <h3 className="text-white text-xl font-semibold mb-4">Current Challenges</h3>
                  <ul
</> className="space-y-3">
                    {[
                      "Manual assessment processes",
                      "Compliance monitoring overhead", 
                      "Data quality issues",
                      "Limited analytical capabilities",
                      "Staff productivity constraints"
                    ].map((challenge /* , index */) => (
                      <li key={index} className="flex items-center text-slate-300">
                        <div className="w-2 h-2 bg-red-400 rounded-full mr-3" />
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
                <div><>

                  <h3 className="text-white text-xl font-semibold mb-4">Terrafusion Benefits</h3>
                  <ul
</> className="space-y-3">
                    {[
                      "85% faster processing speed",
                      "Automated compliance monitoring",
                      "98.4% assessment accuracy",
                      "Real-time analytics and insights",
                      "3x staff productivity increase"
                    ].map((benefit /* , index */) => (
                      <li key={index} className="flex items-center text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
                <div className="text-center"><>

                  <h4 className="text-2xl font-bold text-cyan-400 mb-2">Average ROI: 340%</h4>
                  <p
</> className="text-white">Typical payback period: 6-8 months</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto"><>

          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Assessment Operations?
          </h2>
          <p
</> className="text-xl text-slate-300 mb-8">
            Join the leading counties already using Terrafusion to revolutionize their property assessment workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8">
              Schedule Your Demo<>

              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
</> size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">
              Download Case Studies
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center"><>

                  <Map className="w-6 h-6 text-white" />
                </div>
                <div
</>><>

                  <h3 className="text-xl font-bold text-white">Terrafusion</h3>
                  <p
</> className="text-cyan-400 text-sm">AI That Understands Land</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4">
                Revolutionary AI platform transforming property assessment operations across the nation.
              </p>
            </div>
            <div><>

              <h4 className="text-white font-semibold mb-4">Solutions</h4>
              <ul
</> className="space-y-2 text-slate-300"><>

                <li>Property Assessment</li>
                            <li
</>>Compliance Monitoring</li><>

                <li>GIS Integration</li>
                            <li
</>>Legacy System Support</li>
              </ul>
            </div>
            <div><>

              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul
</> className="space-y-2 text-slate-300"><>

                <li>Implementation</li>
                            <li
</>>Training</li><>

                <li>24/7 Support</li>
                            <li
</>>Documentation</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 Terrafusion Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CountyLanding;
