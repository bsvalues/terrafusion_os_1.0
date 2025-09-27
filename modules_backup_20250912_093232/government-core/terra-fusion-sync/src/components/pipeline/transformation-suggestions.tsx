// Transformation suggestions component

export interface TransformationSuggestionsProps {data?: any;
  onApply?: (transformation: string) =>void;}

export function TransformationSuggestions({onApply}: TransformationSuggestionsProps) {
  const suggestions = ['Clean null values', 'Normalize data', 'Convert types', 'Remove duplicates'];

  return (<div className="space-y-2"><h4 className="font-medium">Suggested Transformations</h4>{suggestions.map((suggestion, index) => (<button
          key={index}
          onClick={() =>onApply?.(suggestion)}
          className="block w-full text-left p-2 hover:bg-gray-100 rounded"
        >
          {suggestion}</button>))}</div>
  );
}
