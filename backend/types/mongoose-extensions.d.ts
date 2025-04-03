import { Document, Model } from 'mongoose';

declare module 'mongoose' {
  interface Document {
    comparePassword(password: string): Promise<boolean>;
  }

  interface Model<T extends Document> {
    // No need to extend the Model type here, as the comparePassword method is on the Document type.
  }
}
