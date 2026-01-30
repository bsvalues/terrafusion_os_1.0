from typing import Any, List, Optional, Protocol

class CursorProtocol(Protocol):
    description: List[Any]
    def execute(self, sql: str, params: Any = None) -> None: ...
    def fetchone(self) -> Optional[Any]: ...
    def fetchall(self) -> List[Any]: ...
    def close(self) -> None: ...

class ConnectionProtocol(Protocol):
    def cursor(self) -> CursorProtocol: ...
    def close(self) -> None: ...

class MockCursor:
    def __init__(self):
        self.description = [
            ("parcel_no", None, None, None, None, None, None),
            ("prop_id", None, None, None, None, None, None),
            ("situs_display", None, None, None, None, None, None),
            ("legal_desc", None, None, None, None, None, None),
            ("nbhd_code", None, None, None, None, None, None),
        ]

    def execute(self, sql: str, params: Any = None):
        print(f"MOCK DB EXECUTE: {sql} with params {params}")
        pass

    def fetchone(self):
        return ("1-0294-200-3333-000", 101, "123 Sovereign Lane", "LOT 1 BLK 3 ISO-PLAT", "NBHD-01")

    def fetchall(self):
        return []

    def close(self):
        pass

class MockConnection:
    def cursor(self):
        return MockCursor()
    
    def close(self):
        pass

def get_mock_connection():
    return MockConnection()
