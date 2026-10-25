# ACADEMIX — Your Grades. Your Growth. Your Future.

Academic performance & CGPA management app for Nigerian university students (HTML5, CSS3, vanilla JS, Chart.js, Lucide, Google Fonts, LocalStorage), now with a **Quiz** and **Study** assistant that turns your notes into practice quizzes and summaries.

## Run it
1. Open this folder in VS Code.
2. Install the "Live Server" extension.
3. Right-click `index.html` → "Open with Live Server".

Internet is needed for Google Fonts, Lucide icons and Chart.js (loaded from CDNs). The PDF reader (pdf.js, cdnjs) and Word reader (mammoth.js, cdnjs) are loaded only when you upload a .pdf or .docx.

## How it's organised
The app is a single-page application: `index.html` loads everything and switches screens with hash routes
(`#/dashboard`, `#/courses`, `#/gpa`, `#/cgpa`, `#/predictor`, `#/goals`, `#/analytics`, `#/history`, `#/quiz`, `#/study`, `#/profile`, `#/settings`, `#/login`, `#/signup`).
The `dashboard.html`, `courses.html`, `quiz.html`, `study.html` etc. files open the matching screen, so every page name works.
On phones the bottom bar shows Home, Courses, GPA, Quiz and Study; **More** opens every other page.

- `css/style.css` — design system, dark/light themes (CSS variables), responsive + print styles
- `js/storage.js` — LocalStorage wrapper (in-memory fallback) and helpers
- `js/theme.js` — theme switching, demo auth, logo
- `js/grading.js` — Nigerian 5.0 grading scale and degree classes
- `js/views.js` — landing, auth, dashboard, app shell
- `js/courses.js` — course registration (add/edit/delete)
- `js/calculator.js` — GPA, CGPA, predictor, goals
- `js/analytics.js` — charts and academic history
- `js/settings.js` — profile and settings
- `js/ai.js` — offline engine (TF-IDF summariser, quiz generator, answer checking) and the optional Gemini client + Settings card
- `js/documents.js` — upload (drag-drop or file picker), PDF/DOCX/TXT/MD text extraction, "My Documents" library
- `js/quiz.js` — Quiz screen: setup, one-question-at-a-time runner, timer, results, review, history chart
- `js/study.js` — Study screen: summaries, key terms, exam questions, copy/download/print/save
- `js/main.js` — router, forms, actions, start-up

Scripts must stay in the order listed in `index.html`.

## Quiz & Study
1. Upload lecture notes (PDF, Word .docx, .txt or .md, up to 25 MB) on the **Quiz** or **Study** screen, or pick one from **My Documents**. Extracted text is saved in this browser (up to 60,000 characters per document, 15 documents). Scanned PDFs (images only) have no text to read; use a text-based PDF.
2. **Quiz** (“Test Yourself. Know Your Readiness.”): choose 5/10/15/20 questions, types (multiple choice, true/false, fill-in), difficulty and an optional timer. Fill-in answers are case-insensitive and allow one typo for answers over 4 letters. Results show your score, a label (≥70% Excellent, 50–69 Good, 40–49 Fair, <40 Needs work), time taken and a review with explanations. Retake, retry only the wrong ones, or start a new quiz. Scores are saved and charted.
3. **Study** (“Study Smarter, Not Longer.”): choose Short, Medium or Detailed and summarise. You get an overview, key points, key terms, likely exam questions (AI mode), and words/reading time saved. Copy, download as .txt, print, save, or make a quiz from the same document.

### Offline vs AI mode
Everything works offline: summaries pick the most important sentences with TF-IDF, and quizzes are built from your document's key terms.
For smarter results, add a free **Google Gemini API key** in **Settings → AI Study Assistant**. Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey).
The key is stored only in this browser's localStorage. When a key is saved, up to about 30,000 characters of the document are sent to Google's Gemini API (`gemini-2.0-flash`). If Gemini fails (no internet, bad key, rate limit), ACADEMIX falls back to the offline engine and tells you. A badge always shows which mode produced the result.

## Formulas
- Quality Points = Credit Units × Grade Point
- GPA = Total Quality Points ÷ Total Credit Units
- CGPA = Quality Points across all semesters ÷ Credit Units across all semesters (weighted, never an average of GPAs)
- Required GPA = (Target × (Completed + Future Units) − Current CGPA × Completed Units) ÷ Future Units

## Important
Authentication is a demonstration only. LocalStorage is not secure and does not sync across devices.
A production version needs a secure backend for accounts and data.
