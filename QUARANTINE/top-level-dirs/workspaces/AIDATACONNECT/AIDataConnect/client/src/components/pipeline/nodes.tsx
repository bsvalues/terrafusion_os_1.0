import { memo, type ReactNode, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransformationSuggestions } from './transformation-suggestions';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface BaseNodeProps extends NodeProps {
  children?: ReactNode;
  className?: string;
}

const BaseNode = memo(({ data, children, className }: BaseNodeProps) => {
  return (
    <Card className={cn("w-[200px]", className)}>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {children}
      </CardContent>
    </Card>
  );
});

const SourceNode = memo(({ data, ...props }: NodeProps) => (
  <BaseNode data={data} {...props} className="border-blue-500">
    <Handle type="source" position={Position.Right} data-handlepos="right" />
    <div className="text-xs">Data Source</div>
  </BaseNode>
));

const TransformNode = memo(({ data, ...props }: NodeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [transformation, setTransformation] = useState(data.config?.transformation || '');

  const handleApplyTransformation = (newTransform: string) => {
    setTransformation(newTransform);
    data.config = {
      ...data.config,
      transformation: newTransform
    };
  };

  return (
    <BaseNode data={data} {...props} className="border-green-500">
      <Handle type="target" position={Position.Left} data-handlepos="left" />
      <div className="space-y-2">
        <div className="text-xs">Transform Data</div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              {transformation ? 'Edit Transform' : 'Configure Transform'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[80vh]">
            <DialogHeader>
              <DialogTitle>Configure Data Transformation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="space-y-2">
                <Label>Current Transformation</Label>
                <Textarea
                  value={transformation}
                  onChange={(e) => handleApplyTransformation(e.target.value)}
                  placeholder="Enter transformation code..."
                  className="font-mono text-sm"
                  rows={5}
                />
              </div>
              <Separator className="my-4" />
              <TransformationSuggestions
                data={data.inputData}
                onApply={handleApplyTransformation}
              />
            </div>
          </DialogContent>
        </Dialog>
        {transformation && (
          <div className="text-xs bg-muted p-2 rounded overflow-auto max-h-[80px]">
            <code>{transformation}</code>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} data-handlepos="right" />
    </BaseNode>
  );
});

const FilterNode = memo(({ data, ...props }: NodeProps) => (
  <BaseNode data={data} {...props} className="border-yellow-500">
    <Handle type="target" position={Position.Left} data-handlepos="left" />
    <div className="text-xs">Filter Data</div>
    <Handle type="source" position={Position.Right} data-handlepos="right" />
  </BaseNode>
));

const JoinNode = memo(({ data, ...props }: NodeProps) => (
  <BaseNode data={data} {...props} className="border-purple-500">
    <Handle type="target" position={Position.Left} data-handlepos="left" />
    <div className="text-xs">Join Data</div>
    <Handle type="source" position={Position.Right} data-handlepos="right" />
  </BaseNode>
));

const OutputNode = memo(({ data, ...props }: NodeProps) => (
  <BaseNode data={data} {...props} className="border-red-500">
    <Handle type="target" position={Position.Left} data-handlepos="left" />
    <div className="text-xs">Output</div>
  </BaseNode>
));

BaseNode.displayName = 'BaseNode';
SourceNode.displayName = 'SourceNode';
TransformNode.displayName = 'TransformNode';
FilterNode.displayName = 'FilterNode';
JoinNode.displayName = 'JoinNode';
OutputNode.displayName = 'OutputNode';

export { SourceNode, TransformNode, FilterNode, JoinNode, OutputNode };