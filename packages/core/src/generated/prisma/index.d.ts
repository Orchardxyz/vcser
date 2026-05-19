/**
 * Client
 **/

import * as runtime from "./runtime/client.js";
import $Types = runtime.Types; // general types
import $Public = runtime.Types.Public;
import $Utils = runtime.Types.Utils;
import $Extensions = runtime.Types.Extensions;
import $Result = runtime.Types.Result;

export type PrismaPromise<T> = $Public.PrismaPromise<T>;

/**
 * Model ExtensionNamespaceCache
 *
 */
export type ExtensionNamespaceCache = $Result.DefaultSelection<Prisma.$ExtensionNamespaceCachePayload>;

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more ExtensionNamespaceCaches
 * const extensionNamespaceCaches = await prisma.extensionNamespaceCache.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = "log" extends keyof ClientOptions
    ? ClientOptions["log"] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
      ? Prisma.GetEvents<ClientOptions["log"]>
      : never
    : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["other"] };

  /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more ExtensionNamespaceCaches
   * const extensionNamespaceCaches = await prisma.extensionNamespaceCache.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends "query" ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
  ): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;

  $transaction<R>(
    fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
  ): $Utils.JsPromise<R>;

  $extends: $Extensions.ExtendsHook<
    "extends",
    Prisma.TypeMapCb<ClientOptions>,
    ExtArgs,
    $Utils.Call<
      Prisma.TypeMapCb<ClientOptions>,
      {
        extArgs: ExtArgs;
      }
    >
  >;

  /**
   * `prisma.extensionNamespaceCache`: Exposes CRUD operations for the **ExtensionNamespaceCache** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more ExtensionNamespaceCaches
   * const extensionNamespaceCaches = await prisma.extensionNamespaceCache.findMany()
   * ```
   */
  get extensionNamespaceCache(): Prisma.ExtensionNamespaceCacheDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF;

  export type PrismaPromise<T> = $Public.PrismaPromise<T>;

  /**
   * Validator
   */
  export import validator = runtime.Public.validator;

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError;
  export import PrismaClientValidationError = runtime.PrismaClientValidationError;

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag;
  export import empty = runtime.empty;
  export import join = runtime.join;
  export import raw = runtime.raw;
  export import Sql = runtime.Sql;

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal;

  export type DecimalJsLike = runtime.DecimalJsLike;

  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs;
  export import getExtensionContext = runtime.Extensions.getExtensionContext;
  export import Args = $Public.Args;
  export import Payload = $Public.Payload;
  export import Result = $Public.Result;
  export import Exact = $Public.Exact;

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string;
    engine: string;
  };

  export const prismaVersion: PrismaVersion;

  /**
   * Utility Types
   */

  export import Bytes = runtime.Bytes;
  export import JsonObject = runtime.JsonObject;
  export import JsonArray = runtime.JsonArray;
  export import JsonValue = runtime.JsonValue;
  export import InputJsonObject = runtime.InputJsonObject;
  export import InputJsonArray = runtime.InputJsonArray;
  export import InputJsonValue = runtime.InputJsonValue;

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
     * Type of `Prisma.DbNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class DbNull {
      private DbNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.JsonNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class JsonNull {
      private JsonNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.AnyNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class AnyNull {
      private AnyNull: never;
      private constructor();
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull;

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull;

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull;

  type SelectAndInclude = {
    select: any;
    include: any;
  };

  type SelectAndOmit = {
    select: any;
    omit: any;
  };

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>;

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K;
  }[keyof T];

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K;
  };

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>;

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & (T extends SelectAndInclude
    ? "Please either choose `select` or `include`."
    : T extends SelectAndOmit
      ? "Please either choose `select` or `omit`."
      : {});

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & K;

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> = T extends object ? (U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U) : T;

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> =
    T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O>; // With K possibilities
    }[K];

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;

  type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
  }[strict];

  type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;

  export type Union = any;

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
  } & {};

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

  export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<
    Overwrite<
      U,
      {
        [K in keyof U]-?: At<U, K>;
      }
    >
  >;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function
    ? A
    : {
        [K in keyof A]: A[K];
      } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown ? (K extends keyof O ? { [P in K]: O[P] } & O : O) | ({ [P in keyof O as P extends K ? P : never]-?: O[P] } & O) : never
  >;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False;

  // /**
  // 1
  // */
  export type True = 1;

  /**
  0
  */
  export type False = 0;

  export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
  }[B];

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
      ? 1
      : 0;

  export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0;
      1: 1;
    };
    1: {
      0: 1;
      1: 1;
    };
  }[B1][B2];

  export type Keys<U extends Union> = U extends unknown ? keyof U : never;

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object
    ? {
        [P in keyof T]: P extends keyof O ? O[P] : never;
      }
    : never;

  type FieldPaths<T, U = Omit<T, "_avg" | "_sum" | "_count" | "_min" | "_max">> = IsObject<T> extends True ? U : T;

  type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<"OR", K>, Extends<"AND", K>>, Extends<"NOT", K>> extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
        ? never
        : K;
  }[keyof T];

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;

  export const ModelName: {
    ExtensionNamespaceCache: "ExtensionNamespaceCache";
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName];

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{ extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this["params"]["extArgs"], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>;
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions;
    };
    meta: {
      modelProps: "extensionNamespaceCache";
      txIsolationLevel: Prisma.TransactionIsolationLevel;
    };
    model: {
      ExtensionNamespaceCache: {
        payload: Prisma.$ExtensionNamespaceCachePayload<ExtArgs>;
        fields: Prisma.ExtensionNamespaceCacheFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ExtensionNamespaceCacheFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ExtensionNamespaceCacheFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>;
          };
          findFirst: {
            args: Prisma.ExtensionNamespaceCacheFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ExtensionNamespaceCacheFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>;
          };
          findMany: {
            args: Prisma.ExtensionNamespaceCacheFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>[];
          };
          create: {
            args: Prisma.ExtensionNamespaceCacheCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>;
          };
          createMany: {
            args: Prisma.ExtensionNamespaceCacheCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ExtensionNamespaceCacheCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>[];
          };
          delete: {
            args: Prisma.ExtensionNamespaceCacheDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>;
          };
          update: {
            args: Prisma.ExtensionNamespaceCacheUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>;
          };
          deleteMany: {
            args: Prisma.ExtensionNamespaceCacheDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ExtensionNamespaceCacheUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ExtensionNamespaceCacheUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>[];
          };
          upsert: {
            args: Prisma.ExtensionNamespaceCacheUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExtensionNamespaceCachePayload>;
          };
          aggregate: {
            args: Prisma.ExtensionNamespaceCacheAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateExtensionNamespaceCache>;
          };
          groupBy: {
            args: Prisma.ExtensionNamespaceCacheGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ExtensionNamespaceCacheGroupByOutputType>[];
          };
          count: {
            args: Prisma.ExtensionNamespaceCacheCountArgs<ExtArgs>;
            result: $Utils.Optional<ExtensionNamespaceCacheCountAggregateOutputType> | number;
          };
        };
      };
    };
  } & {
    other: {
      payload: any;
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
      };
    };
  };
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>;
  export type DefaultPrismaClient = PrismaClient;
  export type ErrorFormat = "pretty" | "colorless" | "minimal";
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    };
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory;
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string;
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig;
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[];
  }
  export type GlobalOmitConfig = {
    extensionNamespaceCache?: ExtensionNamespaceCacheOmit;
  };

  /* Types for Logging */
  export type LogLevel = "info" | "query" | "warn" | "error";
  export type LogDefinition = {
    level: LogLevel;
    emit: "stdout" | "event";
  };

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T["level"] : T>;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;

  export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
  };

  export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
  };
  /* End Types for Logging */

  export type PrismaAction =
    | "findUnique"
    | "findUniqueOrThrow"
    | "findMany"
    | "findFirst"
    | "findFirstOrThrow"
    | "create"
    | "createMany"
    | "createManyAndReturn"
    | "update"
    | "updateMany"
    | "updateManyAndReturn"
    | "upsert"
    | "delete"
    | "deleteMany"
    | "executeRaw"
    | "queryRaw"
    | "aggregate"
    | "count"
    | "runCommandRaw"
    | "findRaw"
    | "groupBy";

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>;

  export type Datasource = {
    url?: string;
  };

  /**
   * Count Types
   */

  /**
   * Models
   */

  /**
   * Model ExtensionNamespaceCache
   */

  export type AggregateExtensionNamespaceCache = {
    _count: ExtensionNamespaceCacheCountAggregateOutputType | null;
    _avg: ExtensionNamespaceCacheAvgAggregateOutputType | null;
    _sum: ExtensionNamespaceCacheSumAggregateOutputType | null;
    _min: ExtensionNamespaceCacheMinAggregateOutputType | null;
    _max: ExtensionNamespaceCacheMaxAggregateOutputType | null;
  };

  export type ExtensionNamespaceCacheAvgAggregateOutputType = {
    id: number | null;
  };

  export type ExtensionNamespaceCacheSumAggregateOutputType = {
    id: number | null;
  };

  export type ExtensionNamespaceCacheMinAggregateOutputType = {
    id: number | null;
    extensionId: string | null;
    namespace: string | null;
  };

  export type ExtensionNamespaceCacheMaxAggregateOutputType = {
    id: number | null;
    extensionId: string | null;
    namespace: string | null;
  };

  export type ExtensionNamespaceCacheCountAggregateOutputType = {
    id: number;
    extensionId: number;
    namespace: number;
    _all: number;
  };

  export type ExtensionNamespaceCacheAvgAggregateInputType = {
    id?: true;
  };

  export type ExtensionNamespaceCacheSumAggregateInputType = {
    id?: true;
  };

  export type ExtensionNamespaceCacheMinAggregateInputType = {
    id?: true;
    extensionId?: true;
    namespace?: true;
  };

  export type ExtensionNamespaceCacheMaxAggregateInputType = {
    id?: true;
    extensionId?: true;
    namespace?: true;
  };

  export type ExtensionNamespaceCacheCountAggregateInputType = {
    id?: true;
    extensionId?: true;
    namespace?: true;
    _all?: true;
  };

  export type ExtensionNamespaceCacheAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ExtensionNamespaceCache to aggregate.
     */
    where?: ExtensionNamespaceCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ExtensionNamespaceCaches to fetch.
     */
    orderBy?: ExtensionNamespaceCacheOrderByWithRelationInput | ExtensionNamespaceCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ExtensionNamespaceCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ExtensionNamespaceCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ExtensionNamespaceCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ExtensionNamespaceCaches
     **/
    _count?: true | ExtensionNamespaceCacheCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: ExtensionNamespaceCacheAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: ExtensionNamespaceCacheSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ExtensionNamespaceCacheMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ExtensionNamespaceCacheMaxAggregateInputType;
  };

  export type GetExtensionNamespaceCacheAggregateType<T extends ExtensionNamespaceCacheAggregateArgs> = {
    [P in keyof T & keyof AggregateExtensionNamespaceCache]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExtensionNamespaceCache[P]>
      : GetScalarType<T[P], AggregateExtensionNamespaceCache[P]>;
  };

  export type ExtensionNamespaceCacheGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExtensionNamespaceCacheWhereInput;
    orderBy?: ExtensionNamespaceCacheOrderByWithAggregationInput | ExtensionNamespaceCacheOrderByWithAggregationInput[];
    by: ExtensionNamespaceCacheScalarFieldEnum[] | ExtensionNamespaceCacheScalarFieldEnum;
    having?: ExtensionNamespaceCacheScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ExtensionNamespaceCacheCountAggregateInputType | true;
    _avg?: ExtensionNamespaceCacheAvgAggregateInputType;
    _sum?: ExtensionNamespaceCacheSumAggregateInputType;
    _min?: ExtensionNamespaceCacheMinAggregateInputType;
    _max?: ExtensionNamespaceCacheMaxAggregateInputType;
  };

  export type ExtensionNamespaceCacheGroupByOutputType = {
    id: number;
    extensionId: string;
    namespace: string;
    _count: ExtensionNamespaceCacheCountAggregateOutputType | null;
    _avg: ExtensionNamespaceCacheAvgAggregateOutputType | null;
    _sum: ExtensionNamespaceCacheSumAggregateOutputType | null;
    _min: ExtensionNamespaceCacheMinAggregateOutputType | null;
    _max: ExtensionNamespaceCacheMaxAggregateOutputType | null;
  };

  type GetExtensionNamespaceCacheGroupByPayload<T extends ExtensionNamespaceCacheGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExtensionNamespaceCacheGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof ExtensionNamespaceCacheGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], ExtensionNamespaceCacheGroupByOutputType[P]>
          : GetScalarType<T[P], ExtensionNamespaceCacheGroupByOutputType[P]>;
      }
    >
  >;

  export type ExtensionNamespaceCacheSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<
    {
      id?: boolean;
      extensionId?: boolean;
      namespace?: boolean;
    },
    ExtArgs["result"]["extensionNamespaceCache"]
  >;

  export type ExtensionNamespaceCacheSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        extensionId?: boolean;
        namespace?: boolean;
      },
      ExtArgs["result"]["extensionNamespaceCache"]
    >;

  export type ExtensionNamespaceCacheSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        extensionId?: boolean;
        namespace?: boolean;
      },
      ExtArgs["result"]["extensionNamespaceCache"]
    >;

  export type ExtensionNamespaceCacheSelectScalar = {
    id?: boolean;
    extensionId?: boolean;
    namespace?: boolean;
  };

  export type ExtensionNamespaceCacheOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    "id" | "extensionId" | "namespace",
    ExtArgs["result"]["extensionNamespaceCache"]
  >;

  export type $ExtensionNamespaceCachePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ExtensionNamespaceCache";
    objects: {};
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        extensionId: string;
        namespace: string;
      },
      ExtArgs["result"]["extensionNamespaceCache"]
    >;
    composites: {};
  };

  type ExtensionNamespaceCacheGetPayload<S extends boolean | null | undefined | ExtensionNamespaceCacheDefaultArgs> = $Result.GetResult<
    Prisma.$ExtensionNamespaceCachePayload,
    S
  >;

  type ExtensionNamespaceCacheCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    ExtensionNamespaceCacheFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: ExtensionNamespaceCacheCountAggregateInputType | true;
  };

  export interface ExtensionNamespaceCacheDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["model"]["ExtensionNamespaceCache"]; meta: { name: "ExtensionNamespaceCache" } };
    /**
     * Find zero or one ExtensionNamespaceCache that matches the filter.
     * @param {ExtensionNamespaceCacheFindUniqueArgs} args - Arguments to find a ExtensionNamespaceCache
     * @example
     * // Get one ExtensionNamespaceCache
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExtensionNamespaceCacheFindUniqueArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheFindUniqueArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one ExtensionNamespaceCache that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ExtensionNamespaceCacheFindUniqueOrThrowArgs} args - Arguments to find a ExtensionNamespaceCache
     * @example
     * // Get one ExtensionNamespaceCache
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExtensionNamespaceCacheFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ExtensionNamespaceCache that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExtensionNamespaceCacheFindFirstArgs} args - Arguments to find a ExtensionNamespaceCache
     * @example
     * // Get one ExtensionNamespaceCache
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExtensionNamespaceCacheFindFirstArgs>(
      args?: SelectSubset<T, ExtensionNamespaceCacheFindFirstArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ExtensionNamespaceCache that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExtensionNamespaceCacheFindFirstOrThrowArgs} args - Arguments to find a ExtensionNamespaceCache
     * @example
     * // Get one ExtensionNamespaceCache
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExtensionNamespaceCacheFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ExtensionNamespaceCacheFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more ExtensionNamespaceCaches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExtensionNamespaceCacheFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ExtensionNamespaceCaches
     * const extensionNamespaceCaches = await prisma.extensionNamespaceCache.findMany()
     *
     * // Get first 10 ExtensionNamespaceCaches
     * const extensionNamespaceCaches = await prisma.extensionNamespaceCache.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const extensionNamespaceCacheWithIdOnly = await prisma.extensionNamespaceCache.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ExtensionNamespaceCacheFindManyArgs>(
      args?: SelectSubset<T, ExtensionNamespaceCacheFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;

    /**
     * Create a ExtensionNamespaceCache.
     * @param {ExtensionNamespaceCacheCreateArgs} args - Arguments to create a ExtensionNamespaceCache.
     * @example
     * // Create one ExtensionNamespaceCache
     * const ExtensionNamespaceCache = await prisma.extensionNamespaceCache.create({
     *   data: {
     *     // ... data to create a ExtensionNamespaceCache
     *   }
     * })
     *
     */
    create<T extends ExtensionNamespaceCacheCreateArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheCreateArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many ExtensionNamespaceCaches.
     * @param {ExtensionNamespaceCacheCreateManyArgs} args - Arguments to create many ExtensionNamespaceCaches.
     * @example
     * // Create many ExtensionNamespaceCaches
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ExtensionNamespaceCacheCreateManyArgs>(
      args?: SelectSubset<T, ExtensionNamespaceCacheCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many ExtensionNamespaceCaches and returns the data saved in the database.
     * @param {ExtensionNamespaceCacheCreateManyAndReturnArgs} args - Arguments to create many ExtensionNamespaceCaches.
     * @example
     * // Create many ExtensionNamespaceCaches
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ExtensionNamespaceCaches and only return the `id`
     * const extensionNamespaceCacheWithIdOnly = await prisma.extensionNamespaceCache.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ExtensionNamespaceCacheCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ExtensionNamespaceCacheCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;

    /**
     * Delete a ExtensionNamespaceCache.
     * @param {ExtensionNamespaceCacheDeleteArgs} args - Arguments to delete one ExtensionNamespaceCache.
     * @example
     * // Delete one ExtensionNamespaceCache
     * const ExtensionNamespaceCache = await prisma.extensionNamespaceCache.delete({
     *   where: {
     *     // ... filter to delete one ExtensionNamespaceCache
     *   }
     * })
     *
     */
    delete<T extends ExtensionNamespaceCacheDeleteArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheDeleteArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one ExtensionNamespaceCache.
     * @param {ExtensionNamespaceCacheUpdateArgs} args - Arguments to update one ExtensionNamespaceCache.
     * @example
     * // Update one ExtensionNamespaceCache
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ExtensionNamespaceCacheUpdateArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheUpdateArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more ExtensionNamespaceCaches.
     * @param {ExtensionNamespaceCacheDeleteManyArgs} args - Arguments to filter ExtensionNamespaceCaches to delete.
     * @example
     * // Delete a few ExtensionNamespaceCaches
     * const { count } = await prisma.extensionNamespaceCache.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ExtensionNamespaceCacheDeleteManyArgs>(
      args?: SelectSubset<T, ExtensionNamespaceCacheDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ExtensionNamespaceCaches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExtensionNamespaceCacheUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ExtensionNamespaceCaches
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ExtensionNamespaceCacheUpdateManyArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ExtensionNamespaceCaches and returns the data updated in the database.
     * @param {ExtensionNamespaceCacheUpdateManyAndReturnArgs} args - Arguments to update many ExtensionNamespaceCaches.
     * @example
     * // Update many ExtensionNamespaceCaches
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ExtensionNamespaceCaches and only return the `id`
     * const extensionNamespaceCacheWithIdOnly = await prisma.extensionNamespaceCache.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ExtensionNamespaceCacheUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;

    /**
     * Create or update one ExtensionNamespaceCache.
     * @param {ExtensionNamespaceCacheUpsertArgs} args - Arguments to update or create a ExtensionNamespaceCache.
     * @example
     * // Update or create a ExtensionNamespaceCache
     * const extensionNamespaceCache = await prisma.extensionNamespaceCache.upsert({
     *   create: {
     *     // ... data to create a ExtensionNamespaceCache
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ExtensionNamespaceCache we want to update
     *   }
     * })
     */
    upsert<T extends ExtensionNamespaceCacheUpsertArgs>(
      args: SelectSubset<T, ExtensionNamespaceCacheUpsertArgs<ExtArgs>>
    ): Prisma__ExtensionNamespaceCacheClient<
      $Result.GetResult<Prisma.$ExtensionNamespaceCachePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of ExtensionNamespaceCaches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExtensionNamespaceCacheCountArgs} args - Arguments to filter ExtensionNamespaceCaches to count.
     * @example
     * // Count the number of ExtensionNamespaceCaches
     * const count = await prisma.extensionNamespaceCache.count({
     *   where: {
     *     // ... the filter for the ExtensionNamespaceCaches we want to count
     *   }
     * })
     **/
    count<T extends ExtensionNamespaceCacheCountArgs>(
      args?: Subset<T, ExtensionNamespaceCacheCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], ExtensionNamespaceCacheCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a ExtensionNamespaceCache.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExtensionNamespaceCacheAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ExtensionNamespaceCacheAggregateArgs>(
      args: Subset<T, ExtensionNamespaceCacheAggregateArgs>
    ): Prisma.PrismaPromise<GetExtensionNamespaceCacheAggregateType<T>>;

    /**
     * Group by ExtensionNamespaceCache.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExtensionNamespaceCacheGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ExtensionNamespaceCacheGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExtensionNamespaceCacheGroupByArgs["orderBy"] }
        : { orderBy?: ExtensionNamespaceCacheGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
    >(
      args: SubsetIntersection<T, ExtensionNamespaceCacheGroupByArgs, OrderByArg> & InputErrors
    ): {} extends InputErrors ? GetExtensionNamespaceCacheGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ExtensionNamespaceCache model
     */
    readonly fields: ExtensionNamespaceCacheFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ExtensionNamespaceCache.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExtensionNamespaceCacheClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {}
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the ExtensionNamespaceCache model
   */
  interface ExtensionNamespaceCacheFieldRefs {
    readonly id: FieldRef<"ExtensionNamespaceCache", "Int">;
    readonly extensionId: FieldRef<"ExtensionNamespaceCache", "String">;
    readonly namespace: FieldRef<"ExtensionNamespaceCache", "String">;
  }

  // Custom InputTypes
  /**
   * ExtensionNamespaceCache findUnique
   */
  export type ExtensionNamespaceCacheFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * Filter, which ExtensionNamespaceCache to fetch.
     */
    where: ExtensionNamespaceCacheWhereUniqueInput;
  };

  /**
   * ExtensionNamespaceCache findUniqueOrThrow
   */
  export type ExtensionNamespaceCacheFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * Filter, which ExtensionNamespaceCache to fetch.
     */
    where: ExtensionNamespaceCacheWhereUniqueInput;
  };

  /**
   * ExtensionNamespaceCache findFirst
   */
  export type ExtensionNamespaceCacheFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * Filter, which ExtensionNamespaceCache to fetch.
     */
    where?: ExtensionNamespaceCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ExtensionNamespaceCaches to fetch.
     */
    orderBy?: ExtensionNamespaceCacheOrderByWithRelationInput | ExtensionNamespaceCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ExtensionNamespaceCaches.
     */
    cursor?: ExtensionNamespaceCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ExtensionNamespaceCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ExtensionNamespaceCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ExtensionNamespaceCaches.
     */
    distinct?: ExtensionNamespaceCacheScalarFieldEnum | ExtensionNamespaceCacheScalarFieldEnum[];
  };

  /**
   * ExtensionNamespaceCache findFirstOrThrow
   */
  export type ExtensionNamespaceCacheFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * Filter, which ExtensionNamespaceCache to fetch.
     */
    where?: ExtensionNamespaceCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ExtensionNamespaceCaches to fetch.
     */
    orderBy?: ExtensionNamespaceCacheOrderByWithRelationInput | ExtensionNamespaceCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ExtensionNamespaceCaches.
     */
    cursor?: ExtensionNamespaceCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ExtensionNamespaceCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ExtensionNamespaceCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ExtensionNamespaceCaches.
     */
    distinct?: ExtensionNamespaceCacheScalarFieldEnum | ExtensionNamespaceCacheScalarFieldEnum[];
  };

  /**
   * ExtensionNamespaceCache findMany
   */
  export type ExtensionNamespaceCacheFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * Filter, which ExtensionNamespaceCaches to fetch.
     */
    where?: ExtensionNamespaceCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ExtensionNamespaceCaches to fetch.
     */
    orderBy?: ExtensionNamespaceCacheOrderByWithRelationInput | ExtensionNamespaceCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ExtensionNamespaceCaches.
     */
    cursor?: ExtensionNamespaceCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ExtensionNamespaceCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ExtensionNamespaceCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ExtensionNamespaceCaches.
     */
    distinct?: ExtensionNamespaceCacheScalarFieldEnum | ExtensionNamespaceCacheScalarFieldEnum[];
  };

  /**
   * ExtensionNamespaceCache create
   */
  export type ExtensionNamespaceCacheCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * The data needed to create a ExtensionNamespaceCache.
     */
    data: XOR<ExtensionNamespaceCacheCreateInput, ExtensionNamespaceCacheUncheckedCreateInput>;
  };

  /**
   * ExtensionNamespaceCache createMany
   */
  export type ExtensionNamespaceCacheCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ExtensionNamespaceCaches.
     */
    data: ExtensionNamespaceCacheCreateManyInput | ExtensionNamespaceCacheCreateManyInput[];
  };

  /**
   * ExtensionNamespaceCache createManyAndReturn
   */
  export type ExtensionNamespaceCacheCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * The data used to create many ExtensionNamespaceCaches.
     */
    data: ExtensionNamespaceCacheCreateManyInput | ExtensionNamespaceCacheCreateManyInput[];
  };

  /**
   * ExtensionNamespaceCache update
   */
  export type ExtensionNamespaceCacheUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * The data needed to update a ExtensionNamespaceCache.
     */
    data: XOR<ExtensionNamespaceCacheUpdateInput, ExtensionNamespaceCacheUncheckedUpdateInput>;
    /**
     * Choose, which ExtensionNamespaceCache to update.
     */
    where: ExtensionNamespaceCacheWhereUniqueInput;
  };

  /**
   * ExtensionNamespaceCache updateMany
   */
  export type ExtensionNamespaceCacheUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ExtensionNamespaceCaches.
     */
    data: XOR<ExtensionNamespaceCacheUpdateManyMutationInput, ExtensionNamespaceCacheUncheckedUpdateManyInput>;
    /**
     * Filter which ExtensionNamespaceCaches to update
     */
    where?: ExtensionNamespaceCacheWhereInput;
    /**
     * Limit how many ExtensionNamespaceCaches to update.
     */
    limit?: number;
  };

  /**
   * ExtensionNamespaceCache updateManyAndReturn
   */
  export type ExtensionNamespaceCacheUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * The data used to update ExtensionNamespaceCaches.
     */
    data: XOR<ExtensionNamespaceCacheUpdateManyMutationInput, ExtensionNamespaceCacheUncheckedUpdateManyInput>;
    /**
     * Filter which ExtensionNamespaceCaches to update
     */
    where?: ExtensionNamespaceCacheWhereInput;
    /**
     * Limit how many ExtensionNamespaceCaches to update.
     */
    limit?: number;
  };

  /**
   * ExtensionNamespaceCache upsert
   */
  export type ExtensionNamespaceCacheUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * The filter to search for the ExtensionNamespaceCache to update in case it exists.
     */
    where: ExtensionNamespaceCacheWhereUniqueInput;
    /**
     * In case the ExtensionNamespaceCache found by the `where` argument doesn't exist, create a new ExtensionNamespaceCache with this data.
     */
    create: XOR<ExtensionNamespaceCacheCreateInput, ExtensionNamespaceCacheUncheckedCreateInput>;
    /**
     * In case the ExtensionNamespaceCache was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExtensionNamespaceCacheUpdateInput, ExtensionNamespaceCacheUncheckedUpdateInput>;
  };

  /**
   * ExtensionNamespaceCache delete
   */
  export type ExtensionNamespaceCacheDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
    /**
     * Filter which ExtensionNamespaceCache to delete.
     */
    where: ExtensionNamespaceCacheWhereUniqueInput;
  };

  /**
   * ExtensionNamespaceCache deleteMany
   */
  export type ExtensionNamespaceCacheDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ExtensionNamespaceCaches to delete
     */
    where?: ExtensionNamespaceCacheWhereInput;
    /**
     * Limit how many ExtensionNamespaceCaches to delete.
     */
    limit?: number;
  };

  /**
   * ExtensionNamespaceCache without action
   */
  export type ExtensionNamespaceCacheDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExtensionNamespaceCache
     */
    select?: ExtensionNamespaceCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ExtensionNamespaceCache
     */
    omit?: ExtensionNamespaceCacheOmit<ExtArgs> | null;
  };

  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: "Serializable";
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];

  export const ExtensionNamespaceCacheScalarFieldEnum: {
    id: "id";
    extensionId: "extensionId";
    namespace: "namespace";
  };

  export type ExtensionNamespaceCacheScalarFieldEnum =
    (typeof ExtensionNamespaceCacheScalarFieldEnum)[keyof typeof ExtensionNamespaceCacheScalarFieldEnum];

  export const SortOrder: {
    asc: "asc";
    desc: "desc";
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

  /**
   * Field references
   */

  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "Int">;

  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "String">;

  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "Float">;

  /**
   * Deep Input Types
   */

  export type ExtensionNamespaceCacheWhereInput = {
    AND?: ExtensionNamespaceCacheWhereInput | ExtensionNamespaceCacheWhereInput[];
    OR?: ExtensionNamespaceCacheWhereInput[];
    NOT?: ExtensionNamespaceCacheWhereInput | ExtensionNamespaceCacheWhereInput[];
    id?: IntFilter<"ExtensionNamespaceCache"> | number;
    extensionId?: StringFilter<"ExtensionNamespaceCache"> | string;
    namespace?: StringFilter<"ExtensionNamespaceCache"> | string;
  };

  export type ExtensionNamespaceCacheOrderByWithRelationInput = {
    id?: SortOrder;
    extensionId?: SortOrder;
    namespace?: SortOrder;
  };

  export type ExtensionNamespaceCacheWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      extensionId_namespace?: ExtensionNamespaceCacheExtensionIdNamespaceCompoundUniqueInput;
      AND?: ExtensionNamespaceCacheWhereInput | ExtensionNamespaceCacheWhereInput[];
      OR?: ExtensionNamespaceCacheWhereInput[];
      NOT?: ExtensionNamespaceCacheWhereInput | ExtensionNamespaceCacheWhereInput[];
      extensionId?: StringFilter<"ExtensionNamespaceCache"> | string;
      namespace?: StringFilter<"ExtensionNamespaceCache"> | string;
    },
    "id" | "extensionId_namespace"
  >;

  export type ExtensionNamespaceCacheOrderByWithAggregationInput = {
    id?: SortOrder;
    extensionId?: SortOrder;
    namespace?: SortOrder;
    _count?: ExtensionNamespaceCacheCountOrderByAggregateInput;
    _avg?: ExtensionNamespaceCacheAvgOrderByAggregateInput;
    _max?: ExtensionNamespaceCacheMaxOrderByAggregateInput;
    _min?: ExtensionNamespaceCacheMinOrderByAggregateInput;
    _sum?: ExtensionNamespaceCacheSumOrderByAggregateInput;
  };

  export type ExtensionNamespaceCacheScalarWhereWithAggregatesInput = {
    AND?: ExtensionNamespaceCacheScalarWhereWithAggregatesInput | ExtensionNamespaceCacheScalarWhereWithAggregatesInput[];
    OR?: ExtensionNamespaceCacheScalarWhereWithAggregatesInput[];
    NOT?: ExtensionNamespaceCacheScalarWhereWithAggregatesInput | ExtensionNamespaceCacheScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"ExtensionNamespaceCache"> | number;
    extensionId?: StringWithAggregatesFilter<"ExtensionNamespaceCache"> | string;
    namespace?: StringWithAggregatesFilter<"ExtensionNamespaceCache"> | string;
  };

  export type ExtensionNamespaceCacheCreateInput = {
    extensionId: string;
    namespace: string;
  };

  export type ExtensionNamespaceCacheUncheckedCreateInput = {
    id?: number;
    extensionId: string;
    namespace: string;
  };

  export type ExtensionNamespaceCacheUpdateInput = {
    extensionId?: StringFieldUpdateOperationsInput | string;
    namespace?: StringFieldUpdateOperationsInput | string;
  };

  export type ExtensionNamespaceCacheUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    extensionId?: StringFieldUpdateOperationsInput | string;
    namespace?: StringFieldUpdateOperationsInput | string;
  };

  export type ExtensionNamespaceCacheCreateManyInput = {
    id?: number;
    extensionId: string;
    namespace: string;
  };

  export type ExtensionNamespaceCacheUpdateManyMutationInput = {
    extensionId?: StringFieldUpdateOperationsInput | string;
    namespace?: StringFieldUpdateOperationsInput | string;
  };

  export type ExtensionNamespaceCacheUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    extensionId?: StringFieldUpdateOperationsInput | string;
    namespace?: StringFieldUpdateOperationsInput | string;
  };

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type ExtensionNamespaceCacheExtensionIdNamespaceCompoundUniqueInput = {
    extensionId: string;
    namespace: string;
  };

  export type ExtensionNamespaceCacheCountOrderByAggregateInput = {
    id?: SortOrder;
    extensionId?: SortOrder;
    namespace?: SortOrder;
  };

  export type ExtensionNamespaceCacheAvgOrderByAggregateInput = {
    id?: SortOrder;
  };

  export type ExtensionNamespaceCacheMaxOrderByAggregateInput = {
    id?: SortOrder;
    extensionId?: SortOrder;
    namespace?: SortOrder;
  };

  export type ExtensionNamespaceCacheMinOrderByAggregateInput = {
    id?: SortOrder;
    extensionId?: SortOrder;
    namespace?: SortOrder;
  };

  export type ExtensionNamespaceCacheSumOrderByAggregateInput = {
    id?: SortOrder;
  };

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type StringFieldUpdateOperationsInput = {
    set?: string;
  };

  export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
  };

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatFilter<$PrismaModel> | number;
  };

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number;
  };

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF;
}
