from __future__ import annotations

import hashlib
import json
from typing import Any

from sqlalchemy import Column, String, Text, create_engine, Integer, text, Index, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from services.storage.base import StorageBackend

Base = declarative_base()


class AccountModel(Base):
    """账号数据模型"""
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=False)
    access_token_hash = Column(String(64), nullable=False)
    data = Column(Text, nullable=False)


Index(
    "ix_accounts_access_token_hash",
    AccountModel.access_token_hash,
    unique=True,
)

Index(
    "ix_accounts_email",
    AccountModel.email,
)


class AuthKeyModel(Base):
    """鉴权密钥数据模型"""
    __tablename__ = "auth_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key_id = Column(String(255), unique=True, nullable=False, index=True)
    data = Column(Text, nullable=False)


class DatabaseStorageBackend(StorageBackend):
    """数据库存储后端（支持 SQLite、PostgreSQL、MySQL 等）"""

    def __init__(self, database_url: str):
        self.database_url = database_url
        engine_options: dict[str, Any] = {
            "pool_pre_ping": True,
            "pool_recycle": 3600,
        }
        if database_url.startswith("sqlite:"):
            engine_options["connect_args"] = {"timeout": 30}

        self.engine = create_engine(database_url, **engine_options)
        if self.engine.dialect.name == "sqlite":
            @event.listens_for(self.engine, "connect")
            def _configure_sqlite(dbapi_connection: Any, _connection_record: Any) -> None:
                cursor = dbapi_connection.cursor()
                try:
                    cursor.execute("PRAGMA busy_timeout=30000")
                    cursor.execute("PRAGMA foreign_keys=ON")
                finally:
                    cursor.close()

        Base.metadata.create_all(self.engine)
        if self.engine.dialect.name == "sqlite":
            with self.engine.connect() as conn:
                conn.execute(text("PRAGMA journal_mode=WAL"))
        self._ensure_email_column()
        self.Session = sessionmaker(bind=self.engine)

    def _ensure_email_column(self) -> None:
        """
        Tự động thêm cột `email` nếu bảng `accounts` đã tồn tại từ trước
        (create_all() chỉ tạo bảng mới, không tự thêm cột mới vào bảng cũ).

        Lưu ý về thứ tự cột: model khai báo thứ tự id | email | access_token |
        access_token_hash | data, và bảng MỚI (tạo bằng create_all) sẽ theo đúng
        thứ tự này. Với bảng CŨ đã tồn tại, ALTER TABLE ADD COLUMN chỉ chèn được
        đúng vị trí "sau id" trên MySQL/MariaDB (dùng AFTER); SQLite và PostgreSQL
        không hỗ trợ chèn cột vào giữa bảng bằng ALTER TABLE, cột mới sẽ luôn nằm
        ở cuối bảng cũ dù thứ tự logic trong code là đúng.
        """
        with self.engine.connect() as conn:
            dialect = self.engine.dialect.name

            if dialect == "sqlite":
                cols = conn.execute(text("PRAGMA table_info(accounts)")).fetchall()
                col_names = {c[1] for c in cols}
                if "email" not in col_names:
                    # SQLite không hỗ trợ ADD COLUMN ... AFTER, cột sẽ nằm ở cuối bảng
                    conn.execute(text("ALTER TABLE accounts ADD COLUMN email VARCHAR(255)"))
                    conn.execute(text(
                        "CREATE INDEX IF NOT EXISTS ix_accounts_email ON accounts (email)"
                    ))
                    conn.commit()
            elif dialect in ("mysql", "mariadb"):
                result = conn.execute(text(
                    "SELECT COUNT(*) FROM information_schema.columns "
                    "WHERE table_schema = DATABASE() AND table_name = 'accounts' AND column_name = 'email'"
                )).scalar()
                if not result:
                    # MySQL hỗ trợ AFTER nên có thể chèn đúng vị trí sau cột id
                    conn.execute(text(
                        "ALTER TABLE accounts ADD COLUMN email VARCHAR(255) NULL AFTER id"
                    ))
                    conn.execute(text("CREATE INDEX ix_accounts_email ON accounts (email)"))
                    conn.commit()
            elif dialect == "postgresql":
                # PostgreSQL không hỗ trợ ADD COLUMN ... AFTER, cột sẽ nằm ở cuối bảng
                conn.execute(text("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255)"))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_accounts_email ON accounts (email)"
                ))
                conn.commit()
            # Các dialect khác: bỏ qua, coi như bảng mới đã có cột email sẵn từ create_all()

    def load_accounts(self) -> list[dict[str, Any]]:
        session = self.Session()
        try:
            accounts = []
            for row in session.query(AccountModel).all():
                try:
                    account_data = json.loads(row.data)
                    if isinstance(account_data, dict):
                        accounts.append(account_data)
                except json.JSONDecodeError:
                    continue
            return accounts
        finally:
            session.close()

    def _reset_auto_increment(self, table_name: str) -> None:
        """
        Reset lại bộ đếm auto-increment/sequence của bảng về 0/1,
        để lần insert tiếp theo bắt đầu lại từ ID = 1.
        Chỉ nên gọi ngay sau khi đã DELETE hết dữ liệu trong bảng.
        """
        dialect = self.engine.dialect.name
        with self.engine.connect() as conn:
            if dialect == "sqlite":
                # sqlite_sequence chỉ tồn tại nếu bảng có cột AUTOINCREMENT
                sequence_exists = conn.execute(text(
                    "SELECT 1 FROM sqlite_master "
                    "WHERE type = 'table' AND name = 'sqlite_sequence'"
                )).scalar()
                if sequence_exists:
                    conn.execute(text(
                        "DELETE FROM sqlite_sequence WHERE name = :table"
                    ), {"table": table_name})
                    conn.commit()
            elif dialect in ("mysql", "mariadb"):
                conn.execute(text(f"ALTER TABLE `{table_name}` AUTO_INCREMENT = 1"))
                conn.commit()
            elif dialect == "postgresql":
                # Reset sequence gắn với cột id (mặc định tên là <table>_id_seq)
                conn.execute(text(
                    f"ALTER SEQUENCE {table_name}_id_seq RESTART WITH 1"
                ))
                conn.commit()
            # Các dialect khác: bỏ qua, không có cơ chế reset tương ứng

    def add_account(self, item: dict[str, Any]) -> bool:
        """
        Thêm MỘT account mới vào bảng, KHÔNG xóa các account đã có.

        - Tự đảm bảo cột `email` đã tồn tại trước khi ghi (an toàn dù backend
          được khởi tạo theo cách nào).
        - Dedupe theo access_token_hash: nếu token đã tồn tại, bỏ qua (return False).
        - Không đụng tới auto-increment ID — ID sẽ tự tăng tiếp theo giá trị hiện tại.

        Trả về True nếu insert thành công, False nếu bị bỏ qua do trùng token
        hoặc dữ liệu không hợp lệ.
        """
        if not isinstance(item, dict):
            return False

        token = str(item.get("access_token") or "").strip()
        if not token:
            return False

        self._ensure_email_column()

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        email = str(item.get("email") or "").strip() or None

        session = self.Session()
        try:
            exists = (
                session.query(AccountModel)
                .filter(AccountModel.access_token_hash == token_hash)
                .first()
            )
            if exists is not None:
                return False

            session.add(
                AccountModel(
                    access_token=token,
                    access_token_hash=token_hash,
                    email=email,
                    data=json.dumps(item, ensure_ascii=False),
                )
            )
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def save_accounts(self, accounts: list[dict[str, Any]]) -> None:
        session = self.Session()
        try:
            session.query(AccountModel).delete()
            session.commit()
            self._reset_auto_increment("accounts")
            seen_hashes: set[str] = set()
            for item in accounts:
                if not isinstance(item, dict):
                    continue
                token = str(item.get("access_token") or "").strip()
                if not token:
                    continue
                token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
                if token_hash in seen_hashes:
                    continue
                seen_hashes.add(token_hash)

                email = str(item.get("email") or "").strip() or None

                session.add(
                    AccountModel(
                        access_token=token,
                        access_token_hash=token_hash,
                        email=email,
                        data=json.dumps(item, ensure_ascii=False),
                    )
                )
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def load_auth_keys(self) -> list[dict[str, Any]]:
        return self._load_rows(AuthKeyModel)

    def save_auth_keys(self, auth_keys: list[dict[str, Any]]) -> None:
        self._save_rows(AuthKeyModel, auth_keys, "id", "key_id")

    def _load_rows(self, model: type[AccountModel] | type[AuthKeyModel]) -> list[dict[str, Any]]:
        session = self.Session()
        try:
            items = []
            for row in session.query(model).all():
                try:
                    item_data = json.loads(row.data)
                    if isinstance(item_data, dict):
                        items.append(item_data)
                except json.JSONDecodeError:
                    continue
            return items
        finally:
            session.close()

    def _save_rows(
        self,
        model: type[AccountModel] | type[AuthKeyModel],
        items: list[dict[str, Any]],
        source_key: str,
        target_key: str | None = None,
    ) -> None:
        session = self.Session()
        try:
            key_column = target_key or source_key
            existing_rows = {
                str(getattr(row, key_column)): row
                for row in session.query(model).all()
            }
            incoming_keys: set[str] = set()
            for item in items:
                if not isinstance(item, dict):
                    continue
                key_value = str(item.get(source_key) or "").strip()
                if not key_value:
                    continue
                if key_value in incoming_keys:
                    raise ValueError(f"Duplicate {source_key} in storage snapshot")

                incoming_keys.add(key_value)
                serialized_data = json.dumps(item, ensure_ascii=False)
                existing_row = existing_rows.get(key_value)
                if existing_row is None:
                    session.add(
                        model(
                            **{key_column: key_value},
                            data=serialized_data,
                        )
                    )
                elif existing_row.data != serialized_data:
                    existing_row.data = serialized_data

            for key_value, row in existing_rows.items():
                if key_value not in incoming_keys:
                    session.delete(row)

            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def find_accounts_by_email(self, email: str) -> list[dict[str, Any]]:
        """Tra cứu nhanh account theo email nhờ cột email đã index, không cần parse toàn bộ JSON."""
        session = self.Session()
        try:
            accounts = []
            for row in session.query(AccountModel).filter(AccountModel.email == email).all():
                try:
                    account_data = json.loads(row.data)
                    if isinstance(account_data, dict):
                        accounts.append(account_data)
                except json.JSONDecodeError:
                    continue
            return accounts
        finally:
            session.close()

    def health_check(self) -> dict[str, Any]:
        try:
            session = self.Session()
            try:
                session.execute(text("SELECT 1"))
                count = session.query(AccountModel).count()
                auth_key_count = session.query(AuthKeyModel).count()
                return {
                    "status": "healthy",
                    "backend": "database",
                    "database_url": self._mask_password(self.database_url),
                    "account_count": count,
                    "auth_key_count": auth_key_count,
                }
            finally:
                session.close()
        except Exception as e:
            return {
                "status": "unhealthy",
                "backend": "database",
                "error": str(e),
            }

    def get_backend_info(self) -> dict[str, Any]:
        db_type = "unknown"
        if "sqlite" in self.database_url:
            db_type = "sqlite"
        elif "postgresql" in self.database_url or "postgres" in self.database_url:
            db_type = "postgresql"
        elif "mysql" in self.database_url:
            db_type = "mysql"

        return {
            "type": "database",
            "db_type": db_type,
            "description": f"数据库存储 ({db_type})",
            "database_url": self._mask_password(self.database_url),
        }

    @staticmethod
    def _mask_password(url: str) -> str:
        if "://" not in url:
            return url
        try:
            protocol, rest = url.split("://", 1)
            if "@" in rest:
                credentials, host = rest.split("@", 1)
                if ":" in credentials:
                    username, _ = credentials.split(":", 1)
                    return f"{protocol}://{username}:****@{host}"
            return url
        except Exception:
            return url
