import * as React from 'react';

export type PropertyValuationFormProps = {
  parcelId: string;
  defaultBedrooms?: number | null;
  defaultBathrooms?: number | null;
  canEdit?: boolean;
  featureFlags?: string[];
  onSubmit?: (payload: { parcelId: string; bedrooms: number | null; bathrooms: number | null }) => Promise<any> | any;
};

export default function PropertyValuationForm(props: PropertyValuationFormProps) {
  const [bedrooms, setBedrooms] = React.useState<number | null>(
    props.defaultBedrooms === undefined ? null : (props.defaultBedrooms as any)
  );
  const [bathrooms, setBathrooms] = React.useState<number | null>(
    props.defaultBathrooms === undefined ? null : (props.defaultBathrooms as any)
  );
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const disabled = props.canEdit === false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await (props.onSubmit?.({ parcelId: props.parcelId, bedrooms, bathrooms }) ?? Promise.resolve());
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Property Valuation Form">
      <div><>

        <label htmlFor="bedrooms">Bedrooms</label>
        <input
</>

          id="bedrooms"
          name="bedrooms"
          type="number"
          aria-label="Bedrooms"
          value={bedrooms as any}
          onChange={(e) => setBedrooms(e.currentTarget.value === '' ? null : Number(e.currentTarget.value))}
          disabled={disabled}
        />
      </div>

      <div><>

        <label htmlFor="bathrooms">Bathrooms</label>
        <input
</>

          id="bathrooms"
          name="bathrooms"
          type="number"
          aria-label="Bathrooms"
          value={bathrooms as any}
          onChange={(e) => setBathrooms(e.currentTarget.value === '' ? null : Number(e.currentTarget.value))}
          disabled={disabled}
        />
      </div>

      <button type="submit" disabled={disabled || loading}>
        {loading ? 'Calculating…' : 'Calculate'}
      </button>

      {submitted && <p>Valuation submitted</p>}
    </form>
  );
}