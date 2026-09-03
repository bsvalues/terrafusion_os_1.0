/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchCountyCsvUploadHistoryMock, uploadCountyCsvMock } = vi.hoisted(() => ({
  fetchCountyCsvUploadHistoryMock: vi.fn(),
  uploadCountyCsvMock: vi.fn(),
}));

vi.mock('../../../services/canon/countyCsvUpload', () => ({
  fetchCountyCsvUploadHistory: fetchCountyCsvUploadHistoryMock,
  uploadCountyCsv: uploadCountyCsvMock,
}));

import CountyCsvAdmissionPage from '../CountyCsvAdmissionPage';

const SPOKANE_ID = '00000000-0000-0000-0000-000000000032';

function renderRoute(path = '/counties/063/upload') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path='/counties/:countyCode/upload' element={<CountyCsvAdmissionPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('county CSV admission domain surface', () => {
  beforeEach(() => {
    fetchCountyCsvUploadHistoryMock.mockReset().mockResolvedValue({
      contractId: 'wal.county-upload.authenticated-durable-csv-api-admission.v1',
      countyId: SPOKANE_ID,
      countyKey: 'wa-spokane',
      countyName: 'Spokane',
      availability: 'admitted-not-staged',
      batches: [],
    });
    uploadCountyCsvMock.mockReset().mockResolvedValue({
      contractId: 'wal.county-upload.authenticated-durable-csv-api-admission.v1',
      ledgerContractId: 'wal.county-upload.durable-admission-ledger.v1',
      batchId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      countyId: SPOKANE_ID,
      countyKey: 'wa-spokane',
      countyName: 'Spokane',
      dataset: 'Sales',
      contentSha256: 'a'.repeat(64),
      contentLength: 64,
      acceptedRowCount: 2,
      duplicateDisposition: 'FirstSeen',
    });
  });

  it('admits a CSV only after the route county and authenticated county match', async () => {
    const batch = {
      batchId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      countyId: SPOKANE_ID,
      dataset: 'Sales',
      sourceFileName: 'spokane-sales.csv',
      contentSha256: 'a'.repeat(64),
      contentByteLength: 64,
      acceptedRowCount: 2,
      status: 'Admitted',
      receivedAtUtc: '2026-09-03T00:00:00Z',
    };
    fetchCountyCsvUploadHistoryMock
      .mockResolvedValueOnce({
        contractId: 'wal.county-upload.authenticated-durable-csv-api-admission.v1',
        countyId: SPOKANE_ID,
        countyKey: 'wa-spokane',
        countyName: 'Spokane',
        availability: 'admitted-not-staged',
        batches: [],
      })
      .mockResolvedValueOnce({
        contractId: 'wal.county-upload.authenticated-durable-csv-api-admission.v1',
        countyId: SPOKANE_ID,
        countyKey: 'wa-spokane',
        countyName: 'Spokane',
        availability: 'admitted-not-staged',
        batches: [batch],
      });

    renderRoute();
    expect(
      screen.getByRole('heading', { name: 'Spokane County CSV admission' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('county-csv-upload-panel')).toHaveTextContent(
      /check authenticated county/i
    );
    expect(
      screen.getByText(/does not yet stage, publish, or enable rows in TerraForge/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Check authenticated county' }));
    expect(await screen.findByText(/Authenticated for Spokane County/i)).toBeInTheDocument();

    const file = new File(['parcel_id,sale_price\n1,350000\n2,410000\n'], 'spokane-sales.csv', {
      type: 'text/csv',
    });
    fireEvent.change(screen.getByLabelText('Choose county CSV'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Admit county CSV' }));

    await waitFor(() => expect(uploadCountyCsvMock).toHaveBeenCalledWith(file, 'Sales'));
    expect(await screen.findByTestId('county-upload-receipt')).toHaveTextContent(
      /2 structurally valid rows/i
    );
    expect(await screen.findByTestId(`county-upload-batch-${batch.batchId}`)).toHaveTextContent(
      /spokane-sales.csv.*Sales.*2 structurally valid rows/i
    );
    expect(screen.getByText(/not staged or available to TerraForge/i)).toBeInTheDocument();
  });

  it('blocks controls when the authenticated county differs from the route county', async () => {
    fetchCountyCsvUploadHistoryMock.mockResolvedValueOnce({
      contractId: 'wal.county-upload.authenticated-durable-csv-api-admission.v1',
      countyId: '00000000-0000-0000-0000-000000000005',
      countyKey: 'wa-benton',
      countyName: 'Benton',
      availability: 'admitted-not-staged',
      batches: [],
    });

    renderRoute();
    fireEvent.click(screen.getByRole('button', { name: 'Check authenticated county' }));

    expect(await screen.findByText(/authenticated county is Benton County/i)).toHaveTextContent(
      /no data was uploaded/i
    );
    expect(screen.queryByRole('button', { name: 'Admit county CSV' })).not.toBeInTheDocument();
    expect(uploadCountyCsvMock).not.toHaveBeenCalled();
  });

  it('fails closed when the route is not a canonical Washington county code', () => {
    renderRoute('/counties/999/upload');
    expect(
      screen.getByText(/does not name one of Washington's 39 canonical county codes/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Check authenticated county' })
    ).not.toBeInTheDocument();
  });
});
