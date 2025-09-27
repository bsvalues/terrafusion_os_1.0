import os
import sys
from pathlib import Path
import tempfile

import pytest

# ensure workspace root is importable
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import tfctl


@pytest.mark.skipif('moto' not in sys.modules and not pytest.importorskip('moto'), reason='moto is required')
def test_bundle_upload_s3(monkeypatch, tmp_path):
    # Use moto to mock S3
    # moto has changed APIs across versions; try mock_s3 first, then fallback to mock_aws(['s3'])
    import boto3
    bucket = 'tfctl-test-bucket'

    # Obtain a moto context manager (or decorator) and support start/stop patterns
    moto_ctx = None
    moto_ctx = None
    # prefer newer location
    try:
        from moto.s3 import mock_s3 as moto_mock_s3
        moto_ctx = moto_mock_s3()
    except Exception:
        # older/newer variants
        try:
            from moto import mock_s3 as moto_mock
            moto_ctx = moto_mock()
        except Exception:
            try:
                from moto import mock_aws as moto_mock_aws
                moto_ctx = moto_mock_aws(['s3'])
            except Exception:
                moto_ctx = None

    # Ensure we have a running moto context for the scope of the test
    if moto_ctx is None:
        pytest.skip('Unable to create moto mock context')
    # ensure moto_ctx is usable (context manager or has start/stop)
    if not (hasattr(moto_ctx, '__enter__') or hasattr(moto_ctx, 'start')):
        pytest.skip('moto in this environment does not provide usable mock context')

    # moto_ctx may be a context manager or decorator; support both via start()/stop() fallback
    started = False
    try:
        # Prefer context manager
        with moto_ctx:
            s3 = boto3.client('s3', region_name='us-east-1')
            s3.create_bucket(Bucket=bucket)
            # run test assertions in same with block
            monkeypatch.setenv('TF_BUNDLE_S3_BUCKET', bucket)
            monkeypatch.setenv('AWS_REGION', 'us-east-1')
            extra = tmp_path / 'extra.txt'
            extra.write_text('hello')
            out = tmp_path / 'out.zip'
            rc = tfctl.cmd_bundle(outfile=str(out), max_log_lines=10, since=None, includes=[str(extra)], upload_s3=True)
            assert rc == 0
            objs = s3.list_objects_v2(Bucket=bucket)
            assert 'Contents' in objs and len(objs['Contents']) == 1
            started = True
    except TypeError:
        # not a context manager — try start/stop
        try:
            moto_ctx.start()
            s3 = boto3.client('s3', region_name='us-east-1')
            s3.create_bucket(Bucket=bucket)
            monkeypatch.setenv('TF_BUNDLE_S3_BUCKET', bucket)
            monkeypatch.setenv('AWS_REGION', 'us-east-1')
            extra = tmp_path / 'extra.txt'
            extra.write_text('hello')
            out = tmp_path / 'out.zip'
            rc = tfctl.cmd_bundle(outfile=str(out), max_log_lines=10, since=None, includes=[str(extra)], upload_s3=True)
            assert rc == 0
            objs = s3.list_objects_v2(Bucket=bucket)
            assert 'Contents' in objs and len(objs['Contents']) == 1
            started = True
        finally:
            try:
                moto_ctx.stop()
            except Exception:
                pass

    if not started:
        pytest.skip('Could not run moto mock in this environment')

        # set env to instruct cmd_bundle to upload
        monkeypatch.setenv('TF_BUNDLE_S3_BUCKET', bucket)
        monkeypatch.setenv('AWS_REGION', 'us-east-1')

        # create a small dummy file to include
        extra = tmp_path / 'extra.txt'
        extra.write_text('hello')

        out = tmp_path / 'out.zip'
        # Call cmd_bundle and request upload
        rc = tfctl.cmd_bundle(outfile=str(out), max_log_lines=10, since=None, includes=[str(extra)], upload_s3=True)
        assert rc == 0

        # verify object exists in moto
        objs = s3.list_objects_v2(Bucket=bucket)
        assert 'Contents' in objs and len(objs['Contents']) == 1
