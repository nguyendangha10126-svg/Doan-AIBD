declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }

  const env: Env;

  interface ServeTcpOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
    onListen?: (params: { hostname: string; port: number }) => void;
    onError?: (error: unknown) => Response | Promise<Response>;
  }

  type ServeHandler = (
    request: Request
  ) => Response | Promise<Response>;

  function serve(handler: ServeHandler): void;
  function serve(options: ServeTcpOptions, handler: ServeHandler): void;
}
