import os
import tempfile
import uuid


def _workspace_mkdtemp(suffix=None, prefix=None, dir=None):
    root = dir or tempfile.gettempdir()
    name = f"{prefix or 'tmp'}{uuid.uuid4().hex}{suffix or ''}"
    path = os.path.join(root, name)
    os.makedirs(path)
    return path


tempfile.mkdtemp = _workspace_mkdtemp
