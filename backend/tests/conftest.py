import os, sys
import tempfile
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure fresh test database for pytest runs
temp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
test_db_path = os.path.join(temp_dir.name, "test_scout.db")
os.environ["SQLITE_DB_PATH"] = test_db_path

import db
db.DB_PATH = test_db_path
db.init_db()

@pytest.fixture(scope="session", autouse=True)
def cleanup_sqlite_connections():
    yield
    db.close_all_connections()

