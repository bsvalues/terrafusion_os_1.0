import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocumentClassifier, ClassificationResult } from '@/hooks/use-document-classifier';
import { DocumentClassificationResult } from '@/components/documents/document-classification-result';
import { BrainCircuit, FileText, Upload, Workflow, Database  } from '@mui/icons-material';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { BatchDocumentProcessor } from '@/components/documents/batch-document-processor';
import { EnhancedDocumentManagement } from '@/components/documents/enhanced-document-management';

export default function DocumentClassificationPage() {
  const [activeTab, setActiveTab] = useState<string>('single');
  const [documentText, setDocumentText] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  
  const { classifyDocument } = useDocumentClassifier();
  
  // Fetch workflows for the document management section
  const { data: workflows = [] } = useQuery({
    queryKey: ['/api/workflows'],
  });
  
  // Use the first workflow as a default if available
  const selectedWorkflow = workflows.length > 0 ? workflows[0] : null;
  
  const handleClassify = async () => {
    if (!documentText.trim()) return;
    
    setIsClassifying(true);
    try {
      const result = await classifyDocument(documentText);
      setClassificationResult(result);
    } catch (error) {
      console.error('Error classifying document:', error);
    } finally {
      setIsClassifying(false);
    }
  };
  
  const handleClear = () => {
    setDocumentText('');
    setDocumentTitle('');
    setClassificationResult(null);
  };
  
  // Sample document text examples for each document type
  const examples = [
    {
      name: 'Plat Map Example',
      text: `PLAT OF SURVEY
SHORT PLAT NO. 2022-101
LEGAL DESCRIPTION:
A TRACT OF LAND SITUATED IN THE SOUTHEAST QUARTER OF SECTION 15, TOWNSHIP 9 NORTH, RANGE 29 E.W.M., BENTON COUNTY, WASHINGTON, MORE PARTICULARLY DESCRIBED AS FOLLOWS:
BEGINNING AT THE NORTHEAST CORNER OF LOT 3, BLOCK 2 OF VISTA HEIGHTS SUBDIVISION AS RECORDED IN VOLUME 15 OF PLATS, PAGE 45, RECORDS OF BENTON COUNTY, WASHINGTON; THENCE NORTH 89°45'30" EAST ALONG THE NORTH LINE OF SAID LOT 3, A DISTANCE OF 120.00 FEET TO THE NORTHWEST CORNER OF LOT 4, BLOCK 2 OF SAID VISTA HEIGHTS SUBDIVISION; THENCE SOUTH 00°14'30" EAST ALONG THE WEST LINE OF SAID LOT 4, A DISTANCE OF 100.00 FEET TO THE SOUTHWEST CORNER OF SAID LOT 4; THENCE SOUTH 89°45'30" WEST ALONG THE SOUTH LINE OF LOT 3, A DISTANCE OF 120.00 FEET TO THE SOUTHEAST CORNER OF SAID LOT 3; THENCE NORTH 00°14'30" WEST ALONG THE EAST LINE OF SAID LOT 3, A DISTANCE OF 100.00 FEET TO THE POINT OF BEGINNING.
CONTAINS 12,000 SQUARE FEET, MORE OR LESS.`
    },
    {
      name: 'Deed Example',
      text: `WARRANTY DEED
THIS DEED, made on March 15, 2022, between John Smith and Jane Smith, husband and wife, hereinafter called the grantor, and Robert Johnson, a single person, hereinafter called the grantee.
WITNESSETH: That the grantor, for and in consideration of the sum of THREE HUNDRED FIFTY THOUSAND AND NO/100 DOLLARS ($350,000.00), in hand paid, the receipt whereof is hereby acknowledged, does by these presents grant, bargain, sell, convey and confirm unto the grantee, and to his heirs and assigns forever, the following described real estate, situated in the County of Benton, State of Washington:
Lot 7, Block 3, VALLEY VIEW ADDITION, according to the plat thereof recorded in Volume 12 of Plats, page 87, records of Benton County, Washington.
Subject to: Easements and restrictions of record.
TOGETHER WITH all and singular the tenements, hereditaments and appurtenances thereunto belonging or in anywise appertaining.`
    },
    {
      name: 'Survey Example',
      text: `BOUNDARY SURVEY
JOB NO: 22-1458
DATE: JULY 8, 2022
PROPERTY ADDRESS: 1234 MAIN STREET, KENNEWICK, WA 99336
CLIENT: MARK WILLIAMS
SURVEYOR: JAMES PETERSON, PLS #12345

FIELD NOTES:
BEGINNING AT THE FOUND 5/8" IRON ROD WITH CAP MARKING THE NORTHEAST CORNER OF LOT 12, BLOCK 4, SUNSET TERRACE SUBDIVISION AS RECORDED IN VOLUME 14 OF PLATS, PAGE 72, RECORDS OF BENTON COUNTY, WASHINGTON; THENCE SOUTH B9°42'18" WEST ALONG THE NORTH LINE OF SAID LOT 12, A DISTANCE OF 75.00 FEET TO A FOUND 5/8" IRON ROD WITH CAP MARKING THE NORTHWEST CORNER OF SAID LOT 12; THENCE SOUTH 00°17'42" EAST ALONG THE WEST LINE OF SAID LOT 12, A DISTANCE OF 125.00 FEET TO A FOUND 5/8" IRON ROD WITH CAP MARKING THE SOUTHWEST CORNER OF SAID LOT 12; THENCE NORTH 89°42'18" EAST ALONG THE SOUTH LINE OF SAID LOT 12, A DISTANCE OF 75.00 FEET TO A FOUND 5/8" IRON ROD WITH CAP MARKING THE SOUTHEAST CORNER OF SAID LOT 12; THENCE NORTH 00°17'42" WEST ALONG THE EAST LINE OF SAID LOT 12, A DISTANCE OF 125.00 FEET TO THE POINT OF BEGINNING.

MONUMENTS FOUND:
5/8" IRON ROD WITH CAP AT ALL PROPERTY CORNERS
UTILITY POLE BEARS N45°E, 15.2' FROM NE CORNER
BENCHMARK: CITY OF KENNEWICK MONUMENT NO. 47 ELEVATION: 432.58 FEET (NAVD 88)`
    }
  ];
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center"><>

        <h1 className="text-3xl font-bold tracking-tight">Document Classification</h1>
        <p
</>
className="text-muted-foreground mt-2">
          Machine learning-powered document classification for Benton County Assessor's Office
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
          <TabsTrigger value="single" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Single Document</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-1">
            <Upload className="h-4 w-4" />
            <span>Batch Process</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            <span>Document Management</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Single Document Classification Tab */}
        <TabsContent value="single">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><>

                    <FileText className="h-5 w-5 text-primary" />
                    Document Input
                  </CardTitle>
                  <CardDescription
</>
</>>
                    Enter document text to classify or select from examples
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2"><>

                    <Label htmlFor="documentTitle">Document Title</Label>
                    <Input
</>

                      id="documentTitle"
                      placeholder="Enter document title (optional)"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2"><>

                    <Label htmlFor="documentText">Document Text</Label>
                    <Textarea
</>

                      id="documentText"
                      placeholder="Paste document text here to classify"
                      className="min-h-[200px]"
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleClassify} 
                      className="flex-1"
                      disabled={!documentText.trim() || isClassifying}
                    ><>

                      <BrainCircuit className="mr-2 h-4 w-4" />
                      {isClassifying ? 'Classifying...' : 'Classify Document'}
                    </Button>
                    
                    <Button
</>

                      variant="outline" 
                      onClick={handleClear}
                      disabled={isClassifying}
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><>

                  <CardTitle>Document Examples</CardTitle>
                  <CardDescription
</>
</>>
                    Try with pre-written document text examples
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="plat_map" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-4"><>

                      <TabsTrigger value="plat_map">Plat Map</TabsTrigger>
                      <TabsTrigger
</>
value="deed">Deed</TabsTrigger>
                      <TabsTrigger value="survey">Survey</TabsTrigger>
                    </TabsList>
                    
                    {examples.map((example /* , index */) => (
                      <TabsContent 
                        key={index} 
                        value={Object.values({
                          plat_map: examples[0], 
                          deed: examples[1], 
                          survey: examples[2]
                        })[index] === example ? 
                          Object.keys({
                            plat_map: examples[0], 
                            deed: examples[1], 
                            survey: examples[2]
                          })[index] : ''}
                        className="space-y-4"
                      >
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm max-h-[200px] overflow-y-auto"><>

                          <p className="font-medium mb-2">{example.name}</p>
                          <p
</>
className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {example.text}
                          </p>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            setDocumentTitle(example.name);
                            setDocumentText(example.text);
                          }}
                          variant="secondary"
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Use This Example
                        </Button>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><>

                    <BrainCircuit className="h-5 w-5 text-primary" />
                    Classification Results
                  </CardTitle>
                  <CardDescription
</>
</>>
                    AI-powered document type detection results
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {classificationResult ? (
                    <DocumentClassificationResult classification={classificationResult} />
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-md text-center">
                      <BrainCircuit className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                        No Document Classified Yet
                      </h3>
                      <p
</>
className="text-slate-500 dark:text-slate-400 text-sm">
                        Enter document text and click "Classify Document" to see results
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {classificationResult && (
                <Card>
                  <CardHeader><>

                    <CardTitle>How It Works</CardTitle>
                    <CardDescription
</>
</>>
                      Understanding the classification process
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><>

                      <h3 className="font-medium">ML-based Classification</h3>
                      <p
</>
className="text-sm text-slate-600 dark:text-slate-400">
                        Our document classifier uses machine learning to analyze document text and identify patterns that match known document types in the Benton County Assessor's Office workflow.
                      </p>
                    </div>
                    
                    <div className="space-y-2"><>

                      <h3 className="font-medium">Confidence Score</h3>
                      <p
</>
className="text-sm text-slate-600 dark:text-slate-400">
                        The confidence score indicates how certain the model is about the classification. Higher confidence means the document more clearly matches a known document type.
                      </p>
                    </div>
                    
                    <div className="space-y-2"><>

                      <h3 className="font-medium">Alternative Types</h3>
                      <p
</>
className="text-sm text-slate-600 dark:text-slate-400">
                        When a document contains elements of multiple document types, the system shows alternative classifications with their confidence scores.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Batch Document Processing Tab */}
        <TabsContent value="batch">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Upload className="h-5 w-5 text-primary" />
                  Batch Document Classification
                </CardTitle>
                <CardDescription
</>
</>>
                  Upload and classify multiple documents at once
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {selectedWorkflow ? (
                  <BatchDocumentProcessor 
                    workflowId={selectedWorkflow.id} 
                    onComplete={() => {}}
                  />
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <Workflow className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

                    <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                      No Workflow Available
                    </h3>
                    <p
</>
className="text-slate-500 dark:text-slate-400 mb-4">
                      Please create or select a workflow to use batch processing
                    </p>
                    <Button variant="outline">
                      Create New Workflow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Document Management Tab */}
        <TabsContent value="management">
          {selectedWorkflow ? (
            <EnhancedDocumentManagement workflow={selectedWorkflow} />
          ) : (
            <div className="text-center py-12">
              <Database className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" /><>

              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-2">
                No Workflow Available
              </h3>
              <p
</>
className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Please create or select a workflow to use the document management features
              </p>
              <Button>
                Create New Workflow
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}