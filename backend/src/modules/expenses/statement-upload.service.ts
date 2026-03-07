import { recognize } from 'tesseract.js';

const isPdf = (mimeType: string) => mimeType.includes('pdf');
const isImage = (mimeType: string) => mimeType.startsWith('image/');

export const extractStatementTextFromUpload = async (file: {
  buffer: Buffer;
  mimetype: string;
  password?: string;
}): Promise<string> => {
  if (isPdf(file.mimetype)) {
    const pdfModule = await import('pdf-parse');
    const PDFParseCtor = (pdfModule as unknown as { PDFParse?: new (params: unknown) => { getText: () => Promise<{ text?: string }>; destroy: () => Promise<void> } }).PDFParse;

    if (PDFParseCtor) {
      const parser = new PDFParseCtor({
        data: file.buffer,
        password: file.password?.trim() || undefined,
      });

      try {
        const parsed = await parser.getText();
        return parsed.text ?? '';
      } catch (error) {
        const message = (error as Error).message ?? '';
        const isPasswordError = /password/i.test(message) || /PasswordException/i.test(String(error));

        if (isPasswordError && !file.password?.trim()) {
          throw new Error('This statement PDF is password protected. Enter PDF password and retry upload.');
        }

        if (isPasswordError && file.password?.trim()) {
          throw new Error('Invalid statement PDF password. Please check password and retry.');
        }

        throw error;
      } finally {
        await parser.destroy().catch(() => undefined);
      }
    }

    const legacyParser = (pdfModule as unknown as {
      default?: (buffer: Buffer, options?: { password?: string }) => Promise<{ text?: string }>;
    }).default;

    if (!legacyParser) {
      throw new Error('PDF parser is unavailable');
    }

    try {
      const parsed = await legacyParser(file.buffer, {
        password: file.password?.trim() || undefined,
      });
      return parsed.text ?? '';
    } catch (error) {
      const message = (error as Error).message ?? '';
      if (/password/i.test(message) && !file.password?.trim()) {
        throw new Error('This statement PDF is password protected. Enter PDF password and retry upload.');
      }
      if (/password/i.test(message) && file.password?.trim()) {
        throw new Error('Invalid statement PDF password. Please check password and retry.');
      }
      throw error;
    }
  }

  if (isImage(file.mimetype)) {
    const result = await recognize(file.buffer, 'eng');
    return result.data.text ?? '';
  }

  throw new Error('Unsupported statement file type. Upload PDF or image.');
};
