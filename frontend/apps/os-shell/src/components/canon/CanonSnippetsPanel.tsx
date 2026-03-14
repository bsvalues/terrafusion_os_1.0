import React, { useCallback, useEffect, useState } from 'react';
import { fetchSnippets, type CanonSnippet } from '../../api/canonFs';

interface CanonSnippetsPanelProps {
  onInsert?: (body: string) => void;
}

export const CanonSnippetsPanel: React.FC<CanonSnippetsPanelProps> = ({ onInsert }) => {
  const [snippets, setSnippets] = useState<CanonSnippet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newLanguage, setNewLanguage] = useState('typescript');
  const [newPrefix, setNewPrefix] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadSnippets = useCallback(async () => {
    setLoading(true);
    const result = await fetchSnippets('list');
    if (result.error) {
      setError(result.error);
    } else {
      setSnippets(result.snippets);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  const handleCreate = async () => {
    if (!newName.trim() || !newBody.trim()) return;
    const result = await fetchSnippets('create', {
      name: newName.trim(),
      language: newLanguage,
      prefix: newPrefix.trim(),
      body: newBody,
      description: newDescription.trim(),
    } as Partial<CanonSnippet>);
    if (result.error) {
      setError(result.error);
    } else {
      setSnippets(result.snippets);
      setError(null);
      setShowCreate(false);
      setNewName('');
      setNewPrefix('');
      setNewBody('');
      setNewDescription('');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await fetchSnippets('delete', { id } as Partial<CanonSnippet>);
    if (result.error) {
      setError(result.error);
    } else {
      setSnippets(result.snippets);
      setError(null);
    }
  };

  const handleInsert = async (id: string) => {
    const result = await fetchSnippets('insert', { id } as Partial<CanonSnippet>);
    if (result.error) {
      setError(result.error);
    } else if (result.inserted && onInsert) {
      onInsert(result.inserted);
    }
  };

  // Group snippets by language
  const grouped = snippets.reduce<Record<string, CanonSnippet[]>>((acc, s) => {
    const lang = s.language || 'plaintext';
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(s);
    return acc;
  }, {});

  const sortedLangs = Object.keys(grouped).sort();

  return (
    <div className='canon-snippets-panel'>
      <div className='canon-snippets-panel__header'>
        <span className='canon-snippets-panel__title'>Snippets</span>
        <button
          className='canon-snippets-panel__add-btn'
          onClick={() => setShowCreate(!showCreate)}
          title={showCreate ? 'Cancel' : 'New Snippet'}
        >
          {showCreate ? '✕' : '+'}
        </button>
      </div>

      {error && <div className='canon-snippets-panel__error'>{error}</div>}

      {showCreate && (
        <div className='canon-snippets-panel__create-form'>
          <input
            className='canon-snippets-panel__input'
            placeholder='Snippet name'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className='canon-snippets-panel__input'
            placeholder='Prefix (trigger)'
            value={newPrefix}
            onChange={(e) => setNewPrefix(e.target.value)}
          />
          <select
            className='canon-snippets-panel__select'
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
          >
            <option value='typescript'>TypeScript</option>
            <option value='javascript'>JavaScript</option>
            <option value='python'>Python</option>
            <option value='csharp'>C#</option>
            <option value='html'>HTML</option>
            <option value='css'>CSS</option>
            <option value='json'>JSON</option>
            <option value='sql'>SQL</option>
            <option value='plaintext'>Plain Text</option>
          </select>
          <textarea
            className='canon-snippets-panel__textarea'
            placeholder='Snippet body'
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={4}
          />
          <input
            className='canon-snippets-panel__input'
            placeholder='Description (optional)'
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button
            className='canon-snippets-panel__create-btn'
            onClick={handleCreate}
            disabled={!newName.trim() || !newBody.trim()}
          >
            Create Snippet
          </button>
        </div>
      )}

      {loading && snippets.length === 0 && (
        <div className='canon-snippets-panel__empty'>Loading…</div>
      )}

      {!loading && snippets.length === 0 && !showCreate && (
        <div className='canon-snippets-panel__empty'>
          No snippets yet. Click <strong>+</strong> to create one.
        </div>
      )}

      {sortedLangs.map((lang) => (
        <div key={lang} className='canon-snippets-panel__group'>
          <div className='canon-snippets-panel__group-header'>
            <span className='canon-snippets-panel__lang-badge'>{lang}</span>
            <span className='canon-snippets-panel__group-count'>{grouped[lang].length}</span>
          </div>
          {grouped[lang].map((snippet) => (
            <div key={snippet.id} className='canon-snippets-panel__item'>
              <div className='canon-snippets-panel__item-header'>
                <span className='canon-snippets-panel__item-name' title={snippet.description || snippet.name}>
                  {snippet.name}
                </span>
                {snippet.prefix && (
                  <code className='canon-snippets-panel__item-prefix'>{snippet.prefix}</code>
                )}
              </div>
              <div className='canon-snippets-panel__item-preview'>
                {snippet.body.split('\n')[0].slice(0, 60)}
                {snippet.body.length > 60 ? '…' : ''}
              </div>
              <div className='canon-snippets-panel__item-actions'>
                <button
                  className='canon-snippets-panel__action-btn canon-snippets-panel__action-btn--insert'
                  onClick={() => handleInsert(snippet.id)}
                  title='Insert into editor'
                >
                  Insert
                </button>
                <button
                  className='canon-snippets-panel__action-btn canon-snippets-panel__action-btn--delete'
                  onClick={() => handleDelete(snippet.id)}
                  title='Delete snippet'
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CanonSnippetsPanel;
