-- Shipment tracking: carrier + tracking number captured at fulfillment time,
-- surfaced to the customer on their order history.

alter table public.orders
  add column if not exists carrier text,
  add column if not exists tracking_number text,
  add column if not exists shipped_at timestamptz;
