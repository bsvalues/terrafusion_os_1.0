import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addRow, createRow, selectRows, selectScore } from '../../store/compGrid/slice';
import { AppDispatch } from '../../store/types';

type Props = { parcelId: string };

export default function ComparableGrid({ parcelId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const rows = useSelector(selectRows);
  const score = useSelector(selectScore);
  const [showForm, setShowForm] = React.useState(false);
  const [address, setAddress] = React.useState('');
  const [price, setPrice] = React.useState<number | ''>('');
  const [error, setError] = React.useState<string | null>(null);

  async function onSave() {
    setError(null);
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    dispatch(addRow({ id: tempId, address, price: Number(price), optimistic: true }));
    const res = await dispatch(createRow({ tempId, address, price: Number(price) }));
    const { error: err } = (res as any).payload ?? {};
    if (err) setError('Could not save comparable');
    setShowForm(false);
    setAddress('');
    setPrice('');
  }

  return (
    <section aria-label="Comparable Grid">
      <button onClick={() => setShowForm(true)}>Add Comparable</button>

      {showForm && (
        <div role="dialog" aria-label="Add Comparable Dialog">
          <div><>

            <label htmlFor="addr">Address</label>
            <input
</>

id="addr" aria-label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div><>

            <label htmlFor="price">Sale Price</label>
            <input
</>

              id="price"
              aria-label="Sale Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <button onClick={onSave}>Save</button>
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      <table aria-label="Comparable Rows">
        <thead>
          <tr><th>Address</th><th>Sale Price</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} role="row" aria-label={r.address}><>

              <td>{r.address}</td>
              <td
</>

</>>
                <input
                  type="number"
                  defaultValue={r.price}
                  aria-label="Sale Price"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // (Inline edit stub; in real app dispatch update)
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div data-testid="score-summary">Score: {score}</div>
    </section>
  );
}