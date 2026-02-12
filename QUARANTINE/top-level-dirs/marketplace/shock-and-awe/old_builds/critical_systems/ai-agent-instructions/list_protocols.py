#!/usr/bin/env python3
"""
list_protocols.py - Legendary CLI for listing, searching, and opening AI agent protocol docs

Usage:
  python list_protocols.py                # List all protocol docs with info
  python list_protocols.py search <term>  # Search protocol docs by keyword
  python list_protocols.py open <file>    # Open protocol doc in default editor

Legendary clarity and operational excellence by design.
"""
import os
import sys
import datetime
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
HISTORICAL = os.path.join(ROOT, 'historical-protocols')

PROTOCOLS = [
    ('README.md', 'Overview and usage of the AI Agent Instructions folder'),
    ('master-agent-protocols.md', 'Governance and escalation protocols for master AI agents'),
    ('subagent-swarm-build.md', 'Build and deployment instructions for subagent swarms'),
    ('deployment-strategies.md', 'Deployment, scaling, monitoring, and rollback strategies'),
    ('agent-roles.md', 'Definitions of agent and subagent roles and responsibilities'),
    ('INDEX.md', 'Canonical index of protocol documents'),
    ('CHANGELOG.md', 'Protocol update history and audit trail'),
]

HISTORICAL_PROTOCOLS = [
    ('historical-protocols/SWARM_MANIFEST.md', 'Legacy Claude Code Swarm Manifest (archival)'),
    ('historical-protocols/deploy_agent.sh', 'Legacy agent deployment script (archival)'),
]

def get_last_modified(path):
    try:
        ts = os.path.getmtime(path)
        return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
    except Exception:
        return 'N/A'

def list_protocols():
    print('\nLegendary AI Agent Protocols Index\n')
    print(f'%-40s  %-55s  %-16s' % ("File", "Purpose", "Last Modified"))
    print('-'*115)
    for fname, desc in PROTOCOLS:
        fpath = os.path.join(ROOT, fname)
        print(f'{fname:40}  {desc:55}  {get_last_modified(fpath):16}')
    for fname, desc in HISTORICAL_PROTOCOLS:
        fpath = os.path.join(ROOT, fname)
        print(f'{fname:40}  {desc:55}  {get_last_modified(fpath):16}')
    print('\nUse `python list_protocols.py search <term>` to search protocols.')
    print('Use `python list_protocols.py open <file>` to open a protocol doc.\n')

def search_protocols(term):
    print(f"\nSearching for '{term}' in protocol docs...\n")
    found = False
    for fname, desc in PROTOCOLS + HISTORICAL_PROTOCOLS:
        fpath = os.path.join(ROOT, fname)
        try:
            with open(fpath, encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()
                if term.lower() in content or term.lower() in desc.lower():
                    print(f'- {fname}: {desc}')
                    found = True
        except Exception:
            continue
    if not found:
        print('No matches found.')

def open_protocol(fname):
    fpath = os.path.join(ROOT, fname)
    if not os.path.exists(fpath):
        print(f'File not found: {fname}')
        return
    try:
        if sys.platform.startswith('win'):
            os.startfile(fpath)
        elif sys.platform.startswith('darwin'):
            subprocess.run(['open', fpath])
        else:
            subprocess.run(['xdg-open', fpath])
        print(f'Opened {fname} in default editor.')
    except Exception as e:
        print(f'Could not open file: {e}')

def main():
    if len(sys.argv) == 1:
        list_protocols()
    elif len(sys.argv) >= 3 and sys.argv[1] == 'search':
        search_protocols(' '.join(sys.argv[2:]))
    elif len(sys.argv) == 3 and sys.argv[1] == 'open':
        open_protocol(sys.argv[2])
    else:
        print(__doc__)

if __name__ == '__main__':
    main()
