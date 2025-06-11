# Demo

## packages/single-user-worker

1 User Worker per application w/ access to a KV namespace -- contains custom code to facilitate "wrapping" the KV namespace for limiting/analytics

## packages/two-user-workers

2 User Workers per application.

One has access to the KV namespace and handles "wrapping" it. The other worker is the normal "application" (closer to normal a CF setup)
