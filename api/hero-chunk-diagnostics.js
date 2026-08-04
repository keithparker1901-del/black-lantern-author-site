import crypto from 'node:crypto';

const expected = {
  part01: ['f8850c86109cbb67d041e474279820c153f25404b72a82f69f73148b8aff167d', 12000],
  part02a: ['77777270c7f24a89c59784826a8ae415561b56aaf667dd3c1ac696226fdd33fe', 6000],
  part02b: ['7f0e5d44c3fa0eae034f6925c27dca127e526409091e5ae1b1e01d5c28b4c725', 6000],
  part03: ['ed31ed1c8b18e719f614b6586da219c5263b7db071de55bc8dfa3b612ba0b90c', 12000],
  part04a: ['cdf3f6c2a0e1765305b3452140983a9aa3526b4637bb62c9df59644a8d24e91a', 6000],
  part04b: ['d194f9d2b9837c8d2198bb7a89f77d07e37dd705778fba16fb28521d6e579a41', 6000],
  part05a: ['d0bafb3d392471e7651692348c92dec1e5d4afe19ed8fcbe62308d80d9f5a391', 4500],
  part05b: ['b86fea3991ff8af59ec897d7af023f12d0ef4f4b171947f25e82ca995b7ee2a3', 4084]
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  const results = [];
  let assembled = '';
  for (const [name, [expectedHash, expectedLength]] of Object.entries(expected)) {
    const url = `https://raw.githubusercontent.com/keithparker1901-del/black-lantern-author-site/main/.hero-image-parts/${name}.b64`;
    const result = await fetch(url, { headers: { 'User-Agent': 'black-lantern-site-diagnostics' } });
    const text = await result.text();
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    assembled += text;
    results.push({ name, status: result.status, length: text.length, expectedLength, hash, expectedHash, match: hash === expectedHash && text.length === expectedLength, start: text.slice(0,16), end: text.slice(-16) });
  }
  const bytes = Buffer.from(assembled, 'base64');
  const assembledHash = crypto.createHash('sha256').update(bytes).digest('hex');
  response.status(200).json({ results, assembledBase64Length: assembled.length, byteLength: bytes.length, assembledHash, expectedAssembledHash: '702ce442d34f6aa0210dc7fb33707a63a6d38eb3b78e3eb66be420b955e36dfd' });
}
