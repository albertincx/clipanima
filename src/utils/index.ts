export function timeout(s: number, f?: () => void) {
    const tm = (r: any) =>
        setTimeout(() => {
            if (f) {
                f();
            }
            r(true);
        }, s * 1000);
    return new Promise(r => tm(r));
}

export const serialize = function (obj: any) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}
