
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Zap, Globe, Activity  } from '@mui/icons-material';
import { Link } from "react-router-dom";
import TerraFusionPanel from "@/components/TerraFusionPanel";

const TerraFusionDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
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
              <div>
                <h1 className="text-xl font-bold text-white flex items-center"><>

                  <Shield className="w-6 h-6 mr-2 text-cyan-400" />
                  Terrafusion Platform
                </h1>
                <p
</> className="text-sm text-slate-300">Omniscient Civil Infrastructure Brain</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30"><>

                <Zap className="w-3 h-3 mr-1" />
                Tesla Precision
              </Badge>
              <Badge
</> variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30"><>

                <Globe className="w-3 h-3 mr-1" />
                Musk Scale
              </Badge>
              <Badge
</> variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <Activity className="w-3 h-3 mr-1" />
                Divine Operations
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
            <CardHeader><>

              <CardTitle className="text-white text-2xl">
                Welcome to Terrafusion Platform
              </CardTitle>
              <CardDescription
</> className="text-slate-300 text-lg">
                Engineered with Tesla precision, Jobs elegance, Musk scale, and Brady/Belichick tactical excellence.
                Your omniscient civil infrastructure brain is ready for divine operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-cyan-400" /><>

                  <h3 className="text-white font-semibold">Security First</h3>
                  <p
</> className="text-slate-400 text-sm">ICSF secure simulation kernel integration</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" /><>

                  <h3 className="text-white font-semibold">Real-Time Processing</h3>
                  <p
</> className="text-slate-400 text-sm">Tesla-grade autonomous precision</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-blue-400" /><>

                  <h3 className="text-white font-semibold">Global Scale</h3>
                  <p
</> className="text-slate-400 text-sm">Musk-scale infrastructure management</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TerraFusionPanel />
      </div>
    </div>
  );
};

export default TerraFusionDashboard;
