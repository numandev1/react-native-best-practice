export const isEqual: any = (x: any, y: any) => {
  const ok = Object.keys;
  const tx = typeof x;
  const ty = typeof y;

  return x && y && tx === 'object' && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) => isEqual(x[key], y[key]))
    : x === y;
};

export const cloneDeep = (obj: any) => {
  var clone: any = {};
  for (var i in obj) {
    if (typeof obj[i] === 'object' && obj[i] != null)
      clone[i] = cloneDeep(obj[i]);
    else clone[i] = obj[i];
  }
  return clone;
};
