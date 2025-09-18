import type { DocumentChunk } from "./types"
import { PDFProcessor } from "./pdf-processor"

export class DocumentProcessor {
  private static readonly CHUNK_SIZE = 1000
  private static readonly CHUNK_OVERLAP = 200

  static async processText(
    text: string,
    metadata: {
      source: string
      type: DocumentChunk["metadata"]["type"]
      title?: string
    },
  ): Promise<DocumentChunk[]> {
    const chunks = this.chunkText(text)

    return chunks.map((content, index) => ({
      id: `${metadata.source}-chunk-${index}`,
      content: content.trim(),
      metadata: {
        ...metadata,
        section: `chunk-${index}`,
      },
    }))
  }

  private static chunkText(text: string): string[] {
    const chunks: string[] = []
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

    let currentChunk = ""

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      const potentialChunk = currentChunk + (currentChunk ? ". " : "") + trimmedSentence

      if (potentialChunk.length <= this.CHUNK_SIZE) {
        currentChunk = potentialChunk
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + ".")
        }
        currentChunk = trimmedSentence
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk + ".")
    }

    return chunks
  }

  static async processPDF(
    file: File,
    metadata: {
      type: DocumentChunk["metadata"]["type"]
      title?: string
    },
  ): Promise<DocumentChunk[]> {
    return PDFProcessor.processPDFFile(file, metadata)
  }
}
