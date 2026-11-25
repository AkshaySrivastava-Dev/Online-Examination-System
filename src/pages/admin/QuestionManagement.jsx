import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../../services/questionService.js';
import { getExaminations, getExaminationById } from '../../services/examService.js';
import {
  getTaxonomies,
  getSubjects,
  getTopics,
  getSubtopics,
  getConcepts,
  addTaxonomyEntry,
  updateTaxonomyEntry,
  deleteTaxonomyEntry,
} from '../../services/taxonomyService.js';
import { useToast } from '../../hooks/useToast.js';
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Button,
  Input,
  Badge,
  Modal,
  PageTransition,
  FloatingBackgroundElements,
} from '../../components/common';
import {
  Layers,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Info,
  FolderTree,
  Filter,
} from 'lucide-react';

export function QuestionManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || '';

  const { success, error, warning } = useToast();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');

  // Structured Taxonomy Filters
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedSubtopic, setSelectedSubtopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Taxonomy Master Repository state
  const [taxonomies, setTaxonomies] = useState([]);
  const [taxonomyModalOpen, setTaxonomyModalOpen] = useState(false);
  const [newTaxEntry, setNewTaxEntry] = useState({ subject: '', topic: '', subtopic: '', concept: '' });
  const [taxError, setTaxError] = useState('');
  const [editingTaxId, setEditingTaxId] = useState(null);
  const [editTaxForm, setEditTaxForm] = useState({ subject: '', topic: '', subtopic: '', concept: '' });

  // Add Question Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    examId: initialExamId,
    subject: 'Computer Science',
    topic: '',
    subtopic: '',
    concept: '',
    difficulty: 'Medium',
    questionText: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctAnswer: 'A',
    marks: 10,
    explanation: '',
  });
  const [addErrors, setAddErrors] = useState({});

  // Edit Question Modal State
  const [editQuestion, setEditQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showExplanationInPreview, setShowExplanationInPreview] = useState(false);
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState(null);

  // Load available exams and taxonomy master
  useEffect(() => {
    const list = getExaminations({ includeDeleted: false });
    setExams(list);
    if (!selectedExamId && list.length > 0) {
      setSelectedExamId(list[0].id);
      setAddFormData((p) => ({ ...p, examId: list[0].id }));
    }
    refreshTaxonomies();
  }, []);

  const refreshTaxonomies = () => {
    const taxList = getTaxonomies();
    setTaxonomies(taxList);
  };

  // Update query params when filter changes
  useEffect(() => {
    if (selectedExamId) {
      setSearchParams({ examId: selectedExamId });
    }
  }, [selectedExamId, setSearchParams]);

  // Load questions
  const refreshQuestions = () => {
    const list = getQuestions({
      examId: selectedExamId || undefined,
      includeDeleted: false,
    });
    setQuestions(list);
  };

  useEffect(() => {
    refreshQuestions();
  }, [selectedExamId]);

  // Unique options for filters
  const subjectsList = getSubjects();
  const topicsList = getTopics(selectedSubject !== 'all' ? selectedSubject : null);
  const subtopicsList = getSubtopics(
    selectedSubject !== 'all' ? selectedSubject : null,
    selectedTopic !== 'all' ? selectedTopic : null
  );

  const filteredQuestions = questions.filter((q) => {
    if (selectedSubject !== 'all' && (q.subject || 'Unclassified') !== selectedSubject) return false;
    if (selectedTopic !== 'all' && (q.topic || 'Unclassified') !== selectedTopic) return false;
    if (selectedSubtopic !== 'all' && (q.subtopic || 'Unclassified') !== selectedSubtopic) return false;
    if (selectedDifficulty !== 'all' && (q.difficulty || 'Medium') !== selectedDifficulty) return false;

    if (search.trim()) {
      const query = search.toLowerCase();
      const matchText = q.questionText && q.questionText.toLowerCase().includes(query);
      const matchExp = q.explanation && q.explanation.toLowerCase().includes(query);
      const matchTopic = q.topic && q.topic.toLowerCase().includes(query);
      const matchSubtopic = q.subtopic && q.subtopic.toLowerCase().includes(query);
      const matchConcept = q.concept && q.concept.toLowerCase().includes(query);
      const matchSubject = q.subject && q.subject.toLowerCase().includes(query);
      return matchText || matchExp || matchTopic || matchSubtopic || matchConcept || matchSubject;
    }
    return true;
  });

  // Handle Add MCQ
  const handleAddQuestion = () => {
    const errs = {};
    if (!addFormData.examId) errs.examId = 'Target examination is required.';
    if (!addFormData.questionText.trim()) errs.questionText = 'Question text cannot be empty.';
    addFormData.options.forEach((opt) => {
      if (!opt.text.trim()) errs[`opt_${opt.id}`] = `Option ${opt.id} cannot be empty.`;
    });
    if (!addFormData.marks || addFormData.marks <= 0)
      errs.marks = 'Marks must be greater than 0.';

    if (Object.keys(errs).length > 0) {
      setAddErrors(errs);
      return;
    }

    const res = createQuestion(addFormData);
    if (res.success) {
      success('MCQ question authored and added to examination question bank.');
      setAddModalOpen(false);
      refreshQuestions();
      refreshTaxonomies();
      // Reset form
      setAddFormData({
        examId: selectedExamId || (exams[0]?.id || ''),
        subject: 'Computer Science',
        topic: '',
        subtopic: '',
        concept: '',
        difficulty: 'Medium',
        questionText: '',
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ],
        correctAnswer: 'A',
        marks: 10,
        explanation: '',
      });
    } else {
      error(res.error || 'Failed to create question.');
    }
  };

  // Handle Open Edit
  const handleOpenEdit = (q) => {
    setEditQuestion(q);
    setEditFormData({
      subject: q.subject || 'Computer Science',
      topic: q.topic || '',
      subtopic: q.subtopic || '',
      concept: q.concept || '',
      difficulty: q.difficulty || 'Medium',
      questionText: q.questionText,
      options: JSON.parse(JSON.stringify(q.options)),
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      explanation: q.explanation || '',
    });
    setEditErrors({});
  };

  const handleSaveEdit = () => {
    const errs = {};
    if (!editFormData.questionText.trim()) errs.questionText = 'Question text cannot be empty.';
    editFormData.options.forEach((opt) => {
      if (!opt.text.trim()) errs[`opt_${opt.id}`] = `Option ${opt.id} cannot be empty.`;
    });
    if (!editFormData.marks || editFormData.marks <= 0)
      errs.marks = 'Marks must be greater than 0.';

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    const res = updateQuestion(editQuestion.id, editFormData);
    if (res.success) {
      success('Question updated successfully. (Past student results remain preserved).');
      setEditQuestion(null);
      refreshQuestions();
      refreshTaxonomies();
    } else {
      error(res.error || 'Failed to update question.');
    }
  };

  // Handle Delete
  const handleDeleteQuestion = () => {
    if (!deleteConfirmQuestion) return;
    const res = deleteQuestion(deleteConfirmQuestion.id);
    if (res.success) {
      warning('Question removed from the active question bank.');
      setDeleteConfirmQuestion(null);
      refreshQuestions();
    } else {
      error(res.error || 'Failed to delete question.');
    }
  };

  // Taxonomy Master CRUD Actions
  const handleAddTaxonomy = () => {
    setTaxError('');
    if (!newTaxEntry.subject.trim() || !newTaxEntry.topic.trim()) {
      setTaxError('Subject and Topic are required.');
      return;
    }

    const res = addTaxonomyEntry(newTaxEntry);
    if (res.success) {
      success('Taxonomy entry registered successfully.');
      setNewTaxEntry({ subject: '', topic: '', subtopic: '', concept: '' });
      refreshTaxonomies();
    } else {
      setTaxError(res.error || 'Failed to register taxonomy.');
    }
  };

  const handleSaveEditTaxonomy = (id) => {
    setTaxError('');
    const res = updateTaxonomyEntry(id, editTaxForm);
    if (res.success) {
      success('Taxonomy entry updated successfully.');
      setEditingTaxId(null);
      refreshTaxonomies();
    } else {
      setTaxError(res.error || 'Failed to update taxonomy.');
    }
  };

  const handleDeleteTaxonomy = (id) => {
    const res = deleteTaxonomyEntry(id);
    if (res.success) {
      warning('Taxonomy entry removed.');
      refreshTaxonomies();
    } else {
      error(res.error || 'Failed to delete taxonomy entry.');
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <PageTransition>
      {/* Module Header */}
      <div
        className="module-header"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '1.5rem var(--space-6)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.5rem',
        }}
      >
        <FloatingBackgroundElements count={3} opacity={0.35} />
        <div className="module-title-group" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Layers size={12} />
            ASSESSMENT ITEM BANK & TAXONOMY
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' }}>
            Question Repository
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '640px', fontSize: '0.875rem' }}>
            Structured academic taxonomy (Subject → Topic → Subtopic → Concept) with MCQ authoring, difficulty calibrations, and student preview.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <Button
            variant="secondary"
            size="md"
            iconLeft={<FolderTree size={16} />}
            onClick={() => {
              setTaxError('');
              setTaxonomyModalOpen(true);
            }}
          >
            Manage Taxonomy ({taxonomies.length})
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeft={<Plus size={16} />}
            onClick={() => {
              setAddErrors({});
              setAddFormData((p) => ({ ...p, examId: selectedExamId || (exams[0]?.id || '') }));
              setAddModalOpen(true);
            }}
            disabled={exams.length === 0}
          >
            Add MCQ Question
          </Button>
        </div>
      </div>

      {/* Immutability Architecture Notice */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: '#FFFFFF' }}>Result Immutability Guarantee:</strong> Editing questions or altering taxonomy here applies only to future test attempts. Historical test records strictly reference the frozen snapshot captured at submission time.
        </span>
      </div>

      {/* Filter and Selection Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem var(--space-6)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Row: Exam Selector & Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                Select Examination:
              </span>
              <select
                className="form-input"
                style={{ width: '280px', height: '38px', padding: '0 0.5rem', fontWeight: 500 }}
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.questionCount || 0} questions)
                  </option>
                ))}
              </select>
            </div>

            <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '320px' }}>
              <Input
                placeholder="Search text, topic, concept, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                iconLeft={<Search size={15} />}
              />
            </div>

            {selectedExam && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge variant="primary" size="md">
                  {filteredQuestions.length} Questions
                </Badge>
                <Badge variant={selectedExam.status === 'published' ? 'success' : 'neutral'} size="md" dot>
                  {selectedExam.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            )}
          </div>

          {/* Bottom Row: 4-Dimensional Taxonomy Filter Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              <Filter size={14} />
              <span>Taxonomy Filters:</span>
            </div>

            {/* Subject Filter */}
            <select
              className="form-input"
              style={{ height: '34px', padding: '0 0.5rem', fontSize: '0.8125rem', width: '180px' }}
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('all');
                setSelectedSubtopic('all');
              }}
            >
              <option value="all">All Subjects ({subjectsList.length})</option>
              {subjectsList.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            {/* Topic Filter */}
            <select
              className="form-input"
              style={{ height: '34px', padding: '0 0.5rem', fontSize: '0.8125rem', width: '200px' }}
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedSubtopic('all');
              }}
            >
              <option value="all">All Topics ({topicsList.length})</option>
              {topicsList.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>

            {/* Subtopic Filter */}
            <select
              className="form-input"
              style={{ height: '34px', padding: '0 0.5rem', fontSize: '0.8125rem', width: '190px' }}
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
            >
              <option value="all">All Subtopics ({subtopicsList.length})</option>
              {subtopicsList.map((subtop) => (
                <option key={subtop} value={subtop}>{subtop}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              className="form-input"
              style={{ height: '34px', padding: '0 0.5rem', fontSize: '0.8125rem', width: '150px' }}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {(selectedSubject !== 'all' || selectedTopic !== 'all' || selectedSubtopic !== 'all' || selectedDifficulty !== 'all') && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}
                onClick={() => {
                  setSelectedSubject('all');
                  setSelectedTopic('all');
                  setSelectedSubtopic('all');
                  setSelectedDifficulty('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Questions Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '50px' }}>#</TableHead>
              <TableHead style={{ minWidth: '320px' }}>Question & Structured Taxonomy</TableHead>
              <TableHead>Options (A - D)</TableHead>
              <TableHead style={{ width: '100px' }}>Correct Key</TableHead>
              <TableHead style={{ width: '80px' }}>Marks</TableHead>
              <TableHead style={{ textAlign: 'right', width: '110px' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableEmpty
                colSpan={6}
                message={
                  exams.length === 0
                    ? 'Create an examination first before authoring questions.'
                    : 'No questions match the current filters. Adjust taxonomy filters or author a new question.'
                }
              />
            ) : (
              filteredQuestions.map((q, idx) => (
                <TableRow key={q.id}>
                  <TableCell style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Q{idx + 1}
                  </TableCell>
                  <TableCell style={{ maxWidth: '400px' }}>
                    {/* Structured Taxonomy Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <Badge variant="primary" size="sm">
                        {q.subject || 'General'}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {q.topic || 'Unclassified'}
                      </Badge>
                      <Badge
                        variant={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Easy' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {q.difficulty || 'Medium'}
                      </Badge>
                    </div>

                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      <strong>Hierarchy:</strong> {q.subject || 'General'} › {q.topic || 'Unclassified'} › {q.subtopic || 'Unclassified'} › {q.concept || 'General Concept'}
                    </div>

                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
                      {q.questionText}
                    </div>
                    {q.explanation && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          style={{
                            fontWeight: opt.id === q.correctAnswer ? 600 : 400,
                            color: opt.id === q.correctAnswer ? 'var(--color-success)' : 'inherit',
                          }}
                        >
                          <strong>{opt.id}:</strong> {opt.text.length > 25 ? opt.text.substring(0, 23) + '...' : opt.text}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">
                      Option {q.correctAnswer}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{q.marks} pts</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setPreviewQuestion(q);
                          setShowExplanationInPreview(false);
                        }}
                        title="Student-view preview"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenEdit(q)}
                        title="Edit question & taxonomy"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirmQuestion(q)}
                        title="Delete question"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ========================================================= */}
      {/* MODAL 1: ADD MCQ QUESTION                                */}
      {/* ========================================================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Author MCQ Question & Assign Taxonomy"
        description="Select or create structured taxonomy and define question statement, options, and scoring."
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddQuestion}>
              Save to Question Bank
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">
              <span>Target Examination <span className="form-label-required">*</span></span>
            </label>
            <select
              className="form-input"
              value={addFormData.examId}
              onChange={(e) => setAddFormData((p) => ({ ...p, examId: e.target.value }))}
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Reusable Taxonomy Picker */}
          <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <label className="form-label" style={{ marginBottom: '0.375rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <FolderTree size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Reuse Existing Taxonomy Hierarchy</span>
              </span>
            </label>
            <select
              className="form-input"
              onChange={(e) => {
                const selected = taxonomies.find((t) => t.id === e.target.value);
                if (selected) {
                  setAddFormData((p) => ({
                    ...p,
                    subject: selected.subject,
                    topic: selected.topic,
                    subtopic: selected.subtopic,
                    concept: selected.concept,
                  }));
                }
              }}
            >
              <option value="">-- Choose from existing taxonomy entries --</option>
              {taxonomies.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subject} › {t.topic} › {t.subtopic} › {t.concept}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Selecting an entry auto-fills the fields below. You can also customize or type a new entry directly.
            </div>
          </div>

          {/* Hierarchy Inputs */}
          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Subject"
              placeholder="e.g. Computer Science, Information Technology"
              value={addFormData.subject}
              onChange={(e) => setAddFormData((p) => ({ ...p, subject: e.target.value }))}
              required
            />
            <Input
              label="Topic"
              placeholder="e.g. Web Architecture, Algorithms"
              value={addFormData.topic}
              onChange={(e) => setAddFormData((p) => ({ ...p, topic: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 md-grid-cols-1 gap-3">
            <Input
              label="Subtopic"
              placeholder="e.g. React Internals, Graph Traversal"
              value={addFormData.subtopic}
              onChange={(e) => setAddFormData((p) => ({ ...p, subtopic: e.target.value }))}
            />
            <Input
              label="Concept / Syllabus Node"
              placeholder="e.g. Virtual DOM Reconciliation"
              value={addFormData.concept}
              onChange={(e) => setAddFormData((p) => ({ ...p, concept: e.target.value }))}
            />
            <div>
              <label className="form-label">
                <span>Difficulty</span>
              </label>
              <select
                className="form-input"
                value={addFormData.difficulty}
                onChange={(e) => setAddFormData((p) => ({ ...p, difficulty: e.target.value }))}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <Input
            label="Question Statement"
            as="textarea"
            placeholder="State the problem clearly..."
            value={addFormData.questionText}
            onChange={(e) => setAddFormData((p) => ({ ...p, questionText: e.target.value }))}
            error={addErrors.questionText}
            required
          />

          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>
              <span>Four Options & Select Correct Key <span className="form-label-required">*</span></span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {addFormData.options.map((opt, i) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setAddFormData((p) => ({ ...p, correctAnswer: opt.id }))}
                    style={{
                      width: '36px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${addFormData.correctAnswer === opt.id ? 'var(--color-success)' : 'var(--color-border)'}`,
                      backgroundColor: addFormData.correctAnswer === opt.id ? 'var(--color-success-subtle)' : 'var(--color-surface)',
                      color: addFormData.correctAnswer === opt.id ? 'var(--color-success-text)' : 'var(--color-text-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    title={`Mark option ${opt.id} as correct answer`}
                  >
                    {opt.id}
                  </button>

                  <div style={{ flex: 1 }}>
                    <Input
                      placeholder={`Enter text for Option ${opt.id}...`}
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...addFormData.options];
                        newOpts[i].text = e.target.value;
                        setAddFormData((p) => ({ ...p, options: newOpts }));
                      }}
                      error={addErrors[`opt_${opt.id}`]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
            <Input
              label="Marks for this Question"
              type="number"
              value={addFormData.marks}
              onChange={(e) => setAddFormData((p) => ({ ...p, marks: e.target.value }))}
              error={addErrors.marks}
              required
            />

            <div>
              <label className="form-label">
                <span>Selected Correct Key</span>
              </label>
              <div
                style={{
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.75rem',
                  backgroundColor: 'var(--color-success-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-success-text)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Option {addFormData.correctAnswer} is currently selected as Correct
              </div>
            </div>
          </div>

          <Input
            label="Answer Explanation (Optional)"
            as="textarea"
            placeholder="Explain why this option is correct to aid student review..."
            value={addFormData.explanation}
            onChange={(e) => setAddFormData((p) => ({ ...p, explanation: e.target.value }))}
          />
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: EDIT MCQ QUESTION                               */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!editQuestion}
        onClose={() => setEditQuestion(null)}
        title="Edit MCQ Question & Taxonomy"
        description="Update question statement, taxonomy classification, answer choices, or point allocation"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditQuestion(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              Save Updates
            </Button>
          </>
        }
      >
        {editQuestion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Quick Reusable Taxonomy Picker */}
            <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <label className="form-label" style={{ marginBottom: '0.375rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <FolderTree size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>Reuse Existing Taxonomy Hierarchy</span>
                </span>
              </label>
              <select
                className="form-input"
                onChange={(e) => {
                  const selected = taxonomies.find((t) => t.id === e.target.value);
                  if (selected) {
                    setEditFormData((p) => ({
                      ...p,
                      subject: selected.subject,
                      topic: selected.topic,
                      subtopic: selected.subtopic,
                      concept: selected.concept,
                    }));
                  }
                }}
              >
                <option value="">-- Choose from existing taxonomy entries --</option>
                {taxonomies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.subject} › {t.topic} › {t.subtopic} › {t.concept}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
              <Input
                label="Subject"
                value={editFormData.subject || 'Computer Science'}
                onChange={(e) => setEditFormData((p) => ({ ...p, subject: e.target.value }))}
                required
              />
              <Input
                label="Topic"
                value={editFormData.topic || ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, topic: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 md-grid-cols-1 gap-3">
              <Input
                label="Subtopic"
                value={editFormData.subtopic || ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, subtopic: e.target.value }))}
              />
              <Input
                label="Concept / Syllabus Node"
                value={editFormData.concept || ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, concept: e.target.value }))}
              />
              <div>
                <label className="form-label">
                  <span>Difficulty</span>
                </label>
                <select
                  className="form-input"
                  value={editFormData.difficulty || 'Medium'}
                  onChange={(e) => setEditFormData((p) => ({ ...p, difficulty: e.target.value }))}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <Input
              label="Question Statement"
              as="textarea"
              value={editFormData.questionText || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, questionText: e.target.value }))}
              error={editErrors.questionText}
              required
            />

            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                <span>Four Options & Select Correct Key <span className="form-label-required">*</span></span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {editFormData.options?.map((opt, i) => (
                  <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setEditFormData((p) => ({ ...p, correctAnswer: opt.id }))}
                      style={{
                        width: '36px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${editFormData.correctAnswer === opt.id ? 'var(--color-success)' : 'var(--color-border)'}`,
                        backgroundColor: editFormData.correctAnswer === opt.id ? 'var(--color-success-subtle)' : 'var(--color-surface)',
                        color: editFormData.correctAnswer === opt.id ? 'var(--color-success-text)' : 'var(--color-text-primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      title={`Mark option ${opt.id} as correct answer`}
                    >
                      {opt.id}
                    </button>

                    <div style={{ flex: 1 }}>
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...editFormData.options];
                          newOpts[i].text = e.target.value;
                          setEditFormData((p) => ({ ...p, options: newOpts }));
                        }}
                        error={editErrors[`opt_${opt.id}`]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md-grid-cols-1 gap-3">
              <Input
                label="Marks for this Question"
                type="number"
                value={editFormData.marks || 10}
                onChange={(e) => setEditFormData((p) => ({ ...p, marks: e.target.value }))}
                error={editErrors.marks}
                required
              />

              <div>
                <label className="form-label">
                  <span>Selected Correct Key</span>
                </label>
                <div
                  style={{
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 0.75rem',
                    backgroundColor: 'var(--color-success-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-success-text)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Option {editFormData.correctAnswer} is currently selected as Correct
                </div>
              </div>
            </div>

            <Input
              label="Answer Explanation"
              as="textarea"
              value={editFormData.explanation || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, explanation: e.target.value }))}
            />
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: STRUCTURED TAXONOMY REPOSITORY MANAGER           */}
      {/* ========================================================= */}
      <Modal
        isOpen={taxonomyModalOpen}
        onClose={() => {
          setTaxonomyModalOpen(false);
          setEditingTaxId(null);
        }}
        title="Structured Question Taxonomy Manager"
        description="Create, edit, deduplicate, and organize hierarchical Subject → Topic → Subtopic → Concept taxonomies."
        size="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setTaxonomyModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Add New Taxonomy Entry Card */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Register New Academic Taxonomy Node
            </div>

            {taxError && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(239, 71, 67, 0.1)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-danger)',
                  fontSize: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                {taxError}
              </div>
            )}

            <div className="grid grid-cols-2 md-grid-cols-1 gap-2" style={{ marginBottom: '0.5rem' }}>
              <Input
                placeholder="Subject (e.g. Computer Science)"
                value={newTaxEntry.subject}
                onChange={(e) => setNewTaxEntry((p) => ({ ...p, subject: e.target.value }))}
              />
              <Input
                placeholder="Topic (e.g. Web Architecture)"
                value={newTaxEntry.topic}
                onChange={(e) => setNewTaxEntry((p) => ({ ...p, topic: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 md-grid-cols-1 gap-2" style={{ marginBottom: '0.75rem' }}>
              <Input
                placeholder="Subtopic (e.g. React Internals)"
                value={newTaxEntry.subtopic}
                onChange={(e) => setNewTaxEntry((p) => ({ ...p, subtopic: e.target.value }))}
              />
              <Input
                placeholder="Concept (e.g. Virtual DOM Reconciliation)"
                value={newTaxEntry.concept}
                onChange={(e) => setNewTaxEntry((p) => ({ ...p, concept: e.target.value }))}
              />
            </div>

            <Button variant="primary" size="sm" onClick={handleAddTaxonomy} iconLeft={<Plus size={14} />}>
              Add Structured Entry
            </Button>
          </div>

          {/* Existing Taxonomy List Table */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Existing Hierarchical Taxonomy Entries ({taxonomies.length})
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ backgroundColor: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Subject</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Topic</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Subtopic</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Concept</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {taxonomies.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {editingTaxId === t.id ? (
                        <>
                          <td style={{ padding: '0.5rem' }}>
                            <input
                              className="form-input"
                              style={{ height: '30px', fontSize: '0.75rem' }}
                              value={editTaxForm.subject}
                              onChange={(e) => setEditTaxForm((p) => ({ ...p, subject: e.target.value }))}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <input
                              className="form-input"
                              style={{ height: '30px', fontSize: '0.75rem' }}
                              value={editTaxForm.topic}
                              onChange={(e) => setEditTaxForm((p) => ({ ...p, topic: e.target.value }))}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <input
                              className="form-input"
                              style={{ height: '30px', fontSize: '0.75rem' }}
                              value={editTaxForm.subtopic}
                              onChange={(e) => setEditTaxForm((p) => ({ ...p, subtopic: e.target.value }))}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <input
                              className="form-input"
                              style={{ height: '30px', fontSize: '0.75rem' }}
                              value={editTaxForm.concept}
                              onChange={(e) => setEditTaxForm((p) => ({ ...p, concept: e.target.value }))}
                            />
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                            <Button size="sm" variant="primary" onClick={() => handleSaveEditTaxonomy(t.id)}>
                              Save
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{t.subject}</td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>{t.topic}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>{t.subtopic}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>{t.concept}</td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingTaxId(t.id);
                                setEditTaxForm({
                                  subject: t.subject,
                                  topic: t.topic,
                                  subtopic: t.subtopic,
                                  concept: t.concept,
                                });
                              }}
                              title="Edit taxonomy entry"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteTaxonomy(t.id)}
                              title="Delete taxonomy entry"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: PREVIEW MCQ QUESTION                            */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        title="Student-Facing Question Preview"
        description="Inspect rendered layout and answer choices exactly as presented to students."
        footer={
          <Button variant="secondary" size="sm" onClick={() => setPreviewQuestion(null)}>
            Close Preview
          </Button>
        }
      >
        {previewQuestion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Badge variant="primary">{previewQuestion.subject || 'General'}</Badge>
              <Badge variant="outline">{previewQuestion.topic || 'Unclassified'}</Badge>
              <Badge variant={previewQuestion.difficulty === 'Hard' ? 'danger' : previewQuestion.difficulty === 'Easy' ? 'success' : 'warning'}>
                {previewQuestion.difficulty || 'Medium'}
              </Badge>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {previewQuestion.marks} Marks
              </span>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
              {previewQuestion.questionText}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {previewQuestion.options.map((opt) => {
                const isCorrect = opt.id === previewQuestion.correctAnswer;
                return (
                  <div
                    key={opt.id}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${showExplanationInPreview && isCorrect ? 'var(--color-success)' : 'var(--color-border)'}`,
                      backgroundColor: showExplanationInPreview && isCorrect ? 'rgba(44, 187, 93, 0.08)' : 'var(--color-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: showExplanationInPreview && isCorrect ? 'var(--color-success)' : 'var(--color-surface)',
                        color: showExplanationInPreview && isCorrect ? '#FFFFFF' : 'inherit',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {opt.id}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                      {opt.text}
                    </span>
                    {showExplanationInPreview && isCorrect && (
                      <Badge variant="success" size="sm" style={{ marginLeft: 'auto' }}>
                        Correct Answer
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Correct Answer Key: <strong style={{ color: 'var(--color-success)' }}>Option {previewQuestion.correctAnswer}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExplanationInPreview((p) => !p)}
                >
                  {showExplanationInPreview ? 'Hide Answer Key' : 'Reveal Answer Key'}
                </Button>
              </div>

              {showExplanationInPreview && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  💡 {previewQuestion.explanation || 'No explanation provided.'}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 5: DELETE QUESTION CONFIRMATION                     */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!deleteConfirmQuestion}
        onClose={() => setDeleteConfirmQuestion(null)}
        title="Confirm Question Removal"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmQuestion(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteQuestion}>
              Remove Question
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '4px' }}>
              Are you sure you want to delete this question?
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              This question will be soft-deleted from future attempts of this examination. Any historical results created prior to this deletion will strictly retain their original question snapshots and scoring.
            </p>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}

export default QuestionManagement;
