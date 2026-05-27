# Security Specification - Lual POS Platinum

This specification defines the rigorous security invariants and rules applied to our Firestore database deployment.

## Data Invariants

1. **User Identity Isolation**: No authenticated profile can read another user's PII or modify their own security `role` to escalate privileges.
2. **Negative Boundary Blockers**: Quantities (`stock_qty`, `quantity`), prices (`sale_price`, `cost_price`), and values (`total_amount`, `current_debt`) must never be negative.
3. **Table Lifecycle Sequence**: Tables must cycle through legal enum states (`Libre`, `Ocupada`, `Cuenta_Lista`) and cannot have unrecorded state shortcuts.
4. **Permanent Sales Auditing**: Orders and order items are historically immutable. Once checked out, an order cannot be updated or modified by standard cashier privileges.

## The Dirty Dozen Payloads (Targeting Exploits)

1. **Privilege Escalation**: Attempt to create a standard staff profile with a fake self-assigned `Admin` role.
2. **Identity Spoofing**: Attempt to insert an order header with a different `waiter_id` or `uid` than the logged-in user.
3. **Price Injection**: Writing a negative item price `unit_price = -99999.00` to lower checkout totals.
4. **Stock Exhaustion**: Setting `stock_qty` of a high-value product to a massive number to bypass physical count controls.
5. **PII Data Extraction**: Attempting a blanket unconstrained search over client telephone or nit listings.
6. **Orphaned Sales Items**: Creating an `order_item` that references an order ID which doesn't exist.
7. **Negative Balance Adjustment**: Direct client debt modification to overwrite real unpaid POS check balances.
8. **Setting Blank Identifiers**: Document IDs with illegal, overly long strings (>128 chars) or SQL injection payloads.
9. **State Shortcutting**: Updating table status from `Libre` straight to `Cuenta_Lista` with zero active cart item values in parallel.
10. **Bypassing Server Timestamps**: Forging old historical UTC dates in `created_at` or `updated_at` instead of using the server's time (`request.time`).
11. **Shadow Update Attack**: Attacking a client record by injecting a ghost field `is_platinum_unlimited_credit: true` that is not part of the schema.
12. **Bypassing Audits**: Deleting or cleaning out the `audit_logs` collection to erase administrative telemetry history.

## Rules Verification

The following security rules enforce these checks natively. Every single target write is matched by a secure verification schema.
