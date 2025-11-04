import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppraisal } from "@/contexts/AppraisalContext";
import { Property } from "@shared/schema";

interface PropertyAddressCardProps {
  property: Property;
  onPropertyChange: (property: Partial<Property>) => void;
}

export default function PropertyAddressCard({
  property,
  onPropertyChange,
}: PropertyAddressCardProps) {
  const handleChange = useCallback(
    (field: keyof Property, value: any) => {
      onPropertyChange({ [field]: value });
    },
    [onPropertyChange]
  );

  const states = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  return (
    <Card className="bg-white rounded-md shadow-sm mb-6">
      <div className="draggable-panel-header p-4 border-b border-neutral-medium bg-neutral-light flex justify-between items-center"><>

        <h3 className="font-medium">Property Address</h3>
        <div
</> className="flex space-x-2">
          <button
            className="p-1 text-neutral-gray hover:text-neutral-dark"
            title="Expand/collapse panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
              />
            </svg>
          </button>
          <button className="p-1 text-neutral-gray hover:text-neutral-dark" title="More options">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div><>

              <Label className="block text-sm font-medium text-neutral-dark mb-1">
                Street Address
              </Label>
              <Input
</>
                type="text"
                value={property.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div><>

              <Label className="block text-sm font-medium text-neutral-dark mb-1">City</Label>
              <Input
</>
                type="text"
                value={property.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex space-x-4">
              <div className="w-1/2"><>

                <Label className="block text-sm font-medium text-neutral-dark mb-1">State</Label>
                <Select
</>
                  value={property.state || ""}
                  onValueChange={(value) => handleChange("state", value)}
                >
                  <SelectTrigger className="w-full"><>

                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent
</>>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-1/2"><>

                <Label className="block text-sm font-medium text-neutral-dark mb-1">Zip Code</Label>
                <Input
</>
                  type="text"
                  value={property.zipCode || ""}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div><>

              <Label className="block text-sm font-medium text-neutral-dark mb-1">County</Label>
              <Input
</>
                type="text"
                value={property.county || ""}
                onChange={(e) => handleChange("county", e.target.value)}
                className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div><>

              <Label className="block text-sm font-medium text-neutral-dark mb-1">
                Legal Description
              </Label>
              <Textarea
</>
                value={property.legalDescription || ""}
                onChange={(e) => handleChange("legalDescription", e.target.value)}
                className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-24"
              />
            </div>

            <div><>

              <Label className="block text-sm font-medium text-neutral-dark mb-1">
                Tax Parcel ID
              </Label>
              <Input
</>
                type="text"
                value={property.taxParcelId || ""}
                onChange={(e) => handleChange("taxParcelId", e.target.value)}
                className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
