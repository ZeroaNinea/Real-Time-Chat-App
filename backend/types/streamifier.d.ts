declare module 'streamifier' {
  export function createReadStream(stream: Buffer): NodeJS.ReadableStream;
}
