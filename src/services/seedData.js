/**
 * ExamPro Realistic Seed Data Engine
 *
 * Populates realistic initial mock data into LocalStorage on first launch.
 * IDEMPOTENCY:
 * Checks whether keys already exist in storage (`getItem('users')`, `getItem('examinations')`).
 * If data is already present, it will NEVER overwrite or reset user changes.
 */

import { getItem, setItem } from './storageService.js';
import { mockTransformPassword } from '../utils/idGenerator.js';
import {
  EXPANDED_STUDENTS,
  EXPANDED_EXAMINATIONS,
  EXPANDED_QUESTIONS,
  EXPANDED_RESULTS,
} from './expandedSeedData.js';

// Predefined Admin Credentials
export const PREDEFINED_ADMIN = {
  id: 'usr_admin_root_001',
  fullName: 'Administrator',
  email: 'admin@exampro.com',
  passwordHash: mockTransformPassword('Admin@123'),
  role: 'admin',
  phone: '+1 (555) 019-2834',
  status: 'active',
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
};

// Realistic Seed Students
export const SEED_STUDENTS = [
  {
    id: 'usr_std_2026_001',
    studentId: 'STD-2026-001',
    fullName: 'Alex Morgan',
    email: 'alex.morgan@university.edu',
    passwordHash: mockTransformPassword('Student@123'),
    role: 'student',
    phone: '+1 (555) 234-5678',
    status: 'active',
    createdAt: '2026-10-10T09:30:00.000Z',
    updatedAt: '2026-10-10T09:30:00.000Z',
  },
  {
    id: 'usr_std_2026_002',
    studentId: 'STD-2026-002',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@university.edu',
    passwordHash: mockTransformPassword('Student@123'),
    role: 'student',
    phone: '+1 (555) 345-6789',
    status: 'active',
    createdAt: '2026-10-11T10:15:00.000Z',
    updatedAt: '2026-10-11T10:15:00.000Z',
  },
  {
    id: 'usr_std_2026_003',
    studentId: 'STD-2026-003',
    fullName: 'David Kim',
    email: 'david.kim@university.edu',
    passwordHash: mockTransformPassword('Student@123'),
    role: 'student',
    phone: '+1 (555) 456-7890',
    status: 'active',
    createdAt: '2026-10-12T11:45:00.000Z',
    updatedAt: '2026-10-12T11:45:00.000Z',
  },
  {
    id: 'usr_std_2026_004',
    studentId: 'STD-2026-004',
    fullName: 'Sophia Martinez',
    email: 'sophia.martinez@university.edu',
    passwordHash: mockTransformPassword('Student@123'),
    role: 'student',
    phone: '+1 (555) 567-8901',
    status: 'active',
    createdAt: '2026-10-13T14:20:00.000Z',
    updatedAt: '2026-10-13T14:20:00.000Z',
  },
  ...EXPANDED_STUDENTS,
];

// Realistic Seed Examinations
export const SEED_EXAMINATIONS = [
  {
    id: 'exam_cs_101',
    title: 'Full-Stack Web Development & Modern Architecture',
    description: 'Comprehensive assessment covering HTML5 semantics, CSS flexbox/grid, React 19 architecture, asynchronous JavaScript, and RESTful API principles.',
    category: 'Computer Science',
    durationMinutes: 20,
    totalMarks: 50,
    passingPercentage: 60,
    startDateTime: '2026-11-01T00:00:00.000Z',
    endDateTime: '2026-11-30T23:59:59.000Z',
    status: 'published',
    allowRetake: true,
    questionCount: 5,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'exam_cs_102',
    title: 'Data Structures, Algorithms & Complexity',
    description: 'Advanced evaluation of asymptotic time and space complexity (Big-O), balanced binary search trees, hash tables, graph traversals, and dynamic programming.',
    category: 'Computer Science',
    durationMinutes: 30,
    totalMarks: 50,
    passingPercentage: 50,
    startDateTime: '2026-11-01T00:00:00.000Z',
    endDateTime: '2026-11-30T23:59:59.000Z',
    status: 'published',
    allowRetake: false,
    isAdaptive: true,
    questionCount: 5,
    createdAt: '2026-10-22T14:00:00.000Z',
    updatedAt: '2026-10-22T14:00:00.000Z',
  },
  {
    id: 'exam_cs_103',
    title: 'Cloud Computing, DevOps & Microservices',
    description: 'Industry-standard testing covering containerization with Docker, Kubernetes orchestration, CI/CD pipelines, 12-factor apps, and distributed cloud resiliency.',
    category: 'Information Technology',
    durationMinutes: 15,
    totalMarks: 40,
    passingPercentage: 60,
    startDateTime: '2026-11-01T00:00:00.000Z',
    endDateTime: '2026-11-30T23:59:59.000Z',
    status: 'published',
    allowRetake: true,
    questionCount: 4,
    createdAt: '2026-10-25T09:00:00.000Z',
    updatedAt: '2026-10-25T09:00:00.000Z',
  },
  {
    id: 'exam_cs_104',
    title: 'Artificial Intelligence & Neural Systems (Draft)',
    description: 'Exploration of transformer models, gradient descent, loss functions, tokenization, and ethical AI deployment frameworks.',
    category: 'Data Science',
    durationMinutes: 25,
    totalMarks: 30,
    passingPercentage: 50,
    startDateTime: '2026-12-01T00:00:00.000Z',
    endDateTime: '2026-12-31T23:59:59.000Z',
    status: 'draft',
    allowRetake: false,
    questionCount: 3,
    createdAt: '2026-11-02T16:00:00.000Z',
    updatedAt: '2026-11-02T16:00:00.000Z',
  },
  {
    id: 'exam_cs_105',
    title: 'Database Systems & Query Optimization',
    description: 'Relational algebra, SQL query optimization, ACID transactions, B-Tree index tuning, and distributed concurrency control.',
    category: 'Information Technology',
    durationMinutes: 45,
    totalMarks: 50,
    passingPercentage: 50,
    startDateTime: '2026-12-05T00:00:00.000Z',
    endDateTime: '2026-12-31T23:59:59.000Z',
    status: 'published',
    allowRetake: false,
    questionCount: 5,
    createdAt: '2026-10-28T10:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z',
  },
  ...EXPANDED_EXAMINATIONS,
];

// Detailed MCQ Questions with exact marks, explanations, and 4 options
export const SEED_QUESTIONS = [
  // Exam 1: Full-Stack Web Development (5 questions * 10 marks = 50 total marks)
  {
    id: 'qst_web_001',
    examId: 'exam_cs_101',
    subject: 'Computer Science',
    topic: 'Web Architecture',
    subtopic: 'React Internals',
    concept: 'Virtual DOM Reconciliation',
    difficulty: 'Medium',
    questionText: 'What is the primary architectural purpose of the React Virtual DOM (VDOM)?',
    options: [
      { id: 'A', text: 'To replace the browser HTML rendering engine entirely with WebGL.' },
      { id: 'B', text: 'To perform fast in-memory diffing of UI changes and batch minimal mutations to the real DOM.' },
      { id: 'C', text: 'To provide persistent offline database storage in the browser.' },
      { id: 'D', text: 'To automatically compile JavaScript code into native machine assembly instructions.' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'The Virtual DOM allows React to calculate differences (reconciliation) in memory and execute the smallest necessary set of updates to the actual browser DOM, which is slow.',
    createdAt: '2026-10-20T10:05:00.000Z',
  },
  {
    id: 'qst_web_002',
    examId: 'exam_cs_101',
    subject: 'Computer Science',
    topic: 'Web Security & Protocols',
    subtopic: 'Cross-Origin Resource Sharing',
    concept: 'Access-Control Headers',
    difficulty: 'Easy',
    questionText: 'Which HTTP header is strictly necessary for a server to permit cross-origin asynchronous requests from a frontend domain?',
    options: [
      { id: 'A', text: 'Access-Control-Allow-Origin' },
      { id: 'B', text: 'Content-Security-Policy-Report-Only' },
      { id: 'C', text: 'X-Forwarded-Host-Prototype' },
      { id: 'D', text: 'Sec-WebSocket-Extensions' },
    ],
    correctAnswer: 'A',
    marks: 10,
    explanation: 'The Access-Control-Allow-Origin response header indicates whether the response can be shared with requesting code from the given origin.',
    createdAt: '2026-10-20T10:10:00.000Z',
  },
  {
    id: 'qst_web_003',
    examId: 'exam_cs_101',
    subject: 'Computer Science',
    topic: 'Web Architecture',
    subtopic: 'CSS Layouts',
    concept: 'Grid vs Flexbox Dimensions',
    difficulty: 'Easy',
    questionText: 'In modern CSS Layout, what is the key difference between CSS Flexbox and CSS Grid?',
    options: [
      { id: 'A', text: 'Flexbox works only in Safari, while Grid is exclusive to Chromium browsers.' },
      { id: 'B', text: 'Flexbox is designed for one-dimensional layouts (row or column), whereas Grid is built for two-dimensional layouts (rows and columns simultaneously).' },
      { id: 'C', text: 'Flexbox requires JavaScript polyfills, whereas Grid is purely declarative.' },
      { id: 'D', text: 'Flexbox cannot center items vertically, but Grid can.' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'Flexbox is primarily a one-dimensional layout system (row or column), while CSS Grid provides two-dimensional control over rows and columns concurrently.',
    createdAt: '2026-10-20T10:15:00.000Z',
  },
  {
    id: 'qst_web_004',
    examId: 'exam_cs_101',
    subject: 'Computer Science',
    topic: 'JavaScript Runtime',
    subtopic: 'Asynchronous Execution',
    concept: 'Event Loop Microtask Priority',
    difficulty: 'Hard',
    questionText: 'In the JavaScript event loop, which queue has highest execution priority upon completion of the current synchronous call stack?',
    options: [
      { id: 'A', text: 'Macro-task queue (setTimeout, setInterval)' },
      { id: 'B', text: 'Micro-task queue (Promise.then, MutationObserver, queueMicrotask)' },
      { id: 'C', text: 'File system I/O callback buffer' },
      { id: 'D', text: 'RequestAnimationFrame animation queue' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'All microtasks in the microtask queue are drained completely after the synchronous call stack empties before any macrotask (such as setTimeout) is executed.',
    createdAt: '2026-10-20T10:20:00.000Z',
  },
  {
    id: 'qst_web_005',
    examId: 'exam_cs_101',
    subject: 'Computer Science',
    topic: 'Web Security & Protocols',
    subtopic: 'RESTful APIs',
    concept: 'Rate Limiting Status Codes',
    difficulty: 'Easy',
    questionText: 'What does the HTTP status code 429 indicate in a RESTful API exchange?',
    options: [
      { id: 'A', text: 'The requested resource was permanently moved to a new URI.' },
      { id: 'B', text: 'The payload contains invalid syntactic or semantic JSON structure.' },
      { id: 'C', text: 'The client has sent too many requests in a given amount of time (Rate Limited).' },
      { id: 'D', text: 'The server encountered an unhandled database deadlock exception.' },
    ],
    correctAnswer: 'C',
    marks: 10,
    explanation: 'HTTP 429 Too Many Requests indicates the user has sent too many requests in a given amount of time ("rate limiting").',
    createdAt: '2026-10-20T10:25:00.000Z',
  },

  // Exam 2: Data Structures & Algorithms (5 questions * 10 marks = 50 total marks)
  {
    id: 'qst_dsa_001',
    examId: 'exam_cs_102',
    subject: 'Computer Science',
    topic: 'Data Structures',
    subtopic: 'Balanced Search Trees',
    concept: 'Red-Black Tree Search Complexity',
    difficulty: 'Hard',
    questionText: 'What is the average-case and worst-case time complexity of searching for an element in a balanced Red-Black Tree with N nodes?',
    options: [
      { id: 'A', text: 'Average: O(1), Worst: O(N)' },
      { id: 'B', text: 'Average: O(log N), Worst: O(log N)' },
      { id: 'C', text: 'Average: O(log N), Worst: O(N)' },
      { id: 'D', text: 'Average: O(N), Worst: O(N log N)' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'Because Red-Black trees maintain a strict height balance factor of at most 2*log2(N+1), searching is guaranteed O(log N) in both average and worst cases.',
    createdAt: '2026-10-22T14:05:00.000Z',
  },
  {
    id: 'qst_dsa_002',
    examId: 'exam_cs_102',
    subject: 'Computer Science',
    topic: 'Algorithms',
    subtopic: 'Graph Traversal',
    concept: 'Breadth-First Shortest Path',
    difficulty: 'Medium',
    questionText: 'Which graph traversal algorithm is optimal for finding the shortest path in an unweighted graph?',
    options: [
      { id: 'A', text: 'Depth-First Search (DFS)' },
      { id: 'B', text: 'Breadth-First Search (BFS)' },
      { id: 'C', text: 'Bellman-Ford Algorithm' },
      { id: 'D', text: 'Prim’s Minimum Spanning Tree' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'BFS explores neighbor nodes level by level, ensuring that the first time a destination node is reached, it is via the minimum number of edges in an unweighted graph.',
    createdAt: '2026-10-22T14:10:00.000Z',
  },
  {
    id: 'qst_dsa_003',
    examId: 'exam_cs_102',
    subject: 'Computer Science',
    topic: 'Data Structures',
    subtopic: 'Hashing',
    concept: 'Open Addressing Collision Resolution',
    difficulty: 'Medium',
    questionText: 'What is the primary technique used to resolve collisions in an open-addressing Hash Table?',
    options: [
      { id: 'A', text: 'Separate Chaining with linked lists' },
      { id: 'B', text: 'Linear Probing, Quadratic Probing, or Double Hashing' },
      { id: 'C', text: 'Dynamic Array re-allocation with Fibonacci expansion' },
      { id: 'D', text: 'Depth-first backtrack hashing' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'Open addressing stores all elements directly within the hash table slots, using probing techniques (linear, quadratic, or double hashing) to locate unoccupied buckets.',
    createdAt: '2026-10-22T14:15:00.000Z',
  },
  {
    id: 'qst_dsa_004',
    examId: 'exam_cs_102',
    subject: 'Computer Science',
    topic: 'Algorithms',
    subtopic: 'Dynamic Programming',
    concept: 'Optimal Substructure & Overlapping Subproblems',
    difficulty: 'Medium',
    questionText: 'In dynamic programming, what are the two fundamental properties a problem must possess to be solvable via DP?',
    options: [
      { id: 'A', text: 'Continuous differentiability and deterministic randomness' },
      { id: 'B', text: 'Greedy choice property and polynomial verification' },
      { id: 'C', text: 'Optimal substructure and overlapping subproblems' },
      { id: 'D', text: 'Divide-and-conquer and non-recurrent base states' },
    ],
    correctAnswer: 'C',
    marks: 10,
    explanation: 'Dynamic programming requires that optimal solutions to subproblems combine into the overall optimal solution (optimal substructure) and that the same subproblems are solved repeatedly (overlapping subproblems).',
    createdAt: '2026-10-22T14:20:00.000Z',
  },
  {
    id: 'qst_dsa_005',
    examId: 'exam_cs_102',
    subject: 'Computer Science',
    topic: 'Algorithms',
    subtopic: 'Sorting',
    concept: 'Merge Sort Auxiliary Space',
    difficulty: 'Easy',
    questionText: 'What is the space complexity of merge sort when sorting an array of N integers in standard implementation?',
    options: [
      { id: 'A', text: 'O(1) auxiliary space' },
      { id: 'B', text: 'O(N) auxiliary space' },
      { id: 'C', text: 'O(log N) auxiliary space' },
      { id: 'D', text: 'O(N^2) auxiliary space' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'Standard merge sort requires an auxiliary array of size O(N) to merge the partitioned sub-arrays back together.',
    createdAt: '2026-10-22T14:25:00.000Z',
  },

  // Exam 3: Cloud Computing & DevOps (4 questions * 10 marks = 40 total marks)
  {
    id: 'qst_cloud_001',
    examId: 'exam_cs_103',
    subject: 'Information Technology',
    topic: 'Cloud & Infrastructure',
    subtopic: 'Kubernetes Architecture',
    concept: 'Pod Scheduling Mechanism',
    difficulty: 'Medium',
    questionText: 'In Kubernetes architecture, which master component is responsible for distributing and assigning Pods to worker nodes based on resource availability?',
    options: [
      { id: 'A', text: 'kube-proxy' },
      { id: 'B', text: 'kube-scheduler' },
      { id: 'C', text: 'kubelet' },
      { id: 'D', text: 'etcd' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'The kube-scheduler watches for newly created Pods with no assigned node and selects an optimal node for them to run on.',
    createdAt: '2026-10-25T09:05:00.000Z',
  },
  {
    id: 'qst_cloud_002',
    examId: 'exam_cs_103',
    subject: 'Information Technology',
    topic: 'DevOps & CI/CD',
    subtopic: 'Deployment Strategies',
    concept: 'Traffic Splitting & Rollout Patterns',
    difficulty: 'Medium',
    questionText: 'What is the primary distinction between Blue-Green Deployment and Canary Deployment?',
    options: [
      { id: 'A', text: 'Blue-Green deploys to mobile, while Canary deploys to web only.' },
      { id: 'B', text: 'Blue-Green switches 100% of traffic instantaneously between two environments, while Canary gradually rolls out traffic to a small percentage of users first.' },
      { id: 'C', text: 'Blue-Green requires container destruction, while Canary requires bare-metal servers.' },
      { id: 'D', text: 'Canary deployments do not allow rollbacks.' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'Blue-Green maintains two identical environments and switches traffic at the router, whereas Canary incrementally exposes the new release to a fractional subset of live users.',
    createdAt: '2026-10-25T09:10:00.000Z',
  },
  {
    id: 'qst_cloud_003',
    examId: 'exam_cs_103',
    subject: 'Information Technology',
    topic: 'Cloud & Infrastructure',
    subtopic: 'Containerization',
    concept: 'Control Groups Resource Metering',
    difficulty: 'Hard',
    questionText: 'Which Linux kernel feature enables Docker to isolate resource consumption (CPU, memory, disk I/O) for individual containers?',
    options: [
      { id: 'A', text: 'Control Groups (cgroups)' },
      { id: 'B', text: 'SELinux labels' },
      { id: 'C', text: 'IPTables routing rules' },
      { id: 'D', text: 'Chroot virtual environments' },
    ],
    correctAnswer: 'A',
    marks: 10,
    explanation: 'Control groups (cgroups) provide resource metering and limiting for memory, CPU, and device access, while namespaces provide isolation of process trees and network stacks.',
    createdAt: '2026-10-25T09:15:00.000Z',
  },
  {
    id: 'qst_cloud_004',
    examId: 'exam_cs_103',
    subject: 'Information Technology',
    topic: 'DevOps & CI/CD',
    subtopic: 'Cloud-Native Architecture',
    concept: 'Environment Variable Configuration',
    difficulty: 'Easy',
    questionText: 'According to the 12-Factor App methodology, how should application configuration (e.g. database credentials, API tokens) be stored?',
    options: [
      { id: 'A', text: 'Hardcoded in dedicated configuration constants in source control.' },
      { id: 'B', text: 'Stored strictly in environment variables (env vars) separated from code.' },
      { id: 'C', text: 'Committed to XML files in the repository root directory.' },
      { id: 'D', text: 'Embedded in compiled JavaScript bundles.' },
    ],
    correctAnswer: 'B',
    marks: 10,
    explanation: 'Factor III of the Twelve-Factor App specifies that config that varies between deployments (staging, production) should be stored in environment variables.',
    createdAt: '2026-10-25T09:20:00.000Z',
  },

  // Exam 4: Draft Questions (sum to 30 marks)
  {
    id: 'qst_ai_001',
    examId: 'exam_cs_104',
    subject: 'Computer Science',
    topic: 'Machine Learning',
    subtopic: 'Transformer Architectures',
    concept: 'Self-Attention Alignment',
    difficulty: 'Hard',
    questionText: 'What is the attention mechanism primarily computing in transformer models?',
    options: [
      { id: 'A', text: 'Soft alignment weights between query and key vectors.' },
      { id: 'B', text: 'The physical clock cycle latency of GPU memory.' },
      { id: 'C', text: 'The cryptographic signature of the prompt.' },
      { id: 'D', text: 'Convolutional filter kernel strides.' },
    ],
    correctAnswer: 'A',
    marks: 10,
    explanation: 'Self-attention calculates compatibility scores between queries and keys, mapping values into a contextualized representation.',
    createdAt: '2026-11-02T16:05:00.000Z',
  },
  {
    id: 'qst_ai_002',
    examId: 'exam_cs_104',
    subject: 'Computer Science',
    topic: 'Machine Learning',
    subtopic: 'Deep Neural Networks',
    concept: 'Vanishing Gradient Mitigation',
    difficulty: 'Medium',
    questionText: 'What problem does residual (skip) connections solve in deep neural networks?',
    options: [
      { id: 'A', text: 'Vanishing and exploding gradients during backpropagation.' },
      { id: 'B', text: 'Overheating of GPU cores.' },
      { id: 'C', text: 'Lack of training dataset samples.' },
      { id: 'D', text: 'Loss of floating-point precision in CPU registers.' },
    ],
    correctAnswer: 'A',
    marks: 10,
    explanation: 'Residual connections allow gradients to flow directly through skip paths, preventing vanishing gradient degradation in deep architectures.',
    createdAt: '2026-11-02T16:10:00.000Z',
  },
  {
    id: 'qst_ai_003',
    examId: 'exam_cs_104',
    subject: 'Computer Science',
    topic: 'Machine Learning',
    subtopic: 'Generative Models',
    concept: 'Entropy & Temperature Scaling',
    difficulty: 'Easy',
    questionText: 'What is the purpose of temperature parameter in LLM text generation sampling?',
    options: [
      { id: 'A', text: 'Controls the randomness and entropy of token probability distributions.' },
      { id: 'B', text: 'Monitors thermal throttling of server processors.' },
      { id: 'C', text: 'Specifies the maximum character count of output.' },
      { id: 'D', text: 'Determines the cache lifespan of vector embeddings.' },
    ],
    correctAnswer: 'A',
    marks: 10,
    explanation: 'Lower temperature sharpens the probability distribution making output more deterministic; higher temperature flattens it for increased diversity.',
    createdAt: '2026-11-02T16:15:00.000Z',
  },
  ...EXPANDED_QUESTIONS,
];

// Sample Historical Results (with complete immutable snapshots)
export const SEED_RESULTS = [
  {
    id: 'res_seed_001',
    attemptId: 'att_seed_001',
    examId: 'exam_cs_101',
    examSnapshot: {
      title: 'Full-Stack Web Development & Modern Architecture',
      description: 'Comprehensive assessment covering HTML5 semantics, CSS flexbox/grid, React 19 architecture, asynchronous JavaScript, and RESTful API principles.',
      category: 'Computer Science',
      durationMinutes: 20,
      totalMarks: 50,
      passingPercentage: 60,
    },
    studentSnapshot: {
      id: 'usr_std_2026_001',
      studentId: 'STD-2026-001',
      fullName: 'Alex Morgan',
      email: 'alex.morgan@university.edu',
    },
    totalQuestions: 5,
    attemptedCount: 5,
    correctCount: 4,
    incorrectCount: 1,
    unansweredCount: 0,
    totalMarks: 50,
    marksObtained: 40,
    percentage: 80,
    isPassed: true,
    submittedAt: '2026-11-02T11:22:00.000Z',
    durationTakenSeconds: 745,
    submissionType: 'manual',
    answersBreakdown: [
      {
        questionId: 'qst_web_001',
        questionText: 'What is the primary architectural purpose of the React Virtual DOM (VDOM)?',
        options: [
          { id: 'A', text: 'To replace the browser HTML rendering engine entirely with WebGL.' },
          { id: 'B', text: 'To perform fast in-memory diffing of UI changes and batch minimal mutations to the real DOM.' },
          { id: 'C', text: 'To provide persistent offline database storage in the browser.' },
          { id: 'D', text: 'To automatically compile JavaScript code into native machine assembly instructions.' },
        ],
        studentAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        marksAwarded: 10,
        maxMarks: 10,
        explanation: 'Correct! Virtual DOM minimizes browser DOM thrashing.',
      },
      {
        questionId: 'qst_web_002',
        questionText: 'Which HTTP header is strictly necessary for a server to permit cross-origin asynchronous requests from a frontend domain?',
        options: [
          { id: 'A', text: 'Access-Control-Allow-Origin' },
          { id: 'B', text: 'Content-Security-Policy-Report-Only' },
          { id: 'C', text: 'X-Forwarded-Host-Prototype' },
          { id: 'D', text: 'Sec-WebSocket-Extensions' },
        ],
        studentAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        marksAwarded: 10,
        maxMarks: 10,
        explanation: 'Correct! Access-Control-Allow-Origin defines allowed origins.',
      },
      {
        questionId: 'qst_web_003',
        questionText: 'In modern CSS Layout, what is the key difference between CSS Flexbox and CSS Grid?',
        options: [
          { id: 'A', text: 'Flexbox works only in Safari, while Grid is exclusive to Chromium browsers.' },
          { id: 'B', text: 'Flexbox is designed for one-dimensional layouts (row or column), whereas Grid is built for two-dimensional layouts (rows and columns simultaneously).' },
          { id: 'C', text: 'Flexbox requires JavaScript polyfills, whereas Grid is purely declarative.' },
          { id: 'D', text: 'Flexbox cannot center items vertically, but Grid can.' },
        ],
        studentAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        marksAwarded: 10,
        maxMarks: 10,
        explanation: 'Correct! Flexbox is 1D, Grid is 2D.',
      },
      {
        questionId: 'qst_web_004',
        questionText: 'In the JavaScript event loop, which queue has highest execution priority upon completion of the current synchronous call stack?',
        options: [
          { id: 'A', text: 'Macro-task queue (setTimeout, setInterval)' },
          { id: 'B', text: 'Micro-task queue (Promise.then, MutationObserver, queueMicrotask)' },
          { id: 'C', text: 'File system I/O callback buffer' },
          { id: 'D', text: 'RequestAnimationFrame animation queue' },
        ],
        studentAnswer: 'A',
        correctAnswer: 'B',
        isCorrect: false,
        marksAwarded: 0,
        maxMarks: 10,
        explanation: 'Incorrect. The microtask queue executes prior to macrotasks.',
      },
      {
        questionId: 'qst_web_005',
        questionText: 'What does the HTTP status code 429 indicate in a RESTful API exchange?',
        options: [
          { id: 'A', text: 'The requested resource was permanently moved to a new URI.' },
          { id: 'B', text: 'The payload contains invalid syntactic or semantic JSON structure.' },
          { id: 'C', text: 'The client has sent too many requests in a given amount of time (Rate Limited).' },
          { id: 'D', text: 'The server encountered an unhandled database deadlock exception.' },
        ],
        studentAnswer: 'C',
        correctAnswer: 'C',
        isCorrect: true,
        marksAwarded: 10,
        maxMarks: 10,
        explanation: 'Correct! 429 stands for Too Many Requests.',
      },
    ],
    examFairAudit: {
      verifiedAt: '2026-11-02T14:55:00.000Z',
      tabSwitches: 0,
      copyPasteAttempts: 0,
      rapidAnomalies: 0,
      integrityScore: 100,
      status: 'CLEAN_VERIFIED',
      riskLevel: 'LOW',
      summary: 'Assessment session fully verified with zero suspicious telemetry.',
    },
  },
  {
    id: 'res_seed_002',
    attemptId: 'att_seed_002',
    examId: 'exam_cs_102',
    examSnapshot: {
      title: 'Data Structures, Algorithms & Complexity',
      description: 'Advanced evaluation of asymptotic time and space complexity, balanced BSTs, and dynamic programming.',
      category: 'Computer Science',
      durationMinutes: 30,
      totalMarks: 50,
      passingPercentage: 50,
    },
    studentSnapshot: {
      id: 'usr_std_2026_002',
      studentId: 'STD-2026-002',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@university.edu',
    },
    totalQuestions: 5,
    attemptedCount: 5,
    correctCount: 5,
    incorrectCount: 0,
    unansweredCount: 0,
    totalMarks: 50,
    marksObtained: 50,
    percentage: 100,
    isPassed: true,
    submittedAt: '2026-11-03T15:40:00.000Z',
    durationTakenSeconds: 1100,
    submissionType: 'manual',
    examFairAudit: {
      verifiedAt: '2026-11-03T15:40:00.000Z',
      tabSwitches: 1,
      copyPasteAttempts: 0,
      rapidAnomalies: 0,
      integrityScore: 90,
      status: 'CLEAN_VERIFIED',
      riskLevel: 'LOW',
      summary: 'Assessment session verified with minor window unfocus logged.',
    },
    adaptiveReport: {
      theta: 1.85,
      scaledScore: 88,
      proficiencyTier: 'Advanced / Mastery',
      trajectory: ['Medium (Correct)', 'Hard (Correct)', 'Hard (Correct)', 'Hard (Correct)', 'Hard (Correct)'],
    },
    answersBreakdown: [],
  },
  {
    id: 'res_seed_003',
    attemptId: 'att_seed_003',
    examId: 'exam_cs_101',
    examSnapshot: {
      title: 'Full-Stack Web Development & Modern Architecture',
      description: 'Comprehensive assessment covering HTML5, React, and CSS architecture.',
      category: 'Computer Science',
      durationMinutes: 20,
      totalMarks: 50,
      passingPercentage: 60,
    },
    studentSnapshot: {
      id: 'usr_std_2026_003',
      studentId: 'STD-2026-003',
      fullName: 'David Kim',
      email: 'david.kim@university.edu',
    },
    totalQuestions: 5,
    attemptedCount: 4,
    correctCount: 2,
    incorrectCount: 2,
    unansweredCount: 1,
    totalMarks: 50,
    marksObtained: 20,
    percentage: 40,
    isPassed: false,
    submittedAt: '2026-11-04T09:12:00.000Z',
    durationTakenSeconds: 1200,
    submissionType: 'auto-timer',
    answersBreakdown: [],
  },
  ...EXPANDED_RESULTS,
];

/**
 * Initializes default demo data if missing or merges missing seed entities idempotently.
 * Will NOT overwrite existing records if they have already been seeded or modified.
 *
 * @returns {{ initialized: boolean, usersCount: number, examsCount: number, questionsCount: number, resultsCount: number }}
 */
export const initializeSeedData = () => {
  let initialized = false;

  // 1. Initialize / Merge Users (Admin + Seed Students)
  const existingUsers = getItem('users', null);
  const initialUsers = [PREDEFINED_ADMIN, ...SEED_STUDENTS];
  if (!existingUsers || !Array.isArray(existingUsers) || existingUsers.length === 0) {
    setItem('users', initialUsers);
    initialized = true;
    console.info(`[seedData] Initialized ${initialUsers.length} seed users.`);
  } else {
    const existingIds = new Set(existingUsers.map((u) => u.id));
    const missingUsers = initialUsers.filter((u) => !existingIds.has(u.id));
    if (missingUsers.length > 0) {
      setItem('users', [...existingUsers, ...missingUsers]);
      initialized = true;
      console.info(`[seedData] Merged ${missingUsers.length} missing seed users.`);
    }
  }

  // 2. Initialize / Merge Examinations
  const existingExams = getItem('examinations', null);
  if (!existingExams || !Array.isArray(existingExams) || existingExams.length === 0) {
    setItem('examinations', SEED_EXAMINATIONS);
    initialized = true;
    console.info(`[seedData] Initialized ${SEED_EXAMINATIONS.length} seed examinations.`);
  } else {
    const existingIds = new Set(existingExams.map((e) => e.id));
    const missingExams = SEED_EXAMINATIONS.filter((e) => !existingIds.has(e.id));
    if (missingExams.length > 0) {
      setItem('examinations', [...existingExams, ...missingExams]);
      initialized = true;
      console.info(`[seedData] Merged ${missingExams.length} missing seed examinations.`);
    }
  }

  // 3. Initialize / Merge Questions
  const existingQuestions = getItem('questions', null);
  if (!existingQuestions || !Array.isArray(existingQuestions) || existingQuestions.length === 0) {
    setItem('questions', SEED_QUESTIONS);
    initialized = true;
    console.info(`[seedData] Initialized ${SEED_QUESTIONS.length} seed questions.`);
  } else {
    const existingIds = new Set(existingQuestions.map((q) => q.id));
    const missingQuestions = SEED_QUESTIONS.filter((q) => !existingIds.has(q.id));
    if (missingQuestions.length > 0) {
      setItem('questions', [...existingQuestions, ...missingQuestions]);
      initialized = true;
      console.info(`[seedData] Merged ${missingQuestions.length} missing seed questions.`);
    }
  }

  // 4. Initialize / Merge Historical Results
  const existingResults = getItem('results', null);
  if (!existingResults || !Array.isArray(existingResults) || existingResults.length === 0) {
    setItem('results', SEED_RESULTS);
    initialized = true;
    console.info(`[seedData] Initialized ${SEED_RESULTS.length} seed results.`);
  } else {
    const existingIds = new Set(existingResults.map((r) => r.id));
    const missingResults = SEED_RESULTS.filter((r) => !existingIds.has(r.id));
    if (missingResults.length > 0) {
      setItem('results', [...existingResults, ...missingResults]);
      initialized = true;
      console.info(`[seedData] Merged ${missingResults.length} missing seed results.`);
    }
  }

  const currentUsers = getItem('users', []);
  const currentExams = getItem('examinations', []);
  const currentQuestions = getItem('questions', []);
  const currentResults = getItem('results', []);

  return {
    initialized,
    usersCount: currentUsers.length,
    examsCount: currentExams.length,
    questionsCount: currentQuestions.length,
    resultsCount: currentResults.length,
  };
};

