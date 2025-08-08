function splitTextIntoChunks(text, minChunkSize = 300, maxChunkSize = 500) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length >= minChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ✅ إزالة التشكيل + تصفية للنص العربي فقط
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '')                // إزالة التشكيل (حركات)
    .replace(/[^\u0621-\u064A0-9\s]/g, '')          // إبقاء الحروف العربية والأرقام
    .replace(/\s+/g, ' ')
    .trim();
}

// ✅ تحسين البحث: حساب نسبة الكلمات المشتركة بين السؤال والمقطع
function findRelevantChunks(question, chunks, maxChunks = 5) {
  const queryWords = normalize(question).split(' ');
  const results = [];

  for (const chunk of chunks) {
    const normalizedChunk = normalize(chunk);
    const chunkWords = new Set(normalizedChunk.split(' '));

    const commonWords = queryWords.filter(word => chunkWords.has(word));
    const similarity = commonWords.length / queryWords.length;

    if (similarity > 0) {
      results.push({ chunk, score: similarity });
    }
  }

  // ترتيب المقاطع حسب نسبة التشابه
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxChunks).map(r => r.chunk);
}

module.exports = {
  splitTextIntoChunks,
  findRelevantChunks,
};
