import os
import sys
import asyncio
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import tfctl


def test_env_loader_overrides(tmp_path: Path, monkeypatch):
    (tmp_path / ".env").write_text("TF_API_PORT=1111\nFOO='bar'\n# comment\nBAZ=qux")
    (tmp_path / ".env.stage").write_text('TF_API_PORT="2222"\nFOO=baz\n')
    monkeypatch.setenv("TF_ENV", "stage")
    tfctl.ROOT = tmp_path
    # call loader
    env = tfctl.load_dotenv_files()
    assert env.get('TF_API_PORT') == '2222'
    assert env.get('FOO') == 'baz'
    assert env.get('BAZ') == 'qux'


def test_call_maybe_async_behaviors():
    def add(a, b):
        return a + b

    assert tfctl.call_maybe_async(add, 2, 3) == 5

    async def coro(x):
        return x * 2

    # no running loop -> returns result
    assert tfctl.call_maybe_async(coro, 7) == 14

    # inside a running loop -> returns a Task that can be awaited
    results = {}

    async def main():
        t = tfctl.call_maybe_async(coro, 5)
        assert asyncio.isfuture(t) or isinstance(t, asyncio.Task)
        results['v'] = await t

    asyncio.run(main())
    assert results['v'] == 10
