import {
  Account,
  Contract,
  nativeToScVal,
  Networks,
  type Operation,
  rpc,
  scValToNative,
  type Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

export enum AssetType {
  Stellar = "Stellar",
  Other = "Other",
}

export type IAsset = [AssetType, string];

export interface IPriceData {
  price: bigint;
  timestamp: bigint;
}

export interface IOracleProps {
  /**
   * The Contract Address of the oracle
   */
  oracleId: string;

  /**
   * The rpc to use across all the calls for this oracle
   */
  rpcUrl?: string;

  /**
   * If you want to allow sending requests to non-SSL RPCs.
   */
  allowHttp?: boolean;

  /**
   * The account that will be use in the Transaction simulation, by default it uses the VOID account in mainnet
   */
  simAccount?: string;
}

/**
 * This class exposes simulations of the methods defined in [SEP-0040](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0040.md)
 */
export class Oracle {
  contract: Contract;
  rpc: rpc.Server;
  simAccount: Account;

  constructor(props: IOracleProps) {
    this.contract = new Contract(props.oracleId);
    this.rpc = new rpc.Server(props.rpcUrl || "https://rpc.lightsail.network");
    this.simAccount = new Account(
      props.simAccount ||
        "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
      "0",
    );
  }

  /**
   * Return the base asset the price is reported in
   */
  async base(): Promise<IAsset> {
    return this.simResult<IAsset>(this.contract.call("base"));
  }

  /**
   * Return all assets quoted by the price feed
   */
  async assets(): Promise<IAsset[]> {
    return this.simResult<IAsset[]>(this.contract.call("assets"));
  }

  /**
   * Return the number of decimals for all assets quoted by the oracle
   */
  async decimals(): Promise<number> {
    return this.simResult<number>(this.contract.call("decimals"));
  }

  /**
   * Return default tick period timeframe (in seconds)
   */
  async resolution(): Promise<number> {
    return this.simResult<number>(this.contract.call("resolution"));
  }

  /**
   * Get last N price records
   */
  async prices(params: { asset: IAsset; records: number }): Promise<IPriceData[]> {
    const result: IPriceData[] | undefined = await this.simResult<IPriceData[] | undefined>(
      this.contract.call(
        "prices",
        xdr.ScVal.scvVec([
          xdr.ScVal.scvSymbol(params.asset[0]),
          params.asset[0] === AssetType.Other
            ? xdr.ScVal.scvSymbol(params.asset[1])
            : nativeToScVal(params.asset[1], { type: "address" }),
        ]),
        nativeToScVal(params.records, { type: "u32" }),
      ),
    );

    if (!result) {
      throw new Error(`Prices for asset ${params.asset[1]} not available.`);
    }

    return result || [];
  }

  /**
   * Get the most recent price for an asset
   */
  async lastPrice(params: { asset: IAsset }): Promise<IPriceData> {
    const result: IPriceData | undefined = await this.simResult<IPriceData | undefined>(
      this.contract.call(
        "lastprice",
        xdr.ScVal.scvVec([
          xdr.ScVal.scvSymbol(params.asset[0]),
          params.asset[0] === AssetType.Other
            ? xdr.ScVal.scvSymbol(params.asset[1])
            : nativeToScVal(params.asset[1], { type: "address" }),
        ]),
      ),
    );

    if (!result) {
      throw new Error(`Last price for asset ${params.asset[1]} not available.`);
    }

    return result;
  }

  /**
   * Get price in base asset at specific timestamp
   */
  async price(params: { asset: IAsset; timestamp: number | bigint }): Promise<IPriceData> {
    const result: IPriceData | undefined = await this.simResult<IPriceData | undefined>(
      this.contract.call(
        "price",
        xdr.ScVal.scvVec([
          xdr.ScVal.scvSymbol(params.asset[0]),
          params.asset[0] === AssetType.Other
            ? xdr.ScVal.scvSymbol(params.asset[1])
            : nativeToScVal(params.asset[1], { type: "address" }),
        ]),
        nativeToScVal(params.timestamp, { type: "u64" }),
      ),
    );

    if (!result) {
      throw new Error(`Price for asset ${params.asset[1]} at timestamp ${params.timestamp} not available.`);
    }

    return result;
  }

  async simResult<T>(operation: xdr.Operation<Operation.InvokeHostFunction>): Promise<T> {
    const tx: Transaction = new TransactionBuilder(this.simAccount, {
      networkPassphrase: Networks.TESTNET,
      fee: "0",
    })
      .setTimeout(0)
      .addOperation(operation)
      .build();

    const sim: rpc.Api.SimulateTransactionResponse = await this.rpc.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(sim.error);
    }
    return scValToNative(sim.result!.retval);
  }
}
