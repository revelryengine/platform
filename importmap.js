globalThis.REVELRY_DEV_MODE ??= new URL(self.location.href).searchParams?.get('REVELRY_DEV_MODE') === 'false' ? false: true;

if(globalThis.REVELRY_DEV_MODE) {
    const shim = document.createElement('script');
    shim.nonce = document.querySelector('script[nonce]')?.nonce;
    shim.async = true;
    shim.src   = 'https://ga.jspm.io/npm:es-module-shims@1.6.2/dist/es-module-shims.js';

    const element = document.createElement('script');
    element.type = 'importmap';
    element.textContent = JSON.stringify({
        imports: {
            'https://cdn.jsdelivr.net/gh/revelryengine/': new URL('/@packages/', location.href).toString(),
        }
    });

    document.currentScript?.after(shim);
    document.currentScript?.after(element);
}
