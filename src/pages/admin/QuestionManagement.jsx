import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../../services/questionService.js';
import { getExaminations, getExaminationById } from '../../services/examService.js';
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
} from 'lucide-react';

export function QuestionManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || '';

  const { success, error, warning } = useToast();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    examId: initialExamId,
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

  const [editQuestion, setEditQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showExplanationInPreview, setShowExplanationInPreview] = useState(false);

  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState(null);

  // Load available exams
  useEffect(() => {
    const list = getExaminations({ includeDeleted: false });
    setExams(list);
    if (!selectedExamId && list.length > 0) {
      setSelectedExamId(list[0].id);
      setAddFormData((p) => ({ ...p, examId: list[0].id }));
    }
  }, []);

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

  const filteredQuestions = questions.filter((q) => {
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchText = q.questionText && q.questionText.toLowerCase().includes(query);
      const matchExp = q.explanation && q.explanation.toLowerCase().includes(query);
      return matchText || matchExp;
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
      // Reset form
      setAddFormData({
        examId: selectedExamId || (exams[0]?.id || ''),
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

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div>
      {/* Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="eyebrow" style={{ marginBottom: '0.375rem' }}>ASSESSMENT ITEM BANK</div>
          <h1>Question Repository</h1>
          <p>Author 4-option MCQs, define marking criteria, and preview student test items.</p>
        </div>

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
          <strong style={{ color: '#FFFFFF' }}>Result Immutability Guarantee:</strong> Editing questions or altering correct answers here applies only to future test attempts. Historical test records strictly reference the immutable snapshot captured at submission time.
        </span>
      </div>

      {/* Filter and Selection Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
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

            <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '280px' }}>
              <Input
                placeholder="Search question text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                iconLeft={<Search size={15} />}
              />
            </div>
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

        {/* Questions Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '60px' }}>#</TableHead>
              <TableHead>Question Statement</TableHead>
              <TableHead>Options (A - D)</TableHead>
              <TableHead>Correct Key</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableEmpty
                colSpan={6}
                message={
                  exams.length === 0
                    ? 'Create an examination first before authoring questions.'
                    : 'No questions have been added to this examination yet. Click "Add MCQ Question" to start building your test.'
                }
              />
            ) : (
              filteredQuestions.map((q, idx) => (
                <TableRow key={q.id}>
                  <TableCell style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Q{idx + 1}
                  </TableCell>
                  <TableCell style={{ maxWidth: '380px' }}>
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
                        title="Edit question"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirmQuestion(q)}
                        title="Delete question"
                      >
                        <Trash2 size={15} color="var(--color-danger)" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add MCQ Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Author MCQ Question"
        description="Create a four-option multiple choice test item"
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

      {/* Edit MCQ Modal */}
      <Modal
        isOpen={!!editQuestion}
        onClose={() => setEditQuestion(null)}
        title="Edit MCQ Question"
        description="Update question statement, answer choices, or point allocation"
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
                value={editFormData.marks || ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, marks: e.target.value }))}
                error={editErrors.marks}
                required
              />

              <div>
                <label className="form-label">
                  <span>Correct Key</span>
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
                  Option {editFormData.correctAnswer} is set as Correct
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

      {/* Student View Question Preview Modal */}
      <Modal
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        title="Student-Facing Question Preview"
        description="Inspect item layout exactly as presented during an examination session"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanationInPreview((p) => !p)}
            >
              {showExplanationInPreview ? 'Hide Answer Key' : 'Reveal Answer Key & Explanation'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPreviewQuestion(null)}>
              Close Preview
            </Button>
          </>
        }
      >
        {previewQuestion && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <Badge variant="neutral" size="sm">Points: {previewQuestion.marks} pts</Badge>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Single-Choice MCQ</span>
            </div>

            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              {previewQuestion.questionText}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {previewQuestion.options.map((opt) => {
                const isCorrect = showExplanationInPreview && opt.id === previewQuestion.correctAnswer;
                return (
                  <div
                    key={opt.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-border)'}`,
                      backgroundColor: isCorrect ? 'var(--color-success-subtle)' : 'var(--color-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.875rem',
                      color: isCorrect ? 'var(--color-success-text)' : 'var(--color-text-primary)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isCorrect ? 'var(--color-success)' : 'var(--color-surface-subtle)',
                        color: isCorrect ? '#fff' : 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                    {isCorrect && (
                      <Badge variant="success" size="sm" style={{ marginLeft: 'auto' }}>
                        Correct Answer
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {showExplanationInPreview && previewQuestion.explanation && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
                  Educational Rationale:
                </strong>
                {previewQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Question Confirmation Modal */}
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
              Delete Question
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
              Are you sure you want to remove this question?
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              The question will be removed from this examination's active pool. Historical student results and answer sheets will not be affected.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default QuestionManagement;

