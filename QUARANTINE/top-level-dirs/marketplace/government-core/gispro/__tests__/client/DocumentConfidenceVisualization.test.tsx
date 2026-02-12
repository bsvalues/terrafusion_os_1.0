import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocumentConfidenceIndicator } from '@/components/documents/document-confidence-indicator';
import { ClassificationConfidenceCard } from '@/components/documents/classification-confidence-card';

describe('Document Confidence Visualization', () => {
  // Test the confidence indicator component
  describe('DocumentConfidenceIndicator', () => {
    test('should display high confidence correctly', () => {
      render(<DocumentConfidenceIndicator confidence={0.92} />);
      
      const indicator = screen.getByTestId('confidence-indicator');
      expect(indicator).toHaveClass('bg-green-500');
      expect(screen.getByText('92%')).toBeInTheDocument();
    });
    
    test('should display medium confidence correctly', () => {
      render(<DocumentConfidenceIndicator confidence={0.65} />);
      
      const indicator = screen.getByTestId('confidence-indicator');
      expect(indicator).toHaveClass('bg-yellow-500');
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
    
    test('should display low confidence correctly', () => {
      render(<DocumentConfidenceIndicator confidence={0.35} />);
      
      const indicator = screen.getByTestId('confidence-indicator');
      expect(indicator).toHaveClass('bg-red-500');
      expect(screen.getByText('35%')).toBeInTheDocument();
    });
    
    test('should handle undefined confidence values', () => {
      render(<DocumentConfidenceIndicator confidence={undefined} />);
      
      const indicator = screen.getByTestId('confidence-indicator');
      expect(indicator).toHaveClass('bg-gray-300');
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });
  
  // Test the classification confidence card component
  describe('ClassificationConfidenceCard', () => {
    const mockClassification = {
      documentType: 'boundary_line_adjustment',
      documentTypeLabel: 'Boundary Line Adjustment',
      confidence: 0.78,
      wasManuallyClassified: false,
      classifiedAt: new Date().toISOString()
    };
    
    test('should display classification details', () => {
      render(<ClassificationConfidenceCard classification={mockClassification} />);
      
      expect(screen.getByText('Boundary Line Adjustment')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText(/Auto-classified/)).toBeInTheDocument();
    });
    
    test('should indicate manual classification', () => {
      const manualClassification = {
        ...mockClassification,
        wasManuallyClassified: true
      };
      
      render(<ClassificationConfidenceCard classification={manualClassification} />);
      
      expect(screen.getByText(/Manually classified/)).toBeInTheDocument();
    });
    
    test('should show suggestions for low confidence classifications', () => {
      const lowConfidenceClassification = {
        ...mockClassification,
        confidence: 0.35
      };
      
      render(<ClassificationConfidenceCard classification={lowConfidenceClassification} />);
      
      expect(screen.getByText(/Low confidence/)).toBeInTheDocument();
      expect(screen.getByText(/Consider manual review/)).toBeInTheDocument();
    });
    
    test('should allow updating classification', () => {
      const handleUpdateMock = jest.fn();
      
      render(
        <ClassificationConfidenceCard 
          classification={mockClassification}
          onUpdateClassification={handleUpdateMock}
        />
      );
      
      // Click the update button
      const updateButton = screen.getByText(/Update/);
      updateButton.click();
      
      expect(handleUpdateMock).toHaveBeenCalled();
    });
  });
});