
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Camera  } from '@mui/icons-material';
import type { Property } from "@/hooks/useProperty";
import { useAssessmentHistory } from "@/hooks/useProperty";

interface PropertyDetailsProps {
  property: Property & {
    counties: { name: string; state: string; fips_code: string } | null;
    property_owners: Array<{
      owner_name: string;
      owner_type: string;
      primary_owner: boolean;
      percentage_owned: number;
    }>;
  };
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const { data: assessmentHistory } = useAssessmentHistory(property.id);
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const primaryOwner = property.property_owners?.find(owner => owner.primary_owner);

  return (
    <>
      {/* Property Header */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><>

              <CardTitle className="text-white text-2xl">Parcel {property.parcel_id}</CardTitle>
              <div
</> className="text-slate-300 text-lg flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {property.address}
              </div>
              {property.counties && (
                <div className="text-slate-400 text-sm mt-1">
                  {property.counties.name}, {property.counties.state}
                </div>
              )}
            </div>
            <div className="text-right"><>

              <div className="text-3xl font-bold text-cyan-400">
                {formatCurrency(property.assessed_value)}
              </div>
              <div
</> className="text-slate-300">Total Assessed Value</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Property Details Tabs */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10"><>

              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-cyan-500/20">Overview</TabsTrigger>
              <TabsTrigger
</> value="improvements" className="text-white data-[state=active]:bg-cyan-500/20">Improvements</TabsTrigger><>

              <TabsTrigger value="land" className="text-white data-[state=active]:bg-cyan-500/20">Land</TabsTrigger>
              <TabsTrigger
</> value="history" className="text-white data-[state=active]:bg-cyan-500/20">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Owner:</span>
                    <span
</> className="text-white font-semibold">{primaryOwner?.owner_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Year Built:</span>
                    <span
</> className="text-white">{property.year_built || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Square Feet:</span>
                    <span
</> className="text-white">{property.square_feet?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Acres:</span>
                    <span
</> className="text-white">{property.lot_size_acres || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Land Value:</span>
                    <span
</> className="text-cyan-400 font-semibold">{formatCurrency(property.land_value)}</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Improvement Value:</span>
                    <span
</> className="text-cyan-400 font-semibold">{formatCurrency(property.improvement_value)}</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Zoning:</span>
                    <span
</> className="text-white">{property.zoning || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span className="text-slate-300">Property Type:</span>
                    <span
</> className="text-white">{property.property_type}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="improvements" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span className="text-white">Building Photos & Sketches</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-white/10 rounded border border-white/20 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-slate-400" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2"><>

                  <p className="text-slate-300">Building Features:</p>
                  <ul
</> className="text-white space-y-1 text-sm">
                    <li>• Property Type: {property.property_type}</li>
                    {property.square_feet && <li>• {property.square_feet.toLocaleString()} square feet</li>}
                    {property.year_built && <li>• Built in {property.year_built}</li>}
                    <li>• Improvement Value: {formatCurrency(property.improvement_value)}</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="land" className="mt-4">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><>

                    <p className="text-slate-300 mb-2">Land Characteristics:</p>
                    <ul
</> className="text-white space-y-1 text-sm"><>

                      <li>• Total Area: {property.lot_size_acres || 'N/A'} acres</li>
                            <li
</>>• Zoning: {property.zoning || 'N/A'}</li>
                      <li>• Land Value: {formatCurrency(property.land_value)}</li>
                      {property.legal_description && <li>• Legal: {property.legal_description}</li>}
                    </ul>
                  </div>
                  <div><>

                    <p className="text-slate-300 mb-2">Assessment Info:</p>
                    <ul
</> className="text-white space-y-1 text-sm"><>

                      <li>• Last Assessment: {new Date(property.last_assessment_date).toLocaleDateString()}</li>
                            <li
</>>• Next Due: {new Date(property.next_assessment_due).toLocaleDateString()}</li>
                      <li>• Property ID: {property.id.substring(0, 8)}...</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                {assessmentHistory?.map((assessment /* , index */) => (
                  <div key={assessment.id} className={`border-l-2 ${index === 0 ? 'border-cyan-400' : 'border-slate-400'} pl-4`}><>

                    <p className="text-white font-semibold">
                      {new Date(assessment.assessment_date).getFullYear()} Assessment
                    </p>
                    <p
</> className="text-slate-300 text-sm">
                      {formatCurrency(assessment.assessed_value)} - {assessment.assessment_method}
                      {assessment.ai_confidence_score && ` (${Math.round(assessment.ai_confidence_score * 100)}% confidence)`}
                    </p>
                    {assessment.notes && (
                      <p className="text-slate-400 text-xs mt-1">{assessment.notes}</p>
                    )}
                  </div>
                )) || (
                  <div className="text-slate-400 text-center py-4">
                    No assessment history available
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
