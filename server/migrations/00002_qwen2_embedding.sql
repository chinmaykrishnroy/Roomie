-- +goose Up
UPDATE rooms SET embedding = NULL;
ALTER TABLE rooms ALTER COLUMN embedding TYPE vector(1536);

-- +goose Down
UPDATE rooms SET embedding = NULL;
ALTER TABLE rooms ALTER COLUMN embedding TYPE vector(384);
