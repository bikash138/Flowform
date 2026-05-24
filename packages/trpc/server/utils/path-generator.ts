export function generatePath<TBase extends `/${string}`>(base: TBase) {
  return (subpath: string = ""): `/${string}` => {
    const cleanBase = base.replace(/\/+$/, "");
    const cleanSub = subpath.replace(/^\/+/, "");
    if (!cleanSub) {
      return cleanBase as `/${string}`;
    }
    return `${cleanBase}/${cleanSub}` as `/${string}`;
  };
}
