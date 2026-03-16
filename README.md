# ⚙️ Regex Engine from Scratch

> **Compiler Design — Phase 1 Submission | Division 6A | March Week 2**

A complete **Regular Expression Engine** built from the ground up using vanilla HTML, CSS, and JavaScript — implementing all five phases of compiler theory with live visualization and visual state graph diagrams.

---

## 📌 Project Overview

This project demonstrates a fully working Regex Engine that takes any regular expression pattern as input and runs it through **five compiler phases** — from tokenization all the way to DFA Minimization. Every phase is visualized in real time, and NFA, DFA, and Minimized DFA are rendered as interactive **state graph diagrams** using the HTML5 Canvas API.

---

## 🚀 How to Run

### Option 1 — Direct Browser (Easiest)
```
1. Download all 6 files into one folder
2. Double-click index.html
3. Opens directly in Chrome / Firefox — no installation needed
```

### Option 2 — VS Code with Live Server
```
1. Download all 6 files into one folder (e.g. FinalRegex/)
2. Open VS Code → File → Open Folder → select FinalRegex/
3. Install "Live Server" extension by Ritwick Dey
4. Right-click index.html → Open with Live Server
5. App runs at http://127.0.0.1:5500
```

> ⚠️ **All 6 files must be in the same folder** — they share `style.css`, `engine.js`, and `nav.js`

---

## 📁 Project Structure

```
FinalRegex/
│
├── index.html       →  Home / Landing page
├── engine.html      →  Live Regex Engine (5 phases + 3 visual graphs)
├── about.html       →  About page (phase explanations + references)
│
├── engine.js        →  Full engine logic (Lexer, Parser, NFA, DFA, Min-DFA)
│                        + Canvas graph drawing functions
├── style.css        →  All shared styles (theme, nav, panels, graphs)
└── nav.js           →  Navigation active link handler
```

---

## 🔬 Compiler Phases

The engine runs input through **5 complete compiler phases**:

### Phase 1 — Lexer (Tokenization)
- Reads regex pattern character by character
- Classifies each character into token types: `CHAR`, `STAR`, `PLUS`, `QUES`, `OR`, `LPAREN`, `RPAREN`, `DOT`
- Produces a typed **token stream**

### Phase 2 — Parser (Abstract Syntax Tree)
- Uses **Recursive Descent Parsing**
- Inserts explicit `CONCAT` tokens between adjacent operands
- Builds an **Abstract Syntax Tree (AST)** with correct operator precedence:
  > Quantifiers (`*`, `+`, `?`) > Concatenation > Alternation (`|`)

### Phase 3 — NFA Builder (Thompson's Construction)
- Recursively converts each AST node into an **NFA fragment**
- Fragments are joined using **ε-transitions (epsilon transitions)**
- Result: single start state + single accept state
- 🎨 **Visual graph drawn** — teal circles, dashed ε-arrows

### Phase 4 — DFA Converter (Subset Construction)
- Applies **Powerset (Subset) Construction** algorithm
- Each DFA state = a set of NFA states reachable via ε-closure
- A DFA state is **accepting** if any of its NFA states is accepting
- 🎨 **Visual graph drawn** — pink circles, solid arrows

### Phase 5 — DFA Minimization (Hopcroft's Algorithm)
- Partitions DFA states into **equivalence classes**
- Starts with `{accepting}` and `{non-accepting}` partitions
- Repeatedly refines until no further splits are possible
- **Merges indistinguishable states** → smallest possible DFA
- 🎨 **Visual graph drawn** — violet circles, merged state labels

---

## 🖼️ Visual State Graph Diagrams

After running any pattern, **3 canvas diagrams** are automatically drawn:

| Symbol | Meaning |
|--------|---------|
| ⭕ Single circle | Normal state |
| ⭕⭕ Double circle | Accept state |
| `→ start` | Start state arrow |
| Solid arrow | Normal transition with label |
| Dashed arrow | ε-transition (NFA only) |

---

## 🧪 Example Patterns to Try

| Pattern | Meaning |
|---------|---------|
| `a(b\|c)*d` | `a`, then any number of `b` or `c`, then `d` |
| `a+b` | One or more `a` followed by `b` |
| `(ab)+` | One or more repetitions of `ab` |
| `a?b` | Optional `a` followed by `b` |
| `a.c` | `a`, any character, `c` |
| `(a\|b)*c` | Any combination of `a` and `b`, then `c` |

---

## 📚 Compiler Concepts Covered

```
01. Regular Expressions       09. ε-Transitions
02. Lexical Analysis          10. ε-Closure
03. Tokenization              11. DFA Conversion
04. Recursive Descent Parsing 12. Subset Construction
05. Abstract Syntax Tree      13. State Machines
06. Operator Precedence       14. DFA Minimization
07. NFA Construction          15. Hopcroft's Algorithm
08. Thompson's Construction   16. Equivalent States
```

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Compiler Phases | 5 |
| Concepts Covered | 16 |
| Visual Graph Diagrams | 3 (NFA, DFA, Min-DFA) |
| External Libraries | 0 |
| Total Files | 6 |
| Language | Vanilla HTML / CSS / JavaScript |

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| HTML5 | Page structure and markup |
| CSS3 | Styling, animations, dark theme |
| Vanilla JavaScript | Full engine logic |
| HTML5 Canvas API | Drawing state graph diagrams |
| IBM Plex Mono | Monospace font (code/tokens) |
| DM Sans | Display font (headings/body) |

> **Zero dependencies** — no React, no jQuery, no external libraries.

---

## 🌐 Pages

### 🏠 Home (`index.html`)
- Project overview and pipeline visualization
- Feature cards for all 5 phases
- List of all 16 compiler concepts covered
- Stats and CTA to launch engine

### ⚙️ Engine (`engine.html`)
- Pattern input field with 6 example chips
- Animated pipeline progress bar (5 steps)
- **5 phase output panels** (Lexer → Parser → NFA → DFA → Min-DFA)
- **3 visual canvas graph diagrams** (NFA, DFA, Minimized DFA)
- Press `Enter` or click `▶ Run` to execute

### 📖 About (`about.html`)
- Detailed explanation of all 5 phases
- Academic references
- Tech stack overview
- Project metadata (Subject, Division, Submission date)

---

## 📖 Academic References

1. **Aho, Lam, Sethi, Ullman** — *Compilers: Principles, Techniques, and Tools* (Dragon Book), 2nd Edition
2. **Thompson, K. (1968)** — *Programming Techniques: Regular expression search algorithm*, Communications of the ACM
3. **Hopcroft, J. (1971)** — *An n log n Algorithm for Minimizing States in a Finite Automaton*, Stanford University
4. **Sipser, M.** — *Introduction to the Theory of Computation*, 3rd Edition
5. **Hopcroft, Motwani, Ullman** — *Introduction to Automata Theory, Languages, and Computation*

---

## 👨‍💻 Project Info

| Field | Details |
|-------|---------|
| Subject | Compiler Design |
| Division | 6A |
| Phase | 1 — Application of Subject Knowledge |
| Submission | 2nd Week of March |

---

*Built with vanilla JavaScript — no frameworks, no libraries, no shortcuts.*
