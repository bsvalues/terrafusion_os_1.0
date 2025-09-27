import React, {useRef, useEffect, useState, useCallback} from 'react';
import * as monaco from 'monaco-editor';
import {Box, Paper, Toolbar, IconButton, Typography, CircularProgress} from '@mui/material';
import {PlayArrow, Stop, Save, Settings, BugReport} from '@mui/icons-material';
import {useAICompletion} from '../../hooks/useAICompletion';
import {useGovernmentCompliance} from '../../hooks/useGovernmentCompliance';
import {useSecureAPI} from '../../contexts/InfrastructureContext';
import {AttestationError, CircuitBreakerError} from '../../infrastructure/SecureAPIClient';

interface MonacoEditorProps {initialValue?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs-light' | 'terrafusion-government';
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  projectType?: 'government-module' | 'ai-agent' | 'rust-service' | 'dotnet-api' | 'python-ai';
  complianceMode?: boolean;}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({initialValue = '',
  language = 'typescript',
  theme = 'terrafusion-government',
  onChange,
  onSave,
  projectType = 'government-module',
  complianceMode = true,}) => {const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const { getAICompletion, isLoading: aiLoading} = useAICompletion();
  const {validateCompliance, complianceStatus} = useGovernmentCompliance();
  const secureAPI = useSecureAPI();

  // Custom TerraFusion theme
  useEffect(() => {monaco.editor.defineTheme('terrafusion-government', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic'},
        {token: 'keyword', foreground: '569CD6', fontStyle: 'bold'},
        {token: 'string', foreground: 'CE9178'},
        {token: 'number', foreground: 'B5CEA8'},
        {token: 'type', foreground: '4EC9B0'},
        {token: 'function', foreground: 'DCDCAA'},
        {token: 'variable', foreground: '9CDCFE'},
        {token: 'government-keyword', foreground: 'FFD700', fontStyle: 'bold'},
        {token: 'compliance-annotation', foreground: 'FF6B6B', fontStyle: 'underline'},
      ],
      colors: {'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2D2D30',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorCursor.foreground': '#AEAFAD',
        'editorWhitespace.foreground': '#404040',},
    });
  }, []);

  // Initialize Monaco Editor
  useEffect(() => {if (editorRef.current) {
      const editorInstance = monaco.editor.create(editorRef.current, {
        value: initialValue,
        language: language,
        theme: theme,
        automaticLayout: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
        fontLigatures: true,
        minimap: { enabled: true},
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        rulers: [80, 120],
        wordWrap: 'on',
        quickSuggestions: {other: true,
          comments: true,
          strings: true,},
        parameterHints: {enabled: true},
        formatOnPaste: true,
        formatOnType: true,
        tabCompletion: 'on',
      });

      // Register TerraFusion-specific languages
      registerTerraFusionLanguages();

      // Setup AI-powered code completion
      setupAICodeCompletion(editorInstance);

      // Setup government compliance validation
      if (complianceMode) {setupComplianceValidation(editorInstance);}

      // Setup change handler
      editorInstance.onDidChangeModelContent(() => {const value = editorInstance.getValue();
        onChange?.(value);});

      // Setup keyboard shortcuts
      setupKeyboardShortcuts(editorInstance);

      setEditor(editorInstance);

      return () => {editorInstance.dispose();};
    }
  }, [initialValue, language, theme]);

  const registerTerraFusionLanguages = () => {// Register Government Module DSL
    monaco.languages.register({ id: 'government-module'});
    monaco.languages.setMonarchTokensProvider('government-module', {tokenizer: {
        root: [
          [/\b(FISMA|NIST|Section508|compliance|audit|security)\b/, 'government-keyword'],
          [/@\w+/, 'compliance-annotation'],
          [/\b(module|service|controller|model|entity)\b/, 'keyword'],
          [/".*?"/, 'string'],
          [/\d+/, 'number'],
          [/\/\/.*$/, 'comment'],
        ],},
    });

    // Register AI Agent Configuration
    monaco.languages.register({id: 'ai-agent-config'});
    monaco.languages.setMonarchTokensProvider('ai-agent-config', {tokenizer: {
        root: [
          [/\b(agent|swarm|orchestration|coordination|intelligence)\b/, 'keyword'],
          [/\b(Supreme_Commander|Field_General|Operational_Agent)\b/, 'type'],
          [/".*?"/, 'string'],
          [/\d+/, 'number'],
        ],},
    });
  };

  const setupAICodeCompletion = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {// Custom completion provider with AI integration
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: async (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,});

        try {
          const aiSuggestions = await getAICompletion(textUntilPosition, language);

          const suggestions = aiSuggestions.map((suggestion: any, index: number) => ({
            label: suggestion.label,
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: suggestion.insertText,
            documentation: suggestion.documentation,
            detail: `AI Suggestion (${suggestion.confidence}% confidence)`,
            sortText: `0${index.toString().padStart(3, '0')}`,
            filterText: suggestion.filterText,
            additionalTextEdits: suggestion.additionalTextEdits || [],
          }));

          // Add TerraFusion-specific completions
          const terraFusionCompletions = getTerraFusionCompletions(textUntilPosition, language);

          return {suggestions: [...suggestions, ...terraFusionCompletions],};
        } catch (error: any) {
          if (error instanceof CircuitBreakerError) {
            console.error('Service temporarily unavailable:', error.state);
            // Handle circuit breaker error
          } else if (error instanceof AttestationError) {
            console.error('Security attestation failed:', error.message);
            // Handle attestation error
          } else {
            console.error('API call failed:', error);
          }
          return {
            suggestions: getTerraFusionCompletions(textUntilPosition, language)
          };
        }
      },
    });
  };

  const getTerraFusionCompletions = (text: string, lang: string) => {
    const completions = [];

    if (projectType === 'government-module') {
      completions.push(
        {
          label: 'FISMA Compliance Template',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            '// FISMA Compliance: ${1:requirement}',
            '// Classification: ${2:RED|YELLOW|GREEN}',
            '// Audit Trail: Required',
            'export class ${3:ComponentName} {',
            '  constructor() {',
            '    this.auditLog = new AuditLogger();',
            '    this.securityContext = new SecurityContext();',
            '  }',
            '  ',
            '  ${4:// Implementation}',
            '}',
          ].join('\n'),
          documentation: 'FISMA-compliant component template with audit logging',
          detail: 'TerraFusion Government Template',
        },
        {
          label: 'Government API Endpoint',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            '[Authorize(Roles = "GovernmentUser")]',
            '[HttpGet]',
            '[ProducesResponseType(typeof(${1:ResponseType}), 200)]',
            '[ProducesResponseType(400)]',
            'public async Task<IActionResult>${2:MethodName}()',
            '{',
            '  var auditContext = await _auditService.StartAudit();',
            '  try',
            '  {',
            '    ${3:// Implementation}',
            '    await _auditService.LogSuccess(auditContext);',
            '    return Ok(result);',
            '  }',
            '  catch (Exception ex) {',
            '    await _auditService.LogError(auditContext, ex);',
            '    return BadRequest();',
            '  }',
            '}',
          ].join('\n'),
          documentation: 'Government-compliant API endpoint with audit logging',
          detail: 'TerraFusion Government API',
        }
      );
    }

    if (projectType === 'ai-agent') {
      completions.push({
        label: 'AI Agent Base Class',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'class ${1:AgentName}(TerraFusionAgent):',
          '    def __init__(self, agent_id: str, commander: SupremeCommanderClaude):',
          '        super().__init__(agent_id, commander)',
          '        self.capabilities = ["${2:capability}"]',
          '        self.security_clearance = "${3:RED|YELLOW|GREEN}"',
          '    ',
          '    async def execute_task(self, task: Task) -> TaskResult:',
          '        """Execute government-compliant task with audit trail"""',
          '        await self.audit_task_start(task)',
          '        try:',
          '            result = await self.process_task(task)',
          '            await self.audit_task_success(task, result)',
          '            return result',
          '        except Exception as e:',
          '            await self.audit_task_error(task, e)',
          '            raise',
          '    ',
          '    async def process_task(self, task: Task) -> TaskResult:',
          '        """Override this method with agent-specific logic"""',
          '        pass',
        ].join('\n'),
        documentation: 'TerraFusion AI Agent base implementation with compliance',
        detail: 'TerraFusion AI Agent',
      });
    }

    return completions;
  };

  const setupComplianceValidation = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {// Real-time compliance validation
    let validationTimeout: NodeJS.Timeout;

    editorInstance.onDidChangeModelContent(() => {
      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(async () => {
        const code = editorInstance.getValue();
        try {
          const validation = await validateCompliance({
            code,
            language,
            projectType,
            standards: ['FISMA', 'NIST', 'Section508'],});

          // Clear existing markers
          monaco.editor.setModelMarkers(editorInstance.getModel()!, 'compliance', []);

          if (validation.violations?.length) {
            const markers = validation.violations.map((violation: any) => ({
              severity: monaco.MarkerSeverity.Warning,
              message: `Compliance Violation: ${violation.message}`,
              startLineNumber: violation.line,
              startColumn: violation.column,
              endLineNumber: violation.line,
              endColumn: violation.column + violation.length,
              source: 'TerraFusion Compliance',
            }));

            monaco.editor.setModelMarkers(editorInstance.getModel()!, 'compliance', markers);
          }
        } catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Compliance validation error:', error);
      }
      }, 1000);
    });
  };

  const setupKeyboardShortcuts = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {// Custom keyboard shortcuts
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();});

    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => {handleExecute();}
    );

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {handleAIAssist();});
  };

  const handleSave = useCallback(() => {if (editor) {
      const value = editor.getValue();
      onSave?.(value);}
  }, [editor, onSave]);

  const handleExecute = useCallback(async () => {if (!editor) return;

    setIsExecuting(true);
    try {
      const code = editor.getValue();
      // Execute code based on project type
      const result = await executeCode(code, language, projectType);
      console.log('Execution result:', result);} catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Execution error:', error);
      } finally {setIsExecuting(false);}
  }, [editor, language, projectType]);

  const handleAIAssist = useCallback(async () => {if (!editor) return;

    const selection = editor.getSelection();
    const selectedText = selection ? editor.getModel()?.getValueInRange(selection) : '';

    try {
      const assistance = await getAICompletion(selectedText || editor.getValue(), language);
      // Show AI assistance in a dialog or inline
      console.log('AI assistance:', assistance);} catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('AI assistance error:', error);
      }
  }, [editor, language, getAICompletion]);

  const executeCode = async (code: string, lang: string, type: string) => {// Implementation depends on project type
    const response = await secureAPI.get('terrafusion-backend', '/api/ide/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({code, language: lang, projectType: type}),
    });
    return response.data;
  };

  return (<Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column'}}><Toolbar variant='dense' sx={{ borderBottom: 1, borderColor: 'divider'}}><Typography variant='h6' component='div' sx={{ flexGrow: 1}}>TerraFusion IDE - {language.toUpperCase()} ({projectType})</Typography><IconButton onClick={handleSave} color='primary' title='Save (Ctrl+S)'><Save /></IconButton><IconButton
          onClick={handleExecute}
          color='success'
          disabled={isExecuting}
          title='Execute (Ctrl+Shift+P)'
        >{isExecuting ?<CircularProgress size={20} />:<PlayArrow />}
        </IconButton><IconButton onClick={handleAIAssist} color='secondary' title='AI Assist (Ctrl+J)'>{aiLoading ?<CircularProgress size={20} />:<BugReport />}
        </IconButton><IconButton color='inherit' title='Settings'><Settings /></IconButton></Toolbar><Box
        ref={editorRef}
        sx={{
          flexGrow: 1,
          '& .monaco-editor': {
            border: 'none',},
        }} />{complianceMode && complianceStatus && (<Box
          sx={{ p: 1, bgcolor: complianceStatus.isCompliant ? 'success.light' : 'warning.light'}}
        ><Typography variant='caption'>Compliance: {complianceStatus.isCompliant ? '✓ Compliant' : '⚠ Issues Found'}(
            {complianceStatus.score}% score)</Typography></Box>)}</Paper>
  );
};

export default MonacoEditor;
