import { Step } from 'react-joyride';
import { TourType } from '@/types/tour';

// Tour metadata interface
export interface TourInfo {
  id: string;
  name: string;
  description: string;
  steps: Step[];
  duration: string;
  category?: 'workflow' | 'feature' | 'onboarding' | 'advanced';
  prerequisiteTours?: string[]; // Optional IDs of tours that should be completed first
}

// Tour registry to maintain a catalog of all available tours
class TourRegistry {
  private tours: Map<string, TourInfo> = new Map();
  
  /**
   * Register a new tour in the registry
   */
  register(tourInfo: TourInfo): void {
    this.tours.set(tourInfo.id, tourInfo);
  }
  
  /**
   * Get a tour by its ID
   */
  getTour(id: string): TourInfo | undefined {
    return this.tours.get(id);
  }
  
  /**
   * Get all registered tours
   */
  getAllTours(): TourInfo[] {
    return Array.from(this.tours.values());
  }
  
  /**
   * Get tours by category
   */
  getToursByCategory(category: TourInfo['category']): TourInfo[] {
    return this.getAllTours().filter(tour => tour.category === category);
  }
  
  /**
   * Check if a tour exists
   */
  hasTour(id: string): boolean {
    return this.tours.has(id);
  }
}

// Create a singleton instance of the tour registry
const tourRegistry = new TourRegistry();

// Tour service to orchestrate tours within the application
export class TourService {
  private static instance: TourService;
  private completedTours: Set<string> = new Set();
  
  private constructor() {
    // Load completed tours from localStorage
    this.loadCompletedTours();
  }
  
  /**
   * Get the singleton instance of the tour service
   */
  public static getInstance(): TourService {
    if (!TourService.instance) {
      TourService.instance = new TourService();
    }
    return TourService.instance;
  }
  
  /**
   * Register a tour with the tour registry
   */
  public registerTour(tourInfo: TourInfo): void {
    tourRegistry.register(tourInfo);
  }
  
  /**
   * Get a tour by its ID
   */
  public getTour(id: string): TourInfo | undefined {
    return tourRegistry.getTour(id);
  }
  
  /**
   * Get all available tours
   */
  public getAllTours(): TourInfo[] {
    return tourRegistry.getAllTours();
  }
  
  /**
   * Get tours by category
   */
  public getToursByCategory(category: TourInfo['category']): TourInfo[] {
    return tourRegistry.getToursByCategory(category);
  }
  
  /**
   * Mark a tour as completed
   */
  public markTourCompleted(tourId: string): void {
    this.completedTours.add(tourId);
    this.saveCompletedTours();
  }
  
  /**
   * Check if a tour has been completed
   */
  public isTourCompleted(tourId: string): boolean {
    return this.completedTours.has(tourId);
  }
  
  /**
   * Get recommended tours for the current user
   * based on completed tours and prerequisites
   */
  public getRecommendedTours(): TourInfo[] {
    return this.getAllTours().filter(tour => {
      // Skip already completed tours
      if (this.isTourCompleted(tour.id)) {
        return false;
      }
      
      // Check if prerequisites are completed
      if (tour.prerequisiteTours && tour.prerequisiteTours.length > 0) {
        return tour.prerequisiteTours.every(prerequisite => 
          this.isTourCompleted(prerequisite)
        );
      }
      
      return true;
    });
  }
  
  /**
   * Reset all completed tours (for testing or user preference)
   */
  public resetCompletedTours(): void {
    this.completedTours.clear();
    localStorage.removeItem('completedTours');
  }
  
  /**
   * Save completed tours to localStorage
   */
  private saveCompletedTours(): void {
    try {
      localStorage.setItem(
        'completedTours', 
        JSON.stringify(Array.from(this.completedTours))
      );
    } catch (error) {
      console.error('Error saving completed tours to localStorage:', error);
    }
  }
  
  /**
   * Load completed tours from localStorage
   */
  private loadCompletedTours(): void {
    try {
      const storedTours = localStorage.getItem('completedTours');
      if (storedTours) {
        const tours = JSON.parse(storedTours);
        this.completedTours = new Set(tours);
      }
    } catch (error) {
      console.error('Error loading completed tours from localStorage:', error);
    }
  }
}

// Create and export a singleton instance
export const tourService = TourService.getInstance();

// Helper function to convert TourType enum to tour ID string
export const tourTypeToId = (tourType: TourType): string => {
  return tourType.toLowerCase();
};

// Helper function to get tour steps by tour type
export const getTourStepsByType = (tourType: TourType): Step[] => {
  const tourId = tourTypeToId(tourType);
  const tour = tourService.getTour(tourId);
  return tour?.steps || [];
};

export default tourService;