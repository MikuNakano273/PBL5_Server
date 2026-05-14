import sys

from app.core.database import get_database
from app.models.registry import ACTIVE_COLLECTION_INDEXES, LEGACY_COLLECTIONS


def main() -> None:
    database = get_database()
    for collection_name, indexes in ACTIVE_COLLECTION_INDEXES.items():
        if indexes:
            database[collection_name].create_indexes(indexes)
            print(f"applied indexes: {collection_name} ({len(indexes)})")

    print("legacy collections out of active registry:")
    for collection_name in LEGACY_COLLECTIONS:
        print(f"- {collection_name}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"index bootstrap failed: {type(exc).__name__}: {exc}")
        sys.exit(1)
