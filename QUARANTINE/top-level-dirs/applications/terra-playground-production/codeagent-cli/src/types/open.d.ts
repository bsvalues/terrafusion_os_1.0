declare module 'open' {
  export interface Options {
    app?: string | string[] | undefined;
    background?: boolean | undefined;
    wait?: boolean | undefined;
    url?: boolean | undefined;
    newInstance?: boolean | undefined;
  }

  export default function open(target: string, options?: Options): Promise<any>;
}
