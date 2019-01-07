export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Mutable<T> = { -readonly [K in keyof T]: T[K]; };
