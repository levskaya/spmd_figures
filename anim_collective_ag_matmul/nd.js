export function init(shape, val) {
    if(shape.length === 1) {
      return new Array(shape[0]).fill(val);
    } else {
      return new Array(shape[0]).fill(null).map(() => init(shape.slice(1), val));
    }
  }

export function empty(shape) {
  return init(shape, null);
}

export function zeros(shape) {
  return init(shape, 0.0);
}

export function ones(shape) {
  return init(shape, 1.0);
}

export function ndim(arr) {
  let ndim = 0;
  while(Array.isArray(arr)) {
    ndim++;
    arr = arr[0];
  }
  return ndim;
}

export function shape(arr) {
  let shape = [];
  while(Array.isArray(arr)) {
    shape.push(arr.length);
    arr = arr[0];
  }
  return shape;
}

export function squeeze(arr) {
  if(Array.isArray(arr)) {
    if (arr.length == 0) {
      return [];
    }
    else if (arr.length == 1) {
      return squeeze(arr[0]);
    }
    else {
      let new_arr = []
      for(let i = 0; i < arr.length; i++) {
        new_arr.push(squeeze(arr[i]));
      }
      return new_arr;
    }
  } else {
    return arr;
  }
}


const isArray = x => Array.isArray(x);

function map_impl(mapfn, idx, ...vals){
  if(vals.some(isArray)) {
    let out = [];
    const length = vals.find(isArray).length;
    for(let i = 0; i < length; i++) {
      const invals = vals.map(x => isArray(x) ? x[i] : x);
      out.push(map_impl(mapfn, [...idx, i], ...invals));
    }
    return out;
  } else {
    return mapfn(idx, ...vals);
  }
}

export function map(mapfn, ...arrs) {
  return map_impl((_idxs, ...arrs) => mapfn(...arrs), [], ...arrs);
}

export function indexMap(mapfn, ...arrs) {
  return map_impl((idxs, ..._arrs) => mapfn(idxs), [], ...arrs);
}

export function indexedMap(mapfn, ...arrs) {
  return map_impl(mapfn, [], ...arrs);
}


export function fromArray(arr) {
  const new_nd = new ndArray(shape(arr));
  new_nd.arr = arr;
  return new_nd;
}

const add3 = (a, b) => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
const mul3 = (a, b) => ({x: a.x * b.x, y: a.y * b.y, z: a.z * b.z});
const smul3 = (s, a) => ({x: s * a.x, y: s * a.y, z: s * a.z});

export class ndArray {
  constructor(shape) {
    this.shape = shape;
    this.ndim = shape.length;
    this.arr = empty(shape);
  }
  map(fn) {
    return fromArray(map(fn, this.arr));
  }
  indexMap(fn) {
    return fromArray(indexMap(fn, this.arr));
  }
  indexedMap(fn) {
    return fromArray(indexedMap(fn, this.arr));
  }
  outerMap(fn, val) {
    return fromArray(map(x => val.map(y => fn(x, y)).arr, this.arr));
  }
  fill(val) {
    return this.map(() => val);
  }
  squeeze() {
    return fromArray(squeeze(this.arr));
  }
  // vec3 specific
  smul3(v) {
    return this.map(x => smul3(v, x));
  }
  mul3(v) {
    return this.map(x => mul3(v, x));
  }
  add3(v) {
    return this.map(x => add3(v, x));
  }
}
