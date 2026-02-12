
import React from "react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, FileText, Calculator, Users, Gavel  } from '@mui/icons-material';

interface WashingtonStateComplianceProps {
  countyId: string;
}

export const WashingtonStateCompliance: React.FC<WashingtonStateComplianceProps> = ({
  countyId
}) => {
  const { data: assessmentStandards } = useSystemConfig(countyId, "assessment_standards");
  const { data: exemptions } = useSystemConfig(countyId, "exemptions");

  const rcwCompliance = assessmentStandards?.find(
    config => config.config_key === "washington_rcw_compliance"
  );

  const marketValueDef = assessmentStandards?.find(
    config => config.config_key === "market_value_definition"
  );

  const seniorExemption = exemptions?.find(
    config => config.config_key === "senior_citizen_exemption"
  );

  const veteranExemption = exemptions?.find(
    config => config.config_key === "disabled_veteran_exemption"
  );

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-green-400" />
          Washington State Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RCW Compliance */}
        {rcwCompliance && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-200 font-medium flex items-center"><>

                <FileText className="w-4 h-4 mr-2 text-blue-400" />
                RCW 84.40 Compliance
              </h3>
              <Badge
</> variant="secondary" className="bg-green-500/20 text-green-300">
                Active
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><>

                <p className="text-slate-400">RCW 84.40</p>
                <p
</> className="text-slate-300">
                  {(rcwCompliance.config_value as any)?.rcw_84_40 ? "Compliant" : "Non-Compliant"}
                </p>
              </div>
              <div><>

                <p className="text-slate-400">DOR Guidelines</p>
                <p
</> className="text-slate-300">
                  {(rcwCompliance.config_value as any)?.dor_guidelines ? "Following" : "Not Following"}
                </p>
              </div>
              <div><>

                <p className="text-slate-400">Appraisal Standards</p>
                <p
</> className="text-slate-300">
                  {(rcwCompliance.config_value as any)?.appraisal_standards || "USPAP"}
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Market Value Definition */}
        {marketValueDef && (
          <div>
            <h3 className="text-slate-200 font-medium mb-3 flex items-center"><>

              <Calculator className="w-4 h-4 mr-2 text-purple-400" />
              Fair Market Value Standard
            </h3>
            <div
</> className="bg-white/5 rounded p-3">
              <p className="text-slate-300 text-sm">
                {(marketValueDef.config_value as any)?.definition}
              </p>
            </div>
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Tax Exemptions */}
        <div>
          <h3 className="text-slate-200 font-medium mb-4 flex items-center"><>

            <Users className="w-4 h-4 mr-2 text-orange-400" />
            Available Tax Exemptions
          </h3>
          
          <div
</> className="space-y-4">
            {seniorExemption && (
              <div className="bg-white/5 rounded p-3">
                <div className="flex items-center justify-between mb-2"><>

                  <h4 className="text-slate-300 font-medium">Senior Citizen Exemption</h4>
                  <Badge
</> variant="outline" className="border-green-400 text-green-300">
                    {(seniorExemption.config_value as any)?.enabled ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><>

                    <p className="text-slate-400">Minimum Age</p>
                    <p
</> className="text-slate-300">
                      {(seniorExemption.config_value as any)?.age_requirement} years
                    </p>
                  </div>
                  <div><>

                    <p className="text-slate-400">Income Threshold</p>
                    <p
</> className="text-slate-300">
                      ${(seniorExemption.config_value as any)?.income_threshold?.toLocaleString()}
                    </p>
                  </div>
                  <div><>

                    <p className="text-slate-400">Max Exemption</p>
                    <p
</> className="text-slate-300">
                      ${(seniorExemption.config_value as any)?.max_exemption?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {veteranExemption && (
              <div className="bg-white/5 rounded p-3">
                <div className="flex items-center justify-between mb-2"><>

                  <h4 className="text-slate-300 font-medium">Disabled Veteran Exemption</h4>
                  <Badge
</> variant="outline" className="border-blue-400 text-blue-300">
                    {(veteranExemption.config_value as any)?.enabled ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><>

                    <p className="text-slate-400">Disability Rating Required</p>
                    <p
</> className="text-slate-300">
                      {(veteranExemption.config_value as any)?.disability_rating_required}%
                    </p>
                  </div>
                  <div><>

                    <p className="text-slate-400">Max Exemption</p>
                    <p
</> className="text-slate-300">
                      {(veteranExemption.config_value as any)?.max_exemption}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
