/* AIF-C01 flashcard dataset — parsed from the memorization sheet.
   Each card: { id, cat, front, back, quiz?, tag?, use? }
   quiz:true → eligible for multiple-choice quiz mode
   use      → concise "purpose / why it matters", revealed by the Show purpose button */

(function () {
  const categories = [
    { id: 'services', name: 'AWS Services',     short: 'Services',  hue: 188, blurb: 'What does each service do? — the #1 question pattern.' },
    { id: 'acronyms', name: 'Acronyms',         short: 'Acronyms',  hue: 286, blurb: 'Decode every abbreviation cold.' },
    { id: 'concepts', name: 'Core Concepts',    short: 'Concepts',  hue: 150, blurb: 'Learning types, metrics, the customization ladder.' },
    { id: 'patterns', name: 'Question Patterns', short: 'Patterns', hue: 24,  blurb: 'Scenario → answer. Train the reflex.' },
  ];

  const c = (id, cat, front, back, extra = {}) => ({ id, cat, front, back, ...extra });

  const cards = [
    // ───────────────── ACRONYMS ─────────────────
    c('a1',  'acronyms', 'AI',        'Artificial Intelligence', { quiz: true, use: 'Umbrella field for machines performing human-like tasks.' }),
    c('a2',  'acronyms', 'ML',        'Machine Learning', { quiz: true, use: 'Systems that learn patterns from data instead of explicit rules.' }),
    c('a3',  'acronyms', 'DL',        'Deep Learning', { quiz: true, use: 'ML using multi-layer neural networks for complex patterns.' }),
    c('a4',  'acronyms', 'NLP',       'Natural Language Processing', { quiz: true, use: 'Lets computers understand and generate human language.' }),
    c('a5',  'acronyms', 'LLM',       'Large Language Model', { quiz: true, use: 'Generates and understands text; powers chatbots and assistants.' }),
    c('a6',  'acronyms', 'GenAI',     'Generative AI', { quiz: true, use: 'Creates new content — text, images, code — from a prompt.' }),
    c('a7',  'acronyms', 'FM',        'Foundation Model', { quiz: true, use: 'Large pre-trained model adapted to many downstream tasks.' }),
    c('a8',  'acronyms', 'RAG',       'Retrieval Augmented Generation', { quiz: true, use: 'Grounds an FM in your own data to reduce hallucination — no training.' }),
    c('a9',  'acronyms', 'MCP',       'Model Context Protocol — connects agents to external systems', { quiz: true, use: 'Standard way to connect AI agents to external tools and data.' }),
    c('a10', 'acronyms', 'MLOps',     'Machine Learning Operations', { quiz: true, use: 'Practices to deploy, monitor and maintain ML in production.' }),
    c('a11', 'acronyms', 'RLHF',      'Reinforcement Learning from Human Feedback', { quiz: true, use: 'Aligns model output to human preferences during training.' }),
    c('a12', 'acronyms', 'ROUGE',     'Recall-Oriented Understudy for Gisting Evaluation — text summarization metric', { quiz: true, use: 'Scores summary quality by overlap with a reference.' }),
    c('a13', 'acronyms', 'BLEU',      'Bilingual Evaluation Understudy — translation metric', { quiz: true, use: 'Scores machine-translation quality against a reference.' }),
    c('a14', 'acronyms', 'BERTScore', 'Semantic similarity metric for generated text', { quiz: true, use: 'Judges generated text by meaning, not exact word overlap.' }),
    c('a15', 'acronyms', 'ROI',       'Return on Investment', { quiz: true, use: 'Measures the business value of an AI project versus its cost.' }),
    c('a16', 'acronyms', 'F1 score',  'Harmonic mean of precision and recall', { quiz: true, use: 'Balances precision and recall — good for imbalanced classes.' }),
    c('a17', 'acronyms', 'A2I',       'Amazon Augmented AI — human-in-the-loop review', { quiz: true, use: 'Routes low-confidence ML predictions to humans for review.' }),
    c('a18', 'acronyms', 'IAM',       'Identity and Access Management', { quiz: true, use: 'Controls who can access which AWS resources.' }),
    c('a19', 'acronyms', 'KMS',       'Key Management Service — encryption keys', { quiz: true, use: 'Creates and manages encryption keys to protect data.' }),

    // ───────────────── SERVICES ─────────────────
    // Managed AI services
    c('s1',  'services', 'Amazon Comprehend',   'NLP — sentiment, entities, key phrases, PII detection', { quiz: true, tag: 'Managed AI', use: 'Reach for it to mine sentiment or PII from raw text.' }),
    c('s2',  'services', 'Amazon Transcribe',   'Speech → text', { quiz: true, tag: 'Managed AI', use: 'Use it to caption calls, meetings or voice notes.' }),
    c('s3',  'services', 'Amazon Translate',    'Language translation', { quiz: true, tag: 'Managed AI', use: 'Localize app content or chat across languages.' }),
    c('s4',  'services', 'Amazon Polly',        'Text → speech (voice)', { quiz: true, tag: 'Managed AI', use: 'Give apps a spoken voice — IVR, audiobooks, accessibility.' }),
    c('s5',  'services', 'Amazon Lex',          'Chatbots / conversational voice & text interfaces', { quiz: true, tag: 'Managed AI', use: 'The bot brain behind Alexa-style chat and voice apps.' }),
    c('s6',  'services', 'Amazon Rekognition',  'Image & video analysis (computer vision)', { quiz: true, tag: 'Managed AI', use: 'Detect objects, faces or moderation issues in media.' }),
    c('s7',  'services', 'Amazon Textract',     'Extract text & data from scanned documents (OCR)', { quiz: true, tag: 'Managed AI', use: 'Pull fields from invoices, forms and IDs — beyond plain OCR.' }),
    c('s8',  'services', 'Amazon Kendra',       'Intelligent enterprise search', { quiz: true, tag: 'Managed AI', use: 'Add natural-language search across your documents.' }),
    c('s9',  'services', 'Amazon Personalize',  'Recommendation systems', { quiz: true, tag: 'Managed AI', use: 'The same tech behind Amazon.com "recommended for you".' }),
    c('s10', 'services', 'Amazon A2I',          'Human review of ML predictions (human-in-the-loop)', { quiz: true, tag: 'Managed AI', use: 'Add a human checkpoint when ML confidence is low.' }),
    // GenAI / FM platform
    c('s11', 'services', 'Amazon Bedrock',                   'Managed access to foundation models via API — the central GenAI service', { quiz: true, tag: 'GenAI / FM', use: 'The exam\u2019s default answer for "use FMs via API".' }),
    c('s12', 'services', 'Bedrock Knowledge Bases',          'RAG — ground FMs in your own data', { quiz: true, tag: 'GenAI / FM', use: 'The managed way to do RAG on Bedrock.' }),
    c('s13', 'services', 'Bedrock Guardrails',               'Content filtering & safety — block harmful / toxic output', { quiz: true, tag: 'GenAI / FM', use: 'The answer for "block toxic or unsafe FM output".' }),
    c('s14', 'services', 'Bedrock Model Evaluation',         'Evaluate & compare FM performance', { quiz: true, tag: 'GenAI / FM', use: 'Compare models to pick the best for your task.' }),
    c('s15', 'services', 'Bedrock Prompt Management',        'Prompt versioning & management', { quiz: true, tag: 'GenAI / FM', use: 'Version and reuse prompts like source code.' }),
    c('s16', 'services', 'Bedrock AgentCore',                'Build & run AI agents (incl. AgentCore Identity, Policy)', { quiz: true, tag: 'GenAI / FM', use: 'Run multi-step agents that call tools securely.' }),
    c('s17', 'services', 'Amazon Nova',                      'Amazon\u2019s own family of foundation models', { quiz: true, tag: 'GenAI / FM', use: 'Amazon\u2019s first-party FMs offered inside Bedrock.' }),
    c('s18', 'services', 'Amazon Q',                         'AWS generative AI assistant', { quiz: true, tag: 'GenAI / FM', use: 'AWS\u2019s built-in GenAI helper for code and the console.' }),
    // SageMaker
    c('s19', 'services', 'Amazon SageMaker AI',     'Build, train & deploy ML models', { quiz: true, tag: 'SageMaker', use: 'Pick it when you build custom models, not just use FMs.' }),
    c('s20', 'services', 'SageMaker JumpStart',     'Pre-trained models / FM hub', { quiz: true, tag: 'SageMaker', use: 'Start from a pre-trained model instead of scratch.' }),
    c('s21', 'services', 'SageMaker Clarify',       'Bias detection + explainability', { quiz: true, tag: 'SageMaker', use: 'The answer for "detect bias" or "explain a prediction".' }),
    c('s22', 'services', 'SageMaker Model Monitor', 'Monitor models in production (drift)', { quiz: true, tag: 'SageMaker', use: 'Catch data or quality drift after deployment.' }),
    c('s23', 'services', 'SageMaker Model Cards',   'Document model details — transparency & data lineage', { quiz: true, tag: 'SageMaker', use: 'The answer for "document model lineage & details".' }),
    // Security / governance
    c('s24', 'services', 'AWS IAM',             'Roles, policies, permissions — access control', { quiz: true, tag: 'Security', use: 'First line of access control for every AWS resource.' }),
    c('s25', 'services', 'AWS KMS',             'Encryption key management', { quiz: true, tag: 'Security', use: 'The answer for "manage encryption keys".' }),
    c('s26', 'services', 'Amazon Macie',        'Discover & protect sensitive data (PII) in S3', { quiz: true, tag: 'Security', use: 'The answer for "find PII sitting in S3".' }),
    c('s27', 'services', 'AWS PrivateLink',     'Private connectivity — no public internet', { quiz: true, tag: 'Security', use: 'Keep service traffic off the public internet.' }),
    c('s28', 'services', 'AWS CloudTrail',      'Audit log of API activity', { quiz: true, tag: 'Security', use: 'The answer for "audit who called which API".' }),
    c('s29', 'services', 'Amazon CloudWatch',   'Monitoring & metrics', { quiz: true, tag: 'Security', use: 'Metrics, logs and alarms for your workloads.' }),
    c('s30', 'services', 'AWS Config',          'Resource configuration compliance', { quiz: true, tag: 'Security', use: 'Track and flag resource configuration changes.' }),
    c('s31', 'services', 'AWS Audit Manager',   'Automate compliance audits', { quiz: true, tag: 'Security', use: 'Automate evidence collection for audits.' }),
    c('s32', 'services', 'AWS Artifact',        'On-demand compliance reports', { quiz: true, tag: 'Security', use: 'Self-serve AWS compliance reports (SOC, ISO…).' }),
    c('s33', 'services', 'Amazon Inspector',    'Vulnerability scanning', { quiz: true, tag: 'Security', use: 'Scan workloads for known vulnerabilities.' }),
    c('s34', 'services', 'AWS Trusted Advisor', 'Best-practice recommendations', { quiz: true, tag: 'Security', use: 'Automated best-practice checks across your account.' }),
    // Extra reference
    c('s35', 'services', 'Vector databases for embeddings', 'OpenSearch Service, Aurora, Neptune, RDS for PostgreSQL', { tag: 'Reference', use: 'Where embeddings are stored so RAG can search them.' }),

    // ───────────────── CORE CONCEPTS ─────────────────
    c('k1',  'concepts', 'The AI → ML → DL hierarchy', 'AI ⊃ ML ⊃ Deep Learning. GenAI is a subset of DL that uses Foundation Models.', { use: 'Know the nesting: GenAI sits inside DL, inside ML, inside AI.' }),
    c('k2',  'concepts', 'Agentic AI', 'Autonomous, multi-step, tool-using systems', { use: 'The "autonomous, tool-using" buzzword on the newer exam.' }),
    c('k3',  'concepts', 'Supervised learning', 'Labeled data → classification & regression', { use: 'If the scenario gives labeled data, pick this.' }),
    c('k4',  'concepts', 'Unsupervised learning', 'Unlabeled data → clustering', { use: 'No labels and you want groupings? Pick this.' }),
    c('k5',  'concepts', 'Reinforcement learning', 'Reward / penalty feedback (RLHF for FMs)', { use: 'Trial-and-error with rewards — also how RLHF works.' }),
    c('k6',  'concepts', 'Inference types', 'Batch, real-time, asynchronous, serverless', { use: 'Match latency and throughput needs to the right mode.' }),
    c('k7',  'concepts', 'Regression', 'Predict a number (continuous value)', { use: 'Use when the target is a quantity, like price or temperature.' }),
    c('k8',  'concepts', 'Classification', 'Predict a category', { use: 'Use when the target is a label, like spam vs. not-spam.' }),
    c('k9',  'concepts', 'Clustering', 'Group similar items (unsupervised)', { use: 'Use to find segments when you have no labels.' }),
    c('k10', 'concepts', 'High bias leads to…?', 'Underfitting — the model is too simple', { use: 'Fix by adding features or using a richer model.' }),
    c('k11', 'concepts', 'High variance leads to…?', 'Overfitting — the model memorizes the training data', { use: 'Fix by adding data or regularization.' }),
    c('k12', 'concepts', 'Classification metrics', 'Accuracy, precision, recall, F1', { use: 'How you grade a classifier\u2019s correctness.' }),
    c('k13', 'concepts', 'Text-generation metrics', 'ROUGE (summaries), BLEU (translation), BERTScore, LLM-as-a-judge', { use: 'How you grade what an LLM writes.' }),
    c('k14', 'concepts', 'Business metrics', 'ROI, cost per user, customer lifetime value, conversion rate', { use: 'Tie an AI project back to dollars and outcomes.' }),
    c('k15', 'concepts', 'GenAI building blocks', 'Tokens, embeddings, vectors, chunking, transformers, diffusion models, multi-modal models', { use: 'The vocabulary the exam expects you to recognize.' }),
    c('k16', 'concepts', 'Temperature', 'Higher = more random / creative; lower = more deterministic / focused', { use: 'Turn it up for creativity, down for consistency.' }),
    c('k17', 'concepts', 'Prompt engineering techniques', 'Zero-shot, single-shot, few-shot, chain-of-thought, prompt templates, negative prompts', { use: 'The cheapest lever to improve an FM\u2019s output.' }),
    c('k18', 'concepts', 'Prompt risks', 'Prompt injection, jailbreaking, poisoning, hijacking, exposure', { use: 'Security threats unique to prompts and LLMs.' }),
    c('k19', 'concepts', 'FM customization ladder (cheap → expensive)', '1) Prompt engineering  2) RAG  3) Fine-tuning  4) Continued pre-training  5) Pre-train from scratch', { use: 'Climb only as high as the task needs — cost rises fast.' }),
    c('k20', 'concepts', 'What is RAG?', 'Retrieves external data to ground the FM in facts; reduces hallucination — no model training', { use: 'Best "reduce hallucination with our data" answer.' }),
    c('k21', 'concepts', 'Fine-tuning methods', 'Instruction tuning, domain adaptation, transfer learning, continued pre-training, RLHF', { use: 'Ways to adapt a model when prompting isn\u2019t enough.' }),
    c('k22', 'concepts', 'Responsible AI pillars', 'Fairness, bias mitigation, inclusivity, robustness, safety, veracity (truthfulness)', { use: 'The values AWS expects you to be able to name.' }),
    c('k23', 'concepts', 'Transparency vs. explainability', 'Transparent = see HOW it works (Model Cards). Explainable = understand WHY it decided (Clarify).', { use: 'Two different "understandability" ideas — don\u2019t mix them up.' }),
    c('k24', 'concepts', 'Hallucination mitigation', 'RAG grounding, output validation, confidence scoring', { use: 'Tactics to keep FM answers truthful.' }),
    c('k25', 'concepts', 'Shared responsibility model', 'AWS secures the cloud (infrastructure); the customer secures in the cloud (data, access, config)', { use: 'Know which side secures what — a frequent question.' }),
    c('k26', 'concepts', 'Generative AI Security Scoping Matrix', 'The governance framework to know by name', { use: 'Name-drop this for GenAI security/governance questions.' }),

    // ───────────────── QUESTION PATTERNS ─────────────────
    c('p1',  'patterns', 'Need to transcribe audio to text?', 'Amazon Transcribe', { use: 'Trigger words: audio, voice, call → text.' }),
    c('p2',  'patterns', 'Need to translate between languages?', 'Amazon Translate', { use: 'Trigger word: between languages.' }),
    c('p3',  'patterns', 'Need to build a chatbot?', 'Amazon Lex', { use: 'Trigger words: conversational bot, voice or text.' }),
    c('p4',  'patterns', 'Need to analyze images or video?', 'Amazon Rekognition', { use: 'Trigger words: images, video, faces, objects.' }),
    c('p5',  'patterns', 'Need to extract text from scanned docs?', 'Amazon Textract', { use: 'Trigger words: scanned documents, forms, invoices.' }),
    c('p6',  'patterns', 'Need sentiment analysis on text?', 'Amazon Comprehend', { use: 'Trigger words: sentiment, entities, PII in text.' }),
    c('p7',  'patterns', 'Need to access foundation models via API?', 'Amazon Bedrock', { use: 'Trigger words: foundation models, via API.' }),
    c('p8',  'patterns', 'Need to ground answers in company docs?', 'RAG (Bedrock Knowledge Bases)', { use: 'Trigger words: reduce hallucination, use our own data.' }),
    c('p9',  'patterns', 'Cheapest / least-effort way to customize an FM?', 'Prompt engineering / in-context learning', { use: 'Trigger words: cheapest, fastest, least effort.' }),
    c('p10', 'patterns', 'Need to bake domain knowledge into the model?', 'Fine-tuning (or continued pre-training)', { use: 'Trigger words: bake in knowledge, change the model itself.' }),
    c('p11', 'patterns', 'Traditional ML or an FM — how to choose?', 'Regulatory / explainability needs → traditional ML. Flexible content generation → FM.', { use: 'Decide by explainability vs. flexible generation.' }),
    c('p12', 'patterns', 'Need to detect bias or explain predictions?', 'SageMaker Clarify', { use: 'Trigger words: bias, fairness, explainability.' }),
    c('p13', 'patterns', 'Need to filter harmful or toxic output?', 'Bedrock Guardrails', { use: 'Trigger words: block harmful, toxic, unsafe output.' }),
    c('p14', 'patterns', 'How do you choose the learning type?', 'Labeled data → supervised. Unlabeled → unsupervised. Reward signal → reinforcement.', { use: 'Read the data: labels, no labels, or rewards.' }),
    c('p15', 'patterns', 'What does raising temperature do?', 'Makes output more creative / random', { use: 'Higher temperature = more randomness; lower = more focused.' }),
    c('p16', 'patterns', 'Where do you store embeddings?', 'A vector DB: OpenSearch / Aurora / Neptune / RDS for PostgreSQL', { use: 'Trigger words: embeddings, vector search.' }),
    c('p17', 'patterns', 'Need to document model lineage & details?', 'SageMaker Model Cards', { use: 'Trigger words: lineage, transparency, model documentation.' }),
    c('p18', 'patterns', 'Need to audit API activity?', 'AWS CloudTrail', { use: 'Trigger words: audit, who did what, API calls.' }),
  ];

  window.AIF = { categories, cards };
})();
