import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Summary } from '@/types';
import { Check, X, FileText  } from '@mui/icons-material';

interface ResultsSummaryProps {
  summary: Summary;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ summary }) => {
  const { totalCount, enterCount, skipCount } = summary;

  return (
    <Card className="mb-6">
      <CardHeader className="border-b">
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex justify-between items-start">
              <div><>

                <p className="text-sm font-medium text-green-800">Permits to Enter</p>
                <p
</> className="text-2xl font-semibold text-green-700 mt-1">{enterCount}</p>
              </div>
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="flex justify-between items-start">
              <div><>

                <p className="text-sm font-medium text-red-800">Permits to Skip</p>
                <p
</> className="text-2xl font-semibold text-red-700 mt-1">{skipCount}</p>
              </div>
              <div className="rounded-full bg-red-100 p-2">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex justify-between items-start">
              <div><>

                <p className="text-sm font-medium text-blue-800">Total Permits</p>
                <p
</> className="text-2xl font-semibold text-blue-700 mt-1">{totalCount}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsSummary;
