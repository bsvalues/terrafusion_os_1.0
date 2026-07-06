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
import { isApiFetchError } from '../services/LiveDataProvider';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

/**
 * Provenance of the eager related-data bundle (assessments/documents/appeals/
 * taxStatements/recordings/auditTrail/operations) for the active parcel.
 * The bundle is loaded all-or-nothing in selectParcel, so 'loaded' means every
 * rendered related slice is available. Drives slice-aware Workbench honesty badges.
 */
export type RelatedDataStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface PropertyState {
  // Active parcel (selected via search or navigation)
  activeParcel: Property | null;
  activeParcelLoading: boolean;
  activeParcelLoadingParcelId: string | null;
  activeParcelError: {
    parcelId?: string;
    status?: number;
    message: string;
    path?: string;
  } | null;

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

  // Provenance of the eager related-data bundle for the active parcel (see
  // RelatedDataStatus). 'loaded' means the rendered related slice is available.
  relatedDataStatus: RelatedDataStatus;

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
const PARCEL_EVIDENCE_TIMEOUT_MS = 20_000;
const EMPTY_RELATED_DATA = {
  assessments: [],
  documents: [],
  appeals: [],
  taxStatements: [],
  recordings: [],
  auditTrail: [],
  operations: [],
} satisfies Pick<
  PropertyState,
  'assessments' | 'documents' | 'appeals' | 'taxStatements' | 'recordings' | 'auditTrail' | 'operations'
>;

function withParcelEvidenceTimeout<T>(parcelId: string, request: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`Property evidence request timed out for parcel ${parcelId}.`));
    }, PARCEL_EVIDENCE_TIMEOUT_MS);

    request
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeParcel: null,
      activeParcelLoading: false,
      activeParcelLoadingParcelId: null,
      activeParcelError: null,
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
      relatedDataStatus: 'idle',
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
        set({
          activeParcelLoading: true,
          activeParcelLoadingParcelId: parcelId,
          activeParcelError: null,
          relatedDataStatus: 'idle',
          ...EMPTY_RELATED_DATA,
        });
        try {
          const provider = getDataProvider();
          const parcel = await withParcelEvidenceTimeout(parcelId, provider.getParcel(parcelId));
          if (get().activeParcelLoadingParcelId !== parcelId) return;
          if (!parcel) {
            set({
              activeParcel: null,
              activeParcelLoading: false,
              activeParcelLoadingParcelId: null,
              relatedDataStatus: 'idle',
              ...EMPTY_RELATED_DATA,
              activeParcelError: {
                parcelId,
                status: 404,
                message: `Parcel ${parcelId} was not found in the live property evidence feed.`,
              },
            });
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

          set({
            activeParcel: parcel,
            recentParcels: recent,
            activeParcelLoading: false,
            activeParcelLoadingParcelId: null,
            activeParcelError: null,
            relatedDataStatus: 'loading',
            ...EMPTY_RELATED_DATA,
          });

          // Eagerly load related data in parallel after the parcel shell is usable.
          void Promise.all([
              provider.getAssessments(parcelId),
              provider.getDocuments(parcelId),
              provider.getAppeals(parcelId),
              provider.getTaxStatements(parcelId),
              provider.getRecordingHistory(parcelId),
              provider.getAuditTrail(parcelId),
              provider.getRecentOperations(parcelId),
            ])
            .then(([assessments, documents, appeals, taxStatements, recordings, auditTrail, operations]) => {
              if (get().activeParcel?.parcelId !== parcel.parcelId) return;
              set({
                assessments,
                documents,
                appeals,
                taxStatements,
                recordings,
                auditTrail,
                operations,
                relatedDataStatus: 'loaded',
              });
            })
            .catch(() => {
              if (get().activeParcel?.parcelId !== parcel.parcelId) return;
              set({
                assessments: [],
                documents: [],
                appeals: [],
                taxStatements: [],
                recordings: [],
                auditTrail: [],
                operations: [],
                relatedDataStatus: 'error',
              });
            });
        } catch (error) {
          if (get().activeParcelLoadingParcelId !== parcelId) return;
          set({
            activeParcel: null,
            activeParcelLoading: false,
            activeParcelLoadingParcelId: null,
            relatedDataStatus: 'idle',
            ...EMPTY_RELATED_DATA,
            activeParcelError: isApiFetchError(error)
              ? {
                  parcelId,
                  status: error.status,
                  path: error.path,
                  message:
                    error.status === 401
                      ? 'Authenticated property evidence is required before this parcel can be reviewed.'
                      : error.status === 403
                        ? 'Your current county/session is not authorized to review this parcel.'
                        : `Property evidence request failed with API status ${error.status}.`,
                }
              : {
                  parcelId,
                  message: error instanceof Error
                    ? error.message
                    : 'Property evidence request failed before the parcel could load.',
                },
          });
        }
      },

      // Clear active parcel
      clearParcel: () => {
        set({
          activeParcel: null,
          activeParcelLoading: false,
          activeParcelLoadingParcelId: null,
          activeParcelError: null,
          relatedDataStatus: 'idle',
          ...EMPTY_RELATED_DATA,
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
