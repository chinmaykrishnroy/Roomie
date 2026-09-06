import os
import logging
from typing import List, Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qwen2-embed")

MODEL_NAME = os.getenv("MODEL_NAME", "Alibaba-NLP/gte-Qwen2-1.5B-instruct")
PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(title="Roomie Qwen2 Embedding Service")

model: SentenceTransformer = None

@app.on_event("startup")
def load_model():
    global model
    logger.info(f"Loading Qwen2-Embedding model '{MODEL_NAME}' on CPU...")
    try:
        model = SentenceTransformer(MODEL_NAME, trust_remote_code=True, device="cpu")
        model.max_seq_length = 512
        logger.info(f"Model loaded successfully! Dimension: {model.get_sentence_embedding_dimension()}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}", exc_info=True)
        raise e

class EmbedRequest(BaseModel):
    text: Union[str, List[str]]

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dim: int

@app.get("/healthz")
def healthz():
    if model is None:
        raise HTTPException(status_code=503, detail="Model still initializing")
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "dim": model.get_sentence_embedding_dimension()
    }

@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model still initializing")

    texts = [req.text] if isinstance(req.text, str) else req.text
    if not texts:
        return EmbedResponse(embeddings=[], dim=model.get_sentence_embedding_dimension())

    cleaned = [t.strip() if t and t.strip() else "general" for t in texts]
    vectors = model.encode(cleaned, normalize_embeddings=True, show_progress_bar=False)
    return EmbedResponse(
        embeddings=vectors.tolist(),
        dim=model.get_sentence_embedding_dimension()
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
