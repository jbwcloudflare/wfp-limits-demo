# Demo

## packages/binding-wrapper-worker-1
This Worker "wraps" a KV binding. It wraps the `get` and `put` methods with versions that:
  1) pretend to check/enforce limits 
  2) perform the underlying `get` or `put` operation
  3) then emit usage data to Workers Analytics Engine

## packages/user-worker-1
This Worker is an example application that uses the "wrapped" KV binding.

## packages/dispatcher-worker
This is the dynamic dispatch worker that takes care of setting up binding wrappers and routing requests to the user worker.
