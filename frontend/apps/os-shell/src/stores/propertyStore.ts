/**
 * TerraFusion OS — Property Store (Zustand)
 *
 * Global state for the active parcel workflow.
 * All workbench tabs read from this store; search and parcel selection
 * are the Tier-0 entry points into the Property Workbench.
 *
 * Contract:
 *   - selectParcel() sets activeParcel AND eagerly loads assessments + documents
 *   - recentParcels persisted to localStorage (last 10)
 *   - All tabs react to activeParcel changes
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Property,
  Assessment,
  ParcelDocument,
  Appeal,
  TaxStatement,
  RecordingEntry,
  AuditEntry,
  OperationTrace,
  PropertySearchResult,
  SearchResults,
} from '../types/domain';
import { getDataProvider } from '../services/dataProvider';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

interface PropertyState {
  // Active parcel (selected via search or navigation)
  activeParcel: Property | null;
  activeParcelLoading: boolean;

  // Search
  searchQuery: string;
  searchResults: PropertySearchResult[];
  searchTotalCount: number;
  searchLoading: boolean;

  // Related data for active parcel
  assessments: Assessment[];
  documents: ParcelDocument[];
  appeals: Appeal[];
  taxStatements: TaxStatement[];
  recordings: RecordingEntry[];
  auditTrail: AuditEntry[];
  operations: OperationTrace[];

  // History
  recentParcels: PropertySearchResult[];

  // Actions
  search: (query: string) => Promise<void>;
  selectParcel: (parcelId: string) => Promise<void>;
  clearParcel: () => void;
  refreshParcelData: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const MAX_RECENT = 10;

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeParcel: null,
      activeParcelLoading: false,
      searchQuery: '',
      searchResults: [],
      searchTotalCount: 0,
      searchLoading: false,
      assessments: [],
      documents: [],
      appeals: [],
      taxStatements: [],
      recordings: [],
      auditTrail: [],
      operations: [],
      recentParcels: [],

      // Search parcels
      search: async (query: string) => {
        set({ searchQuery: query, searchLoading: true });
        try {
          const provider = getDataProvider();
          const results: SearchResults<PropertySearchResult> = await provider.search({
            text: query,
            pageSize: 20,
          });
          set({
            searchResults: results.items,
            searchTotalCount: results.totalCount,
            searchLoading: false,
          });
        } catch {
          set({ searchResults: [], searchTotalCount: 0, searchLoading: false });
        }
      },

      // Select a parcel — sets active and eagerly loads all related data
      selectParcel: async (parcelId: string) => {
        set({ activeParcelLoading: true });
        try {
          const provider = getDataProvider();
          const parcel = await provider.getParcel(parcelId);
          if (!parcel) {
            set({ activeParcel: null, activeParcelLoading: false });
            return;
          }

          // Add to recent parcels
          const recent = get().recentParcels.filter(
            (r) => r.parcelId !== parcelId,
          );
          recent.unshift({
            parcelId: parcel.parcelId,
            address: parcel.address,
            city: parcel.city,
            ownerName: parcel.ownerName,
            totalAssessedValue: parcel.totalAssessedValue,
            propertyType: parcel.propertyType,
            assessmentYear: parcel.assessmentYear,
          });
          if (recent.length > MAX_RECENT) recent.pop();

          set({ activeParcel: parcel, recentParcels: recent });

          // Eagerly load related data in parallel
          const [assessments, documents, appeals, taxStatements, recordings, auditTrail, operations] =
            await Promise.all([
              provider.getAssessments(parcelId),
              provider.getDocuments(parcelId),
              provider.getAppeals(parcelId),
              provider.getTaxStatements(parcelId),
              provider.getRecordingHistory(parcelId),
              provider.getAuditTrail(parcelId),
              provider.getRecentOperations(parcelId),
            ]);

          set({
            assessments,
            documents,
            appeals,
            taxStatements,
            recordings,
            auditTrail,
            operations,
            activeParcelLoading: false,
          });
        } catch {
          set({ activeParcelLoading: false });
        }
      },

      // Clear active parcel
      clearParcel: () => {
        set({
          activeParcel: null,
          assessments: [],
          documents: [],
          appeals: [],
          taxStatements: [],
          recordings: [],
          auditTrail: [],
          operations: [],
        });
      },

      // Refresh data for current active parcel
      refreshParcelData: async () => {
        const parcelId = get().activeParcel?.parcelId;
        if (parcelId) {
          await get().selectParcel(parcelId);
        }
      },
    }),
    {
      name: 'terrafusion-property-store',
      // Only persist recentParcels to localStorage
      partialize: (state) => ({
        recentParcels: state.recentParcels,
      }),
    },
  ),
);
