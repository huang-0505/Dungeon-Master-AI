import type { DocumentChunk, QueryResult } from "./types"
import { generateEmbedding, cosineSimilarity } from "./embeddings"

export class InMemoryVectorStore {
  private documents: Map<string, DocumentChunk> = new Map()

  async addDocument(chunk: DocumentChunk): Promise<void> {
    // Generate embedding if not provided
    if (!chunk.embedding) {
      chunk.embedding = await generateEmbedding(chunk.content)
    }

    this.documents.set(chunk.id, chunk)
  }

  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      await this.addDocument(chunk)
    }
  }

  async search(query: string, limit = 5): Promise<QueryResult[]> {
    const queryEmbedding = await generateEmbedding(query)
    const results: QueryResult[] = []

    for (const chunk of this.documents.values()) {
      if (!chunk.embedding) continue

      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding)
      results.push({ chunk, similarity })
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
  }

  async searchByType(query: string, type: DocumentChunk["metadata"]["type"], limit = 5): Promise<QueryResult[]> {
    const allResults = await this.search(query, this.documents.size)

    return allResults.filter((result) => result.chunk.metadata.type === type).slice(0, limit)
  }

  getDocumentCount(): number {
    return this.documents.size
  }

  clear(): void {
    this.documents.clear()
  }
}

// Global instance for the application
export const vectorStore = new InMemoryVectorStore()
