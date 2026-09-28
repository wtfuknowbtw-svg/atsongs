// Stub for the ESM-only `music-metadata` package so the CommonJS Jest runtime can
// load modules that import it. Unit tests never parse real audio; the code paths
// that need metadata mock it at the service level.
export const parseBuffer = jest.fn(async () => ({
  common: {},
  format: {},
  quality: {},
}));

export const parseFile = jest.fn(async () => ({
  common: {},
  format: {},
  quality: {},
}));

export default { parseBuffer, parseFile };
