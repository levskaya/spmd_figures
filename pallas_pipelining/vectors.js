// Vector Math Helpers

// basic math
export const mod = (n, m) => ((n % m) + m) % m;

// functional (non-mutating) threejs vector math

export const v2 = (x, y) => new THREE.Vector2(x, y);
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const v4 = (x, y, z, w) => new THREE.Vector4(x, y, z, w);

export function add(...vs){
    if(vs.length === 1){
        return vs[0].clone();
    } else {
        const accum = add(...vs.slice(1));
        return accum.add(vs[0]);
    }
}
export const sub = (a, b) => a.clone().sub(b);
export const multiply = (a, b) => a.clone().multiply(b);
export const divide = (a, b) => a.clone().divide(b);
export const multiplyScalar = (s, a) => a.clone().multiplyScalar(s);
export const negate = (a) => a.clone().negate();
