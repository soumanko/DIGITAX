'use client';

import { useShopContext } from '@/lib/client/use-shop-context';

/**
 * Renders the statically-designed sidebar business chip's name from the
 * server-resolved (authorized) active business. Purely presentational — it
 * makes no authorization decisions, cannot leak other tenants' data, and has
 * no demo fallback. Preserves the original chip dimensions.
 */
export function StaticBusinessName() {
  const { shop, loading } = useShopContext();

  if (loading) {
    return (
      <span className="text-ellipsis whitespace-nowrap overflow-hidden text-muted-foreground">
        &nbsp;&nbsp;&nbsp;&nbsp;
      </span>
    );
  }

  if (!shop) {
    return (
      <span className="text-ellipsis whitespace-nowrap overflow-hidden text-muted-foreground">
        No business yet
      </span>
    );
  }

  return (
    <span className="text-ellipsis whitespace-nowrap overflow-hidden">
      {shop.name}
    </span>
  );
}
