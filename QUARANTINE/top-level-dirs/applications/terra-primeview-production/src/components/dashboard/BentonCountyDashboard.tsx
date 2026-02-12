
import React, { useState } from "react";
import { useCounties } from "@/hooks/useCounties";
import { PropertySearchEnhanced } from "@/components/property/PropertySearchEnhanced";
import { WashingtonStateCompliance } from "@/components/analytics/WashingtonStateCompliance";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Search, BarChart3, Shield, MapPin, ExternalLink  } from '@mui/icons-material';

export const BentonCountyDashboard: React.FC = () => {
  const { data: counties } = useCounties();
  const bentonCounty = counties?.find(county => county.fips_code === "53005");

  if (!bentonCounty) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-8">
          <div className="text-center text-slate-300">
            <Building className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>Benton County data is being loaded...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const assessorInfo = bentonCounty.contact_info && typeof bentonCounty.contact_info === 'object' 
    ? (bentonCounty.contact_info as any).assessor_office 
    : null;

  const businessHours = bentonCounty.contact_info && typeof bentonCounty.contact_info === 'object' 
    ? (bentonCounty.contact_info as any).business_hours 
    : null;

  return (
    <div className="space-y-6">
      {/* County Header */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white flex items-center"><>

                <Building className="w-6 h-6 mr-3 text-cyan-400" />
                {bentonCounty.name}, {bentonCounty.state}
              </CardTitle>
              <p
</> className="text-slate-300 mt-1">
                Advanced Property Assessment & Management System
              </p>
            </div>
            <div className="text-right"><>

              <Badge variant="secondary" className="bg-green-500/20 text-green-300 mb-2">
                {bentonCounty.assessment_cycle} Assessment
              </Badge>
              <p
</> className="text-slate-400 text-sm">FIPS: {bentonCounty.fips_code}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {assessorInfo && (
              <div>
                <h3 className="text-white font-medium mb-2 flex items-center"><>

                  <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
                  Assessor Office
                </h3>
                <div
</> className="space-y-1 text-sm"><>

                  <p className="text-slate-300 font-medium">{assessorInfo.name}</p>
                  <p
</> className="text-slate-400">{assessorInfo.address}</p><>

                  <p className="text-slate-400">{assessorInfo.phone}</p>
                  <p
</> className="text-slate-400">{assessorInfo.email}</p>
                  {assessorInfo.website && (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-cyan-400 hover:text-cyan-300"
                      onClick={() => window.open(assessorInfo.website, '_blank')}
                    >
                      Visit Website <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {businessHours && (
              <div><>

                <h3 className="text-white font-medium mb-2">Office Hours</h3>
                <div
</> className="space-y-1 text-sm"><>

                  <p className="text-slate-300">
                    Monday - Friday: {businessHours.monday_friday}
                  </p>
                  <p
</> className="text-slate-400">
                    Timezone: {businessHours.timezone}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/10">
          <TabsTrigger value="search" className="text-white data-[state=active]:bg-cyan-500/20"><>

            <Search className="w-4 h-4 mr-2" />
            Property Search
          </TabsTrigger>
          <TabsTrigger
</> value="analytics" className="text-white data-[state=active]:bg-cyan-500/20"><>

            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
</> value="compliance" className="text-white data-[state=active]:bg-cyan-500/20"><>

            <Shield className="w-4 h-4 mr-2" />
            WA Compliance
          </TabsTrigger>
          <TabsTrigger
</> value="overview" className="text-white data-[state=active]:bg-cyan-500/20">
            <Building className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6"><>

          <PropertySearchEnhanced />
        </TabsContent>

        <TabsContent
</> value="analytics" className="mt-6"><>

          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent
</> value="compliance" className="mt-6"><>

          <WashingtonStateCompliance countyId={bentonCounty.id} />
        </TabsContent>

        <TabsContent
</> value="overview" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Assessment Practices</CardTitle>
              </CardHeader>
              <CardContent>
                {bentonCounty.configuration && typeof bentonCounty.configuration === 'object' && (
                  <div className="space-y-3 text-sm">
                    {(bentonCounty.configuration as any).assessment_practices && (
                      <>
                        <div className="flex justify-between"><>

                          <span className="text-slate-400">Revaluation Cycle:</span>
                          <span
</> className="text-slate-300">
                            {(bentonCounty.configuration as any).assessment_practices.revaluation_cycle}
                          </span>
                        </div>
                        <div className="flex justify-between"><>

                          <span className="text-slate-400">Assessment Date:</span>
                          <span
</> className="text-slate-300">
                            {(bentonCounty.configuration as any).assessment_practices.assessment_date}
                          </span>
                        </div>
                        <div className="flex justify-between"><>

                          <span className="text-slate-400">Market Value Standard:</span>
                          <span
</> className="text-slate-300">
                            {(bentonCounty.configuration as any).assessment_practices.market_value_standard}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">AI Assessment Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {bentonCounty.configuration && typeof bentonCounty.configuration === 'object' && (
                  <div className="space-y-3 text-sm">
                    {(bentonCounty.configuration as any).ai_assessment_settings && (
                      <>
                        <div className="flex justify-between"><>

                          <span className="text-slate-400">Confidence Threshold:</span>
                          <span
</> className="text-slate-300">
                            {((bentonCounty.configuration as any).ai_assessment_settings.confidence_threshold * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between"><>

                          <span className="text-slate-400">Auto Approval:</span>
                          <span
</> className="text-slate-300">
                            {((bentonCounty.configuration as any).ai_assessment_settings.auto_approval_threshold * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between"><>

                          <span className="text-slate-400">Market Radius:</span>
                          <span
</> className="text-slate-300">
                            {(bentonCounty.configuration as any).ai_assessment_settings.market_analysis_radius_miles} miles
                          </span>
                        </div>
                        <div className="flex justify-between"><>

                          <span className="text-slate-400">Sales Timeframe:</span>
                          <span
</> className="text-slate-300">
                            {(bentonCounty.configuration as any).ai_assessment_settings.comparable_sales_timeframe_months} months
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
