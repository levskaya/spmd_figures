// Nd regular array of object helpers

// rank and shape of nested arrays

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

// remove singleton dimensions from nested arrays
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

// maps across rectangular dense arrays of objects

function map_impl(mapfn, idx, ...vals){
  const isArray = x => Array.isArray(x);
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

// bare array inits

export function _init(shape, val) {
  if(shape.length === 0) {
    return val;
  }
  else if(shape.length === 1) {
    return new Array(shape[0]).fill(val);
  } else {
    return new Array(shape[0]).fill(null).map(() => _init(shape.slice(1), val));
  }
}

export function _empty(shape) {
  return _init(shape, null);
}

export function fromArray(arr) {
  const new_nd = new ndArray(shape(arr));
  new_nd.arr = arr;
  return new_nd;
}


// N-dimensional dense nested object Array helper class
export class ndArray {
  constructor(shape) {
    this.shape = shape;
    this.ndim = shape.length;
    this.arr = _empty(shape);
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
  toArray() {
    return this.arr;
  }
}

// ndArray inits
export function init(shape, val) {
  return fromArray(_init(shape, val));
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


// Flatten

export function flatten(val) {
  if(Array.isArray(val)) {
    let out = [];
    for(let i = 0; i < val.length; i++) {
      out = out.concat(flatten(val[i]));
    }
    return out;
  } else {
    return val;
  }
}

// Hacky implementations of general reshape and transpose for
// nested Nd arrays.  Probably much better ways to do these.

function prod(val) {
  return val.reduce( (x,y) => x*y );
}

// convert linear index to Nd coordinate array given shape
function idx_to_coords(idx, shape) {
  if(shape.length > 1) {
    let sz = prod(shape.slice(1));
    let c = Math.floor(idx / sz);
    let rem = idx_to_coords(idx - c * sz, shape.slice(1));
    return [c, ...rem];
  } else {
    return [idx];
  }
}

// convert Nd coordinate array to linear index given shape
function coords_to_idx(coords, shape) {
  let idx = 0;
  for(let i=0; i < shape.length; i++){
    idx += coords[i] * shape.slice(i+1).reduce((x,y) => x*y, 1);
  }
  return idx;
}

function permute(perm, val) {
  let out = Array.from({ length: val.length });
  for(let i=0; i < val.length; i++){
    out[i] = val[perm[i]];
  }
  return out;
}

// get element from Nd nested array with coordinate array
function _get(val, cs) {
  return cs.reduce( (v,i) => v[i], val );
}

// set a position in Nd nested array with coordinate array
function _set(dst, cs, val) {
  if(cs.length > 1){
    let tmp = _get(dst, cs.slice(0, -1));
    tmp[cs[cs.length-1]] = val;
  } else {
    dst[cs[0]] = val;
  }
}

export function reshape(val, new_shape) {
  let out = _empty(new_shape);
  const old_shape = shape(val);
  for(let i = 0; i < prod(old_shape); i++) {
    let old_coords = idx_to_coords(i, old_shape);
    let new_coords = idx_to_coords(i, new_shape);
    _set(out, new_coords, _get(val, old_coords))
  }
  return out;
}

export function transpose(val, perm) {
  const old_shape = shape(val);
  const new_shape = permute(perm, old_shape);
  let out = _empty(new_shape);
  for(let i = 0; i < prod(old_shape); i++) {
    let old_coords = idx_to_coords(i, old_shape);
    let new_coords = permute(perm, old_coords);
    _set(out, new_coords, _get(val, old_coords))
  }
  return out;
}

