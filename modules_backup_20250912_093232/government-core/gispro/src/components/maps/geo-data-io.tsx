import {useState, useRef} from 'react';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {useToast} from "@/hooks/use-toast";
import {Upload, Download, X} from '@mui/icons-material';
import {GeoJSONCollection, GeoJSONFeature} from '@/lib/map-utils';

interface GeoDataIOProps {onImport?: (data: GeoJSONCollection | GeoJSONFeature) => void;
  onExport?: () => GeoJSONCollection | GeoJSONFeature | null;
  importDialogOpen?: boolean;
  onImportDialogOpenChange?: (open: boolean) => void;
  exportDialogOpen?: boolean;
  onExportDialogOpenChange?: (open: boolean) => void;}

export function GeoDataIO({onImport,
  onExport,
  importDialogOpen,
  onImportDialogOpenChange,
  exportDialogOpen,
  onExportDialogOpenChange,}: GeoDataIOProps) {const [importJsonText, setImportJsonText] = useState('');
  const [exportJsonText, setExportJsonText] = useState('');
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast} = useToast();
  
  // Clear import state when dialog opens or closes
  const handleImportDialogOpenChange = (open: boolean) => {if (!open) {
      setImportJsonText('');
      setImportError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';}
    }
    
    if (onImportDialogOpenChange) {onImportDialogOpenChange(open);}
  };
  
  // Prepare export data when dialog opens
  const handleExportDialogOpenChange = (open: boolean) => {if (open && onExport) {
      const data = onExport();
      if (data) {
        setExportJsonText(JSON.stringify(data, null, 2));} else {setExportJsonText('');}
    }
    
    if (onExportDialogOpenChange) {onExportDialogOpenChange(open);}
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>{setImportError('');
    
    if (!e.target.files || e.target.files.length === 0) {
      return;}
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {if (!event.target?.result) return;
      
      try {
        const content = event.target.result as string;
        setImportJsonText(content);} catch (error) {console.error('Error reading file:', error);
        setImportError('Could not read the file. Please try again.');}
    };
    
    reader.onerror = () => {setImportError('Error reading file. Please try again.');};
    
    reader.readAsText(file);
  };
  
  const handleImport = () => {if (!importJsonText.trim()) {
      setImportError('Please provide GeoJSON data to import.');
      return;}
    
    try {const data = JSON.parse(importJsonText);
      
      // Validate that it's a GeoJSON object
      if (
        !data.type || 
        (data.type !== 'FeatureCollection' && data.type !== 'Feature')
      ) {
        setImportError('Invalid GeoJSON format. Must be a FeatureCollection or Feature.');
        return;}
      
      if (onImport) {onImport(data);}
      
      toast({
        title: "Data imported successfully",
        description: data.type === 'FeatureCollection' 
          ? `${data.features?.length || 0} features imported.`
          : "Feature imported successfully.",
      });
      
      handleImportDialogOpenChange(false);
    } catch (error) {console.error('Error parsing GeoJSON:', error);
      setImportError('Invalid JSON format. Please check your data and try again.');}
  };
  
  const handleExport = () => {// Create a download link for the JSON data
    if (!exportJsonText) return;
    
    const blob = new Blob([exportJsonText], { type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported-geojson.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({title: "Data exported successfully",
      description: "The GeoJSON file has been downloaded.",});
    
    if (onExportDialogOpenChange) {onExportDialogOpenChange(false);}
  };
  
  return (
      {/* Import Dialog */}<Dialog open={importDialogOpen} onOpenChange={handleImportDialogOpenChange}><DialogContent className="sm:max-w-[500px]"><DialogHeader><DialogTitle className="flex items-center"><><Upload className="h-5 w-5 mr-2" />Import GeoJSON Data</DialogTitle><DialogDescription
</></>>Import GeoJSON data from a file or paste it directly.</DialogDescription></DialogHeader><div className="py-4 space-y-4"><div className="flex space-x-4"><><Button
                variant={importMethod === 'file' ? "default" : "outline"}
                onClick={() =>setImportMethod('file')}
                className="flex-1"
              >
                From File</Button><Button
</>variant={importMethod === 'text' ? "default" : "outline"}
                onClick={() => setImportMethod('text')}
                className="flex-1"
              >
                Paste JSON</Button></div>{importMethod === 'file' ? (<div className="space-y-2"><><Label htmlFor="geojson-file">GeoJSON File</Label><Input
</>

                  id="geojson-file"
                  type="file"
                  accept=".json,.geojson"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                /><p className="text-sm text-neutral-500">Select a .json or .geojson file</p></div>) : (<div className="space-y-2"><><Label htmlFor="geojson-text">GeoJSON Data</Label><Textarea
</>

                  id="geojson-text"
                  placeholder='{"type": "FeatureCollection", "features": [...]}'
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="h-[200px] font-mono text-sm"
                /></div>)}
            
            {importError && (<div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start space-x-2"><X className="h-4 w-4 mt-0.5" /><p>{importError}</p></div>)}</div><DialogFooter><><Button 
              variant="outline" 
              onClick={() =>handleImportDialogOpenChange(false)}
            >
              Cancel</Button><Button
</>
onClick={handleImport}>Import Data</Button></DialogFooter></DialogContent></Dialog>{/* Export Dialog */}<Dialog open={exportDialogOpen} onOpenChange={handleExportDialogOpenChange}><DialogContent className="sm:max-w-[500px]"><DialogHeader><DialogTitle className="flex items-center"><><Download className="h-5 w-5 mr-2" />Export GeoJSON Data</DialogTitle><DialogDescription
</></>>Export map features as GeoJSON data</DialogDescription></DialogHeader><div className="py-4 space-y-4"><div className="space-y-2"><><Label htmlFor="export-geojson-text">GeoJSON Data</Label><Textarea
</>

                id="export-geojson-text"
                value={exportJsonText}
                readOnly
                className="h-[240px] font-mono text-sm"
              /></div></div><DialogFooter><><Button 
              variant="outline" 
              onClick={() =>handleExportDialogOpenChange(false)}
            >
              Cancel</Button><Button
</>
onClick={handleExport}>Download JSON</Button></DialogFooter></DialogContent></Dialog>
  );
}