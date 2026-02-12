import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Property } from "@shared/schema";

interface PropertyCharacteristicsCardProps {
  property: Property;
  onPropertyChange: (property: Partial<Property>) => void;
}

export default function PropertyCharacteristicsCard({
  property,
  onPropertyChange,
}: PropertyCharacteristicsCardProps) {
  const handleChange = useCallback(
    (field: keyof Property, value: any) => {
      onPropertyChange({ [field]: value });
    },
    [onPropertyChange]
  );

  const propertyTypes = [
    "Single-Family Detached",
    "Condominium",
    "Townhouse",
    "Multi-Family",
    "Cooperative",
    "Planned Unit Development (PUD)",
    "Manufactured Home",
    "Modular Home",
  ];

  const basementOptions = [
    "None",
    "Partial",
    "Full",
    "Finished",
    "Partially Finished",
    "Walkout",
    "Daylight",
  ];

  const garageOptions = [
    "None",
    "1-Car",
    "2-Car",
    "3-Car",
    "4+ Car",
    "Carport",
    "Detached",
    "Attached",
    "Built-In",
  ];

  return (
    <Card className="bg-white rounded-md shadow-sm mb-6">
      <div className="draggable-panel-header p-4 border-b border-neutral-medium bg-neutral-light flex justify-between items-center"><>

        <h3 className="font-medium">Property Characteristics</h3>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">
              Property Type
            </Label>
            <Select
</>
              value={property.propertyType || ""}
              onValueChange={(value) => handleChange("propertyType", value)}
            >
              <SelectTrigger className="w-full"><>

                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent
</>>
                {propertyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">Year Built</Label>
            <Input
</>
              type="number"
              value={property.yearBuilt?.toString() || ""}
              onChange={(e) => handleChange("yearBuilt", parseInt(e.target.value))}
              className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">
              Effective Age
            </Label>
            <Input
</>
              type="number"
              value={property.effectiveAge?.toString() || ""}
              onChange={(e) => handleChange("effectiveAge", parseInt(e.target.value))}
              className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">
              Gross Living Area (sq ft)
            </Label>
            <Input
</>
              type="number"
              value={property.grossLivingArea?.toString() || ""}
              onChange={(e) => handleChange("grossLivingArea", parseFloat(e.target.value))}
              className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">
              Lot Size (sq ft)
            </Label>
            <Input
</>
              type="number"
              value={property.lotSize?.toString() || ""}
              onChange={(e) => handleChange("lotSize", parseFloat(e.target.value))}
              className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">Bedrooms</Label>
            <Input
</>
              type="number"
              value={property.bedrooms?.toString() || ""}
              onChange={(e) => handleChange("bedrooms", parseFloat(e.target.value))}
              className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">Bathrooms</Label>
            <Input
</>
              type="number"
              step="0.5"
              value={property.bathrooms?.toString() || ""}
              onChange={(e) => handleChange("bathrooms", parseFloat(e.target.value))}
              className="w-full border border-neutral-medium rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">Basement</Label>
            <Select
</>
              value={property.basement || ""}
              onValueChange={(value) => handleChange("basement", value)}
            >
              <SelectTrigger className="w-full"><>

                <SelectValue placeholder="Select basement type" />
              </SelectTrigger>
              <SelectContent
</>>
                {basementOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">Garage</Label>
            <Select
</>
              value={property.garage || ""}
              onValueChange={(value) => handleChange("garage", value)}
            >
              <SelectTrigger className="w-full"><>

                <SelectValue placeholder="Select garage type" />
              </SelectTrigger>
              <SelectContent
</>>
                {garageOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
