
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter  } from '@mui/icons-material';
import { SearchCriteria } from "./PropertySearch";
import { useNeighborhoods } from "@/hooks/useNeighborhoods";

interface SearchFiltersProps {
  criteria: SearchCriteria;
  onCriteriaChange: (criteria: SearchCriteria) => void;
  onClose: () => void;
}

export function SearchFilters({ criteria, onCriteriaChange, onClose }: SearchFiltersProps) {
  const { data: neighborhoods } = useNeighborhoods();

  const updateCriteria = (key: keyof SearchCriteria, value: any) => {
    onCriteriaChange({
      ...criteria,
      [key]: value === "" ? undefined : value
    });
  };

  const propertyTypes = [
    { value: "Residential", label: "Residential" },
    { value: "Commercial", label: "Commercial" },
    { value: "Industrial", label: "Industrial" },
    { value: "Agricultural", label: "Agricultural" },
    { value: "Vacant", label: "Vacant Land" },
    { value: "Mixed", label: "Mixed Use" }
  ];

  const assessmentStatuses = [
    { value: "current", label: "Current" },
    { value: "pending", label: "Pending Assessment" },
    { value: "under_review", label: "Under Review" },
    { value: "appealed", label: "Appealed" },
    { value: "overdue", label: "Overdue" }
  ];

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center"><>

            <Filter className="w-5 h-5 mr-2 text-cyan-400" />
            Advanced Search Filters
          </CardTitle>
          <Button
</>
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Property Details */}
          <div className="space-y-4"><>

            <h3 className="text-white font-medium">Property Details</h3>
            
            <div
</>><>

              <Label htmlFor="propertyType" className="text-slate-300">Property Type</Label>
              <Select
</> value={criteria.propertyType || ""} onValueChange={(value) => updateCriteria("propertyType", value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><>

                  <SelectValue placeholder="Any Type" />
                </SelectTrigger>
                <SelectContent
</> className="bg-slate-800 border-white/20">
                  <SelectItem value="">Any Type</SelectItem>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div><>

              <Label htmlFor="neighborhood" className="text-slate-300">Neighborhood</Label>
              <Select
</> value={criteria.neighborhoodId || ""} onValueChange={(value) => updateCriteria("neighborhoodId", value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><>

                  <SelectValue placeholder="Any Neighborhood" />
                </SelectTrigger>
                <SelectContent
</> className="bg-slate-800 border-white/20">
                  <SelectItem value="">Any Neighborhood</SelectItem>
                  {neighborhoods?.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id} className="text-white">
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div><>

              <Label htmlFor="zoning" className="text-slate-300">Zoning</Label>
              <Input
</>
                id="zoning"
                placeholder="e.g. R1, C1, I1"
                value={criteria.zoning || ""}
                onChange={(e) => updateCriteria("zoning", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Value Filters */}
          <div className="space-y-4"><>

            <h3 className="text-white font-medium">Assessment Value</h3>
            
            <div
</> className="grid grid-cols-2 gap-2">
              <div><>

                <Label htmlFor="minValue" className="text-slate-300">Min Value</Label>
                <Input
</>
                  id="minValue"
                  type="number"
                  placeholder="0"
                  value={criteria.minValue || ""}
                  onChange={(e) => updateCriteria("minValue", Number(e.target.value) || undefined)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <div><>

                <Label htmlFor="maxValue" className="text-slate-300">Max Value</Label>
                <Input
</>
                  id="maxValue"
                  type="number"
                  placeholder="No limit"
                  value={criteria.maxValue || ""}
                  onChange={(e) => updateCriteria("maxValue", Number(e.target.value) || undefined)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div><>

              <Label htmlFor="assessmentStatus" className="text-slate-300">Assessment Status</Label>
              <Select
</> value={criteria.assessmentStatus || ""} onValueChange={(value) => updateCriteria("assessmentStatus", value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><>

                  <SelectValue placeholder="Any Status" />
                </SelectTrigger>
                <SelectContent
</> className="bg-slate-800 border-white/20">
                  <SelectItem value="">Any Status</SelectItem>
                  {assessmentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value} className="text-white">
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Property Characteristics */}
          <div className="space-y-4"><>

            <h3 className="text-white font-medium">Property Characteristics</h3>
            
            <div
</> className="grid grid-cols-2 gap-2">
              <div><>

                <Label htmlFor="yearBuiltMin" className="text-slate-300">Built After</Label>
                <Input
</>
                  id="yearBuiltMin"
                  type="number"
                  placeholder="1900"
                  value={criteria.yearBuiltMin || ""}
                  onChange={(e) => updateCriteria("yearBuiltMin", Number(e.target.value) || undefined)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <div><>

                <Label htmlFor="yearBuiltMax" className="text-slate-300">Built Before</Label>
                <Input
</>
                  id="yearBuiltMax"
                  type="number"
                  placeholder="2024"
                  value={criteria.yearBuiltMax || ""}
                  onChange={(e) => updateCriteria("yearBuiltMax", Number(e.target.value) || undefined)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div><>

                <Label htmlFor="minSquareFeet" className="text-slate-300">Min Sq Ft</Label>
                <Input
</>
                  id="minSquareFeet"
                  type="number"
                  placeholder="0"
                  value={criteria.minSquareFeet || ""}
                  onChange={(e) => updateCriteria("minSquareFeet", Number(e.target.value) || undefined)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <div><>

                <Label htmlFor="maxSquareFeet" className="text-slate-300">Max Sq Ft</Label>
                <Input
</>
                  id="maxSquareFeet"
                  type="number"
                  placeholder="No limit"
                  value={criteria.maxSquareFeet || ""}
                  onChange={(e) => updateCriteria("maxSquareFeet", Number(e.target.value) || undefined)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-white/10"><>

          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            Apply Filters
          </Button>
          <Button
</>
            variant="outline"
            onClick={() => onCriteriaChange({})}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
