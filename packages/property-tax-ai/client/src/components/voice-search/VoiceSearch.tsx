import { useState } from 'react';
import { VoiceSearchButton } from './VoiceSearchButton';
import { VoiceSearchResults } from './VoiceSearchResults';
import { SearchParams } from '../../services/voice-recognition-service';

interface VoiceSearchProps {
  onSearch?: (searchParams: SearchParams) => void;
  className?: string;
}

export function VoiceSearch({ onSearch, className = '' }: VoiceSearchProps) {
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleSearchResult = (text: string, params: SearchParams) => {
    setTranscribedText(text);
    setSearchParams(params);
    setIsActive(true);
  };

  const handleApplySearch = (modifiedParams?: SearchParams) => {
    if (onSearch && modifiedParams) {
      onSearch(modifiedParams);
    }
    setIsActive(false);
  };

  const handleClear = () => {
    setTranscribedText(null);
    setSearchParams(null);
    setIsActive(false);
  };

  const handleCancel = () => {
    setIsActive(false);
  };

  return (
    <div className={`voice-search ${className}`}>
      {!isActive ? (
        <VoiceSearchButton onSearchResult={handleSearchResult} />
      ) : (
        transcribedText && 
        searchParams && (
          <VoiceSearchResults
            text={transcribedText}
            searchParams={searchParams}
            onApply={handleApplySearch}
            onClear={handleClear}
            onCancel={handleCancel}
          />
        )
      )}
    </div>
  );
}