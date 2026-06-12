/* Game-only expert questions — harder than the advanced tier. These are never
   shown as flashcards or in the study quiz: only apps/play/banks.js imports
   them, and the live game appends a random few as its final questions. Items
   share the quiz.js question shape (single answer, <=4 short options); every
   entry is implicitly diff "expert". Answers verified against AWS docs. */

export const expert = [
  {
    q: "Which Amazon Bedrock Guardrails policy detects hallucinations by checking responses against the retrieved source material?",
    options: [
      "Contextual grounding check",
      "Content filters",
      "Denied topics",
      "Sensitive information filter",
    ],
    correct: "Contextual grounding check",
    explain: "Contextual grounding checks score a response for grounding (factual accuracy against the source) and relevance, filtering ungrounded answers in RAG flows. The other policies block harmful content, banned subjects and PII.",
  },
  {
    q: "Roughly how many tokens are in each chunk when Amazon Bedrock Knowledge Bases uses default chunking?",
    options: ["300", "100", "512", "1000"],
    correct: "300",
    explain: "Default chunking splits source documents into chunks of approximately 300 tokens — a middle ground between retrieval precision and surrounding context.",
  },
  {
    q: "By default, what does Amazon Bedrock log about your model invocations?",
    options: [
      "Nothing — invocation logging is off by default",
      "Prompts only",
      "Token counts only",
      "Full requests and responses",
    ],
    correct: "Nothing — invocation logging is off by default",
    explain: "Model invocation logging is disabled by default. You opt in per account/Region and choose S3 and/or CloudWatch Logs as the destination.",
  },
  {
    q: "Which Amazon Bedrock API gives one consistent request format that works across all supported chat models?",
    options: ["Converse", "InvokeModel", "InvokeAgent", "RetrieveAndGenerate"],
    correct: "Converse",
    explain: "Converse (and ConverseStream) uses a single message format for every Bedrock model that supports messages, so code is written once. InvokeModel bodies are model-specific.",
  },
  {
    q: "What do Amazon Bedrock cross-Region inference profiles do?",
    options: [
      "Route requests across Regions for higher throughput",
      "Replicate your custom models between Regions",
      "Cache responses closer to your users",
      "Back up invocation logs to another Region",
    ],
    correct: "Route requests across Regions for higher throughput",
    explain: "Cross-Region inference profiles spread bursts of traffic across a set of Regions, giving higher throughput than a single Region's capacity allows.",
  },
  {
    q: "Which schema format defines the API operations an Amazon Bedrock agent action group can call?",
    options: ["OpenAPI", "GraphQL SDL", "JSON Schema", "Smithy"],
    correct: "OpenAPI",
    explain: "Action groups describe their callable operations with an OpenAPI schema in JSON or YAML; the agent uses it to decide which operation to call and which parameters to send.",
  },
  {
    q: "Which SageMaker hyperparameter tuning strategy treats the search as a regression problem, using earlier results to pick the next values to try?",
    options: ["Bayesian optimisation", "Grid search", "Random search", "Hyperband"],
    correct: "Bayesian optimisation",
    explain: "Bayesian optimisation models metric-versus-hyperparameters as a regression problem and uses previous jobs' results to choose the next combination. Random and grid search don't learn from results; Hyperband's edge is early-stopping underperformers.",
  },
  {
    q: "Which SageMaker inference option queues incoming requests and accepts payloads up to 1 GB?",
    options: [
      "Asynchronous Inference",
      "Real-time inference",
      "Serverless Inference",
      "Batch transform",
    ],
    correct: "Asynchronous Inference",
    explain: "Asynchronous Inference queues each request, allows payloads up to 1 GB with processing up to an hour, and can scale to zero. Real-time caps payloads at 6 MB, serverless at 4 MB; batch transform processes whole S3 datasets.",
  },
  {
    q: "Which technique does SageMaker Clarify use to attribute a model's prediction to individual input features?",
    options: ["SHAP", "LIME", "PCA", "Grad-CAM"],
    correct: "SHAP",
    explain: "Clarify's explainability is built on Shapley values, using a scalable implementation of the Kernel SHAP algorithm to assign each feature its contribution to a prediction.",
  },
  {
    q: "In SageMaker Feature Store, which store serves features at millisecond latency for real-time inference?",
    options: ["The online store", "The offline store", "The Glue Data Catalog", "Amazon Athena"],
    correct: "The online store",
    explain: "The online store provides low-latency reads for serving predictions; the offline store keeps full history in S3 for training and batch work, queried via Athena and the Glue Data Catalog.",
  },
  {
    q: "Which AWS service routes low-confidence ML predictions to human reviewers?",
    options: [
      "Amazon Augmented AI (A2I)",
      "SageMaker Ground Truth",
      "Amazon Mechanical Turk",
      "Amazon Comprehend",
    ],
    correct: "Amazon Augmented AI (A2I)",
    explain: "A2I builds human review workflows over model predictions, stepping in when confidence is low. Ground Truth labels training data before a model exists; Mechanical Turk is a workforce, not a review workflow service.",
  },
  {
    q: "Which AWS chip was purpose-built for training deep learning models?",
    options: ["AWS Trainium", "AWS Inferentia", "AWS Graviton", "AWS Nitro"],
    correct: "AWS Trainium",
    explain: "Trainium powers Trn instances for deep learning training. Inferentia is the inference counterpart, Graviton a general-purpose CPU, and Nitro the virtualisation system under EC2.",
  },
  {
    q: "What is the default output vector size of Amazon Titan Text Embeddings V2?",
    options: ["1024", "256", "512", "1536"],
    correct: "1024",
    explain: "Titan Text Embeddings V2 returns 1,024-dimension vectors by default and can be configured down to 512 or 256; 1,536 is the older Titan Embeddings G1 size.",
  },
  {
    q: "GPT-style text-generation models are built on which transformer architecture?",
    options: ["Decoder-only", "Encoder-only", "Encoder-decoder", "Recurrent"],
    correct: "Decoder-only",
    explain: "Generative LLMs such as the Llama and Mistral families are decoder-only transformers. BERT-style encoder-only models embed and classify text; encoder-decoder models like T5 map an input sequence to an output sequence.",
  },
  {
    q: "During LoRA fine-tuning, what actually gets trained?",
    options: [
      "Small low-rank adapter matrices",
      "All of the model's weights",
      "Only the final output layer",
      "The tokeniser vocabulary",
    ],
    correct: "Small low-rank adapter matrices",
    explain: "LoRA keeps the base model's parameters frozen and trains lightweight low-rank matrices injected into chosen layers — a tiny fraction of the parameters for near full-fine-tune quality.",
  },
  {
    q: "Which metric is the standard for scoring generated text summaries against reference summaries?",
    options: ["ROUGE", "BLEU", "Perplexity", "RMSE"],
    correct: "ROUGE",
    explain: "ROUGE measures n-gram overlap with reference summaries. BLEU plays the same role for machine translation, and perplexity measures how well a language model predicts text.",
  },
  {
    q: "Hiding malicious instructions inside a document that a RAG app will retrieve is which kind of attack?",
    options: [
      "Indirect prompt injection",
      "Direct prompt injection",
      "Data poisoning",
      "Model inversion",
    ],
    correct: "Indirect prompt injection",
    explain: "Indirect prompt injection plants adversarial instructions in external content the model later ingests. Direct injection arrives typed in the user's prompt; data poisoning corrupts training data instead.",
  },
];
