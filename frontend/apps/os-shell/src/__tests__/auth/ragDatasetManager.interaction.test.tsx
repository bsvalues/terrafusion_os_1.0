import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RAGDatasetManager } from '../../components/gpt/RAGDatasetManager';

const {
  mockGetDatasets,
  mockGetDataset,
  mockCreateDataset,
  mockDeleteDataset,
  mockReindexDataset,
  mockGetDocuments,
  mockAddDocument,
  mockDeleteDocument,
  mockGetChunks,
} = vi.hoisted(() => ({
  mockGetDatasets: vi.fn(),
  mockGetDataset: vi.fn(),
  mockCreateDataset: vi.fn(),
  mockDeleteDataset: vi.fn(),
  mockReindexDataset: vi.fn(),
  mockGetDocuments: vi.fn(),
  mockAddDocument: vi.fn(),
  mockDeleteDocument: vi.fn(),
  mockGetChunks: vi.fn(),
}));

vi.mock('@/services/ragAPI', () => ({
  ragAPI: {
    getDatasets: mockGetDatasets,
    getDataset: mockGetDataset,
    createDataset: mockCreateDataset,
    deleteDataset: mockDeleteDataset,
    reindexDataset: mockReindexDataset,
    getDocuments: mockGetDocuments,
    addDocument: mockAddDocument,
    deleteDocument: mockDeleteDocument,
    getChunks: mockGetChunks,
  },
}));

function makeDataset(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Benton CAMA Basics',
    description: 'County assessment policy and appraisal references.',
    countyId: 33,
    category: 'Assessment',
    embeddingProvider: 'OpenAI',
    embeddingModel: 'text-embedding-3-small',
    documentCount: 1,
    totalChunks: 3,
    totalEmbeddings: 3,
    storageSize: 2048,
    status: 'Active',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
    ...overrides,
  };
}

function makeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    datasetId: 1,
    title: 'Assessment Manual',
    content: 'County guidance for valuation and inspection workflows.',
    sourceUrl: 'https://county.example/manual',
    documentType: 'Manual',
    author: 'County Assessor',
    chunkCount: 3,
    embeddingCount: 3,
    status: 'Indexed',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
    ...overrides,
  };
}

describe('RAGDatasetManager interactions', () => {
  let datasets: ReturnType<typeof makeDataset>[];
  let documentsByDataset: Record<number, ReturnType<typeof makeDocument>[]>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));

    datasets = [
      makeDataset(),
      makeDataset({
        id: 2,
        name: 'Appeal Hearing Prep',
        category: 'Appeals',
        documentCount: 0,
        totalChunks: 0,
        storageSize: 0,
      }),
    ];

    documentsByDataset = {
      1: [makeDocument()],
      2: [],
    };

    mockGetDatasets.mockImplementation(async () => datasets.map((dataset) => ({ ...dataset })));
    mockGetDataset.mockImplementation(async (id: number) => {
      const dataset = datasets.find((entry) => entry.id === id);
      if (!dataset) throw new Error('dataset missing');
      return { ...dataset };
    });
    mockCreateDataset.mockImplementation(async (payload: Record<string, unknown>) => {
      const created = makeDataset({
        id: 99,
        name: payload.name,
        description: payload.description,
        category: payload.category,
        embeddingProvider: payload.embeddingProvider,
        embeddingModel: payload.embeddingModel,
        documentCount: 0,
        totalChunks: 0,
        storageSize: 0,
      });
      datasets = [...datasets, created];
      documentsByDataset[created.id] = [];
      return created;
    });
    mockDeleteDataset.mockImplementation(async (id: number) => {
      datasets = datasets.filter((dataset) => dataset.id !== id);
      delete documentsByDataset[id];
    });
    mockReindexDataset.mockResolvedValue({ message: 'Reindexing started', documentCount: 1 });
    mockGetDocuments.mockImplementation(async (datasetId: number) =>
      (documentsByDataset[datasetId] || []).map((document) => ({ ...document })),
    );
    mockAddDocument.mockImplementation(async (datasetId: number, payload: Record<string, unknown>) => {
      const document = makeDocument({
        id: 44,
        datasetId,
        title: payload.title,
        content: payload.content,
        sourceUrl: payload.sourceUrl,
        documentType: payload.documentType,
        author: payload.author,
        chunkCount: 0,
        embeddingCount: 0,
        status: 'Indexed',
      });
      documentsByDataset[datasetId] = [...(documentsByDataset[datasetId] || []), document];
      datasets = datasets.map((dataset) =>
        dataset.id === datasetId
          ? { ...dataset, documentCount: dataset.documentCount + 1 }
          : dataset,
      );
      return document;
    });
    mockDeleteDocument.mockImplementation(async (documentId: number) => {
      for (const [datasetId, documents] of Object.entries(documentsByDataset)) {
        const nextDocuments = documents.filter((document) => document.id !== documentId);
        if (nextDocuments.length !== documents.length) {
          documentsByDataset[Number(datasetId)] = nextDocuments;
          datasets = datasets.map((dataset) =>
            dataset.id === Number(datasetId)
              ? { ...dataset, documentCount: Math.max(0, dataset.documentCount - 1) }
              : dataset,
          );
        }
      }
    });
    mockGetChunks.mockResolvedValue([]);
  });

  it('renders the honest slice notice and keeps unsupported edit/upload claims out of the UI', async () => {
    render(<RAGDatasetManager />);

    expect(await screen.findByText('Benton CAMA Basics')).toBeInTheDocument();
    expect(
      screen.getByText(/not supported by current backend truth: dataset metadata edit, binary file upload, and live push updates/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit dataset/i })).not.toBeInTheDocument();
  });

  it('creates a dataset through the canonical ragAPI lane', async () => {
    render(<RAGDatasetManager />);

    await screen.findByText('Benton CAMA Basics');
    fireEvent.click(screen.getByRole('button', { name: 'Create dataset' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Dataset name'), {
      target: { value: 'County Appeals Library' },
    });
    fireEvent.change(within(dialog).getByLabelText('Dataset description'), {
      target: { value: 'Appeal hearing prep guidance and templates.' },
    });

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Create Dataset' })[0]);

    await waitFor(() => {
      expect(mockCreateDataset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'County Appeals Library',
          description: 'Appeal hearing prep guidance and templates.',
          embeddingProvider: 'OpenAI',
          embeddingModel: 'text-embedding-3-small',
        }),
      );
    });

    expect(await screen.findByText('Dataset "County Appeals Library" created successfully')).toBeInTheDocument();
  });

  it('deletes a dataset through the canonical ragAPI lane', async () => {
    render(<RAGDatasetManager />);

    await screen.findByText('Benton CAMA Basics');
    fireEvent.click(screen.getByRole('button', { name: 'Delete dataset Benton CAMA Basics' }));

    await waitFor(() => {
      expect(mockDeleteDataset).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText('Dataset "Benton CAMA Basics" deleted from active collections')).toBeInTheDocument();
  });

  it('adds and deletes a document through the canonical ragAPI lane', async () => {
    render(<RAGDatasetManager />);

    await screen.findByText('Benton CAMA Basics');
    fireEvent.click(screen.getByText('Benton CAMA Basics'));

    await screen.findByText('Assessment Manual');
    fireEvent.click(screen.getByRole('button', { name: 'Add document' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Document title'), {
      target: { value: 'Field Inspection Checklist' },
    });
    fireEvent.change(within(dialog).getByLabelText('Document content'), {
      target: { value: 'Checklist for inspection prep and evidence gathering.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add & Index' }));

    await waitFor(() => {
      expect(mockAddDocument).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Field Inspection Checklist',
          content: 'Checklist for inspection prep and evidence gathering.',
        }),
      );
    });

    expect(await screen.findByText('Document "Field Inspection Checklist" added and indexed successfully')).toBeInTheDocument();
    expect(await screen.findByText('Field Inspection Checklist')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete document Field Inspection Checklist' }));

    await waitFor(() => {
      expect(mockDeleteDocument).toHaveBeenCalledWith(44);
    });

    expect(await screen.findByText('Document "Field Inspection Checklist" deleted successfully')).toBeInTheDocument();
  });

  it('reindexes a dataset and labels empty chunk drill-down honestly', async () => {
    render(<RAGDatasetManager />);

    await screen.findByText('Benton CAMA Basics');
    fireEvent.click(screen.getByRole('button', { name: 'Reindex dataset Benton CAMA Basics' }));

    await waitFor(() => {
      expect(mockReindexDataset).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText('Dataset "Benton CAMA Basics" reindexed successfully')).toBeInTheDocument();
    expect(await screen.findByText('Benton CAMA Basics')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Benton CAMA Basics'));
    await screen.findByText('Assessment Manual');
    fireEvent.click(screen.getByRole('button', { name: 'View chunks for Assessment Manual' }));

    await waitFor(() => {
      expect(mockGetChunks).toHaveBeenCalledWith(10);
    });

    expect(
      await screen.findByText(/chunk browsing is live, but the current backend route can still return an empty list/i),
    ).toBeInTheDocument();
  });
});