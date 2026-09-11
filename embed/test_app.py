import unittest
from unittest.mock import MagicMock
import numpy as np
from fastapi.testclient import TestClient

import app as embed_app

class TestEmbeddingService(unittest.TestCase):
    def setUp(self):
        # Create a mock sentence transformer model
        self.mock_model = MagicMock()
        self.mock_model.get_sentence_embedding_dimension.return_value = 1536
        self.mock_model.encode.return_value = np.zeros((1, 1536), dtype=np.float32)
        embed_app.model = self.mock_model
        self.client = TestClient(embed_app.app)

    def tearDown(self):
        embed_app.model = None

    def test_healthz_healthy(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["dim"], 1536)

    def test_healthz_unhealthy_when_model_none(self):
        embed_app.model = None
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 503)

    def test_embed_single_string(self):
        response = self.client.post("/embed", json={"text": "cyberpunk lo-fi chill"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["dim"], 1536)
        self.assertEqual(len(data["embeddings"]), 1)
        self.assertEqual(len(data["embeddings"][0]), 1536)
        self.mock_model.encode.assert_called_once()

    def test_embed_batch_strings(self):
        self.mock_model.encode.return_value = np.zeros((3, 1536), dtype=np.float32)
        response = self.client.post(
            "/embed",
            json={"text": ["studying together", "deep focus", "neon vibes"]}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["embeddings"]), 3)

    def test_embed_empty_list(self):
        response = self.client.post("/embed", json={"text": []})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["embeddings"], [])
        self.assertEqual(data["dim"], 1536)

if __name__ == "__main__":
    unittest.main()
