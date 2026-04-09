import { memo, type ReactNode, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Cast Handle to avoid React type conflicts
const ReactHandle = Handle as any;

type BaseNodeProps = NodeProps & {
  data: { label?: string };
};

export const SourceNode = memo(({ data }: BaseNodeProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="min-w-[150px] shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Source</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Source Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Data Source</Label>
                  <Input placeholder="Select data source..." />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-600">{data.label || "Configure source"}</p>
      </CardContent>
      <ReactHandle type="source" position={Position.Right} data-handlepos="right" />
    </Card>
  );
});

export const TransformNode = memo(({ data }: BaseNodeProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="min-w-[150px] shadow-lg border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Transform</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transform Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Transformation Logic</Label>
                  <Textarea placeholder="Enter transformation rules..." />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-600">{data.label || "Add transform logic"}</p>
      </CardContent>
      <ReactHandle type="target" position={Position.Left} data-handlepos="left" />
      <ReactHandle type="source" position={Position.Right} data-handlepos="right" />
    </Card>
  );
});

export const FilterNode = memo(({ data }: BaseNodeProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="min-w-[150px] shadow-lg border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Filter</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Filter Conditions</Label>
                  <Textarea placeholder="Enter filter conditions..." />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-600">{data.label || "Set filter conditions"}</p>
      </CardContent>
      <ReactHandle type="target" position={Position.Left} data-handlepos="left" />
      <ReactHandle type="source" position={Position.Right} data-handlepos="right" />
    </Card>
  );
});

export const JoinNode = memo(({ data }: BaseNodeProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="min-w-[150px] shadow-lg border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Join</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Join Type</Label>
                  <Input placeholder="INNER, LEFT, RIGHT, FULL" />
                </div>
                <Separator />
                <div>
                  <Label>Join Conditions</Label>
                  <Textarea placeholder="Enter join conditions..." />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-600">{data.label || "Configure join"}</p>
      </CardContent>
      <ReactHandle type="target" position={Position.Left} data-handlepos="left" />
      <ReactHandle type="source" position={Position.Right} data-handlepos="right" />
    </Card>
  );
});

export const OutputNode = memo(({ data }: BaseNodeProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="min-w-[150px] shadow-lg border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Output</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Output Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Output Destination</Label>
                  <Input placeholder="Select output destination..." />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-600">{data.label || "Configure output"}</p>
      </CardContent>
      <ReactHandle type="target" position={Position.Left} data-handlepos="left" />
    </Card>
  );
});

SourceNode.displayName = 'SourceNode';
TransformNode.displayName = 'TransformNode';
FilterNode.displayName = 'FilterNode';
JoinNode.displayName = 'JoinNode';
OutputNode.displayName = 'OutputNode';
