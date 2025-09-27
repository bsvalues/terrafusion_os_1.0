import {describe, it, vi} from 'vitest';
import {render} from '@testing-library/react';

import {SourceNode, TransformNode, FilterNode, JoinNode, OutputNode} from './nodes';

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: vi.fn(),
    formState: { errors: {} },
    setValue: vi.fn(),
    watch: vi.fn(),
    reset: vi.fn(),
  }),
  Controller: ({render}: any) =>
    render({field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: 'test'},
      fieldState: {invalid: false, isTouched: false, isDirty: false, error: undefined},
      formState: { errors: {} },
    }),
}));

// Mock react-query
vi.mock('@tanstack/react-query', () => ({useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,}),
  useQuery: () => ({data: [],
    isLoading: false,
    error: null,}),
  useQueryClient: () => ({invalidateQueries: vi.fn(),}),
}));

// Default node props for all tests
const defaultNodeProps = {id: 'test-node',
  data: { label: 'Test Node'},
  type: 'test',
  position: {x: 0, y: 0},
  dragging: false,
  selected: false,
  isConnectable: true,
  zIndex: 1,
  width: 100,
  height: 50,
  dragHandle: '',
  extent: undefined,
  expandParent: false,
  focusable: true,
  hidden: false,
  parentNode: undefined,
  positionAbsolute: {x: 0, y: 0},
  resizing: false,
  sourcePosition: undefined,
  targetPosition: undefined,
  xPos: 0,
  yPos: 0,
};

describe('Pipeline Nodes', () => {
  it('renders SourceNode', () => {
    render(<SourceNode {...defaultNodeProps} />);
  });

  it('renders TransformNode', () => {
    render(<TransformNode {...defaultNodeProps} />);
  });

  it('renders FilterNode', () => {
    render(<FilterNode {...defaultNodeProps} />);
  });

  it('renders JoinNode', () => {
    render(<JoinNode {...defaultNodeProps} />);
  });

  it('renders OutputNode', () => {
    render(<OutputNode {...defaultNodeProps} />);
  });
});
