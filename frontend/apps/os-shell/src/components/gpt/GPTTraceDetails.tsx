import React from 'react';

import { AlertCircle, FileText, Link2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { type GPTTraceMessage } from '@/services/gptAPI';

interface GPTTraceDetailsProps {
  traceMessage: GPTTraceMessage | null;
  traceLoaded: boolean;
  traceError: string | null;
}

export const GPTTraceDetails: React.FC<GPTTraceDetailsProps> = ({
  traceMessage,
  traceLoaded,
  traceError,
}) => {
  if (traceError) {
    return (
      <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          Trace is unavailable.
        </div>
        <p className="mt-2">{traceError}</p>
      </div>
    );
  }

  if (!traceLoaded) {
    return null;
  }

  if (!traceMessage) {
    return (
      <div className="mt-3 rounded-md border border-gray-200 bg-white/70 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
        The current conversation trace did not return a record for this message.
      </div>
    );
  }

  if (!traceMessage.ragUsed) {
    return (
      <div className="mt-3 rounded-md border border-gray-200 bg-white/70 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
        No source trace is recorded for this response.
      </div>
    );
  }

  const ragDocuments = traceMessage.ragDocuments ?? [];
  const ragChunkDetails = traceMessage.ragChunkDetails ?? [];
  const hasDocuments = ragDocuments.length > 0;
  const hasChunkDetails = ragChunkDetails.length > 0;

  if (!hasDocuments && !hasChunkDetails) {
    return (
      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
        Trace is present, but this response did not return source or chunk details.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-gray-200 bg-white/70 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Manual trace snapshot</Badge>
        {traceMessage.ragScore != null ? (
          <Badge variant="outline">RAG score {traceMessage.ragScore.toFixed(2)}</Badge>
        ) : null}
      </div>

      {hasDocuments ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <FileText className="h-3.5 w-3.5" />
            Source documents
          </div>
          <div className="flex flex-wrap gap-2">
            {ragDocuments.map((documentId) => (
              <Badge key={documentId} variant="outline">
                {documentId}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {hasChunkDetails ? (
        <div className="mt-3 space-y-2">
          <div className="font-medium">Chunk details</div>
          {ragChunkDetails.map((chunk) => (
            <div
              key={`${chunk.chunkId}-${chunk.chunkIndex ?? 'na'}`}
              className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950/50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{chunk.documentTitle || chunk.chunkId}</Badge>
                {chunk.chunkIndex != null ? <Badge variant="secondary">Chunk {chunk.chunkIndex}</Badge> : null}
                {chunk.score != null ? <Badge variant="secondary">Score {chunk.score.toFixed(2)}</Badge> : null}
              </div>
              {chunk.textSnippet ? <p className="mt-2 whitespace-pre-wrap">{chunk.textSnippet}</p> : null}
              {chunk.sourceUrl ? (
                <div className="mt-2 flex items-center gap-2 break-all text-[11px] opacity-80">
                  <Link2 className="h-3.5 w-3.5" />
                  <span>{chunk.sourceUrl}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default GPTTraceDetails;