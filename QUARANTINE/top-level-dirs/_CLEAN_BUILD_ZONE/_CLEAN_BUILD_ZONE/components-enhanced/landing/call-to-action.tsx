import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, Download, Play  } from '@mui/icons-material'

export function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-br from-tf-dark via-tf-dark-lighter to-tf-dark text-tf-light">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8"><>

          <Badge variant="secondary" className="bg-tf-transcend/20 text-tf-transcend border-tf-transcend/30">
            Limited Pioneer Program
          </Badge>

          <div
</>
className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-heading font-bold">
              Ready to <span className="text-tf-transcend">Transcend</span>?
            </h2>
            <p className="text-xl text-tf-light/80 max-w-2xl mx-auto leading-relaxed">
              Join the first wave of counties transforming government operations. Your journey to clarity begins with a
              single decision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <Card className="bg-tf-dark-lighter border-tf-primary/20 transcend-glow">
              <CardContent className="p-6 text-center space-y-4">
                <Play className="w-8 h-8 text-tf-primary mx-auto" /><>

                <h3 className="font-heading font-semibold text-tf-light">Live Demo</h3>
                <p
</>
className="text-sm text-tf-light/70">See Terrafusion in action</p>
                <Button className="w-full bg-tf-primary hover:bg-tf-primary-dark">Watch Demo</Button>
              </CardContent>
            </Card>

            <Card className="bg-tf-dark-lighter border-tf-accent/20 transcend-glow">
              <CardContent className="p-6 text-center space-y-4">
                <Calendar className="w-8 h-8 text-tf-accent mx-auto" /><>

                <h3 className="font-heading font-semibold text-tf-light">Executive Briefing</h3>
                <p
</>
className="text-sm text-tf-light/70">30-minute strategic overview</p>
                <Button className="w-full bg-tf-accent hover:bg-tf-accent-dark text-tf-dark">Schedule Now</Button>
              </CardContent>
            </Card>

            <Card className="bg-tf-dark-lighter border-tf-transcend/20 transcend-glow">
              <CardContent className="p-6 text-center space-y-4">
                <Download className="w-8 h-8 text-tf-transcend mx-auto" /><>

                <h3 className="font-heading font-semibold text-tf-light">ROI Calculator</h3>
                <p
</>
className="text-sm text-tf-light/70">Calculate your savings</p>
                <Button
                  variant="outline"
                  className="w-full border-tf-transcend text-tf-transcend hover:bg-tf-transcend hover:text-tf-dark bg-transparent"
                >
                  Download Free
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Button
              size="lg"
              className="bg-tf-transcend hover:bg-tf-transcend/90 text-tf-dark px-12 py-4 text-xl font-semibold transcend-glow"
            >
              Begin Your Transcendence<>

              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div
</>
className="flex flex-wrap justify-center gap-8 text-sm text-tf-light/60"><>

              <span>✓ No long-term contracts</span>
              <span
</>
</>>✓ 30-day pilot program</span><>

              <span>✓ Full support included</span>
              <span
</>
</>>✓ SOC 2 Type II compliant</span>
            </div>
          </div>

          <div className="border-t border-tf-primary/20 pt-8 mt-12">
            <p className="text-lg text-tf-transcend font-medium">"The future starts here. Government. Transcended."</p>
          </div>
        </div>
      </div>
    </section>
  )
}
