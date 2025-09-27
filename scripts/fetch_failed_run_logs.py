#!/usr/bin/env python3
"""Fetch the latest workflow run for a branch and download logs for failed jobs.

Usage:
  export GITHUB_TOKEN=ghp_xxx  # optional but recommended
  python3 scripts/fetch_failed_run_logs.py --branch feature/disable-marketplace-default

Outputs:
  run-logs-<run id>/ with job log files if download succeeds.
"""
import os,sys,requests,argparse,zipfile,io

API='https://api.github.com'
REPO='bsvalues/terrafusion_os_1.0'

def api_get(path,params=None,token=None):
    headers={'Accept':'application/vnd.github+json'}
    if token:
        headers['Authorization']=f'token {token}'
    r=requests.get(f'{API}/repos/{REPO}{path}',params=params,headers=headers)
    r.raise_for_status()
    return r.json()


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--branch',required=True)
    args=p.parse_args()
    token=os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')

    # list workflow runs for branch
    runs=api_get(f'/actions/runs',params={'branch':args.branch,'per_page':5},token=token)
    if 'workflow_runs' not in runs or len(runs['workflow_runs'])==0:
        print('no runs found for branch',args.branch)
        return
    latest=runs['workflow_runs'][0]
    print('found run id',latest['id'],'status',latest['status'],'conclusion',latest.get('conclusion'))
    if latest.get('conclusion')=='success':
        print('latest run succeeded; nothing to download')
        return
    run_id=latest['id']
    # download logs
    logs_url=f'{API}/repos/{REPO}/actions/runs/{run_id}/logs'
    headers={'Accept':'application/vnd.github+json'}
    if token:
        headers['Authorization']=f'token {token}'
    lr=requests.get(logs_url,headers=headers,stream=True)
    if lr.status_code!=200:
        print('failed to download logs',lr.status_code,lr.text)
        return
    z=zipfile.ZipFile(io.BytesIO(lr.content))
    outdir=f'run-logs-{run_id}'
    os.makedirs(outdir,exist_ok=True)
    z.extractall(outdir)
    print('extracted logs to',outdir)

if __name__=='__main__':
    main()
