import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { CheckCircle2, XCircle, Warning  } from '@mui/icons-material';

// Define types for compliance checking
type CheckStatus = "error" | "warning" | "success";

interface ComplianceCheck {
  id: string;
  category: string;
  rule: string;
  status: CheckStatus;
  description: string;
  location: string;
}

// Simple placeholder compliance page
export default function CompliancePage() {
  const demoComplianceChecks: ComplianceCheck[] = [
    {
      id: "uad-1",
      category: "UAD Compliance",
      rule: "Property Condition Rating",
      status: "error",
      description: "Property condition rating must be C1, C2, C3, C4, C5, or C6.",
      location: "Improvements Section, Page 1",
    },
    {
      id: "uad-2",
      category: "UAD Compliance",
      rule: "Quality Rating Format",
      status: "warning",
      description: "Property quality rating should follow Q1-Q6 format per UAD guidelines.",
      location: "Improvements Section, Page 1",
    },
    {
      id: "uad-3",
      category: "UAD Compliance",
      rule: "View Rating",
      status: "success",
      description: "View rating follows required format.",
      location: "Site Section, Page 1",
    },
    {
      id: "gse-1",
      category: "GSE Requirements",
      rule: "Market Conditions",
      status: "error",
      description:
        "Market conditions analysis must include at least three comparable pending sales.",
      location: "Market Conditions Addendum",
    },
    {
      id: "gse-2",
      category: "GSE Requirements",
      rule: "Comparable Sales Distance",
      status: "warning",
      description: "One or more comparable sales exceed recommended distance from subject.",
      location: "Sales Comparison Approach",
    },
    {
      id: "gse-3",
      category: "GSE Requirements",
      rule: "Sales History",
      status: "success",
      description: "Required 3-year sales history for subject property is present.",
      location: "Sales History Section, Page 1",
    },
    {
      id: "form-1",
      category: "Form Completeness",
      rule: "Required Fields",
      status: "success",
      description: "All required fields have been completed.",
      location: "Throughout Form",
    },
    {
      id: "form-2",
      category: "Form Completeness",
      rule: "Signature/Date",
      status: "warning",
      description: "Digital signature date does not match report date.",
      location: "Certification Section",
    },
  ];

  // Count issues by type
  const errorCount = demoComplianceChecks.filter((check) => check.status === "error").length;
  const warningCount = demoComplianceChecks.filter((check) => check.status === "warning").length;
  const successCount = demoComplianceChecks.filter((check) => check.status === "success").length;

  const getIconByStatus = (status: CheckStatus) => {
    switch (status) {
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <Warning className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center"><>

        <h1 className="text-2xl font-bold">Compliance Validation</h1>
        <Button
</>>Run New Validation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span>Critical Issues</span>
            </CardTitle>
          </CardHeader>
          <CardContent><>

            <p className="text-2xl font-bold text-red-700">{errorCount}</p>
            <p
</> className="text-sm text-red-600">Must be resolved before submission</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Warning className="h-5 w-5 text-amber-500 mr-2" />
              <span>Warnings</span>
            </CardTitle>
          </CardHeader>
          <CardContent><>

            <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
            <p
</> className="text-sm text-amber-600">Review recommended</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Passed Checks</span>
            </CardTitle>
          </CardHeader>
          <CardContent><>

            <p className="text-2xl font-bold text-green-700">{successCount}</p>
            <p
</> className="text-sm text-green-600">No action needed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><>

          <CardTitle>Compliance Checks</CardTitle>
          <CardDescription
</>>
            Review and resolve compliance issues to meet UAD and GSE requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="uad"><>

              <AccordionTrigger>UAD Compliance</AccordionTrigger>
              <AccordionContent
</>>
                <div className="space-y-4 mt-2">
                  {demoComplianceChecks
                    .filter((check) => check.category === "UAD Compliance")
                    .map((check) => (
                      <div
                        key={check.id}
                        className={`p-3 rounded-md border flex items-start ${
                          check.status === "error"
                            ? "bg-red-50 border-red-200"
                            : check.status === "warning"
                              ? "bg-amber-50 border-amber-200"
                              : "bg-green-50 border-green-200"
                        }`}
                      ><>

                        <div className="mt-0.5 mr-3">{getIconByStatus(check.status)}</div>
                        <div
</>><>

                          <h3 className="font-medium">{check.rule}</h3>
                          <p
</> className="text-sm text-gray-600">{check.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Location: {check.location}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gse"><>

              <AccordionTrigger>GSE Requirements</AccordionTrigger>
              <AccordionContent
</>>
                <div className="space-y-4 mt-2">
                  {demoComplianceChecks
                    .filter((check) => check.category === "GSE Requirements")
                    .map((check) => (
                      <div
                        key={check.id}
                        className={`p-3 rounded-md border flex items-start ${
                          check.status === "error"
                            ? "bg-red-50 border-red-200"
                            : check.status === "warning"
                              ? "bg-amber-50 border-amber-200"
                              : "bg-green-50 border-green-200"
                        }`}
                      ><>

                        <div className="mt-0.5 mr-3">{getIconByStatus(check.status)}</div>
                        <div
</>><>

                          <h3 className="font-medium">{check.rule}</h3>
                          <p
</> className="text-sm text-gray-600">{check.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Location: {check.location}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="form"><>

              <AccordionTrigger>Form Completeness</AccordionTrigger>
              <AccordionContent
</>>
                <div className="space-y-4 mt-2">
                  {demoComplianceChecks
                    .filter((check) => check.category === "Form Completeness")
                    .map((check) => (
                      <div
                        key={check.id}
                        className={`p-3 rounded-md border flex items-start ${
                          check.status === "error"
                            ? "bg-red-50 border-red-200"
                            : check.status === "warning"
                              ? "bg-amber-50 border-amber-200"
                              : "bg-green-50 border-green-200"
                        }`}
                      ><>

                        <div className="mt-0.5 mr-3">{getIconByStatus(check.status)}</div>
                        <div
</>><>

                          <h3 className="font-medium">{check.rule}</h3>
                          <p
</> className="text-sm text-gray-600">{check.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Location: {check.location}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
