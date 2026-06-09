from unittest import TestCase

from app.common.exceptions.base import AppError
from app.common.utils.security import hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService


class _UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count


class _Collection:
    def __init__(self, documents):
        self.documents = documents
        self.last_filter = None

    def update_one(self, filters, update):
        self.last_filter = filters
        for document in self.documents:
            if document.get("_id") == filters.get("_id"):
                document.update(update["$set"])
                return _UpdateResult(1)
        return _UpdateResult(0)


class _Database:
    def __init__(self, collection):
        self.collection = collection

    def __getitem__(self, collection_name):
        return self.collection


class _UserRepository:
    def __init__(self, updated):
        self.updated = updated
        self.password_hash = hash_password("password123")

    def get_by_id(self, user_id):
        return {
            "_id": user_id,
            "password_hash": self.password_hash,
        }

    def update_password_hash(self, user_id, password_hash):
        self.password_hash = password_hash
        return self.updated


class _RefreshTokenRepository:
    def __init__(self):
        self.revoked_for_user = None

    def revoke_all_for_user(self, user_id):
        self.revoked_for_user = user_id


class ChangePasswordTest(TestCase):
    def test_repository_updates_password_for_string_user_id(self):
        user = {"_id": "user-1", "password_hash": hash_password("password123")}
        collection = _Collection([user])
        repository = UserRepository(_Database(collection))

        updated = repository.update_password_hash("user-1", hash_password("new-password"))

        self.assertEqual(updated, 1)
        self.assertEqual(collection.last_filter, {"_id": "user-1"})
        self.assertTrue(verify_password("new-password", user["password_hash"]))

    def test_repository_updates_password_for_object_id_shaped_string_user_id(self):
        user_id = "507f1f77bcf86cd799439011"
        user = {"_id": user_id, "password_hash": hash_password("password123")}
        collection = _Collection([user])
        repository = UserRepository(_Database(collection))

        updated = repository.update_password_hash(user_id, hash_password("new-password"))

        self.assertEqual(updated, 1)
        self.assertEqual(collection.last_filter, {"_id": user_id})
        self.assertTrue(verify_password("new-password", user["password_hash"]))

    def test_service_rejects_when_password_was_not_updated(self):
        service = AuthService.__new__(AuthService)
        service.user_repository = _UserRepository(updated=0)
        service.refresh_token_repository = _RefreshTokenRepository()

        with self.assertRaises(AppError) as error:
            service.change_password("user-1", "password123", "new-password")

        self.assertEqual(error.exception.code, "password_update_failed")
        self.assertEqual(service.refresh_token_repository.revoked_for_user, None)

    def test_service_updates_password_before_revoking_refresh_tokens(self):
        service = AuthService.__new__(AuthService)
        service.user_repository = _UserRepository(updated=1)
        service.refresh_token_repository = _RefreshTokenRepository()

        service.change_password("user-1", "password123", "new-password")

        self.assertTrue(verify_password("new-password", service.user_repository.password_hash))
        self.assertEqual(service.refresh_token_repository.revoked_for_user, "user-1")
