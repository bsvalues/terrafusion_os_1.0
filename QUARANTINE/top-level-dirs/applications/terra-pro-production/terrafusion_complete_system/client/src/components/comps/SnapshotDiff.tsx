import { ComparableSnapshot } from "@shared/types/comps";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Refresh, Circle  } from '@mui/icons-material';
import { useEffect, useState } from "react";

interface SnapshotDiffProps {
  baseSnapshot: ComparableSnapshot;
  compareSnapshot: ComparableSnapshot;
}

type DiffType = "added" | "removed" | "changed" | "unchanged";

interface FieldDiff {
  key: string;
  diffType: DiffType;
  baseValue: any;
  compareValue: any;
}

export function SnapshotDiff({ baseSnapshot, compareSnapshot }: SnapshotDiffProps) {
  const [diffResults, setDiffResults] = useState<FieldDiff[]>([]);
  const [filter, setFilter] = useState<DiffType | "all">("all");

  // Generate diff results
  useEffect(() => {
    if (!baseSnapshot || !compareSnapshot) {
      return;
    }

    const results: FieldDiff[] = [];
    const baseFields = baseSnapshot.fields;
    const compareFields = compareSnapshot.fields;

    // Check for changed or removed fields
    Object.keys(baseFields).forEach((key) => {
      if (!(key in compareFields)) {
        // Field was removed in the compare snapshot
        results.push({
          key,
          diffType: "removed",
          baseValue: baseFields[key],
          compareValue: undefined,
        });
      } else if (JSON.stringify(baseFields[key]) !== JSON.stringify(compareFields[key])) {
        // Field value changed
        results.push({
          key,
          diffType: "changed",
          baseValue: baseFields[key],
          compareValue: compareFields[key],
        });
      } else {
        // Field value unchanged
        results.push({
          key,
          diffType: "unchanged",
          baseValue: baseFields[key],
          compareValue: compareFields[key],
        });
      }
    });

    // Check for added fields
    Object.keys(compareFields).forEach((key) => {
      if (!(key in baseFields)) {
        // Field was added in the compare snapshot
        results.push({
          key,
          diffType: "added",
          baseValue: undefined,
          compareValue: compareFields[key],
        });
      }
    });

    // Sort by diff type and then by key
    results.sort((a, b) => {
      const typeOrder = { changed: 0, added: 1, removed: 2, unchanged: 3 };
      if (typeOrder[a.diffType] !== typeOrder[b.diffType]) {
        return typeOrder[a.diffType] - typeOrder[b.diffType];
      }
      return a.key.localeCompare(b.key);
    });

    setDiffResults(results);
  }, [baseSnapshot, compareSnapshot]);

  // Filter diff results
  const filteredResults =
    filter === "all" ? diffResults : diffResults.filter((diff) => diff.diffType === filter);

  // Get counts for each diff type
  const counts = {
    changed: diffResults.filter((d) => d.diffType === "changed").length,
    added: diffResults.filter((d) => d.diffType === "added").length,
    removed: diffResults.filter((d) => d.diffType === "removed").length,
    unchanged: diffResults.filter((d) => d.diffType === "unchanged").length,
    all: diffResults.length,
  };

  // Format a value for display
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) {
      return "-";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Get diff badge
  const getDiffBadge = (diffType: DiffType) => {
    switch (diffType) {
      case "added":
        return <Badge className="bg-green-500">Added</Badge>;
      case "removed":
        return <Badge className="bg-red-500">Removed</Badge>;
      case "changed":
        return <Badge className="bg-amber-500">Changed</Badge>;
      case "unchanged":
        return <Badge variant="outline">Unchanged</Badge>;
      default:
        return null;
    }
  };

  // Get diff icon
  const getDiffIcon = (diffType: DiffType) => {
    switch (diffType) {
      case "added":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "removed":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "changed":
        return <Refresh className="h-4 w-4 text-amber-500" />;
      case "unchanged":
        return <Circle className="h-4 w-4 text-gray-300" />;
      default:
        return null;
    }
  };

  if (!baseSnapshot || !compareSnapshot) {
    return <div>Select two snapshots to compare</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4"><>

        <Badge
          variant={filter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilter("all")}
        >
          All ({counts.all})
        </Badge>
        <Badge
</>
          variant={filter === "changed" ? "default" : "outline"}
          className="cursor-pointer bg-amber-100 text-amber-800 hover:bg-amber-200"
          onClick={() => setFilter("changed")}
        ><>

          <Refresh className="mr-1 h-3 w-3" />
          Changed ({counts.changed})
        </Badge>
        <Badge
</>
          variant={filter === "added" ? "default" : "outline"}
          className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
          onClick={() => setFilter("added")}
        ><>

          <Plus className="mr-1 h-3 w-3" />
          Added ({counts.added})
        </Badge>
        <Badge
</>
          variant={filter === "removed" ? "default" : "outline"}
          className="cursor-pointer bg-red-100 text-red-800 hover:bg-red-200"
          onClick={() => setFilter("removed")}
        ><>

          <Minus className="mr-1 h-3 w-3" />
          Removed ({counts.removed})
        </Badge>
        <Badge
</>
          variant={filter === "unchanged" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilter("unchanged")}
        >
          <Circle className="mr-1 h-3 w-3" />
          Unchanged ({counts.unchanged})
        </Badge>
      </div>

      <div className="bg-slate-50 rounded-md p-2 mb-4">
        <div className="text-sm flex justify-between">
          <div><>

            <span className="font-medium">Base: </span>
            <span
</> className="text-gray-600">
              Version {baseSnapshot.version} ({baseSnapshot.source})
            </span>
          </div>
          <div><>

            <span className="font-medium">Compare: </span>
            <span
</> className="text-gray-600">
              Version {compareSnapshot.version} ({compareSnapshot.source})
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><>

              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead
</>>Field Name</TableHead><>

              <TableHead>Base Value</TableHead>
              <TableHead
</>>Compare Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  No differences found based on current filter
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((diff) => (
                <TableRow
                  key={diff.key}
                  className={diff.diffType === "unchanged" ? "opacity-60" : ""}
                >
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      {getDiffIcon(diff.diffType)}
                      <span className="ml-2 hidden md:inline-block">
                        {getDiffBadge(diff.diffType)}
                      </span>
                    </div>
                  </TableCell><>

                  <TableCell className="font-medium">{diff.key}</TableCell>
                  <TableCell
</> className={diff.diffType === "added" ? "text-gray-400 italic" : ""}>
                    {formatValue(diff.baseValue)}
                  </TableCell>
                  <TableCell className={diff.diffType === "removed" ? "text-gray-400 italic" : ""}>
                    {formatValue(diff.compareValue)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"} displayed
        {filter !== "all" && ` (filtered by ${filter})`}
      </div>
    </div>
  );
}
