import { ComparableSnapshot } from "@shared/types/comps";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Clock, Database, Edit, Upload  } from '@mui/icons-material';

interface SnapshotTileProps {
  snapshot: ComparableSnapshot;
  isSelected: boolean;
  compact?: boolean;
  onClick: () => void;
}

export function SnapshotTile({
  snapshot,
  isSelected,
  compact = false,
  onClick,
}: SnapshotTileProps) {
  // Format the creation date
  const formattedDate = formatDistanceToNow(new Date(snapshot.createdAt), { addSuffix: true });

  // Generate a source icon based on the snapshot source
  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "mls_import":
      case "mls import":
        return <Database className="h-4 w-4" />;
      case "manual_edit":
      case "manual edit":
        return <Edit className="h-4 w-4" />;
      case "api_update":
      case "api update":
        return <Upload className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Generate a summary of the snapshot fields
  const getFieldsSummary = () => {
    const fields = snapshot.fields;
    const summary = [];

    if (fields.price) {
      summary.push(`$${fields.price.toLocaleString()}`);
    }

    if (fields.bedrooms && fields.bathrooms) {
      summary.push(`${fields.bedrooms} bed / ${fields.bathrooms} bath`);
    } else if (fields.bedrooms) {
      summary.push(`${fields.bedrooms} bed`);
    } else if (fields.bathrooms) {
      summary.push(`${fields.bathrooms} bath`);
    }

    if (fields.sqft) {
      summary.push(`${fields.sqft.toLocaleString()} sqft`);
    }

    if (fields.status) {
      summary.push(fields.status);
    }

    return summary.join(" · ");
  };

  // Render compact view
  if (compact) {
    return (
      <Card
        className={`
          cursor-pointer transition-all p-2
          hover:border-primary hover:shadow-sm
          ${isSelected ? "border-primary bg-primary/5" : ""}
        `}
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="flex items-center justify-between"><>

            <Badge variant="outline">v{snapshot.version}</Badge>
            <span
</> className="text-xs text-gray-500">{formattedDate}</span>
          </div>
          <div className="mt-2 text-xs truncate">{getFieldsSummary()}</div>
        </CardContent>
      </Card>
    );
  }

  // Render full view
  return (
    <Card
      className={`
        cursor-pointer transition-all
        hover:border-primary hover:shadow-sm
        ${isSelected ? "border-primary bg-primary/5" : ""}
      `}
      onClick={onClick}
    >
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center"><>

            <Badge variant={isSelected ? "default" : "outline"} className="mr-2">
              v{snapshot.version}
            </Badge>
            <Badge
</> variant="secondary" className="flex items-center gap-1">
              {getSourceIcon(snapshot.source)}
              <span className="capitalize">{snapshot.source.replace("_", " ")}</span>
            </Badge>
          </div>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>

        <div className="mt-3"><>

          <div className="text-md font-medium mb-1">
            {snapshot.fields.address || `Property ID: ${snapshot.propertyId}`}
          </div>
          <div
</> className="text-sm text-gray-600">{getFieldsSummary()}</div>
        </div>

        {snapshot.metadata && snapshot.metadata.tags && (
          <div className="mt-3 flex flex-wrap gap-1">
            {snapshot.metadata.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs bg-slate-50">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
