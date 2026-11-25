/**
 * VERITY Structured Question Taxonomy Service
 *
 * Manages reusable, hierarchical academic taxonomy:
 * Subject → Topic → Subtopic → Concept
 *
 * Core Rules:
 * 1. Strict Deduplication: Prevents duplicate taxonomy entries (case-insensitive & whitespace trimmed).
 * 2. Hierarchical Reusability: Administrators select or add reusable subjects, topics, subtopics, and concepts.
 * 3. Unclassified Integrity: Questions without classification explicitly remain 'Unclassified'.
 * 4. Snapshot Safety: Modifying taxonomy modifies future questions only; historical attempt snapshots remain frozen.
 */

import { getItem, setItem } from './storageService.js';
import { generateId } from '../utils/idGenerator.js';
import { SEED_QUESTIONS } from './seedData.js';

const STORAGE_KEY = 'taxonomies';

/**
 * Normalizes a taxonomy string: trims and collapses internal spaces.
 * @param {string} str
 * @returns {string}
 */
export function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Build initial default taxonomy entries derived from seed questions.
 */
function getInitialSeedTaxonomies() {
  const seen = new Set();
  const list = [];

  for (const q of SEED_QUESTIONS) {
    const subject = normalizeText(q.subject || 'Computer Science');
    const topic = normalizeText(q.topic || 'Unclassified');
    const subtopic = normalizeText(q.subtopic || 'Unclassified');
    const concept = normalizeText(q.concept || 'General Concept');

    const key = `${subject.toLowerCase()}|||${topic.toLowerCase()}|||${subtopic.toLowerCase()}|||${concept.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      list.push({
        id: generateId('tax'),
        subject,
        topic,
        subtopic,
        concept,
        createdAt: '2026-10-20T10:00:00.000Z',
        updatedAt: '2026-10-20T10:00:00.000Z',
      });
    }
  }

  return list;
}

/**
 * Get all taxonomy entries. Initializes with seed entries if storage is empty.
 * @returns {Array<{id: string, subject: string, topic: string, subtopic: string, concept: string}>}
 */
export function getTaxonomies() {
  let entries = getItem(STORAGE_KEY, null);
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    entries = getInitialSeedTaxonomies();
    setItem(STORAGE_KEY, entries);
  }
  return entries;
}

/**
 * Get all distinct subjects.
 * @returns {string[]}
 */
export function getSubjects() {
  const entries = getTaxonomies();
  const subjects = new Set();
  for (const e of entries) {
    if (e.subject && e.subject !== 'Unclassified') {
      subjects.add(e.subject);
    }
  }
  return Array.from(subjects).sort();
}

/**
 * Get distinct topics, optionally scoped by subject.
 * @param {string} [subject]
 * @returns {string[]}
 */
export function getTopics(subject = null) {
  const entries = getTaxonomies();
  const topics = new Set();
  const normSub = subject && subject !== 'all' ? subject.toLowerCase() : null;

  for (const e of entries) {
    if (normSub && e.subject.toLowerCase() !== normSub) continue;
    if (e.topic && e.topic !== 'Unclassified') {
      topics.add(e.topic);
    }
  }
  return Array.from(topics).sort();
}

/**
 * Get distinct subtopics, optionally scoped by subject and topic.
 * @param {string} [subject]
 * @param {string} [topic]
 * @returns {string[]}
 */
export function getSubtopics(subject = null, topic = null) {
  const entries = getTaxonomies();
  const subtopics = new Set();
  const normSub = subject && subject !== 'all' ? subject.toLowerCase() : null;
  const normTop = topic && topic !== 'all' ? topic.toLowerCase() : null;

  for (const e of entries) {
    if (normSub && e.subject.toLowerCase() !== normSub) continue;
    if (normTop && e.topic.toLowerCase() !== normTop) continue;
    if (e.subtopic && e.subtopic !== 'Unclassified') {
      subtopics.add(e.subtopic);
    }
  }
  return Array.from(subtopics).sort();
}

/**
 * Get distinct concepts, optionally scoped by subject, topic, and subtopic.
 * @param {string} [subject]
 * @param {string} [topic]
 * @param {string} [subtopic]
 * @returns {string[]}
 */
export function getConcepts(subject = null, topic = null, subtopic = null) {
  const entries = getTaxonomies();
  const concepts = new Set();
  const normSub = subject && subject !== 'all' ? subject.toLowerCase() : null;
  const normTop = topic && topic !== 'all' ? topic.toLowerCase() : null;
  const normSubtop = subtopic && subtopic !== 'all' ? subtopic.toLowerCase() : null;

  for (const e of entries) {
    if (normSub && e.subject.toLowerCase() !== normSub) continue;
    if (normTop && e.topic.toLowerCase() !== normTop) continue;
    if (normSubtop && e.subtopic.toLowerCase() !== normSubtop) continue;
    if (e.concept && e.concept !== 'General Concept') {
      concepts.add(e.concept);
    }
  }
  return Array.from(concepts).sort();
}

/**
 * Add a new taxonomy entry with strict deduplication and case normalization.
 *
 * @param {Object} data
 * @param {string} data.subject
 * @param {string} data.topic
 * @param {string} [data.subtopic]
 * @param {string} [data.concept]
 * @returns {{ success: boolean, entry?: Object, isDuplicate?: boolean, error?: string }}
 */
export function addTaxonomyEntry({ subject, topic, subtopic = '', concept = '' }) {
  const s = normalizeText(subject);
  const t = normalizeText(topic);
  const sub = normalizeText(subtopic) || 'Unclassified';
  const c = normalizeText(concept) || 'General Concept';

  if (!s) {
    return { success: false, error: 'Subject is required.' };
  }
  if (!t) {
    return { success: false, error: 'Topic is required.' };
  }

  const entries = getTaxonomies();

  // Strict deduplication check (case-insensitive)
  const existing = entries.find(
    (e) =>
      e.subject.toLowerCase() === s.toLowerCase() &&
      e.topic.toLowerCase() === t.toLowerCase() &&
      (e.subtopic || '').toLowerCase() === sub.toLowerCase() &&
      (e.concept || '').toLowerCase() === c.toLowerCase()
  );

  if (existing) {
    return {
      success: false,
      isDuplicate: true,
      error: `Taxonomy entry "${s} → ${t} → ${sub} → ${c}" already exists.`,
      entry: existing,
    };
  }

  const newEntry = {
    id: generateId('tax'),
    subject: s,
    topic: t,
    subtopic: sub,
    concept: c,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...entries];
  const saved = setItem(STORAGE_KEY, updated);

  if (!saved) {
    return { success: false, error: 'Failed to persist taxonomy to storage.' };
  }

  return { success: true, entry: newEntry };
}

/**
 * Update an existing taxonomy entry with deduplication validation.
 *
 * @param {string} id
 * @param {Object} updates
 * @returns {{ success: boolean, entry?: Object, error?: string }}
 */
export function updateTaxonomyEntry(id, updates) {
  if (!id) return { success: false, error: 'Taxonomy ID is required.' };

  const entries = getTaxonomies();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) {
    return { success: false, error: 'Taxonomy entry not found.' };
  }

  const existing = entries[index];
  const s = updates.subject !== undefined ? normalizeText(updates.subject) : existing.subject;
  const t = updates.topic !== undefined ? normalizeText(updates.topic) : existing.topic;
  const sub = updates.subtopic !== undefined ? normalizeText(updates.subtopic) : existing.subtopic;
  const c = updates.concept !== undefined ? normalizeText(updates.concept) : existing.concept;

  if (!s || !t) {
    return { success: false, error: 'Subject and Topic cannot be empty.' };
  }

  // Check collision with another entry
  const collision = entries.find(
    (e) =>
      e.id !== id &&
      e.subject.toLowerCase() === s.toLowerCase() &&
      e.topic.toLowerCase() === t.toLowerCase() &&
      (e.subtopic || '').toLowerCase() === sub.toLowerCase() &&
      (e.concept || '').toLowerCase() === c.toLowerCase()
  );

  if (collision) {
    return {
      success: false,
      error: `Another taxonomy entry already exists with hierarchy "${s} → ${t} → ${sub} → ${c}".`,
    };
  }

  const updatedEntry = {
    ...existing,
    subject: s,
    topic: t,
    subtopic: sub || 'Unclassified',
    concept: c || 'General Concept',
    updatedAt: new Date().toISOString(),
  };

  entries[index] = updatedEntry;
  const saved = setItem(STORAGE_KEY, entries);
  return { success: saved, entry: updatedEntry };
}

/**
 * Delete a taxonomy entry.
 *
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export function deleteTaxonomyEntry(id) {
  if (!id) return { success: false, error: 'Taxonomy ID is required.' };

  const entries = getTaxonomies();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) {
    return { success: false, error: 'Taxonomy entry not found.' };
  }

  const saved = setItem(STORAGE_KEY, filtered);
  return { success: saved };
}
