
import React from "react";
import { useCounties } from "@/hooks/useCounties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Building  } from '@mui/icons-material';

interface CountySelectorProps {
  selectedCountyId?: string;
  onCountySelect: (countyId: string) => void;
  className?: string;
}

export const CountySelector: React.FC<CountySelectorProps> = ({
  selectedCountyId,
  onCountySelect,
  className = ""
}) => {
  const { data: counties, isLoading } = useCounties();
  const selectedCounty = counties?.find(c => c.id === selectedCountyId);

  if (isLoading) {
    return (
      <Card className={`bg-white/5 border-white/10 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Building className="w-5 h-5 mr-2 text-cyan-400" />
            Loading Counties...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Building className="w-5 h-5 mr-2 text-cyan-400" />
            Select County
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCountyId} onValueChange={onCountySelect}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white"><>

              <SelectValue placeholder="Choose a county..." />
            </SelectTrigger>
            <SelectContent
</>>
              {counties?.map((county) => (
                <SelectItem key={county.id} value={county.id}>
                  <div className="flex items-center justify-between w-full"><>

                    <span>{county.name}, {county.state}</span>
                    <Badge
</> variant="outline" className="ml-2">
                      {county.assessment_cycle}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCounty && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              {selectedCounty.name}, {selectedCounty.state}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-slate-300">
              <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
              <span>FIPS: {selectedCounty.fips_code}</span>
            </div>
            
            <div className="flex items-center text-slate-300">
              <Clock className="w-4 h-4 mr-2 text-cyan-400" />
              <span>Timezone: {selectedCounty.timezone}</span>
            </div>

            <div className="flex items-center justify-between"><>

              <span className="text-slate-300">Assessment Cycle:</span>
              <Badge
</> variant="secondary" className="bg-green-500/20 text-green-300">
                {selectedCounty.assessment_cycle}
              </Badge>
            </div>

            {selectedCounty.contact_info && typeof selectedCounty.contact_info === 'object' && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-sm text-slate-400 mb-2">Assessor Contact:</p>
                {(selectedCounty.contact_info as any).assessor_office && (
                  <div className="space-y-1 text-sm"><>

                    <p className="text-slate-300 font-medium">
                      {(selectedCounty.contact_info as any).assessor_office.name}
                    </p>
                    <p
</> className="text-slate-400">
                      {(selectedCounty.contact_info as any).assessor_office.phone}
                    </p>
                    <p className="text-slate-400">
                      {(selectedCounty.contact_info as any).assessor_office.email}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
