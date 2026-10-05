from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from sqlalchemy import text

from services.storage.database_storage import DatabaseStorageBackend


class SQLiteDatabaseStorageTest(unittest.TestCase):
    def test_accounts_and_auth_keys_round_trip(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "accounts.db"
            storage = DatabaseStorageBackend(f"sqlite:///{database_path}")

            accounts = [
                {"access_token": "token-a", "email": "a@example.com"},
                {"access_token": "token-b", "email": "b@example.com"},
            ]
            auth_keys = [{"id": "key-1", "name": "production"}]

            storage.save_accounts(accounts)
            storage.save_auth_keys(auth_keys)

            self.assertEqual(storage.load_accounts(), accounts)
            self.assertEqual(storage.load_auth_keys(), auth_keys)
            self.assertEqual(storage.health_check()["status"], "healthy")

            storage.save_accounts(accounts[:1])
            storage.save_auth_keys(auth_keys)
            self.assertEqual(storage.load_accounts(), accounts[:1])
            self.assertEqual(storage.load_auth_keys(), auth_keys)

            with storage.engine.connect() as conn:
                journal_mode = conn.execute(text("PRAGMA journal_mode")).scalar()
                busy_timeout = conn.execute(text("PRAGMA busy_timeout")).scalar()

            self.assertEqual(str(journal_mode).lower(), "wal")
            self.assertEqual(busy_timeout, 30000)


if __name__ == "__main__":
    unittest.main()
