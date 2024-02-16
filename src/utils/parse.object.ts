export function objForEach<T>(obj: T, f: (k: keyof T, v: T[keyof T]) => void): void {
    for (let k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
            f(k, obj[k]);
        }
    }
}