# 📖 ReadWorld — Read. Think. Grow.

A Kindle-style reading platform for young readers. A student reads a book one
page at a time; at the end of each chapter the app asks comprehension
questions before they can continue. Progress is saved automatically and can
sync across devices with a short code.

Built for a Year 9 reader, with a graded library spanning **Years 4–9** in
**English and Russian**.

## Features

- **Kindle-style reader** — paginated view (tap left/right, swipe, or arrow
  keys), adjustable font size, line spacing, serif/sans font, and light /
  sepia / dark themes.
- **Comprehension questions** — every chapter ends with a short quiz. The
  reader must answer to continue, gets instant feedback and an explanation
  for each question, and earns a star score.
- **Continue where you stopped** — the exact chapter and page are remembered
  per book. A "Continue reading" shelf brings you straight back.
- **Cross-device sync** — each reader gets a 6-character sync code. Enter it
  on another device via *Restore my progress* to carry your whole library
  and progress across.
- **Progress & rewards** — books started/finished, chapters completed, and
  quiz accuracy are tracked on a progress screen.
- **Bilingual library** — English and Russian, filterable by language,
  subject (Science / Maths / Stories) and year group (4–9).

## Library

**English**
- *The Secret Life of Cells* — Year 9 Biology
- *Forces That Shape the World* — Year 9 Physics
- *Atoms and the Periodic Table* — Year 9 Chemistry
- *The Language of Algebra* — Year 9 Maths
- *Shapes, Space and Pythagoras* — Year 9 Maths
- *Treasure Island* — R. L. Stevenson (Year 7)
- *Sherlock Holmes: The Speckled Band* — A. Conan Doyle (Year 9)
- *Alice's Adventures in Wonderland* — Lewis Carroll (Year 6)
- *A Christmas Carol* — Charles Dickens (Year 8)

**Русский (4–9 класс)**
- *Сказка о рыбаке и рыбке* — А. С. Пушкин (4 класс)
- *Басни* — И. А. Крылов (4 класс)
- *Конёк-Горбунок* — П. П. Ершов (5 класс)
- *Каштанка* — А. П. Чехов (6 класс)
- *Кавказский пленник* — Л. Н. Толстой (7 класс)
- *Шинель* — Н. В. Гоголь (9 класс)
- *Атомы и вещество* — химия, 9 класс
- *Язык алгебры* — математика, 9 класс

All literary works are public-domain classics presented as adapted
graded-reader editions; the science and maths titles are original
educational texts written for this platform.

## Run locally

```bash
pip install -r requirements.txt
python server.py
# open http://localhost:5000
```

## Publish to GitHub Pages

The site is a plain static site in `docs/`, so it can be hosted on GitHub
Pages for free (reading, quizzes, highlights and notes all work; only the
cross-device *sync code* needs the local Flask server).

Two ways:

1. **From a branch (fastest).** Repo → *Settings → Pages → Build and
   deployment → Source: Deploy from a branch* → pick the branch and set the
   folder to **`/docs`**. Your site appears at
   `https://<user>.github.io/world/`.
2. **From Actions.** Merge to the default branch; the included workflow
   (`.github/workflows/pages.yml`) builds and deploys `docs/` automatically
   (set *Settings → Pages → Source* to *GitHub Actions* if prompted).

## How it works

- The app is a single-page site in `docs/` (HTML + CSS + vanilla JS). No
  build step, no external dependencies — it runs offline once loaded.
- Books live as plain JavaScript data in `docs/js/data/`. Adding a book is
  just adding an object with chapters and quiz questions — see any file
  there for the shape.
- `server.py` is a small Flask app that serves the site and offers a tiny
  progress-sync API (`/api/sync/<code>`), storing each reader's JSON under
  `data/`.

## Reading features

- **Highlights & notes** — select any text in the reader to highlight it or
  attach a note. A badge on the notes button shows how many you have, and the
  notes panel lists every highlight with a jump-to-chapter link.
- **Comprehension questions** gate the end of each chapter.
- **Progress and display settings** (font, size, spacing, theme) are saved
  per reader.

## Adding a book

Open a file in `docs/js/data/` and add an entry:

```js
{
  id: "unique-id", lang: "en", category: "fiction", year: 7,
  title: "Book Title", author: "Author",
  cover: { emoji: "📕", c1: "#hex", c2: "#hex" },
  description: "One-paragraph blurb.",
  chapters: [
    { title: "1 · Chapter", paragraphs: ["…", "…"],
      quiz: [ { q: "Question?", options: ["a","b","c","d"], a: 0, explain: "Why." } ] }
  ]
}
```
