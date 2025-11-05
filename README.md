# Stellar SEP-0040

A simple library to call oracle methods from
[SEP-0040](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0040.md).

# Install

```shell
# Node
npx jsr add @creit-tech/stellar-sep-0040

# Deno
deno add jsr:@creit-tech/stellar-sep-0040
```

You can check more installation options in the [JSR package](https://jsr.io/@creit-tech/stellar-sep-0040).

# How to use

```typescript
import { Oracle } from "@creit-tech/stellar-sep-0040";

const oracle: Oracle = new Oracle({ oracleId: "CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN" });
const [price, timestamp] = await oracle.lastPrice({ asset: [AssetType.Other, "BTC"] });
console.log(`BTC price: ${price}`);
```

## License

![](https://img.shields.io/badge/License-MIT-lightgrey)

Licensed under the MIT License, Copyright © 2025-present Creit Tech.

Check out the `LICENSE.md` file for more details.
