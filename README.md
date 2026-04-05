# Epydemix RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot for the [Epydemix](https://github.com/epistorm/epydemix) epidemic modeling library. Provides grounded answers with **no hallucinations**, sourced from official tutorials, API docs, and the published paper.

## Architecture

```
User Question
     ↓
Question Type Classifier
(conceptual / non-conceptual)
     ↓
Retriever
(tutorials + API docs + tests + rst)
     ↓
Evidence Judge
(exact / partial / none)
     ↓
Policy Router
├─ exact + conceptual     → grounded answer + code/plot if needed
├─ exact + non-conceptual → grounded answer + code generation allowed
├─ partial + conceptual   → infer from extracted evidence
├─ none + conceptual      → controlled LLM fallback
└─ none + non-conceptual  → "not specified in tutorial"
```

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

The app will open at **http://localhost:3000**.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
epydemix-rag-chatbot/
├── index.html                      # HTML entry point
├── package.json                    # Dependencies & scripts
├── vite.config.js                  # Vite build config
├── README.md                       # This file
└── src/
    ├── main.jsx                    # React mount point
    └── EpydemixRAGChatbot.jsx      # Full app (knowledge base + RAG pipeline + UI)
```

## Knowledge Base Sources

All answers are grounded in content extracted from:

| Source | Coverage |
|--------|----------|
| GitHub README | Installation, quick start, SIR example |
| Tutorial 01 | Model definition, transitions, simulation |
| Tutorial 02 | Population data, contact matrices |
| Tutorial 03 | Non-pharmaceutical interventions |
| Tutorial 04 | ABC calibration (Part 1) |
| Tutorial 05 | ABC-SMC, perturbation kernels (Part 2) |
| Tutorial 06 | Advanced features, custom transitions |
| Tutorial 07 | COVID-19 case study |
| Tutorial 08 | Multiple strains |
| Tutorial 09 | Vaccination modeling |
| Tutorial 10 | Multiprocessing |
| ReadTheDocs API | Full class/method reference |
| PLOS Comp Bio paper | Stochastic engine, chain binomial, ABC algorithms |

## Example Questions

- "What does the EpiModel class represent?"
- "What is the SEIR model in Epydemix?"
- "What is the SIR model and how is it loaded?"
- "How does calibration work and how does it optimize parameters using gradient descent?"
- "What numerical solver does Epydemix use internally for ODE integration?"
- "Create a SIR model for Italy setting transmission rate equal to 0.2 and recovery rate equal to 0.1 run for 100 time steps"

## Anti-Hallucination Design

- **Gradient descent trap**: Correctly explains Epydemix uses ABC, not gradient descent
- **ODE solver trap**: Correctly explains Epydemix uses stochastic chain binomial, not ODE integration
- **Unknown topics**: Returns "not specified in tutorial" instead of fabricating answers
- **Pipeline transparency**: Every answer shows its classification badges (question type, evidence level, policy path)

## License

MIT
