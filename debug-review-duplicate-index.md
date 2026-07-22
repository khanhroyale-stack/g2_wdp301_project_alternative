# Debug Session: review-duplicate-index

- Status: OPEN
- Symptom: `POST /api/reviews` fails with `E11000 duplicate key error` on index `reviewerId_1_rentalContractId_1` with `rentalContractId: null`.
- Goal: identify whether the failure is caused by stale MongoDB indexes, missing payload fields, or backend persistence logic, then apply the minimal safe fix.

## Hypotheses

1. The MongoDB index `reviewerId_1_rentalContractId_1` still exists in a stale unique form and incorrectly treats `null` values as conflicting.
2. The backend still persists `rentalContractId: null` for product reviews, causing collisions on the stale unique index.
3. The frontend review payload is missing `orderId`, so the backend creates a product review without an order binding.
4. The current Mongoose schema is correct, but existing indexes in the live database were not rebuilt after the schema changed.

## Evidence Log

- Verified current frontend payload preparation in [ReviewModal.jsx](file:///d:/tailieuktpm/g2_wdp301_project_alternative/frontend/src/components/reviews/ReviewModal.jsx): `orderId` is only sent when truthy, and `rentalContractId` is no longer sent for product reviews.
- Verified backend create path in [review.controller.js](file:///d:/tailieuktpm/g2_wdp301_project_alternative/backend/src/controllers/review.controller.js): review documents are now created from a conditional `reviewData` object instead of forcing `orderId` / `rentalContractId` to `null`.
- Verified live MongoDB indexes before fix: `reviewerId_1_orderId_1` and `reviewerId_1_rentalContractId_1` were `unique + sparse`, without `partialFilterExpression`.
- Applied live index repair: both indexes now exist as `unique + partialFilterExpression` on `objectId`, matching the schema intent and no longer treating `null` product reviews as duplicates.
