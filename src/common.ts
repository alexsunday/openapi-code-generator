import * as crypto from 'crypto';

export function sha1(s: string) {
  const shasum = crypto.createHash('sha1');
  shasum.update(s);
  return shasum.digest('hex');
}
