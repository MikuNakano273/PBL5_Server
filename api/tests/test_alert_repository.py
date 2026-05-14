from unittest import TestCase

from app.repositories.alert_repository import AlertRepository


class _Collection:
    def __init__(self, documents):
        self.documents = documents
        self.last_filter = None

    def find_one(self, filters):
        self.last_filter = filters
        for document in self.documents:
            if document.get("_id") == filters.get("_id"):
                return document
        return None


class _Database:
    def __init__(self, collection):
        self.collection = collection

    def __getitem__(self, collection_name):
        return self.collection


class AlertRepositoryTest(TestCase):
    def test_get_by_id_supports_string_alert_ids(self):
        collection = _Collection([{"_id": "alert-1", "title": "Obstacle"}])
        repository = AlertRepository(_Database(collection))

        alert = repository.get_by_id("alert-1")

        self.assertEqual(alert, {"_id": "alert-1", "title": "Obstacle"})
        self.assertEqual(collection.last_filter, {"_id": "alert-1"})
