from enum import Enum


class WorkspaceFactoryEnum(Enum):
    FileGDB = "FileGDB"
    SDE = "SDE"
    Access = "Access"
    Memory = "Memory"
    InMemoryDB = "InMemoryDB"
    Sqlite = "SQLite"
    Shapefile = "Shapefile"
