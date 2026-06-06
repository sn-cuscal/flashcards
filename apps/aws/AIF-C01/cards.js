/* AIF-C01 flashcard dataset — parsed from the memorization sheet.
   Each card: { id, cat, front, back, quiz?, tag?, use?, example? }
   quiz:true → eligible for multiple-choice quiz mode
   use      → concise "purpose / why it matters", revealed by the Show purpose button
   example  → a typical real-world situation it applies to, revealed by the Show example button */

export const data = (function () {
  const categories = [
    { id: 'services', name: 'AWS Services',     short: 'Services',  hue: 188, blurb: 'What does each service do? — the #1 question pattern.' },
    { id: 'acronyms', name: 'Acronyms',         short: 'Acronyms',  hue: 286, blurb: 'Decode every abbreviation cold.' },
    { id: 'concepts', name: 'Core Concepts',    short: 'Concepts',  hue: 150, blurb: 'Learning types, metrics, the customization ladder.' },
    { id: 'patterns', name: 'Question Patterns', short: 'Patterns', hue: 24,  blurb: 'Scenario → answer. Train the reflex.' },
  ];

  const c = (id, cat, front, back, extra = {}) => ({ id, cat, front, back, ...extra });

  const cards = [
    // ───────────────── ACRONYMS ─────────────────
    c('a1',  'acronyms', 'AI',        'Artificial Intelligence', { quiz: true, use: 'Umbrella field for machines performing human-like tasks.', example: 'A bank flags unusual card transactions for fraud in real time.' }),
    c('a2',  'acronyms', 'ML',        'Machine Learning', { quiz: true, use: 'Systems that learn patterns from data instead of explicit rules.', example: 'An email service learns to filter spam from millions of past examples.' }),
    c('a3',  'acronyms', 'DL',        'Deep Learning', { quiz: true, use: 'ML using multi-layer neural networks for complex patterns.', example: 'A photo app recognises faces and objects using neural networks.' }),
    c('a4',  'acronyms', 'NLP',       'Natural Language Processing', { quiz: true, use: 'Lets computers understand and generate human language.', example: 'A helpdesk auto-tags support tickets by reading their text.' }),
    c('a5',  'acronyms', 'LLM',       'Large Language Model', { quiz: true, use: 'Generates and understands text; powers chatbots and assistants.', example: 'A chatbot drafts natural written replies to customer questions.' }),
    c('a6',  'acronyms', 'GenAI',     'Generative AI', { quiz: true, use: 'Creates new content — text, images, code — from a prompt.', example: 'A marketer generates draft ad copy and images from a short prompt.' }),
    c('a7',  'acronyms', 'FM',        'Foundation Model', { quiz: true, use: 'Large pre-trained model adapted to many downstream tasks.', example: 'One pre-trained model powers a summariser, a chatbot and a classifier.' }),
    c('a8',  'acronyms', 'RAG',       'Retrieval Augmented Generation', { quiz: true, use: 'Grounds an FM in your own data to reduce hallucination — no training.', example: 'A chatbot answers HR questions from the current staff handbook, untrained.' }),
    c('a9',  'acronyms', 'MCP',       'Model Context Protocol — connects agents to external systems', { quiz: true, use: 'Standard way to connect AI agents to external tools and data.', example: 'A coding agent reads your Jira tickets and queries your database via MCP.' }),
    c('a10', 'acronyms', 'MLOps',     'Machine Learning Operations', { quiz: true, use: 'Practices to deploy, monitor and maintain ML in production.', example: 'A team auto-retrains and redeploys a model when its accuracy drifts.' }),
    c('a11', 'acronyms', 'RLHF',      'Reinforcement Learning from Human Feedback', { quiz: true, use: 'Aligns model output to human preferences during training.', example: 'An assistant is tuned so its answers match what human reviewers prefer.' }),
    c('a12', 'acronyms', 'ROUGE',     'Recall-Oriented Understudy for Gisting Evaluation — text summarization metric', { quiz: true, use: 'Scores summary quality by overlap with a reference.', example: 'Checking whether a news summariser captures the article key points.' }),
    c('a13', 'acronyms', 'BLEU',      'Bilingual Evaluation Understudy — translation metric', { quiz: true, use: 'Scores machine-translation quality against a reference.', example: 'Scoring how close machine translation is to a human reference.' }),
    c('a14', 'acronyms', 'BERTScore', 'Semantic similarity metric for generated text', { quiz: true, use: 'Judges generated text by meaning, not exact word overlap.', example: 'Judging a paraphrase as correct even when it uses different words.' }),
    c('a15', 'acronyms', 'ROI',       'Return on Investment', { quiz: true, use: 'Measures the business value of an AI project versus its cost.', example: 'Deciding whether a support chatbot saved enough cost to justify it.' }),
    c('a16', 'acronyms', 'F1 score',  'Harmonic mean of precision and recall', { quiz: true, use: 'Balances precision and recall — good for imbalanced classes.', example: 'Grading a fraud detector where real fraud is rare and imbalanced.' }),
    c('a17', 'acronyms', 'A2I',       'Amazon Augmented AI — human-in-the-loop review', { quiz: true, use: 'Routes low-confidence ML predictions to humans for review.', example: 'Low-confidence document extractions are routed to a human reviewer.' }),
    c('a18', 'acronyms', 'IAM',       'Identity and Access Management', { quiz: true, use: 'Controls who can access which AWS resources.', example: 'Granting an analyst read-only access to a single S3 bucket.' }),
    c('a19', 'acronyms', 'KMS',       'Key Management Service — encryption keys', { quiz: true, use: 'Creates and manages encryption keys to protect data.', example: 'Encrypting customer records in S3 with a tightly controlled key.' }),

    // ───────────────── SERVICES ─────────────────
    // Managed AI services
    c('s1',  'services', 'Amazon Comprehend',   'NLP — sentiment, entities, key phrases, PII detection', { quiz: true, tag: 'Managed AI', use: 'Reach for it to mine sentiment or PII from raw text.', example: 'A retailer scans thousands of product reviews to flag negative sentiment.' }),
    c('s2',  'services', 'Amazon Transcribe',   'Speech → text', { quiz: true, tag: 'Managed AI', use: 'Use it to caption calls, meetings or voice notes.', example: 'A call centre turns recorded support calls into searchable transcripts.' }),
    c('s3',  'services', 'Amazon Translate',    'Language translation', { quiz: true, tag: 'Managed AI', use: 'Localize app content or chat across languages.', example: 'Help-centre articles are translated into a dozen languages automatically.' }),
    c('s4',  'services', 'Amazon Polly',        'Text → speech (voice)', { quiz: true, tag: 'Managed AI', use: 'Give apps a spoken voice — IVR, audiobooks, accessibility.', example: 'An app reads articles aloud and voices an IVR phone menu.' }),
    c('s5',  'services', 'Amazon Lex',          'Chatbots / conversational voice & text interfaces', { quiz: true, tag: 'Managed AI', use: 'The bot brain behind Alexa-style chat and voice apps.', example: 'The conversational bot behind a "track my order" phone line.' }),
    c('s6',  'services', 'Amazon Rekognition',  'Image & video analysis (computer vision)', { quiz: true, tag: 'Managed AI', use: 'Detect objects, faces or moderation issues in media.', example: 'A platform auto-moderates user-uploaded photos for unsafe content.' }),
    c('s7',  'services', 'Amazon Textract',     'Extract text & data from scanned documents (OCR)', { quiz: true, tag: 'Managed AI', use: 'Pull fields from invoices, forms and IDs — beyond plain OCR.', example: 'Pulling line items and totals from scanned supplier invoices.' }),
    c('s8',  'services', 'Amazon Kendra',       'Intelligent enterprise search', { quiz: true, tag: 'Managed AI', use: 'Add natural-language search across your documents.', example: 'Staff ask a search box natural questions and get answers from internal PDFs.' }),
    c('s9',  'services', 'Amazon Personalize',  'Recommendation systems', { quiz: true, tag: 'Managed AI', use: 'The same tech behind Amazon.com "recommended for you".', example: 'Powering a "recommended for you" carousel on an online store.' }),
    c('s10', 'services', 'Amazon A2I',          'Human review of ML predictions (human-in-the-loop)', { quiz: true, tag: 'Managed AI', use: 'Add a human checkpoint when ML confidence is low.', example: 'Low-confidence invoice fields go to a reviewer before being accepted.' }),
    // GenAI / FM platform
    c('s11', 'services', 'Amazon Bedrock',                   'Managed access to foundation models via API — the central GenAI service', { quiz: true, tag: 'GenAI / FM', use: 'The exam’s default answer for "use FMs via API".', example: 'Adding a GenAI feature by calling Claude or Nova through one API.' }),
    c('s12', 'services', 'Bedrock Knowledge Bases',          'RAG — ground FMs in your own data', { quiz: true, tag: 'GenAI / FM', use: 'The managed way to do RAG on Bedrock.', example: 'A support bot answers from your own product docs without fine-tuning.' }),
    c('s13', 'services', 'Bedrock Guardrails',               'Content filtering & safety — block harmful / toxic output', { quiz: true, tag: 'GenAI / FM', use: 'The answer for "block toxic or unsafe FM output".', example: 'Stopping a customer chatbot from returning hateful or unsafe replies.' }),
    c('s14', 'services', 'Bedrock Model Evaluation',         'Evaluate & compare FM performance', { quiz: true, tag: 'GenAI / FM', use: 'Compare models to pick the best for your task.', example: 'Comparing two models on your own prompts to pick the more accurate one.' }),
    c('s15', 'services', 'Bedrock Prompt Management',        'Prompt versioning & management', { quiz: true, tag: 'GenAI / FM', use: 'Version and reuse prompts like source code.', example: 'Versioning and A/B-testing prompt variants across a team.' }),
    c('s16', 'services', 'Bedrock AgentCore',                'Build & run AI agents (incl. AgentCore Identity, Policy)', { quiz: true, tag: 'GenAI / FM', use: 'Run multi-step agents that call tools securely.', example: 'Running a support agent that securely calls internal APIs at scale.' }),
    c('s17', 'services', 'Amazon Nova',                      'Amazon’s own family of foundation models', { quiz: true, tag: 'GenAI / FM', use: 'Amazon’s first-party FMs offered inside Bedrock.', example: 'Using Amazon’s low-cost multimodal model in Bedrock for text and images.' }),
    c('s18', 'services', 'Amazon Q',                         'AWS generative AI assistant', { quiz: true, tag: 'GenAI / FM', use: 'AWS’s built-in GenAI helper for code and the console.', example: 'Asking an in-IDE assistant to explain code or query company data in plain English.' }),
    // SageMaker
    c('s19', 'services', 'Amazon SageMaker AI',     'Build, train & deploy ML models', { quiz: true, tag: 'SageMaker', use: 'Pick it when you build custom models, not just use FMs.', example: 'A data team trains a custom demand-forecasting model on its own data.' }),
    c('s20', 'services', 'SageMaker JumpStart',     'Pre-trained models / FM hub', { quiz: true, tag: 'SageMaker', use: 'Start from a pre-trained model instead of scratch.', example: 'Deploying a pre-trained image classifier instead of training from scratch.' }),
    c('s21', 'services', 'SageMaker Clarify',       'Bias detection + explainability', { quiz: true, tag: 'SageMaker', use: 'The answer for "detect bias" or "explain a prediction".', example: 'Checking a loan model for bias and explaining its decisions.' }),
    c('s22', 'services', 'SageMaker Model Monitor', 'Monitor models in production (drift)', { quiz: true, tag: 'SageMaker', use: 'Catch data or quality drift after deployment.', example: 'Alerting when a live model’s input data drifts from its training data.' }),
    c('s23', 'services', 'SageMaker Model Cards',   'Document model details — transparency & data lineage', { quiz: true, tag: 'SageMaker', use: 'The answer for "document model lineage & details".', example: 'Documenting a model’s training data and intended use for auditors.' }),
    // Security / governance
    c('s24', 'services', 'AWS IAM',             'Roles, policies, permissions — access control', { quiz: true, tag: 'Security', use: 'First line of access control for every AWS resource.', example: 'Letting a Lambda function write to just one DynamoDB table.' }),
    c('s25', 'services', 'AWS KMS',             'Encryption key management', { quiz: true, tag: 'Security', use: 'The answer for "manage encryption keys".', example: 'Managing the keys that encrypt data in S3, EBS and RDS.' }),
    c('s26', 'services', 'Amazon Macie',        'Discover & protect sensitive data (PII) in S3', { quiz: true, tag: 'Security', use: 'The answer for "find PII sitting in S3".', example: 'Scanning S3 buckets to find exposed credit-card or PII data.' }),
    c('s27', 'services', 'AWS PrivateLink',     'Private connectivity — no public internet', { quiz: true, tag: 'Security', use: 'Keep service traffic off the public internet.', example: 'Reaching an AWS service from your VPC without using the public internet.' }),
    c('s28', 'services', 'AWS CloudTrail',      'Audit log of API activity', { quiz: true, tag: 'Security', use: 'The answer for "audit who called which API".', example: 'Finding out which user deleted an S3 bucket and when.' }),
    c('s29', 'services', 'Amazon CloudWatch',   'Monitoring & metrics', { quiz: true, tag: 'Security', use: 'Metrics, logs and alarms for your workloads.', example: 'Alarming when an API error rate or server CPU crosses a threshold.' }),
    c('s30', 'services', 'AWS Config',          'Resource configuration compliance', { quiz: true, tag: 'Security', use: 'Track and flag resource configuration changes.', example: 'Flagging any S3 bucket that becomes publicly readable.' }),
    c('s31', 'services', 'AWS Audit Manager',   'Automate compliance audits', { quiz: true, tag: 'Security', use: 'Automate evidence collection for audits.', example: 'Continuously collecting evidence for a SOC 2 or PCI audit.' }),
    c('s32', 'services', 'AWS Artifact',        'On-demand compliance reports', { quiz: true, tag: 'Security', use: 'Self-serve AWS compliance reports (SOC, ISO…).', example: 'Downloading AWS’s SOC 2 or ISO report for your auditor.' }),
    c('s33', 'services', 'Amazon Inspector',    'Vulnerability scanning', { quiz: true, tag: 'Security', use: 'Scan workloads for known vulnerabilities.', example: 'Automatically scanning EC2 instances and images for known CVEs.' }),
    c('s34', 'services', 'AWS Trusted Advisor', 'Best-practice recommendations', { quiz: true, tag: 'Security', use: 'Automated best-practice checks across your account.', example: 'Being flagged for idle resources, open ports and missing MFA.' }),
    // Extra reference
    c('s35', 'services', 'Vector databases for embeddings', 'OpenSearch Service, Aurora, Neptune, RDS for PostgreSQL', { tag: 'Reference', use: 'Where embeddings are stored so RAG can search them.', example: 'Storing document embeddings so a RAG chatbot can search them.' }),

    // ───────────────── CORE CONCEPTS ─────────────────
    c('k1',  'concepts', 'The AI → ML → DL hierarchy', 'AI ⊃ ML ⊃ Deep Learning. GenAI is a subset of DL that uses Foundation Models.', { use: 'Know the nesting: GenAI sits inside DL, inside ML, inside AI.', example: 'Explaining to stakeholders where GenAI sits when scoping a project.' }),
    c('k2',  'concepts', 'Agentic AI', 'Autonomous, multi-step, tool-using systems', { use: 'The "autonomous, tool-using" buzzword on the newer exam.', example: 'An assistant books travel itself, searching and calling APIs across steps.' }),
    c('k3',  'concepts', 'Supervised learning', 'Labeled data → classification & regression', { use: 'If the scenario gives labeled data, pick this.', example: 'Predicting house prices from labelled past sales.' }),
    c('k4',  'concepts', 'Unsupervised learning', 'Unlabeled data → clustering', { use: 'No labels and you want groupings? Pick this.', example: 'Grouping customers into segments with no predefined labels.' }),
    c('k5',  'concepts', 'Reinforcement learning', 'Reward / penalty feedback (RLHF for FMs)', { use: 'Trial-and-error with rewards — also how RLHF works.', example: 'Training a game agent to improve through rewards and penalties.' }),
    c('k6',  'concepts', 'Inference types', 'Batch, real-time, asynchronous, serverless', { use: 'Match latency and throughput needs to the right mode.', example: 'Real-time inference for a live chatbot; batch for overnight scoring.' }),
    c('k7',  'concepts', 'Regression', 'Predict a number (continuous value)', { use: 'Use when the target is a quantity, like price or temperature.', example: 'Forecasting tomorrow’s sales figure, a continuous number.' }),
    c('k8',  'concepts', 'Classification', 'Predict a category', { use: 'Use when the target is a label, like spam vs. not-spam.', example: 'Deciding whether an email is spam or not, a category.' }),
    c('k9',  'concepts', 'Clustering', 'Group similar items (unsupervised)', { use: 'Use to find segments when you have no labels.', example: 'Discovering natural customer segments from purchase history.' }),
    c('k10', 'concepts', 'High bias leads to…?', 'Underfitting — the model is too simple', { use: 'Fix by adding features or using a richer model.', example: 'A too-simple model that misses patterns in both training and test data.' }),
    c('k11', 'concepts', 'High variance leads to…?', 'Overfitting — the model memorizes the training data', { use: 'Fix by adding data or regularization.', example: 'A model that aces training data but fails on new, unseen data.' }),
    c('k12', 'concepts', 'Classification metrics', 'Accuracy, precision, recall, F1', { use: 'How you grade a classifier’s correctness.', example: 'Reporting accuracy, precision, recall and F1 for a disease detector.' }),
    c('k13', 'concepts', 'Text-generation metrics', 'ROUGE (summaries), BLEU (translation), BERTScore, LLM-as-a-judge', { use: 'How you grade what an LLM writes.', example: 'Scoring a summariser with ROUGE and a translator with BLEU.' }),
    c('k14', 'concepts', 'Business metrics', 'ROI, cost per user, customer lifetime value, conversion rate', { use: 'Tie an AI project back to dollars and outcomes.', example: 'Justifying an AI project to leadership using ROI and conversion rate.' }),
    c('k15', 'concepts', 'GenAI building blocks', 'Tokens, embeddings, vectors, chunking, transformers, diffusion models, multi-modal models', { use: 'The vocabulary the exam expects you to recognize.', example: 'Why long documents are chunked and embedded for a RAG system.' }),
    c('k16', 'concepts', 'Temperature', 'Higher = more random / creative; lower = more deterministic / focused', { use: 'Turn it up for creativity, down for consistency.', example: 'Low temperature for a factual Q&A bot; high for brainstorming taglines.' }),
    c('k17', 'concepts', 'Prompt engineering techniques', 'Zero-shot, single-shot, few-shot, chain-of-thought, prompt templates, negative prompts', { use: 'The cheapest lever to improve an FM’s output.', example: 'Adding a few worked examples so an FM replies in the right format.' }),
    c('k18', 'concepts', 'Prompt risks', 'Prompt injection, jailbreaking, poisoning, hijacking, exposure', { use: 'Security threats unique to prompts and LLMs.', example: 'Hardening a chatbot against a user trying to override its instructions.' }),
    c('k19', 'concepts', 'FM customization ladder (cheap → expensive)', '1) Prompt engineering  2) RAG  3) Fine-tuning  4) Continued pre-training  5) Pre-train from scratch', { use: 'Climb only as high as the task needs — cost rises fast.', example: 'Trying prompts and RAG before paying to fine-tune a model.' }),
    c('k20', 'concepts', 'What is RAG?', 'Retrieves external data to ground the FM in facts; reduces hallucination — no model training', { use: 'Best "reduce hallucination with our data" answer.', example: 'Making a bot cite your current policy docs instead of guessing.' }),
    c('k21', 'concepts', 'Fine-tuning methods', 'Instruction tuning, domain adaptation, transfer learning, continued pre-training, RLHF', { use: 'Ways to adapt a model when prompting isn’t enough.', example: 'Adapting an FM to your legal domain’s language and terms.' }),
    c('k22', 'concepts', 'Responsible AI pillars', 'Fairness, bias mitigation, inclusivity, robustness, safety, veracity (truthfulness)', { use: 'The values AWS expects you to be able to name.', example: 'Reviewing an AI feature for fairness and safety before launch.' }),
    c('k23', 'concepts', 'Transparency vs. explainability', 'Transparent = see HOW it works (Model Cards). Explainable = understand WHY it decided (Clarify).', { use: 'Two different "understandability" ideas — don’t mix them up.', example: 'Model Cards show how a model works; Clarify explains a single decision.' }),
    c('k24', 'concepts', 'Hallucination mitigation', 'RAG grounding, output validation, confidence scoring', { use: 'Tactics to keep FM answers truthful.', example: 'Grounding answers with RAG so a bot stops inventing facts.' }),
    c('k25', 'concepts', 'Shared responsibility model', 'AWS secures the cloud (infrastructure); the customer secures in the cloud (data, access, config)', { use: 'Know which side secures what — a frequent question.', example: 'AWS patches the hardware while you secure your data and IAM.' }),
    c('k26', 'concepts', 'Generative AI Security Scoping Matrix', 'The governance framework to know by name', { use: 'Name-drop this for GenAI security/governance questions.', example: 'Classifying a GenAI app’s risk to decide what controls it needs.' }),

    // ───────────────── QUESTION PATTERNS ─────────────────
    c('p1',  'patterns', 'Need to transcribe audio to text?', 'Amazon Transcribe', { use: 'Trigger words: audio, voice, call → text.', example: 'Generating written minutes from a recorded meeting.' }),
    c('p2',  'patterns', 'Need to translate between languages?', 'Amazon Translate', { use: 'Trigger word: between languages.', example: 'Showing a product page in each visitor’s own language.' }),
    c('p3',  'patterns', 'Need to build a chatbot?', 'Amazon Lex', { use: 'Trigger words: conversational bot, voice or text.', example: 'A "track my order" assistant on a retail website.' }),
    c('p4',  'patterns', 'Need to analyze images or video?', 'Amazon Rekognition', { use: 'Trigger words: images, video, faces, objects.', example: 'Auto-moderating user-uploaded photos for unsafe content.' }),
    c('p5',  'patterns', 'Need to extract text from scanned docs?', 'Amazon Textract', { use: 'Trigger words: scanned documents, forms, invoices.', example: 'Reading the totals off scanned receipts.' }),
    c('p6',  'patterns', 'Need sentiment analysis on text?', 'Amazon Comprehend', { use: 'Trigger words: sentiment, entities, PII in text.', example: 'Gauging mood across thousands of survey responses.' }),
    c('p7',  'patterns', 'Need to access foundation models via API?', 'Amazon Bedrock', { use: 'Trigger words: foundation models, via API.', example: 'Adding a "summarise this" button backed by an LLM.' }),
    c('p8',  'patterns', 'Need to ground answers in company docs?', 'RAG (Bedrock Knowledge Bases)', { use: 'Trigger words: reduce hallucination, use our own data.', example: 'A helpdesk bot that answers from your internal wiki.' }),
    c('p9',  'patterns', 'Cheapest / least-effort way to customize an FM?', 'Prompt engineering / in-context learning', { use: 'Trigger words: cheapest, fastest, least effort.', example: 'Improving answers just by rewriting the prompt.' }),
    c('p10', 'patterns', 'Need to bake domain knowledge into the model?', 'Fine-tuning (or continued pre-training)', { use: 'Trigger words: bake in knowledge, change the model itself.', example: 'Teaching a model your product catalogue and house tone.' }),
    c('p11', 'patterns', 'Traditional ML or an FM — how to choose?', 'Regulatory / explainability needs → traditional ML. Flexible content generation → FM.', { use: 'Decide by explainability vs. flexible generation.', example: 'A regulated credit decision versus writing marketing copy.' }),
    c('p12', 'patterns', 'Need to detect bias or explain predictions?', 'SageMaker Clarify', { use: 'Trigger words: bias, fairness, explainability.', example: 'Auditing a hiring model for fairness.' }),
    c('p13', 'patterns', 'Need to filter harmful or toxic output?', 'Bedrock Guardrails', { use: 'Trigger words: block harmful, toxic, unsafe output.', example: 'Stopping a public chatbot from returning toxic text.' }),
    c('p14', 'patterns', 'How do you choose the learning type?', 'Labeled data → supervised. Unlabeled → unsupervised. Reward signal → reinforcement.', { use: 'Read the data: labels, no labels, or rewards.', example: 'Labelled photos point to supervised; unlabelled logs to unsupervised.' }),
    c('p15', 'patterns', 'What does raising temperature do?', 'Makes output more creative / random', { use: 'Higher temperature = more randomness; lower = more focused.', example: 'Turning temperature up to brainstorm varied slogans.' }),
    c('p16', 'patterns', 'Where do you store embeddings?', 'A vector DB: OpenSearch / Aurora / Neptune / RDS for PostgreSQL', { use: 'Trigger words: embeddings, vector search.', example: 'Holding document vectors so a RAG app can search them.' }),
    c('p17', 'patterns', 'Need to document model lineage & details?', 'SageMaker Model Cards', { use: 'Trigger words: lineage, transparency, model documentation.', example: 'Recording a model’s training data and intended use for an audit.' }),
    c('p18', 'patterns', 'Need to audit API activity?', 'AWS CloudTrail', { use: 'Trigger words: audit, who did what, API calls.', example: 'Finding out who changed a security group last week.' }),
  ];

  return { categories, cards };
})();
