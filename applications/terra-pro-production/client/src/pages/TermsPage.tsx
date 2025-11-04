import { TooltipTerm } from "../components/ui/tooltip-term";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const TermsPage = () => {
  const [context, setContext] = useState<string>("appraisal");

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div><>

          <h1 className="text-3xl font-bold">Real Estate Terminology</h1>
          <p
</> className="text-muted-foreground">
            Hover over any highlighted term to see its definition
          </p>
        </div>
        <div className="space-x-2"><>

          <Button
            variant={context === "appraisal" ? "default" : "outline"}
            onClick={() => setContext("appraisal")}
          >
            Appraisal Context
          </Button>
          <Button
</>
            variant={context === "lending" ? "default" : "outline"}
            onClick={() => setContext("lending")}
          >
            Lending Context
          </Button>
          <Button
            variant={context === "legal" ? "default" : "outline"}
            onClick={() => setContext("legal")}
          >
            Legal Context
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><>

          <CardTitle>Sample Appraisal Report Section</CardTitle>
          <CardDescription
</>>With context-aware tooltips for real estate terminology</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none"><>

            <h3>Valuation Approach</h3>
            <p
</>>
              The{" "}
              <TooltipTerm term="Sales Comparison Approach" context={context}>
                sales comparison approach
              </TooltipTerm>{" "}
              was utilized as the primary valuation method for this single-family residence. The
              subject property's
              <TooltipTerm term="Market Value" context={context}>
                market value
              </TooltipTerm>{" "}
              was determined by analyzing five
              <TooltipTerm term="Comparable Properties" context={context}>
                comparable properties
              </TooltipTerm>{" "}
              that have recently sold within the subject's neighborhood.
            </p>

            <p>
              Each comparable required various{" "}
              <TooltipTerm term="Adjustments" context={context}>
                adjustments
              </TooltipTerm>{" "}
              for differences in characteristics such as{" "}
              <TooltipTerm term="GLA" context={context}>
                GLA
              </TooltipTerm>
              , lot size, age, condition, and amenities. The{" "}
              <TooltipTerm term="Adjusted Sale Price" context={context}>
                adjusted sale prices
              </TooltipTerm>
              of the comparables range from $425,000 to $465,000, providing a reasonable range of
              value for the subject.
            </p>

            <p>
              The property shows no evidence of{" "}
              <TooltipTerm term="External Obsolescence" context={context}>
                external obsolescence
              </TooltipTerm>
              , although there is minor{" "}
              <TooltipTerm term="Physical Depreciation" context={context}>
                physical depreciation
              </TooltipTerm>{" "}
              consistent with the property's age. The{" "}
              <TooltipTerm term="Highest and Best Use" context={context}>
                highest and best use
              </TooltipTerm>{" "}
              of the property as improved is its current use as a single-family residence.
            </p><>


            <h3>Market Conditions</h3>
            <p
</>>
              Analysis of the local{" "}
              <TooltipTerm term="Real Estate Cycle" context={context}>
                real estate cycle
              </TooltipTerm>{" "}
              indicates a stable market with moderate appreciation over the past 12 months. The
              average{" "}
              <TooltipTerm term="DOM" context={context}>
                days on market
              </TooltipTerm>{" "}
              for comparable properties is 24 days, indicating strong demand.{" "}
              <TooltipTerm term="REO" context={context}>
                REO
              </TooltipTerm>{" "}
              sales are minimal in this market, and there are no{" "}
              <TooltipTerm term="Stigma" context={context}>
                stigma
              </TooltipTerm>{" "}
              issues affecting the subject property's value.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" /><>


      <h2 className="text-2xl font-bold mb-4">Common Real Estate Terms</h2>
      <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commonTerms.map((term /* , index */) => (
          <Card key={index} className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                <TooltipTerm term={term} context={context}>
                  {term}
                </TooltipTerm>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

const commonTerms = [
  "Capitalization Rate",
  "Gross Rent Multiplier",
  "Net Operating Income",
  "Fee Simple",
  "Leasehold Estate",
  "Easement",
  "Eminent Domain",
  "Escheat",
  "Riparian Rights",
  "Littoral Rights",
  "Encroachment",
  "Encumbrance",
  "Mortgage",
  "Deed of Trust",
  "Lien",
  "Subordination",
  "Amortization",
  "Loan-to-Value Ratio",
  "Points",
  "PITI",
  "Usury",
  "Hazard Insurance",
  "Market Value",
  "Fair Market Value",
  "Assessed Value",
  "Appraised Value",
];

export default TermsPage;
