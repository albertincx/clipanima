let DEFAULT_TTL = 1000 * 60;

class StorageClass {
    preName = 'seexchng';

    _(k: string, def = false) {
        return localStorage.getItem(k) || def;
    }

    rm(k: string) {
        return localStorage.removeItem(k);
    }

    sRm(k: string) {
        return sessionStorage.removeItem(k);
    }

    get(k: string, def: any = "") {
        return localStorage.getItem(k) || def;
    }

    getNum(k: string, def: any = 0) {
        let v: any = localStorage.getItem(k);
        if (v) {
            v = Number(v);
            if (isNaN(v)) {
                v = 0;
            }
        }

        return v || def;
    }

    set(k: string, v: any) {
        localStorage.setItem(k, v);
    }

    getJ(k: string) {
        const v = this.get(k);
        if (v) {
            try {
                return JSON.parse(v);
            } catch (e) {
                //
            }
        }
        return false;
    }

    setJ(k: string, v: any) {
        return this.set(k, JSON.stringify(v));
    }

    sGet(k: string, def: any = "") {
        return sessionStorage.getItem(k) || def;
    }

    sSet(k: string, v: any) {
        sessionStorage.setItem(k, v);
    }

    // Lifetime Cache Methods
    /**
     * Set a value in the cache with a time-to-live (TTL) in milliseconds.
     * @param key - The cache key.
     * @param value - The value to cache.
     * @param ttl - Time-to-live in milliseconds.
     */
    setWithTTL(key: string, value: any, ttl: number = DEFAULT_TTL): void {
        const now = Date.now();
        const item = {
            value,
            expiry: now + ttl, // Calculate expiry time
        };
        this.setJ(key, item);
    }

    /**
     * Get a value from the cache if it is still valid (not expired).
     * @param key - The cache key.
     * @returns The cached value or `null` if expired or not found.
     */
    getWithTTL(key: string): any {
        const item = this.getJ(key);
        if (item) {
            const now = Date.now();
            if (now < item.expiry) {
                // Cache is still valid
                return item.value;
            } else {
                // Cache is expired, remove it
                this.rm(key);
            }
        }
        return null; // Cache is invalid or not found
    }

    /**
     * Clear the cache for a specific key.
     * @param key - The cache key.
     */
    clearCache(key: string): void {
        this.rm(key);
    }
}

const keyStorage = new StorageClass();

export default keyStorage
