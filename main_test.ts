import { beforeEach, describe, test } from "@std/testing/bdd";
import { assertEquals } from "@std/assert/equals";
import { AssetType, type IAsset, type IPriceData, Oracle } from "./main.ts";
import { assertGreater } from "@std/assert/greater";

describe("Test the Oracle class", (): void => {
  let oracle: Oracle;
  const oracleId: string = "CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN"; // Reflector "External CEX" & DEX oracle

  beforeEach((): void => {
    oracle = new Oracle({ oracleId });
  });

  test("base", async (): Promise<void> => {
    const [type, id] = await oracle.base();
    assertEquals(type, AssetType.Other);
    assertEquals(id, "USD");
  });

  test("assets", async (): Promise<void> => {
    const assets: IAsset[] = await oracle.assets();
    assertGreater(assets.length, 1);
    for (const [type] of assets) {
      assertEquals(type, AssetType.Other);
    }
  });

  test("decimals", async (): Promise<void> => {
    const decimals: number = await oracle.decimals();
    assertEquals(decimals, 14);
  });

  test("resolution", async (): Promise<void> => {
    const resolution: number = await oracle.resolution();
    assertEquals(resolution, 300);
  });

  test("prices", async (): Promise<void> => {
    const prices = await await oracle.prices({
      asset: [AssetType.Other, "BTC"],
      records: 5,
    });

    assertEquals(prices.length, 5);
    for (const { price, timestamp } of prices) {
      assertEquals(typeof price, "bigint");
      assertEquals(typeof timestamp, "bigint");
    }
  });

  test("lastPrice", async (): Promise<void> => {
    const result: IPriceData | undefined = await await oracle.lastPrice({
      asset: [AssetType.Other, "BTC"],
    });

    assertEquals(typeof result?.price, "bigint");
    assertEquals(typeof result?.timestamp, "bigint");
  });

  test("price", async (): Promise<void> => {
    const prices: IPriceData[] = await await oracle.prices({
      asset: [AssetType.Other, "BTC"],
      records: 5,
    });

    const result: IPriceData | undefined = await await oracle.price({
      asset: [AssetType.Other, "BTC"],
      timestamp: prices[4].timestamp,
    });

    assertEquals(result?.price, prices[4]?.price);
    assertEquals(result?.timestamp, prices[4]?.timestamp);
  });
});
