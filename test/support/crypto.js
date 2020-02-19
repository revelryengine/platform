import _crypto from 'crypto';

global.crypto = {
    getRandomValues(input) {
        return _crypto.randomFillSync(input);
    }
}
