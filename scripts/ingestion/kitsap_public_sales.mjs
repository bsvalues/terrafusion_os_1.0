#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import {
  access,
  link,
  mkdir,
  open,
  readFile,
  readlink,
  realpath,
  rm,
  stat,
} from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import XLSX from 'xlsx';

XLSX.set_fs(fs);

const COUNTY = 'Kitsap';
const COUNTY_CODE = '035';
const SOURCE_URL = 'https://www.kitsap.gov/assessor/Documents/Residential_Sales_2021-2026.xlsx';
const SOURCE_BASE_URL = 'https://www.kitsap.gov/assessor/';
const SOURCE_MODE = 'public_assessor_workbook';
const SOURCE_NAME = 'kitsap-official-residential-sales';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const REFRESH_JOURNAL_SCHEMA = 'terrafusion.washington.package-refresh.v1';
const FILESYSTEM_MUTEX_PROTOCOL = 'terrafusion.filesystem-refresh-mutex.v1';
const WINDOWS_DIRECTORY_FLUSH_TYPE =
  'using System; using System.ComponentModel; using Microsoft.Win32.SafeHandles; using System.Runtime.InteropServices; public static class TerraFusionDirectoryDurability { [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern SafeFileHandle CreateFileW(string path, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template); [DllImport("kernel32.dll", SetLastError=true)] static extern bool FlushFileBuffers(SafeFileHandle handle); public static void Flush(string path) { using (var handle = CreateFileW(path, 0x40000000, 0x7, IntPtr.Zero, 3, 0x02000000, IntPtr.Zero)) { if (handle.IsInvalid) throw new Win32Exception(Marshal.GetLastWin32Error()); if (!FlushFileBuffers(handle)) throw new Win32Exception(Marshal.GetLastWin32Error()); } } }';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const OPERATION_ID_PATTERN =
  /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const heldRefreshAcquisitionMutexes = new Map();

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function syncDirectory(path) {
  if (process.platform === 'win32') {
    const canonicalPath = resolve(path);
    const heldEntry = [...heldRefreshAcquisitionMutexes.entries()].find(
      ([outputRoot, state]) =>
        state?.child &&
        !state.releasing &&
        !state.lostError &&
        (canonicalPath === dirname(outputRoot) ||
          canonicalPath === outputRoot ||
          canonicalPath.startsWith(`${outputRoot}${sep}`))
    );
    if (heldEntry) {
      const [outputRoot, state] = heldEntry;
      await runRefreshMutexMutation(outputRoot, state.operationId, {
        op: 'syncDir',
        path: canonicalPath,
      });
      return;
    }
    const powershell = join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe'
    );
    execFileSync(
      powershell,
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Add-Type -TypeDefinition $env:TF_DIRECTORY_FLUSH_TYPE; [TerraFusionDirectoryDurability]::Flush($env:TF_DIRECTORY_TO_FLUSH)',
      ],
      {
        env: {
          ...process.env,
          TF_DIRECTORY_FLUSH_TYPE: WINDOWS_DIRECTORY_FLUSH_TYPE,
          TF_DIRECTORY_TO_FLUSH: canonicalPath,
        },
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: true,
      }
    );
    return;
  }
  let handle;
  try {
    handle = await open(path, 'r');
    await handle.sync();
  } finally {
    await handle?.close();
  }
}

async function writeDurableFile(path, contents) {
  const handle = await open(path, 'wx', 0o644);
  try {
    await handle.writeFile(contents, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(dirname(path));
}

function readProcessIdentity(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return null;
  try {
    if (process.platform === 'win32') {
      const powershell = join(
        process.env.SystemRoot ?? 'C:\\Windows',
        'System32',
        'WindowsPowerShell',
        'v1.0',
        'powershell.exe'
      );
      const startedAt = execFileSync(
        powershell,
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().ToString('o')`,
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }
      ).trim();
      return startedAt ? `windows-start:${startedAt}` : null;
    }
    if (process.platform === 'linux') {
      const processStat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
      const bootId = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
      const closingParenthesis = processStat.lastIndexOf(')');
      if (closingParenthesis < 0 || !bootId) return null;
      const fieldsAfterCommand = processStat
        .slice(closingParenthesis + 2)
        .trim()
        .split(/\s+/);
      const startTicks = fieldsAfterCommand[19];
      return startTicks ? `linux-boot:${bootId}:start-ticks:${startTicks}` : null;
    }
    if (process.platform === 'darwin') {
      const startedAt = execFileSync('/bin/ps', ['-o', 'lstart=', '-p', String(pid)], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      return startedAt ? `darwin-start:${startedAt}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function canonicalizePackageOutputRoot(outputPath) {
  const outputRoot = resolve(outputPath);
  await mkdir(dirname(outputRoot), { recursive: true });
  try {
    return await realpath(outputRoot);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  try {
    const linkTarget = await readlink(outputRoot);
    const resolvedTarget = resolve(dirname(outputRoot), linkTarget);
    try {
      return await realpath(resolvedTarget);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      return join(await realpath(dirname(resolvedTarget)), basename(resolvedTarget));
    }
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'EINVAL') throw error;
  }
  return join(await realpath(dirname(outputRoot)), basename(outputRoot));
}

function startRefreshAcquisitionMutexProcess(mutexPath) {
  if (process.platform === 'linux') {
    const helper = [
      'const fs=require("node:fs/promises")',
      'const readline=require("node:readline")',
      'const rl=readline.createInterface({input:process.stdin})',
      'process.stdout.write("LOCKED\\n")',
      'rl.on("line",async line=>{',
      'if(line==="RELEASE"){process.exit(0);return}',
      'let command',
      'try{command=JSON.parse(line);let result=null;if(command.op==="rename")await fs.rename(command.source,command.target);else if(command.op==="renameIfExists")try{await fs.rename(command.source,command.target)}catch(error){if(error.code!=="ENOENT")throw error}else if(command.op==="restoreFenced"){try{await fs.access(command.target);result=false}catch(error){if(error.code!=="ENOENT")throw error;await fs.rename(command.source,command.target);result=true}}else if(command.op==="rm")await fs.rm(command.path,{recursive:Boolean(command.recursive),force:Boolean(command.force)});else if(command.op==="delay")await new Promise(resolve=>setTimeout(resolve,command.milliseconds));else throw new Error("unsupported mutation");process.stdout.write(JSON.stringify({id:command.id,ok:true,result})+"\\n")}catch(error){process.stdout.write(JSON.stringify({id:command?.id,ok:false,message:error.message,code:error.code??null})+"\\n")}',
      '})',
    ].join(';');
    return spawn('flock', ['-F', '-x', mutexPath, process.execPath, '-e', helper], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }
  if (process.platform === 'win32') {
    const powershell = join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe'
    );
    const helper = [
      'Add-Type -TypeDefinition $env:TF_DIRECTORY_FLUSH_TYPE',
      '$stream = $null',
      'for ($attempt = 0; $attempt -lt 1200; $attempt += 1) {',
      '  try {',
      '    $stream = [System.IO.File]::Open($env:TF_KITSAP_MUTEX_PATH, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)',
      '    break',
      '  } catch [System.IO.IOException] { Start-Sleep -Milliseconds 50 }',
      '}',
      'if ($null -eq $stream) { [Console]::Error.WriteLine("mutex remained busy"); exit 75 }',
      '[Console]::Out.WriteLine("LOCKED")',
      '[Console]::Out.Flush()',
      'while (($line = [Console]::In.ReadLine()) -ne $null) {',
      '  if ($line -eq "RELEASE") { break }',
      '  $command = $null',
      '  $result = $null',
      '  try {',
      '    $command = $line | ConvertFrom-Json',
      '    if ($command.op -eq "rename") {',
      '      if ([System.IO.Directory]::Exists($command.source)) { [System.IO.Directory]::Move($command.source, $command.target) } elseif ([System.IO.File]::Exists($command.source)) { [System.IO.File]::Move($command.source, $command.target) } else { throw "source path does not exist" }',
      '    } elseif ($command.op -eq "renameIfExists") {',
      '      if ([System.IO.Directory]::Exists($command.source)) { [System.IO.Directory]::Move($command.source, $command.target) } elseif ([System.IO.File]::Exists($command.source)) { [System.IO.File]::Move($command.source, $command.target) }',
      '    } elseif ($command.op -eq "restoreFenced") {',
      '      if ([System.IO.Directory]::Exists($command.target) -or [System.IO.File]::Exists($command.target)) { $result = $false } elseif ([System.IO.Directory]::Exists($command.source)) { [System.IO.Directory]::Move($command.source, $command.target); $result = $true } elseif ([System.IO.File]::Exists($command.source)) { [System.IO.File]::Move($command.source, $command.target); $result = $true } else { throw "fenced source path does not exist" }',
      '    } elseif ($command.op -eq "rm") {',
      '      if ([System.IO.Directory]::Exists($command.path)) { [System.IO.Directory]::Delete($command.path, [bool]$command.recursive) } elseif ([System.IO.File]::Exists($command.path)) { [System.IO.File]::Delete($command.path) } elseif (-not [bool]$command.force) { throw "path does not exist" }',
      '    } elseif ($command.op -eq "delay") {',
      '      Start-Sleep -Milliseconds ([int]$command.milliseconds)',
      '    } elseif ($command.op -eq "syncDir") {',
      '      [TerraFusionDirectoryDurability]::Flush($command.path)',
      '    } else { throw "unsupported mutation" }',
      '    [Console]::Out.WriteLine((@{ id = $command.id; ok = $true; result = $result } | ConvertTo-Json -Compress))',
      '  } catch {',
      '    [Console]::Out.WriteLine((@{ id = $command.id; ok = $false; message = $_.Exception.Message } | ConvertTo-Json -Compress))',
      '  }',
      '  [Console]::Out.Flush()',
      '}',
      '$stream.Dispose()',
    ].join('; ');
    return spawn(powershell, ['-NoProfile', '-NonInteractive', '-Command', helper], {
      env: {
        ...process.env,
        TF_DIRECTORY_FLUSH_TYPE: WINDOWS_DIRECTORY_FLUSH_TYPE,
        TF_KITSAP_MUTEX_PATH: mutexPath,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }
  throw new Error(
    `Kitsap package refresh has no filesystem-scoped mutex implementation for ${process.platform}.`
  );
}

async function acquireRefreshAcquisitionMutex(outputRoot) {
  const mutexPath = `${outputRoot}.refresh.acquire.lock`;
  const child = startRefreshAcquisitionMutexProcess(mutexPath);
  let stderr = '';
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });
  await new Promise((resolveReady, rejectReady) => {
    let stdout = '';
    const timeout = setTimeout(() => {
      child.kill();
      rejectReady(new Error('Kitsap package refresh acquisition mutex timed out.'));
    }, 60_000);
    const finish = callback => value => {
      clearTimeout(timeout);
      child.stdout.removeAllListeners('data');
      child.removeAllListeners('error');
      child.removeAllListeners('exit');
      callback(value);
    };
    const resolve = finish(resolveReady);
    const reject = finish(rejectReady);
    child.once('error', reject);
    child.once('exit', code =>
      reject(
        new Error(
          `Kitsap package refresh acquisition mutex exited before locking (${code}): ${stderr.trim()}`
        )
      )
    );
    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
      if (/LOCKED\r?\n/.test(stdout)) resolve(child);
    });
  });
  return child;
}

function monitorRefreshAcquisitionMutex(outputRoot, operationId, child) {
  const state = {
    operationId,
    child,
    releasing: false,
    lostError: null,
    nextCommandId: 1,
    pendingCommands: new Map(),
  };
  const markLost = detail => {
    if (!state.releasing && !state.lostError) {
      state.lostError = new Error(`Kitsap package refresh filesystem mutex was lost${detail}.`);
      for (const pending of state.pendingCommands.values()) {
        clearTimeout(pending.timeout);
        pending.reject(state.lostError);
      }
      state.pendingCommands.clear();
    }
  };
  state.markLost = markLost;
  state.lines = createInterface({ input: child.stdout });
  state.lines.on('line', line => {
    let response;
    try {
      response = JSON.parse(line);
    } catch {
      markLost(' because its mutation response was invalid');
      return;
    }
    const pending = state.pendingCommands.get(response.id);
    if (!pending) return;
    state.pendingCommands.delete(response.id);
    clearTimeout(pending.timeout);
    if (response.ok) pending.resolve(response.result);
    else {
      const error = new Error(`Kitsap package refresh filesystem mutation failed: ${response.message}`);
      if (response.code) error.code = response.code;
      pending.reject(error);
    }
  });
  child.once('error', error => markLost(`: ${error.message}`));
  child.once('exit', (code, signal) =>
    markLost(` (exit ${code ?? 'null'}, signal ${signal ?? 'none'})`)
  );
  heldRefreshAcquisitionMutexes.set(outputRoot, state);
  return state;
}

async function runRefreshMutexMutation(outputRoot, operationId, mutation, timeoutMs = 60_000) {
  const state = assertRefreshAcquisitionMutexHeld(outputRoot, operationId);
  const id = state.nextCommandId;
  state.nextCommandId += 1;
  const result = await new Promise((resolveMutation, rejectMutation) => {
    const timeout = setTimeout(() => {
      state.markLost(' after a filesystem mutation timed out');
      state.child.kill();
    }, timeoutMs);
    state.pendingCommands.set(id, {
      resolve: resolveMutation,
      reject: rejectMutation,
      timeout,
    });
    state.child.stdin.write(`${JSON.stringify({ id, ...mutation })}\n`, error => {
      if (!error) return;
      clearTimeout(timeout);
      state.pendingCommands.delete(id);
      rejectMutation(error);
    });
  });
  assertRefreshAcquisitionMutexHeld(outputRoot, operationId);
  return result;
}

function assertRefreshAcquisitionMutexHeld(outputRoot, operationId) {
  const state = heldRefreshAcquisitionMutexes.get(outputRoot);
  invariant(
    state?.operationId === operationId &&
      state.child &&
      !state.releasing &&
      !state.lostError &&
      !state.child.killed &&
      state.child.exitCode === null &&
      state.child.signalCode === null,
    state?.lostError?.message ?? 'Kitsap package refresh filesystem mutex ownership changed.'
  );
  return state;
}

async function releaseRefreshAcquisitionMutex(child) {
  if (!child) return;
  if (child.exitCode !== null || child.signalCode !== null) {
    invariant(
      child.exitCode === 0 && child.signalCode === null,
      `Kitsap package refresh acquisition mutex exited with ${child.exitCode ?? 'null'} (${child.signalCode ?? 'no signal'}).`
    );
    return;
  }
  const waitForExit = timeoutMs =>
    new Promise((resolveExit, rejectExit) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolveExit({ code: child.exitCode, signal: child.signalCode });
        return;
      }
      let timeout;
      const cleanup = () => {
        clearTimeout(timeout);
        child.removeListener('error', onError);
        child.removeListener('exit', onExit);
      };
      const onError = error => {
        cleanup();
        rejectExit(error);
      };
      const onExit = (code, signal) => {
        cleanup();
        resolveExit({ code, signal });
      };
      timeout = setTimeout(() => {
        cleanup();
        resolveExit(null);
      }, timeoutMs);
      child.once('error', onError);
      child.once('exit', onExit);
    });

  if (!child.killed) child.stdin.end('RELEASE\n');
  let exit = await waitForExit(5_000);
  if (!exit) {
    child.kill('SIGKILL');
    exit = await waitForExit(5_000);
  }
  invariant(exit, 'Kitsap package refresh acquisition mutex did not terminate after escalation.');
  invariant(
    exit.code === 0 && exit.signal === null,
    `Kitsap package refresh acquisition mutex exited with ${exit.code ?? 'null'} (${exit.signal ?? 'no signal'}).`
  );
}

async function readRefreshLockOwner(lockPath) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const lockStat = await stat(lockPath);
      const ownerPath = lockStat.isDirectory() ? join(lockPath, 'owner.json') : lockPath;
      return JSON.parse(await readFile(ownerPath, 'utf8'));
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error?.code) && !(error instanceof SyntaxError)) {
        throw error;
      }
      await new Promise(resolveDelay => setTimeout(resolveDelay, 50));
    }
  }
  return null;
}

function isSameRefreshLockOwner(left, right) {
  return (
    left?.operationId === right?.operationId &&
    left?.ownerPid === right?.ownerPid &&
    left?.ownerProcessIdentity === right?.ownerProcessIdentity &&
    left?.mutexProtocol === right?.mutexProtocol
  );
}

async function restoreUnexpectedFencedLock(outputRoot, operationId, staleLockPath, lockPath) {
  try {
    const restored = await runRefreshMutexMutation(outputRoot, operationId, {
      op: 'restoreFenced',
      source: staleLockPath,
      target: lockPath,
    });
    await syncDirectory(dirname(lockPath));
    return restored;
  } catch (error) {
    if (
      ['EACCES', 'EEXIST', 'EISDIR', 'ENOENT', 'ENOTDIR', 'ENOTEMPTY', 'EPERM'].includes(
        error?.code
      )
    ) {
      return false;
    }
    throw error;
  }
}

export async function acquirePackageRefreshLock(outputPath, operationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  const lockPath = `${outputRoot}.refresh.lock`;
  const claimPath = `${lockPath}.claim-${operationId}.json`;
  invariant(
    OPERATION_ID_PATTERN.test(operationId),
    'Kitsap package refresh operation ID is invalid.'
  );
  const ownerProcessIdentity = readProcessIdentity(process.pid);
  invariant(
    ownerProcessIdentity,
    'Kitsap package refresh cannot establish the current process identity.'
  );
  const existingMutex = heldRefreshAcquisitionMutexes.get(outputRoot);
  invariant(!existingMutex, `Kitsap package refresh is already running under PID ${process.pid}.`);
  heldRefreshAcquisitionMutexes.set(outputRoot, { operationId, child: null });

  let acquisitionMutex;
  let lockAcquired = false;
  try {
    await writeDurableFile(
      claimPath,
      `${JSON.stringify({
        operationId,
        ownerPid: process.pid,
        ownerProcessIdentity,
        mutexProtocol: FILESYSTEM_MUTEX_PROTOCOL,
      })}\n`
    );
    acquisitionMutex = await acquireRefreshAcquisitionMutex(outputRoot);
    monitorRefreshAcquisitionMutex(outputRoot, operationId, acquisitionMutex);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        await link(claimPath, lockPath);
        await syncDirectory(dirname(lockPath));
        lockAcquired = true;
        return lockPath;
      } catch (error) {
        if (!(await pathExists(lockPath))) throw error;
      }

      const owner = await readRefreshLockOwner(lockPath);
      if (!owner) {
        if (!(await pathExists(lockPath))) continue;
        throw new Error(
          'Kitsap package refresh lock owner cannot be verified; the lock remains fenced.'
        );
      }
      if (!OPERATION_ID_PATTERN.test(owner.operationId)) {
        throw new Error(
          'Kitsap package refresh lock operation ID is invalid; the lock remains fenced.'
        );
      }
      if (!Number.isSafeInteger(owner.ownerPid) || owner.ownerPid <= 0) {
        throw new Error(
          'Kitsap package refresh lock owner PID is invalid; the lock remains fenced.'
        );
      }
      if (owner.mutexProtocol !== FILESYSTEM_MUTEX_PROTOCOL) {
        throw new Error(
          'Kitsap package refresh legacy lock has no filesystem-mutex proof; the lock remains fenced.'
        );
      }

      const staleLockPath = `${lockPath}.stale-${operationId}`;
      try {
        await runRefreshMutexMutation(outputRoot, operationId, {
          op: 'rename',
          source: lockPath,
          target: staleLockPath,
        });
        await syncDirectory(dirname(lockPath));
      } catch (error) {
        if (error?.code === 'ENOENT') continue;
        throw error;
      }

      const fencedOwner = await readRefreshLockOwner(staleLockPath);
      if (!isSameRefreshLockOwner(fencedOwner, owner)) {
        const restored = await restoreUnexpectedFencedLock(
          outputRoot,
          operationId,
          staleLockPath,
          lockPath
        );
        throw new Error(
          restored
            ? 'Kitsap package refresh lock changed during stale-owner fencing and was restored.'
            : 'Kitsap package refresh lock changed during stale-owner fencing and remains fenced.'
        );
      }
      await runRefreshMutexMutation(outputRoot, operationId, {
        op: 'rm',
        path: staleLockPath,
        recursive: true,
        force: true,
      });
      await syncDirectory(dirname(lockPath));
    }
    throw new Error('Kitsap package refresh lock could not be acquired.');
  } finally {
    await rm(claimPath, { force: true });
    await syncDirectory(dirname(lockPath));
    if (!lockAcquired) {
      try {
        await releaseRefreshAcquisitionMutex(acquisitionMutex);
      } finally {
        if (heldRefreshAcquisitionMutexes.get(outputRoot)?.operationId === operationId) {
          heldRefreshAcquisitionMutexes.delete(outputRoot);
        }
      }
    }
  }
}

async function assertRefreshLockOwner(outputRoot, operationId) {
  assertRefreshAcquisitionMutexHeld(outputRoot, operationId);
  const lock = JSON.parse(await readFile(`${outputRoot}.refresh.lock`, 'utf8'));
  const ownerProcessIdentity = readProcessIdentity(process.pid);
  invariant(
    lock?.operationId === operationId &&
      lock.ownerPid === process.pid &&
      ownerProcessIdentity &&
      lock.ownerProcessIdentity === ownerProcessIdentity,
    'Kitsap package refresh lock ownership changed.'
  );
  assertRefreshAcquisitionMutexHeld(outputRoot, operationId);
}

export async function terminatePackageRefreshMutexForTest(outputPath, operationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  const state = assertRefreshAcquisitionMutexHeld(outputRoot, operationId);
  const exited = new Promise(resolveExit => {
    if (state.child.exitCode !== null || state.child.signalCode !== null) resolveExit();
    else state.child.once('exit', resolveExit);
  });
  state.child.kill();
  await exited;
}

export async function timeoutPackageRefreshMutexForTest(outputPath, operationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  await runRefreshMutexMutation(
    outputRoot,
    operationId,
    { op: 'delay', milliseconds: 200 },
    10
  );
}

export async function assertPackageRefreshLockHeld(outputPath, operationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  await assertRefreshLockOwner(outputRoot, operationId);
}

export async function releasePackageRefreshLock(outputPath, operationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  const heldMutex = heldRefreshAcquisitionMutexes.get(outputRoot);
  invariant(
    heldMutex?.operationId === operationId && heldMutex.child,
    'Kitsap package refresh filesystem mutex ownership changed.'
  );
  try {
    await assertRefreshLockOwner(outputRoot, operationId);
    await runRefreshMutexMutation(outputRoot, operationId, {
      op: 'rm',
      path: `${outputRoot}.refresh.lock`,
      recursive: true,
      force: true,
    });
    await syncDirectory(dirname(outputRoot));
  } finally {
    heldMutex.releasing = true;
    heldRefreshAcquisitionMutexes.delete(outputRoot);
    await releaseRefreshAcquisitionMutex(heldMutex.child);
  }
}

export async function recoverInterruptedPackageRefresh(outputPath, ownerOperationId) {
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  await assertRefreshLockOwner(outputRoot, ownerOperationId);
  const journalPath = `${outputRoot}.refresh.json`;
  if (!(await pathExists(journalPath))) return false;

  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  invariant(
    journal?.schemaVersion === REFRESH_JOURNAL_SCHEMA &&
      OPERATION_ID_PATTERN.test(journal.operationId),
    'Kitsap package refresh journal is invalid.'
  );

  const temporaryRoot = `${outputRoot}.tmp-${journal.operationId}`;
  const backupRoot = `${outputRoot}.bak-${journal.operationId}`;
  if (!(await pathExists(outputRoot))) {
    if (await pathExists(backupRoot)) {
      await runRefreshMutexMutation(outputRoot, ownerOperationId, {
        op: 'rename',
        source: backupRoot,
        target: outputRoot,
      });
    } else if (await pathExists(temporaryRoot)) {
      await runRefreshMutexMutation(outputRoot, ownerOperationId, {
        op: 'rename',
        source: temporaryRoot,
        target: outputRoot,
      });
    } else {
      throw new Error('Kitsap package refresh cannot recover its published package.');
    }
    await syncDirectory(dirname(outputRoot));
  }

  await runRefreshMutexMutation(outputRoot, ownerOperationId, {
    op: 'rm',
    path: backupRoot,
    recursive: true,
    force: true,
  });
  await runRefreshMutexMutation(outputRoot, ownerOperationId, {
    op: 'rm',
    path: temporaryRoot,
    recursive: true,
    force: true,
  });
  await runRefreshMutexMutation(outputRoot, ownerOperationId, {
    op: 'rm',
    path: journalPath,
    recursive: false,
    force: true,
  });
  await syncDirectory(dirname(outputRoot));
  return true;
}

function canonicalizeJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeJson).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
      .join(',')}}`;
  }
  throw new Error('Kitsap launch package contains a non-JSON value.');
}

function canonicalJsonSha256(value) {
  return createHash('sha256').update(canonicalizeJson(value)).digest('hex');
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalSaleDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  const normalized = String(value ?? '').trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(normalized);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.toISOString().slice(0, 10);
}

function makeSaleId(sheetName, row, ordinal) {
  const reet = nullableString(row['REET no.']);
  const parcel = nullableString(row['Tax parcel no.']);
  invariant(reet && parcel, `${sheetName} row ${ordinal} is missing REET or parcel identity.`);
  const token = `${reet}-${parcel}`.replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-');
  return `WA-${COUNTY_CODE}-${token}`;
}

function mapRecord(sheetName, row, ordinal, payloadSha256, generatedAt) {
  const saleDate = canonicalSaleDate(row['Sale Dt']);
  const salePrice = nullableNumber(row.Price);
  const parcelNumber = nullableString(row['Tax parcel no.']);
  invariant(saleDate, `${sheetName} row ${ordinal} has no canonical sale date.`);
  invariant(
    salePrice !== null && salePrice >= 0,
    `${sheetName} row ${ordinal} has no valid sale price.`
  );
  invariant(parcelNumber, `${sheetName} row ${ordinal} has no parcel number.`);

  const neighborhoodCode = nullableString(row.Nbrhd);
  const generatedDate = generatedAt.slice(0, 10);
  const isDwelling = sheetName === 'Dwellings';
  return {
    saleId: makeSaleId(sheetName, row, ordinal),
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber,
    saleDate,
    saleYear: nullableNumber(row.Yr),
    salePrice,
    adjustedSalePrice: null,
    documentNumber: nullableString(row['REET no.']),
    deedType: null,
    situsAddress: nullableString(row['Property address']),
    situsCity: null,
    situsZip: null,
    useCode: nullableString(row.Class),
    acres: nullableNumber(row.Acres),
    grantor: null,
    grantee: null,
    saleNote: nullableString(row.Validity),
    neighborhoodCode,
    currentNeighborhoodCode: neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_valid_sale',
    reviewStatus: 'ready',
    grossLivingArea: isDwelling ? nullableNumber(row['Living area']) : null,
    lotSizeSqft: null,
    yearBuilt: isDwelling ? nullableNumber(row['Yr blt']) : null,
    bedrooms: null,
    bathrooms: null,
    condition: isDwelling ? nullableString(row.Condition) : null,
    qualityGrade: null,
    provenance: {
      sourceUrl: SOURCE_URL,
      sourceFinalUrl: SOURCE_URL,
      sourcePayloadPath: basename(process.argv[2]),
      sourcePayloadSha256: payloadSha256,
      candidateIndexSource: `${basename(process.argv[2])}#${sheetName}`,
      candidateRecordType: isDwelling ? 'official-dwelling-sale' : 'official-vacant-land-sale',
      candidateSourceOrdinal: ordinal,
    },
    flags: {
      duplicateRisk: false,
      needsReview: false,
      futureSaleDate: saleDate > generatedDate,
      manualException: false,
    },
  };
}

function topNeighborhoodCodes(records) {
  const counts = new Map();
  for (const record of records) {
    if (!record.neighborhoodCode) continue;
    counts.set(record.neighborhoodCode, (counts.get(record.neighborhoodCode) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()]
      .sort(([aCode, aCount], [bCode, bCount]) => bCount - aCount || aCode.localeCompare(bCode))
      .slice(0, 25)
  );
}

async function syncDirectoryChain(path, root) {
  const resolvedRoot = resolve(root);
  let current = resolve(path);
  while (true) {
    invariant(
      current === resolvedRoot || current.startsWith(`${resolvedRoot}${sep}`),
      'Kitsap package staging directory escaped its operation root.'
    );
    await syncDirectory(current);
    if (current === resolvedRoot) return;
    current = dirname(current);
  }
}

async function writeJson(path, value, stagingRoot) {
  await mkdir(dirname(path), { recursive: true });
  await writeDurableFile(path, `${JSON.stringify(value)}\n`);
  await syncDirectoryChain(dirname(path), stagingRoot);
}

async function generatePackage(sourcePath, expectedSha256, outputRoot, generatedAt, operationId) {
  invariant(SHA256_PATTERN.test(expectedSha256), 'Expected workbook SHA-256 is invalid.');
  invariant(
    new Date(generatedAt).toISOString() === generatedAt,
    'Generated-at must be a canonical ISO timestamp.'
  );

  const workbookBytes = await readFile(sourcePath);
  const payloadSha256 = createHash('sha256').update(workbookBytes).digest('hex');
  invariant(
    payloadSha256 === expectedSha256,
    'Official Kitsap workbook does not match its expected SHA-256.'
  );

  const workbook = XLSX.read(workbookBytes, { type: 'buffer', cellDates: true });
  const expectedSheets = ['Dwellings', 'Vacant land'];
  invariant(
    expectedSheets.every(sheetName => workbook.SheetNames.includes(sheetName)),
    'Official Kitsap workbook is missing an expected sheet.'
  );

  const records = [];
  const quarantine = {};
  let candidateSales = 0;
  for (const sheetName of expectedSheets) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null,
      raw: true,
    });
    candidateSales += rows.length;
    const reasons = {};
    let staged = 0;
    rows.forEach((row, rowIndex) => {
      const validity = nullableString(row.Validity) ?? 'missing';
      if (validity.toLowerCase() !== 'valid sale') {
        reasons[validity] = (reasons[validity] ?? 0) + 1;
        return;
      }
      records.push(mapRecord(sheetName, row, rowIndex + 2, payloadSha256, generatedAt));
      staged += 1;
    });
    quarantine[sheetName] = { candidates: rows.length, staged, reasons };
  }

  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  const saleIds = new Set();
  for (const record of records) {
    invariant(
      !saleIds.has(record.saleId),
      `Official Kitsap workbook duplicates sale identity ${record.saleId}.`
    );
    saleIds.add(record.saleId);
  }
  invariant(records.length > 0, 'Official Kitsap workbook produced no valid public sales.');

  const latestSaleDate = records[0].saleDate;
  const needsReview = candidateSales - records.length;
  const neighborhoodCounts = topNeighborhoodCodes(records);
  const recordsWithNeighborhoodCode = records.filter(
    record => record.neighborhoodCode !== null
  ).length;
  const futureSaleDateRecords = records.filter(record => record.flags.futureSaleDate).length;
  const salesRoute = `/launch-data/washington/sales/by-county/${COUNTY_CODE}.json`;
  const detailRoute = `/launch-data/washington/counties/${COUNTY_CODE}.json`;

  const shard = {
    schemaVersion: SHARD_SCHEMA,
    generatedAt,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    summary: {
      records: records.length,
      latestSaleDate,
      reviewRecords: 0,
      recordsWithNeighborhoodCode,
      topNeighborhoodCodes: neighborhoodCounts,
    },
    records,
  };
  const status = {
    schemaVersion: STATUS_SCHEMA,
    generatedAt,
    sourcePosture: SOURCE_MODE,
    counties: [
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        priority: 'washington_assessor_launch',
        prometheusStatus: 'public_data_ready',
        primarySourceMode: SOURCE_MODE,
        latestSaleDate,
        candidateSales,
        stagedSales: records.length,
        needsReview,
        confidence: {
          averageQualityScore: 1,
          parserStatus: 'ready',
          rawStatus: 'official_workbook_verified',
          rawDriftDetected: false,
        },
        staticRoutes: { detail: detailRoute, salesShard: salesRoute },
      },
    ],
  };
  const detail = {
    schemaVersion: DETAIL_SCHEMA,
    generatedAt,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    operationalState: {
      primarySourceMode: SOURCE_MODE,
      prometheusStatus: 'public_data_ready',
    },
    summary: { records: records.length, latestSaleDate },
    salesRoute,
  };
  const manifest = {
    schemaVersion: MANIFEST_SCHEMA,
    statusSchemaVersion: STATUS_SCHEMA,
    statusCanonicalJsonSha256: canonicalJsonSha256(status),
    generatedAt,
    sourcePosture: SOURCE_MODE,
    salesShardAttestations: [
      {
        algorithm: 'SHA-256',
        canonicalJsonSha256: canonicalJsonSha256(shard),
        county: COUNTY,
        countyCode: COUNTY_CODE,
        officialSourceBaseUrl: SOURCE_BASE_URL,
        route: salesRoute,
        sourcePayloadSha256: [payloadSha256],
        sourcePosture: SOURCE_MODE,
      },
    ],
    summary: {
      counties: 1,
      rawLanded: 1,
      parserReady: 1,
      candidateSales,
      stagedSales: records.length,
      needsReview,
      prometheusNeedsReview: 0,
      recordsWithNeighborhoodCode,
      futureSaleDateRecords,
      criticalContradictions: 0,
      garfieldExceptions: 0,
      bentonCityAsNeighborhoodRecords: 0,
    },
  };

  const temporaryRoot = `${outputRoot}.tmp-${operationId}`;
  const backupRoot = `${outputRoot}.bak-${operationId}`;
  const journalPath = `${outputRoot}.refresh.json`;
  const temporaryJournalPath = `${journalPath}.tmp-${operationId}`;
  await mkdir(temporaryRoot, { recursive: false });
  let journalPublished = false;
  try {
    await writeJson(join(temporaryRoot, 'manifest.json'), manifest, temporaryRoot);
    await writeJson(join(temporaryRoot, 'counties/status.json'), status, temporaryRoot);
    await writeJson(join(temporaryRoot, `counties/${COUNTY_CODE}.json`), detail, temporaryRoot);
    await writeJson(
      join(temporaryRoot, `sales/by-county/${COUNTY_CODE}.json`),
      shard,
      temporaryRoot
    );
    await writeJson(
      join(temporaryRoot, 'receipts/kitsap-source.json'),
      {
        schemaVersion: 'terrafusion.washington.public-source-receipt.v1',
        county: COUNTY,
        countyCode: COUNTY_CODE,
        generatedAt,
        sourceUrl: SOURCE_URL,
        sourcePayloadPath: basename(sourcePath),
        sourcePayloadBytes: workbookBytes.byteLength,
        sourcePayloadSha256: payloadSha256,
        candidateSales,
        stagedSales: records.length,
        quarantinedSales: needsReview,
        quarantine,
        omittedFields: ['owner', 'grantor', 'grantee', 'buyer', 'seller'],
      },
      temporaryRoot
    );
    await syncDirectory(temporaryRoot);
    await assertRefreshLockOwner(outputRoot, operationId);
    await writeDurableFile(
      temporaryJournalPath,
      `${JSON.stringify({ schemaVersion: REFRESH_JOURNAL_SCHEMA, operationId })}\n`
    );
    await assertRefreshLockOwner(outputRoot, operationId);
    await runRefreshMutexMutation(outputRoot, operationId, {
      op: 'rename',
      source: temporaryJournalPath,
      target: journalPath,
    });
    await syncDirectory(dirname(outputRoot));
    journalPublished = true;
    await assertRefreshLockOwner(outputRoot, operationId);
    try {
      await runRefreshMutexMutation(outputRoot, operationId, {
        op: 'renameIfExists',
        source: outputRoot,
        target: backupRoot,
      });
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await syncDirectory(dirname(outputRoot));
    await assertRefreshLockOwner(outputRoot, operationId);
    await runRefreshMutexMutation(outputRoot, operationId, {
      op: 'rename',
      source: temporaryRoot,
      target: outputRoot,
    });
    await syncDirectory(dirname(outputRoot));
    await runRefreshMutexMutation(outputRoot, operationId, {
      op: 'rm',
      path: backupRoot,
      recursive: true,
      force: true,
    });
    await syncDirectory(dirname(outputRoot));
    await runRefreshMutexMutation(outputRoot, operationId, {
      op: 'rm',
      path: journalPath,
      recursive: false,
      force: true,
    });
    await syncDirectory(dirname(outputRoot));
    journalPublished = false;
  } catch (error) {
    await rm(temporaryJournalPath, { force: true });
    if (journalPublished) {
      await recoverInterruptedPackageRefresh(outputRoot, operationId);
    } else {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
    throw error;
  }

  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: canonicalJsonSha256(manifest),
        sourcePayloadSha256: payloadSha256,
        candidateSales,
        stagedSales: records.length,
        quarantinedSales: needsReview,
        latestSaleDate,
        outputRoot,
      },
      null,
      2
    )
  );
}

async function main() {
  const [sourcePath, expectedSha256, outputPath, generatedAt] = process.argv.slice(2);
  invariant(
    sourcePath && expectedSha256 && outputPath && generatedAt,
    'Usage: kitsap_public_sales.mjs <source.xlsx> <expected-sha256> <output-directory> <generated-at-iso>'
  );
  const outputRoot = await canonicalizePackageOutputRoot(outputPath);
  const operationId = `${process.pid}-${randomUUID()}`;
  await acquirePackageRefreshLock(outputRoot, operationId);
  try {
    await recoverInterruptedPackageRefresh(outputRoot, operationId);
    await generatePackage(sourcePath, expectedSha256, outputRoot, generatedAt, operationId);
  } finally {
    await releasePackageRefreshLock(outputRoot, operationId);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
