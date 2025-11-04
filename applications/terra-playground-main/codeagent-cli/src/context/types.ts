/**
 * Metadata for a document chunk
 */
export interface ChunkMetadata {
  source: string;
  fileName: string;
  chunkIndex: number;
  language: string;
  timestamp: string;
}

/**
 * Code structure representation
 */
export interface CodeStructure {
  imports: CodeImport[];
  functions: CodeFunction[];
  classes: CodeClass[];
  variables: CodeVariable[];
}

export interface CodeEntity {
  type: string;
  text: string;
  position: {
    start: { row: number; column: number };
    end: { row: number; column: number };
  };
}

export interface CodeImport extends CodeEntity {
  type: 'import';
  module?: string;
}

export interface CodeFunction extends CodeEntity {
  type: 'function';
  name: string;
  signature: string;
  params?: string[];
  returnType?: string;
}

export interface CodeClass extends CodeEntity {
  type: 'class';
  name: string;
  methods?: CodeFunction[];
  properties?: CodeVariable[];
}

export interface CodeVariable extends CodeEntity {
  type: 'variable';
  name?: string;
  valueType?: string;
}

/**
 * Project context summary
 */
export interface ProjectSummary {
  fileCount: number;
  languages: { [key: string]: number };
  importDependencies: { [key: string]: number };
  codeMetrics: {
    totalFunctions: number;
    totalClasses: number;
    avgFunctionLength: number;
  };
}
