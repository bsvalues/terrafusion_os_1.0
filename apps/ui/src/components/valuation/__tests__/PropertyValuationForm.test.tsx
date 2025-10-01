import React from 'react';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderWithProviders} from '../../../../tests/utils/renderWithProviders';
import PropertyValuationForm, {PropertyValuationFormProps} from '../PropertyValuationForm';
import {axe} from 'jest-axe';
import {vi} from 'vitest';

function renderForm(props?: Partial<PropertyValuationFormProps>) {
  return renderWithProviders(
    <PropertyValuationForm
      parcelId={props?.parcelId ?? 'P-10001'}
      defaultBedrooms={props?.defaultBedrooms}
      defaultBathrooms={props?.defaultBathrooms}
      onSubmit={props?.onSubmit ?? vi.fn()}
      canEdit={props?.canEdit ?? true}
      featureFlags={props?.featureFlags ?? ['betaValuationFlow']} />
  );
}

describe('PropertyValuationForm', () => {it('renders initial state with required fields', async () => {
    renderForm({ defaultBedrooms: 3, defaultBathrooms: 2});
    expect(screen.getByLabelText(/bedrooms/i)).toHaveValue(3);
    expect(screen.getByLabelText(/bathrooms/i)).toHaveValue(2);
    expect(screen.getByRole('button', {name: /calculate/i})).toBeEnabled();
  });

  it('handles state transitions and async submit', async () => {const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: true});
    renderForm({onSubmit});

    await user.clear(screen.getByLabelText(/bedrooms/i));
    await user.type(screen.getByLabelText(/bedrooms/i), '4');
    await user.click(screen.getByRole('button', {name: /calculate/i}));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({parcelId: 'P-10001', bedrooms: 4})
    );
    expect(await screen.findByText(/valuation submitted/i)).toBeInTheDocument();
  });

  it('guards permissions (read-only when cannot edit)', async () => {renderForm({ canEdit: false});
    expect(screen.getByLabelText(/bedrooms/i)).toBeDisabled();
    expect(screen.getByRole('button', {name: /calculate/i})).toBeDisabled();
  });

  it('resilient to null/undefined props', () => {renderForm({ defaultBedrooms: undefined, defaultBathrooms: null as any});
    expect(screen.getByLabelText(/bedrooms/i)).toHaveValue(null);
    expect(screen.getByLabelText(/bathrooms/i)).toHaveValue(null);
  });

  it('has no basic accessibility violations', async () => {const { container} = renderForm();
    expect(await axe(container)).toHaveNoViolations();
  });
});
