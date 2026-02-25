// =========================================================
// CONFIGURACIÓN SUPABASE
// Reemplaza estos valores con los tuyos
// =========================================================
const SUPABASE_URL = https://egvuvjbsheotlemejdwj.supabase.co;  
const SUPABASE_KEY = sb_publishable_3iOXPEKfuotbe_WFrc6hzg_BzggXEGP;                    
// Inicializar cliente de Supabase
// (la librería se carga desde el CDN en index.html)
let db = null;
function initSupabase() {
  if (window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase conectado');
  } else {
    console.warn('⚠️ Supabase no disponible, usando solo localStorage');
  }
}
/**
 * THERE IS / THERE ARE — Interactive English Learning Site
 * app.js — All interactivity, exercises, scoring, games
 */

// =========================================================
// STATE
// =========================================================
const STATE = {
  teacherMode: false,
  score: parseInt(localStorage.getItem('tita_score') || '0'),
  totalAnswered: parseInt(localStorage.getItem('tita_answered') || '0'),
  exercisesDone: JSON.parse(localStorage.getItem('tita_done') || '[]'),
  currentSection: 'learn'
};

// =========================================================
// SCORE MANAGEMENT
// =========================================================
async function updateScore(delta = 1, exerciseId = '', exerciseType = '', correct = true) {
  STATE.score += delta;
  STATE.totalAnswered += 1;
  localStorage.setItem('tita_score', STATE.score);
  localStorage.setItem('tita_answered', STATE.totalAnswered);
  renderScoreBadge();
  updateProgressBar();

  // Guardar en Supabase si hay estudiante registrado y hay conexión
  const studentId = localStorage.getItem('tita_student_id');
  if (db && studentId && exerciseId) {
    try {
      await db.from('exercise_results').insert({
        student_id: studentId,
        exercise_id: exerciseId,
        exercise_type: exerciseType,
        correct: correct,
        score: delta
      });
    } catch (err) {
      console.warn('No se pudo guardar en Supabase:', err);
      // La página sigue funcionando aunque falle Supabase
    }
  }
}

function markDone(id) {
  if (!STATE.exercisesDone.includes(id)) {
    STATE.exercisesDone.push(id);
    localStorage.setItem('tita_done', JSON.stringify(STATE.exercisesDone));
    updateProgressBar();
  }
}

function renderScoreBadge() {
  const el = document.getElementById('scoreBadge');
  if (el) el.textContent = `⭐ ${STATE.score} pts`;
}

// =========================================================
// PROGRESS BAR
// =========================================================
const TOTAL_EXERCISES = 68; // total interactive exercises

function updateProgressBar() {
  const done = STATE.exercisesDone.length;
  const pct = Math.min(100, Math.round((done / TOTAL_EXERCISES) * 100));
  const fill = document.getElementById('progressFill');
  const pctEl = document.getElementById('progressPct');
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}

// =========================================================
// NAV & TABS
// =========================================================
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  const tab = document.querySelector(`.nav-tab[data-section="${id}"]`);
  if (sec) sec.classList.add('active');
  if (tab) tab.classList.add('active');
  STATE.currentSection = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================
// TEACHER MODE
// =========================================================
function toggleTeacherMode() {
  if (!STATE.teacherMode) {
    const pw = prompt('🔑 Enter teacher password:');
    if (pw !== 'TEACHER123') {
      alert('❌ Incorrect password!');
      return;
    }
    STATE.teacherMode = true;
    document.body.classList.add('teacher-mode');
    document.getElementById('teacherBtn').classList.add('active');
    document.getElementById('teacherBtn').textContent = '🎓 Teacher ON';
    document.getElementById('teacherBanner').classList.add('show');
    document.querySelectorAll('.model-answer').forEach(el => el.classList.add('show'));
    document.querySelectorAll('.teacher-reset-area').forEach(el => el.classList.add('show'));
  } else {
    STATE.teacherMode = false;
    document.body.classList.remove('teacher-mode');
    document.getElementById('teacherBtn').classList.remove('active');
    document.getElementById('teacherBtn').textContent = '🔑 Teacher';
    document.getElementById('teacherBanner').classList.remove('show');
    document.querySelectorAll('.model-answer').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.teacher-reset-area').forEach(el => el.classList.remove('show'));
  }
}

// =========================================================
// GENERIC FEEDBACK
// =========================================================
function showFeedback(el, isCorrect, explanation = '') {
  el.classList.remove('hidden');
  el.classList.add('show');
  if (isCorrect) {
    el.classList.add('correct-fb');
    el.classList.remove('wrong-fb');
    el.innerHTML = `✅ <span>Correct! Well done! 🎉</span>`;
  } else {
    el.classList.add('wrong-fb');
    el.classList.remove('correct-fb');
    el.innerHTML = `❌ <span>Not quite! ${explanation}</span>`;
  }
}

// =========================================================
// FILL IN THE BLANK EXERCISES
// =========================================================
const FILL_EXERCISES = [
  { id: 'f1', sentence: '_____ a dog in the garden.', answer: ['There is', 'there is'], hint: 'Use "There is" for ONE dog (singular).', explanation: 'Use "There is" with a singular noun.' },
  { id: 'f2', sentence: '_____ three cats on the sofa.', answer: ['There are', 'there are'], hint: 'Use "There are" for THREE cats (plural).', explanation: 'Use "There are" with a plural noun.' },
  { id: 'f3', sentence: '_____ not a pen on the desk.', answer: ['There is', 'there is'], hint: '"a pen" is singular → use "There is"', explanation: '"There is not" (= There isn\'t) is the negative singular form.' },
  { id: 'f4', sentence: '_____ some children in the park.', answer: ['There are', 'there are'], hint: '"children" is plural → use "There are"', explanation: '"children" is the plural of "child".' },
  { id: 'f5', sentence: '_____ an elephant at the zoo.', answer: ['There is', 'there is'], hint: '"an elephant" = singular → "There is"', explanation: '"an" is used before vowel sounds (a/e/i/o/u), still singular.' },
  { id: 'f6', sentence: '_____ any milk in the fridge?', answer: ['Is there', 'is there'], hint: 'Question form: Is/Are + there + ...?', explanation: '"milk" is uncountable → use "Is there".' },
  { id: 'f7', sentence: '_____ twelve eggs in the basket.', answer: ['There are', 'there are'], hint: '"twelve eggs" = plural → "There are"', explanation: 'Numbers greater than one use "There are".' },
  { id: 'f8', sentence: '_____ a big swimming pool near the school.', answer: ['There is', 'there is'], hint: '"a swimming pool" = singular → "There is"', explanation: '"a" signals a single countable noun.' },
  { id: 'f9', sentence: '_____ any books on the shelf?', answer: ['Are there', 'are there'], hint: 'Question with plural noun → "Are there"?', explanation: '"books" is plural → "Are there...?"' },
  { id: 'f10', sentence: '_____ no monkeys in this zoo.', answer: ['There are', 'there are'], hint: '"monkeys" is plural → "There are" + "no"', explanation: '"There are no" is used for plural negatives.' },
  { id: 'f11', sentence: '_____ some water in the bottle.', answer: ['There is', 'there is'], hint: '"water" is uncountable → "There is"', explanation: 'Uncountable nouns use "There is".' },
  { id: 'f12', sentence: '_____ five students absent today.', answer: ['There are', 'there are'], hint: '"five students" = plural → "There are"', explanation: 'Numbers 2+ require "There are".' },
];

function buildFillExercises() {
  const container = document.getElementById('fillContainer');
  if (!container) return;
  FILL_EXERCISES.forEach((ex, i) => {
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.id = 'fill-' + ex.id;
    div.innerHTML = `
      <div class="exercise-question">
        <span class="exercise-number">${i + 1}</span>
        Complete the sentence:
      </div>
      <p style="font-size:1.05rem;margin-bottom:8px;">
        <input class="blank-input" id="input-${ex.id}" placeholder="Type here..." autocomplete="off" spellcheck="false" />
        ${ex.sentence.replace('_____', '')}
      </p>
      <div class="es-tip">${ex.hint}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-check btn-sm" onclick="checkFill('${ex.id}')">✔ Check</button>
        <button class="btn btn-retry btn-sm" onclick="retryFill('${ex.id}')">🔄 Try again</button>
      </div>
      <div class="feedback" id="fb-${ex.id}"></div>
    `;
    container.appendChild(div);
  });
}

function checkFill(id) {
  const ex = FILL_EXERCISES.find(e => e.id === id);
  const input = document.getElementById('input-' + id);
  const fb = document.getElementById('fb-' + id);
  const val = input.value.trim();
  const correct = ex.answer.some(a => val.toLowerCase() === a.toLowerCase());
  input.classList.toggle('correct-input', correct);
  input.classList.toggle('wrong-input', !correct);
  showFeedback(fb, correct, `The correct answer is: "<strong>${ex.answer[0]}</strong>". ${ex.explanation}`);
  document.getElementById('fill-' + id).classList.toggle('correct', correct);
  document.getElementById('fill-' + id).classList.toggle('incorrect', !correct);
  if (correct) { updateScore(1); markDone('fill-' + id); }
  input.disabled = true;
}

function retryFill(id) {
  const input = document.getElementById('input-' + id);
  const fb = document.getElementById('fb-' + id);
  input.value = '';
  input.disabled = false;
  input.className = 'blank-input';
  fb.classList.remove('show', 'correct-fb', 'wrong-fb');
  document.getElementById('fill-' + id).className = 'exercise-item';
}

// =========================================================
// MULTIPLE CHOICE EXERCISES
// =========================================================
const MCQ_EXERCISES = [
  { id: 'm1', question: 'Look at the kitchen. _____ a big table.', options: ['There is', 'There are', 'Is there', 'Are there'], correct: 0, explanation: '"a table" is singular → There is.' },
  { id: 'm2', question: '_____ five students in the classroom?', options: ['Is there', 'Are there', 'There is', 'There are'], correct: 1, explanation: 'Question with plural noun → Are there...?' },
  { id: 'm3', question: '"_____ many birds in the tree." Complete with the correct form.', options: ['There is', 'There are', 'Is there', 'Are there'], correct: 1, explanation: '"birds" is plural → There are.' },
  { id: 'm4', question: 'The zoo has only one lion. _____ one lion.', options: ['There are', 'There is', 'Are there', 'Is there'], correct: 1, explanation: '"one lion" is singular → There is.' },
  { id: 'm5', question: '_____ some juice in the glass?', options: ['Are there', 'Is there', 'There are', 'There is'], correct: 1, explanation: '"juice" is uncountable → Is there?' },
  { id: 'm6', question: 'Answer: "Is there a cat?" → "Yes, _____ ."', options: ['there are', 'there is', 'is there', 'are there'], correct: 1, explanation: 'Short answer to "Is there...?" = "Yes, there is."' },
  { id: 'm7', question: '"There are many apples." Make it negative:', options: ['There is not apples.', 'There are not any apples.', 'There is not any apples.', 'Are there apples?'], correct: 1, explanation: 'Negative plural: There are not any / There aren\'t any.' },
  { id: 'm8', question: 'My bedroom has a desk, a chair, and a lamp. _____ three pieces of furniture.', options: ['There is', 'Is there', 'There are', 'Are there'], correct: 2, explanation: '"three pieces" is plural → There are.' },
  { id: 'm9', question: '"How many books _____ on the shelf?" Choose the correct word order.', options: ['there are', 'are there', 'is there', 'there is'], correct: 1, explanation: 'After "How many" in a question → are there.' },
  { id: 'm10', question: '"_____ no milk in the fridge." Complete correctly.', options: ['There are', 'There is', 'Is there', 'Are there'], correct: 1, explanation: '"milk" is uncountable → There is no.' },
  { id: 'm11', question: 'Answer: "Are there any cookies?" → "No, _____ ."', options: ['there aren\'t', 'there isn\'t', 'there are', 'there is'], correct: 0, explanation: 'Short negative answer to "Are there...?" = "No, there aren\'t."' },
  { id: 'm12', question: '"The garden has a fountain." Say this with "there":',  options: ['There are a fountain in the garden.', 'Is there a fountain in the garden.', 'There is a fountain in the garden.', 'There is fountains in the garden.'], correct: 2, explanation: '"a fountain" = singular → There is a fountain.' },
];

function buildMCQExercises() {
  const container = document.getElementById('mcqContainer');
  if (!container) return;
  MCQ_EXERCISES.forEach((ex, i) => {
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.id = 'mcq-' + ex.id;
    const optHtml = ex.options.map((opt, oi) =>
      `<button class="mcq-option" onclick="checkMCQ('${ex.id}', ${oi})">${opt}</button>`
    ).join('');
    div.innerHTML = `
      <div class="exercise-question"><span class="exercise-number">${i + 1}</span>${ex.question}</div>
      <div class="mcq-options" id="opts-${ex.id}">${optHtml}</div>
      <div class="feedback" id="fb-mcq-${ex.id}"></div>
    `;
    container.appendChild(div);
  });
}

function checkMCQ(id, chosen) {
  const ex = MCQ_EXERCISES.find(e => e.id === id);
  const opts = document.querySelectorAll(`#opts-${id} .mcq-option`);
  const fb = document.getElementById('fb-mcq-' + id);
  const correct = chosen === ex.correct;
  opts.forEach((btn, i) => {
    btn.disabled = true;
    if (i === ex.correct) btn.classList.add('correct-choice');
    if (i === chosen && !correct) btn.classList.add('wrong-choice');
  });
  showFeedback(fb, correct, ex.explanation);
  document.getElementById('mcq-' + id).classList.toggle('correct', correct);
  document.getElementById('mcq-' + id).classList.toggle('incorrect', !correct);
  if (correct) { updateScore(1); markDone('mcq-' + id); }
}

// =========================================================
// TRUE / FALSE EXERCISES
// =========================================================
const TF_EXERCISES = [
  { id: 'tf1', scene: 'classroom', statement: 'There are two blackboards in the classroom.', answer: false, explanation: 'There is ONE blackboard in the classroom.' },
  { id: 'tf2', scene: 'classroom', statement: 'There are three books on the teacher\'s desk.', answer: true, explanation: 'Yes! Three colourful books are on the teacher\'s desk.' },
  { id: 'tf3', scene: 'classroom', statement: 'There is a globe near the window.', answer: false, explanation: 'The globe is near the wall, not the window.' },
  { id: 'tf4', scene: 'classroom', statement: 'There are three student desks in the classroom.', answer: true, explanation: 'Correct! There are three student desks.' },
  { id: 'tf5', scene: 'kitchen', statement: 'There are four apples on the table.', answer: false, explanation: 'There are THREE apples (2 red + 1 green).' },
  { id: 'tf6', scene: 'kitchen', statement: 'There is a refrigerator in the kitchen.', answer: true, explanation: 'Yes! There is one refrigerator.' },
  { id: 'tf7', scene: 'bedroom', statement: 'There are four books on the desk.', answer: true, explanation: 'Yes! There is a stack of four books on the desk.' },
  { id: 'tf8', scene: 'zoo', statement: 'There are four birds flying in the sky.', answer: true, explanation: 'Yes! There are four colourful birds.' },
];

function buildTFExercises() {
  const container = document.getElementById('tfContainer');
  if (!container) return;
  TF_EXERCISES.forEach((ex, i) => {
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.id = 'tf-' + ex.id;
    div.innerHTML = `
      <div class="exercise-question"><span class="exercise-number">${i + 1}</span>Look at the <strong>${ex.scene}</strong> scene:</div>
      <p style="font-size:1.05rem;margin:8px 0;font-style:italic;">"${ex.statement}"</p>
      <div class="tf-options">
        <button class="tf-btn true-btn" onclick="checkTF('${ex.id}', true)">✅ TRUE</button>
        <button class="tf-btn false-btn" onclick="checkTF('${ex.id}', false)">❌ FALSE</button>
      </div>
      <div class="feedback" id="fb-tf-${ex.id}"></div>
    `;
    container.appendChild(div);
  });
}

function checkTF(id, chosen) {
  const ex = TF_EXERCISES.find(e => e.id === id);
  const btns = document.querySelectorAll(`#tf-${id} .tf-btn`);
  const fb = document.getElementById('fb-tf-' + id);
  const correct = chosen === ex.answer;
  btns.forEach(btn => btn.disabled = true);
  showFeedback(fb, correct, ex.explanation);
  document.getElementById('tf-' + id).classList.toggle('correct', correct);
  document.getElementById('tf-' + id).classList.toggle('incorrect', !correct);
  if (correct) { updateScore(1); markDone('tf-' + id); }
}

// =========================================================
// MATCHING EXERCISES
// =========================================================
const MATCH_SETS = [
  {
    id: 'match1',
    title: 'Match the sentence to the correct form:',
    left: [
      { id: 'ml1a', text: '_____ a cat.' },
      { id: 'ml1b', text: '_____ two dogs.' },
      { id: 'ml1c', text: '_____ some milk.' },
      { id: 'ml1d', text: '_____ any eggs?' },
      { id: 'ml1e', text: '_____ many people.' },
    ],
    right: [
      { id: 'mr1a', text: 'There is', match: 'ml1a' },
      { id: 'mr1b', text: 'There are', match: 'ml1b' },
      { id: 'mr1c', text: 'There is', match: 'ml1c' },
      { id: 'mr1d', text: 'Are there', match: 'ml1d' },
      { id: 'mr1e', text: 'There are', match: 'ml1e' },
    ]
  },
  {
    id: 'match2',
    title: 'Match the question to its short answer:',
    left: [
      { id: 'ml2a', text: 'Is there a pen on the desk?' },
      { id: 'ml2b', text: 'Are there any chairs?' },
      { id: 'ml2c', text: 'Is there any water?' },
      { id: 'ml2d', text: 'Are there five books?' },
      { id: 'ml2e', text: 'Is there a window?' },
    ],
    right: [
      { id: 'mr2a', text: 'Yes, there is.', match: 'ml2a' },
      { id: 'mr2b', text: 'Yes, there are.', match: 'ml2b' },
      { id: 'mr2c', text: 'No, there isn\'t.', match: 'ml2c' },
      { id: 'mr2d', text: 'No, there aren\'t.', match: 'ml2d' },
      { id: 'mr2e', text: 'Yes, there is.', match: 'ml2e' },
    ]
  }
];

let matchState = {};

function buildMatchingExercises() {
  const container = document.getElementById('matchContainer');
  if (!container) return;
  MATCH_SETS.forEach((set, si) => {
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.id = 'match-' + set.id;
    // Shuffle right side
    const shuffledRight = [...set.right].sort(() => Math.random() - 0.5);
    div.innerHTML = `
      <div class="exercise-question"><span class="exercise-number">${si + 1}</span>${set.title}</div>
      <div class="matching-container">
        <div class="matching-col" id="left-${set.id}">
          ${set.left.map(l => `<div class="match-item" id="${l.id}" data-set="${set.id}" data-side="left" onclick="selectMatch('${l.id}','${set.id}','left')">${l.text}</div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;font-size:1.5rem;">→</div>
        <div class="matching-col" id="right-${set.id}">
          ${shuffledRight.map(r => `<div class="match-item" id="${r.id}" data-set="${set.id}" data-side="right" data-match="${r.match}" onclick="selectMatch('${r.id}','${set.id}','right')">${r.text}</div>`).join('')}
        </div>
      </div>
      <button class="btn btn-retry btn-sm" onclick="resetMatch('${set.id}')">🔄 Reset</button>
      <div class="feedback" id="fb-match-${set.id}"></div>
    `;
    container.appendChild(div);
    matchState[set.id] = { selectedLeft: null, selectedRight: null, matched: 0 };
  });
}

function selectMatch(itemId, setId, side) {
  const state = matchState[setId];
  const el = document.getElementById(itemId);
  if (!el || el.classList.contains('matched-correct')) return;

  if (side === 'left') {
    // Deselect previous left
    if (state.selectedLeft) {
      const prev = document.getElementById(state.selectedLeft);
      if (prev && !prev.classList.contains('matched-correct')) prev.classList.remove('selected');
    }
    state.selectedLeft = itemId;
    el.classList.add('selected');
  } else {
    if (state.selectedLeft === null) return;
    state.selectedRight = itemId;
    // Check match
    const set = MATCH_SETS.find(s => s.id === setId);
    const leftEl = document.getElementById(state.selectedLeft);
    const rightItem = set.right.find(r => r.id === itemId);
    const correct = rightItem && rightItem.match === state.selectedLeft;
    if (correct) {
      leftEl.classList.remove('selected');
      leftEl.classList.add('matched-correct');
      el.classList.add('matched-correct');
      state.matched++;
      if (state.matched === set.left.length) {
        showFeedback(document.getElementById('fb-match-' + setId), true, 'All matched!');
        updateScore(2);
        markDone('match-' + setId);
      }
    } else {
      leftEl.classList.add('matched-wrong');
      el.classList.add('matched-wrong');
      setTimeout(() => {
        leftEl.classList.remove('matched-wrong', 'selected');
        el.classList.remove('matched-wrong');
      }, 700);
    }
    state.selectedLeft = null;
    state.selectedRight = null;
  }
}

function resetMatch(setId) {
  const set = MATCH_SETS.find(s => s.id === setId);
  set.left.forEach(l => {
    const el = document.getElementById(l.id);
    if (el) el.className = 'match-item';
    el.onclick = () => selectMatch(l.id, setId, 'left');
  });
  set.right.forEach(r => {
    const el = document.getElementById(r.id);
    if (el) el.className = 'match-item';
    el.onclick = () => selectMatch(r.id, setId, 'right');
  });
  const fb = document.getElementById('fb-match-' + setId);
  if (fb) fb.classList.remove('show', 'correct-fb', 'wrong-fb');
  matchState[setId] = { selectedLeft: null, selectedRight: null, matched: 0 };
}

// =========================================================
// IMAGE EXERCISES (count + is/are)
// =========================================================
const IMAGE_EXERCISES = [
  { id: 'img1', scene: 'classroom', question: 'How many <strong>books</strong> are on the teacher\'s desk? Choose "is" or "are":',  sentence: 'There ___ 3 books on the desk.', answer: 'are', hint: '3 books → plural → "are"' },
  { id: 'img2', scene: 'classroom', question: 'Look at the blackboard. There ___ one blackboard.', sentence: 'There ___ one blackboard.', answer: 'is', hint: 'ONE blackboard = singular → "is"' },
  { id: 'img3', scene: 'kitchen', question: 'Count the apples! There ___ 3 apples on the table.', sentence: 'There ___ 3 apples on the table.', answer: 'are', hint: 'More than one → "are"' },
  { id: 'img4', scene: 'kitchen', question: 'There ___ one refrigerator in the kitchen.', sentence: 'There ___ one refrigerator.', answer: 'is', hint: 'ONE refrigerator = singular → "is"' },
  { id: 'img5', scene: 'bedroom', question: 'Count the books on the desk. There ___ 4 books.', sentence: 'There ___ 4 books on the desk.', answer: 'are', hint: '4 books = plural → "are"' },
  { id: 'img6', scene: 'bedroom', question: 'There ___ one teddy bear on the floor.', sentence: 'There ___ one teddy bear.', answer: 'is', hint: 'ONE teddy = singular → "is"' },
  { id: 'img7', scene: 'zoo', question: 'Count the birds! There ___ 4 birds in the sky.', sentence: 'There ___ 4 birds.', answer: 'are', hint: '4 birds = plural → "are"' },
  { id: 'img8', scene: 'zoo', question: 'How many elephants? There ___ one elephant.', sentence: 'There ___ one elephant.', answer: 'is', hint: 'ONE elephant = singular → "is"' },
];

function buildImageExercises() {
  const container = document.getElementById('imgContainer');
  if (!container) return;
  IMAGE_EXERCISES.forEach((ex, i) => {
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.id = 'img-' + ex.id;
    div.innerHTML = `
      <div class="exercise-question"><span class="exercise-number">${i + 1}</span>${ex.question}</div>
      <p style="font-size:1.05rem;margin:8px 0;">${ex.sentence}</p>
      <div class="es-tip">${ex.hint}</div>
      <div class="tf-options">
        <button class="tf-btn true-btn" onclick="checkImg('${ex.id}','is')"><strong>IS</strong></button>
        <button class="tf-btn false-btn" onclick="checkImg('${ex.id}','are')"><strong>ARE</strong></button>
      </div>
      <div class="feedback" id="fb-img-${ex.id}"></div>
    `;
    container.appendChild(div);
  });
}

function checkImg(id, chosen) {
  const ex = IMAGE_EXERCISES.find(e => e.id === id);
  const btns = document.querySelectorAll(`#img-${id} .tf-btn`);
  const fb = document.getElementById('fb-img-' + id);
  const correct = chosen === ex.answer;
  btns.forEach(btn => btn.disabled = true);
  showFeedback(fb, correct, `Use <strong>"${ex.answer}"</strong>. ${ex.hint}`);
  document.getElementById('img-' + id).classList.toggle('correct', correct);
  document.getElementById('img-' + id).classList.toggle('incorrect', !correct);
  if (correct) { updateScore(1); markDone('img-' + id); }
}

// =========================================================
// WRITING EXERCISES
// =========================================================
const WRITING_EXERCISES = [
  {
    id: 'w1',
    prompt: 'Describe your bedroom. Write 2 sentences using "There is" and "There are".',
    model: 'In my bedroom, there is a big bed next to the window. There are some books on my desk.',
    rubric: [
      'Uses "There is" at least once.',
      'Uses "There are" at least once.',
      'Correct use of "a/an" or number with singular.',
      'Uses "some" or a number with plural.',
    ]
  },
  {
    id: 'w2',
    prompt: 'Look at the kitchen scene. Write 3 sentences describing what you see.',
    model: 'There is a refrigerator in the kitchen. There are three apples on the table. There is a pot on the stove.',
    rubric: [
      'Writes at least 3 sentences.',
      'At least one sentence uses "There is".',
      'At least one sentence uses "There are".',
      'Correct noun-verb agreement.',
    ]
  },
  {
    id: 'w3',
    prompt: 'Ask 2 questions about the classroom using "Is there...?" and "Are there...?"',
    model: 'Is there a clock on the wall? Are there any students in the classroom?',
    rubric: [
      'Writes at least 2 questions.',
      'One question uses "Is there?".',
      'One question uses "Are there?".',
      'Questions end with "?".',
    ]
  },
  {
    id: 'w4',
    prompt: 'Write the negative form of these sentences:\n1. There is a cat in the garden.\n2. There are books on the table.',
    model: '1. There is not a cat in the garden. / There isn\'t a cat in the garden.\n2. There are not any books on the table. / There aren\'t any books on the table.',
    rubric: [
      'Answers both sentences.',
      'Uses "is not" or "isn\'t" for singular.',
      'Uses "are not" or "aren\'t" for plural.',
      'Correct word order (not after is/are).',
    ]
  },
  {
    id: 'w5',
    prompt: 'Write 2 sentences using prepositions of place (in, on, under, next to, between, behind, in front of).',
    model: 'There is a ball under the bed. There are pencils in front of the books.',
    rubric: [
      'Writes 2 sentences.',
      'Uses at least 2 different prepositions.',
      'Correct "There is/are" in each sentence.',
      'Sentence makes logical sense.',
    ]
  },
  {
    id: 'w6',
    prompt: 'Write a short answer to each question:\n1. Is there a lion at the zoo?\n2. Are there any bananas in the kitchen?',
    model: '1. Yes, there is.\n2. Yes, there are.',
    rubric: [
      'Answers both questions.',
      'Uses "Yes, there is." or "No, there isn\'t." for Q1.',
      'Uses "Yes, there are." or "No, there aren\'t." for Q2.',
      'No extra words in short answer.',
    ]
  },
  {
    id: 'w7',
    prompt: 'Write 3 sentences about the zoo using "There are" and numbers.',
    model: 'There are two lions in the cage. There are four birds in the sky. There are two monkeys in the tree.',
    rubric: [
      'Writes 3 sentences.',
      'Each sentence uses "There are".',
      'Each sentence includes a number.',
      'Plural nouns used correctly.',
    ]
  },
  {
    id: 'w8',
    prompt: 'Write a question with "How many" and answer it.',
    model: 'How many books are there on the shelf? There are nine books on the shelf.',
    rubric: [
      'Question starts with "How many".',
      'Question contains "are there".',
      'Answer uses "There are".',
      'Question and answer make sense together.',
    ]
  },
];

function buildWritingExercises() {
  const container = document.getElementById('writingContainer');
  if (!container) return;
  WRITING_EXERCISES.forEach((ex, i) => {
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.id = 'writing-' + ex.id;
    const rubricHtml = ex.rubric.map((r, ri) =>
      `<li class="rubric-item" id="rub-${ex.id}-${ri}"><span class="rubric-icon">⬜</span> ${r}</li>`
    ).join('');
    div.innerHTML = `
      <div class="exercise-question"><span class="exercise-number">${i + 1}</span>${ex.prompt.replace(/\n/g, '<br>')}</div>
      <textarea class="writing-area" id="write-${ex.id}" placeholder="Write your answer here..."></textarea>
      <ul class="rubric-list" id="rubric-${ex.id}">${rubricHtml}</ul>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-check btn-sm" onclick="checkWriting('${ex.id}')">✔ Self-check</button>
        <button class="btn btn-warning btn-sm" onclick="toggleModel('${ex.id}')">👁 Model answer</button>
        <button class="btn btn-retry btn-sm" onclick="retryWriting('${ex.id}')">🔄 Clear</button>
      </div>
      <div class="model-answer ${STATE.teacherMode ? 'show' : ''}" id="model-${ex.id}">
        <strong>📝 Model Answer:</strong><br>${ex.model.replace(/\n/g, '<br>')}
      </div>
    `;
    container.appendChild(div);
  });
}

function checkWriting(id) {
  const ex = WRITING_EXERCISES.find(e => e.id === id);
  const text = document.getElementById('write-' + id).value.toLowerCase();
  if (!text.trim()) { alert('Please write something first! ✏️'); return; }
  // Simple keyword rubric checks
  const keywords = [
    text.includes('there is') || text.includes("there isn't") || text.includes('there is not'),
    text.includes('there are') || text.includes("there aren't") || text.includes('there are not'),
    /\b(a|an)\b/.test(text),
    /\b(some|any|\d+)\b/.test(text),
  ];
  let met = 0;
  ex.rubric.forEach((r, ri) => {
    const item = document.getElementById(`rub-${id}-${ri}`);
    const pass = keywords[ri] !== undefined ? keywords[ri] : text.length > 10;
    item.className = `rubric-item ${pass ? 'met' : 'unmet'}`;
    item.querySelector('.rubric-icon').textContent = pass ? '✅' : '❌';
    if (pass) met++;
  });
  if (met >= 3) {
    updateScore(2);
    markDone('writing-' + id);
    document.getElementById('writing-' + id).classList.add('correct');
  }
  // Show model
  document.getElementById('model-' + id).classList.add('show');
}

function toggleModel(id) {
  const m = document.getElementById('model-' + id);
  m.classList.toggle('show');
}

function retryWriting(id) {
  const ex = WRITING_EXERCISES.find(e => e.id === id);
  document.getElementById('write-' + id).value = '';
  document.getElementById('model-' + id).classList.remove('show');
  document.getElementById('writing-' + id).className = 'exercise-item';
  ex.rubric.forEach((r, ri) => {
    const item = document.getElementById(`rub-${id}-${ri}`);
    item.className = 'rubric-item';
    item.querySelector('.rubric-icon').textContent = '⬜';
  });
}

// =========================================================
// UNSCRAMBLE EXERCISES
// =========================================================
const UNSCRAMBLE_EXERCISES = [
  { id: 'us1', words: ['There', 'is', 'a', 'cat', 'under', 'the', 'table', '.'], answer: 'There is a cat under the table .', explanation: 'There is + singular noun + preposition.' },
  { id: 'us2', words: ['There', 'are', 'five', 'birds', 'in', 'the', 'tree', '.'], answer: 'There are five birds in the tree .', explanation: 'There are + number + plural noun.' },
  { id: 'us3', words: ['Is', 'there', 'a', 'dog', 'in', 'the', 'garden', '?'], answer: 'Is there a dog in the garden ?', explanation: 'Question: Is there + a + singular noun?' },
  { id: 'us4', words: ['There', 'are', 'not', 'any', 'apples', 'on', 'the', 'table', '.'], answer: 'There are not any apples on the table .', explanation: 'Negative plural: There are not any + noun.' },
  { id: 'us5', words: ['How', 'many', 'books', 'are', 'there', 'on', 'the', 'shelf', '?'], answer: 'How many books are there on the shelf ?', explanation: 'How many + noun + are there + place?' },
  { id: 'us6', words: ['Are', 'there', 'any', 'children', 'in', 'the', 'park', '?'], answer: 'Are there any children in the park ?', explanation: 'Question plural: Are there any + plural noun?' },
  { id: 'us7', words: ['There', 'is', 'a', 'lamp', 'next', 'to', 'the', 'bed', '.'], answer: 'There is a lamp next to the bed .', explanation: 'There is + a + noun + preposition of place.' },
  { id: 'us8', words: ['There', 'are', 'two', 'monkeys', 'in', 'the', 'tree', '.'], answer: 'There are two monkeys in the tree .', explanation: 'There are + number + plural noun.' },
];

let unscrambleState = {};

function buildUnscrambleExercises() {
  const container = document.getElementById('unscrambleContainer');
  if (!container) return;
  UNSCRAMBLE_EXERCISES.forEach((ex, i) => {
    const shuffled = [...ex.words].sort(() => Math.random() - 0.5);
    unscrambleState[ex.id] = { selected: [], words: shuffled, locked: false };
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.id = 'us-' + ex.id;
    div.innerHTML = `
      <div class="exercise-question"><span class="exercise-number">${i + 1}</span>Put the words in order:</div>
      <div class="scramble-words" id="chips-${ex.id}">
        ${shuffled.map((w, wi) => `<button class="word-chip" id="chip-${ex.id}-${wi}" onclick="addWord('${ex.id}', '${w}', ${wi})">${w}</button>`).join('')}
      </div>
      <div class="scramble-answer" id="ans-${ex.id}"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-check btn-sm" onclick="checkUnscramble('${ex.id}')">✔ Check</button>
        <button class="btn btn-retry btn-sm" onclick="resetUnscramble('${ex.id}')">🔄 Reset</button>
      </div>
      <div class="feedback" id="fb-us-${ex.id}"></div>
    `;
    container.appendChild(div);
  });
}

function addWord(id, word, wi) {
  const state = unscrambleState[id];
  if (state.locked) return;
  const chip = document.getElementById(`chip-${id}-${wi}`);
  chip.classList.add('selected');
  chip.disabled = true;
  state.selected.push({ word, wi });
  renderAnswer(id);
}

function renderAnswer(id) {
  const state = unscrambleState[id];
  const ans = document.getElementById('ans-' + id);
  ans.innerHTML = state.selected.map((s, i) =>
    `<span class="answer-chip ${state.locked ? 'locked' : ''}" onclick="${state.locked ? '' : `removeWord('${id}',${i})`}">${s.word}</span>`
  ).join(' ');
}

function removeWord(id, idx) {
  const state = unscrambleState[id];
  if (state.locked) return;
  const removed = state.selected.splice(idx, 1)[0];
  const chip = document.getElementById(`chip-${id}-${removed.wi}`);
  if (chip) { chip.classList.remove('selected'); chip.disabled = false; }
  renderAnswer(id);
}

function checkUnscramble(id) {
  const ex = UNSCRAMBLE_EXERCISES.find(e => e.id === id);
  const state = unscrambleState[id];
  const attempt = state.selected.map(s => s.word).join(' ');
  const correct = attempt === ex.answer;
  state.locked = true;
  renderAnswer(id);
  showFeedback(document.getElementById('fb-us-' + id), correct,
    `Correct sentence: "<strong>${ex.answer}</strong>". ${ex.explanation}`);
  document.getElementById('us-' + id).classList.toggle('correct', correct);
  document.getElementById('us-' + id).classList.toggle('incorrect', !correct);
  if (correct) { updateScore(2); markDone('us-' + id); }
}

function resetUnscramble(id) {
  const state = unscrambleState[id];
  state.selected = [];
  state.locked = false;
  const fb = document.getElementById('fb-us-' + id);
  fb.classList.remove('show', 'correct-fb', 'wrong-fb');
  document.getElementById('us-' + id).className = 'exercise-item';
  // Re-enable chips
  state.words.forEach((w, wi) => {
    const chip = document.getElementById(`chip-${id}-${wi}`);
    if (chip) { chip.classList.remove('selected'); chip.disabled = false; }
  });
  renderAnswer(id);
}

// =========================================================
// MINI GAMES
// =========================================================

// --- GAME 1: Flashcard Flip ---
const FLASHCARDS = [
  { emoji: '🐈', q: 'One cat. Use "is" or "are"?', a: 'There IS a cat.', ex: 'There is a cat on the sofa.' },
  { emoji: '📚', q: 'Many books. Use "is" or "are"?', a: 'There ARE books.', ex: 'There are books on the shelf.' },
  { emoji: '🍎', q: 'Three apples. Use "is" or "are"?', a: 'There ARE three apples.', ex: 'There are three apples on the table.' },
  { emoji: '💧', q: 'Water (uncountable). Use "is" or "are"?', a: 'There IS water.', ex: 'There is water in the bottle.' },
  { emoji: '🦁', q: 'Five lions. Use "is" or "are"?', a: 'There ARE five lions.', ex: 'There are five lions at the zoo.' },
  { emoji: '🪑', q: 'One chair. Use "is" or "are"?', a: 'There IS a chair.', ex: 'There is a chair next to the desk.' },
  { emoji: '🌸', q: 'Many flowers. Use "is" or "are"?', a: 'There ARE many flowers.', ex: 'There are many flowers in the garden.' },
  { emoji: '🍞', q: 'Some bread (uncountable). Use "is" or "are"?', a: 'There IS some bread.', ex: 'There is some bread on the table.' },
];

let fcIndex = 0;
let fcFlipped = false;

function buildFlashcardGame() {
  const el = document.getElementById('flashcardInner');
  if (!el) return;
  renderFlashcard();
}

function renderFlashcard() {
  const card = FLASHCARDS[fcIndex % FLASHCARDS.length];
  document.getElementById('fc-emoji').textContent = card.emoji;
  document.getElementById('fc-question').textContent = card.q;
  document.getElementById('fc-answer').textContent = card.a;
  document.getElementById('fc-example').textContent = card.ex;
  fcFlipped = false;
  document.getElementById('flashcardInner').classList.remove('flipped');
}

function flipCard() {
  fcFlipped = !fcFlipped;
  document.getElementById('flashcardInner').classList.toggle('flipped', fcFlipped);
}

function nextCard() {
  fcIndex++;
  renderFlashcard();
}

// --- GAME 2: Bubble Pop ---
const BUBBLE_ROUNDS = [
  { question: 'There ___ a dog in the park.', correct: 'is', options: ['is', 'are', 'be', 'am'], colors: ['#FF6B6B','#FFD166','#06D6A0','#118AB2'] },
  { question: 'There ___ many students here.', correct: 'are', options: ['is', 'are', 'were', 'am'], colors: ['#9D4EDD','#FF6B6B','#FFD166','#06D6A0'] },
  { question: '___ there any milk?', correct: 'Is', options: ['Are', 'Is', 'Be', 'Am'], colors: ['#118AB2','#06D6A0','#FF6B6B','#FFD166'] },
  { question: 'There ___ two lions at the zoo.', correct: 'are', options: ['is', 'are', 'was', 'be'], colors: ['#FFD166','#9D4EDD','#FF6B6B','#118AB2'] },
  { question: 'There ___ some bread on the table.', correct: 'is', options: ['is', 'are', 'be', 'have'], colors: ['#06D6A0','#FFD166','#118AB2','#FF6B6B'] },
  { question: '___ there five books on the shelf?', correct: 'Are', options: ['Is', 'Are', 'Be', 'Have'], colors: ['#FF6B6B','#06D6A0','#9D4EDD','#118AB2'] },
];

let bubbleRound = 0;
let bubbleScore = 0;

function buildBubbleGame() {
  renderBubbleRound();
}

function renderBubbleRound() {
  const r = BUBBLE_ROUNDS[bubbleRound % BUBBLE_ROUNDS.length];
  document.getElementById('bubbleQuestion').textContent = r.question;
  document.getElementById('bubbleScore').textContent = `Score: ${bubbleScore}`;
  const grid = document.getElementById('bubbleGrid');
  const shuffled = [...r.options].sort(() => Math.random() - 0.5);
  const colors = r.colors;
  grid.innerHTML = shuffled.map((opt, i) =>
    `<button class="bubble" style="background:${colors[i % colors.length]};color:white;" onclick="popBubble(this,'${opt}','${r.correct}')">${opt}</button>`
  ).join('');
}

function popBubble(btn, chosen, correct) {
  const btns = document.querySelectorAll('#bubbleGrid .bubble');
  btns.forEach(b => b.disabled = true);
  if (chosen === correct) {
    btn.classList.add('correct-bubble');
    bubbleScore++;
    updateScore(1);
    markDone('bubble-' + bubbleRound);
    setTimeout(() => { bubbleRound++; renderBubbleRound(); }, 800);
  } else {
    btn.classList.add('wrong-bubble');
    btns.forEach(b => { if (b.textContent === correct) b.classList.add('correct-bubble'); });
    setTimeout(() => { bubbleRound++; renderBubbleRound(); }, 1200);
  }
}

// --- GAME 3: Classroom Detective ---
const DETECTIVE_QUESTIONS = [
  { q: 'Look at the classroom. Is there an apple on the teacher\'s desk?', a: true, fb: 'Yes! There is a red apple on the teacher\'s desk. 🍎' },
  { q: 'Are there any students in the classroom?', a: false, fb: 'The classroom appears empty — there are no students visible!' },
  { q: 'Is there a clock on the wall?', a: true, fb: 'Yes! There is a clock above the blackboard. 🕐' },
  { q: 'Are there two windows in the classroom?', a: true, fb: 'Correct! There are two windows — one on the left and one on the right.' },
  { q: 'Is there a globe in the classroom?', a: true, fb: 'Yes! There is a globe near the right wall.' },
  { q: 'Are there five student desks?', a: false, fb: 'No! There are only THREE student desks in the classroom.' },
];

let detectiveQ = 0;
let detectiveScore = 0;

function buildDetectiveGame() {
  renderDetectiveQ();
}

function renderDetectiveQ() {
  if (detectiveQ >= DETECTIVE_QUESTIONS.length) {
    document.getElementById('detectiveArea').innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:3rem;">🕵️</div>
        <h3 style="font-family:var(--font-title);color:var(--primary);">Case Solved!</h3>
        <p>You got <strong>${detectiveScore}/${DETECTIVE_QUESTIONS.length}</strong> questions right!</p>
        <button class="btn btn-primary" onclick="restartDetective()">🔄 Play Again</button>
      </div>`;
    return;
  }
  const q = DETECTIVE_QUESTIONS[detectiveQ];
  document.getElementById('detectiveArea').innerHTML = `
    <div class="detective-question">${q.q}</div>
    <p style="text-align:center;font-size:0.85rem;color:#888;margin-bottom:12px;">Look at the classroom scene above!</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button class="tf-btn true-btn" onclick="answerDetective(true)">✅ YES</button>
      <button class="tf-btn false-btn" onclick="answerDetective(false)">❌ NO</button>
    </div>
    <div id="detectiveFb" class="feedback"></div>
  `;
}

function answerDetective(ans) {
  const q = DETECTIVE_QUESTIONS[detectiveQ];
  const fb = document.getElementById('detectiveFb');
  const correct = ans === q.a;
  if (correct) detectiveScore++;
  fb.className = `feedback show ${correct ? 'correct-fb' : 'wrong-fb'}`;
  fb.innerHTML = `${correct ? '✅' : '❌'} ${q.fb}`;
  document.querySelectorAll('#detectiveArea .tf-btn').forEach(b => b.disabled = true);
  setTimeout(() => { detectiveQ++; renderDetectiveQ(); }, 1500);
  if (correct) { updateScore(1); markDone('detective-' + detectiveQ); }
}

function restartDetective() { detectiveQ = 0; detectiveScore = 0; renderDetectiveQ(); }

// --- GAME 4: Fill the Scene (drag & select) ---
const SCENE_FILL = [
  { id: 'sf1', context: 'kitchen', sentence: 'There ___ 2 bananas on the table.', correct: 'are', options: ['is', 'are'] },
  { id: 'sf2', context: 'bedroom', sentence: 'There ___ a teddy bear on the floor.', correct: 'is', options: ['is', 'are'] },
  { id: 'sf3', context: 'zoo', sentence: 'There ___ 2 monkeys in the tree.', correct: 'are', options: ['is', 'are'] },
  { id: 'sf4', context: 'kitchen', sentence: 'There ___ a bowl on the table.', correct: 'is', options: ['is', 'are'] },
  { id: 'sf5', context: 'bedroom', sentence: 'There ___ a car on the floor.', correct: 'is', options: ['is', 'are'] },
  { id: 'sf6', context: 'zoo', sentence: 'There ___ 2 lions in the cage.', correct: 'are', options: ['is', 'are'] },
];

let sceneFillScore = 0;
let sfCurrent = 0;

function buildSceneFillGame() {
  renderSceneFill();
}

function renderSceneFill() {
  if (sfCurrent >= SCENE_FILL.length) {
    document.getElementById('sceneFillArea').innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:3rem;">🏆</div>
        <h3 style="font-family:var(--font-title);color:var(--primary);">Finished!</h3>
        <p>You got <strong>${sceneFillScore}/${SCENE_FILL.length}</strong> correct!</p>
        <button class="btn btn-primary" onclick="restartSceneFill()">🔄 Play Again</button>
      </div>`;
    return;
  }
  const sf = SCENE_FILL[sfCurrent];
  document.getElementById('sceneFillArea').innerHTML = `
    <p style="font-size:1.1rem;font-weight:700;margin-bottom:12px;text-align:center;">${sf.sentence}</p>
    <p style="font-size:0.85rem;color:#888;text-align:center;margin-bottom:12px;">Look at the <strong>${sf.context}</strong> scene and choose:</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      ${sf.options.map(o => `<button class="mcq-option" onclick="checkSceneFill('${o}','${sf.correct}')" style="font-size:1.2rem;padding:12px 32px;">${o.toUpperCase()}</button>`).join('')}
    </div>
    <div id="sfFb" class="feedback"></div>
  `;
}

function checkSceneFill(chosen, correct) {
  const isCorrect = chosen === correct;
  const fb = document.getElementById('sfFb');
  fb.className = `feedback show ${isCorrect ? 'correct-fb' : 'wrong-fb'}`;
  fb.innerHTML = `${isCorrect ? '✅ Correct!' : `❌ The correct answer is: <strong>${correct.toUpperCase()}</strong>`}`;
  document.querySelectorAll('#sceneFillArea .mcq-option').forEach(b => b.disabled = true);
  if (isCorrect) { sceneFillScore++; updateScore(1); markDone('sf-' + sfCurrent); }
  setTimeout(() => { sfCurrent++; renderSceneFill(); }, 1000);
}

function restartSceneFill() { sfCurrent = 0; sceneFillScore = 0; renderSceneFill(); }

// =========================================================
// FINAL QUIZ
// =========================================================
const QUIZ_KEY = 'tita_quiz_done';
const QUIZ_RESULTS_KEY = 'tita_quiz_results';

const QUIZ_QUESTIONS = [
  { type: 'mcq', q: '_____ a cat on the sofa.', options: ['There are', 'There is', 'Is there', 'Are there'], correct: 1 },
  { type: 'mcq', q: '_____ five books on the shelf.', options: ['There is', 'Is there', 'There are', 'Are there'], correct: 2 },
  { type: 'fill', q: '_____ any water in the glass?', answer: 'Is there', hint: 'water = uncountable → Is there' },
  { type: 'mcq', q: 'Answer: "Is there a dog?" → "Yes, _____ ."', options: ['there are', 'there is', 'is there', 'are there'], correct: 1 },
  { type: 'fill', q: 'There _____ not any apples on the table.', answer: 'are', hint: 'apples = plural → are' },
  { type: 'mcq', q: '"How many chairs _____ in the room?"', options: ['there is', 'is there', 'are there', 'there are'], correct: 2 },
  { type: 'mcq', q: 'The cat is _____ the sofa. (= on top)', options: ['under', 'on', 'between', 'in front of'], correct: 1 },
  { type: 'fill', q: 'There _____ a lamp next to the bed.', answer: 'is', hint: 'a lamp = singular → is' },
  { type: 'mcq', q: 'Which is CORRECT?', options: ['There are a cat.', 'There is cats.', 'There is a cat.', 'There are one cat.'], correct: 2 },
  { type: 'mcq', q: '_____ three elephants at the zoo.', options: ['There is', 'Is there', 'There are', 'Are there'], correct: 2 },
  { type: 'fill', q: 'There _____ some milk in the fridge.', answer: 'is', hint: 'milk = uncountable → is' },
  { type: 'mcq', q: '"Are there any flowers?" → "No, _____ ."', options: ['there isn\'t', 'there aren\'t', 'there is', 'there are'], correct: 1 },
  { type: 'fill', q: '_____ many birds in the tree.', answer: 'There are', hint: 'birds = plural → There are' },
  { type: 'mcq', q: 'The ball is _____ the desk. (= below)', options: ['on', 'in', 'under', 'next to'], correct: 2 },
  { type: 'writing', q: 'Write ONE sentence about your classroom using "There is" or "There are".', placeholder: 'E.g. There is a whiteboard in my classroom.' },
];

let quizAnswers = {};

function loadQuiz() {
  const done = localStorage.getItem(QUIZ_KEY);
  const results = localStorage.getItem(QUIZ_RESULTS_KEY);
  const container = document.getElementById('quizContainer');
  if (!container) return;

  if (done && results && !STATE.teacherMode) {
    showQuizResults(JSON.parse(results), container);
    return;
  }

  // Show quiz intro
  container.innerHTML = `
    <div class="quiz-intro">
      <h3>🏆 Final Quiz</h3>
      <p>This quiz has <strong>15 questions</strong> and can only be taken <strong>once</strong>.</p>
      <p>Take your time. Read each question carefully. Good luck! 🍀</p>
      <div class="es-tip">Este examen final solo se puede enviar una vez. ¡Hazlo con calma!</div>
      <button class="btn btn-primary mt-16" onclick="startQuiz()">🚀 Start Quiz</button>
    </div>
    <div class="teacher-reset-area ${STATE.teacherMode ? 'show' : ''}">
      <hr style="margin:16px 0;">
      <p style="text-align:center;font-size:0.9rem;color:var(--text-light);">Teacher: Reset quiz for this device</p>
      <div style="text-align:center;">
        <button class="btn btn-danger btn-sm" onclick="resetQuiz()">🗑 Reset Quiz</button>
      </div>
    </div>
  `;
}

function startQuiz() {
  const container = document.getElementById('quizContainer');
  let html = '<form id="quizForm" onsubmit="submitQuiz(event)">';
  QUIZ_QUESTIONS.forEach((q, i) => {
    html += `<div class="quiz-question" id="qq-${i}">
      <div class="quiz-question-num">Question ${i + 1} of ${QUIZ_QUESTIONS.length}</div>
      <div class="quiz-question-text">${q.q}</div>`;
    if (q.type === 'mcq') {
      html += `<div class="mcq-options">
        ${q.options.map((opt, oi) => `<label style="cursor:pointer;"><input type="radio" name="q${i}" value="${oi}" style="margin-right:6px;"> ${opt}</label>`).join('')}
      </div>`;
    } else if (q.type === 'fill') {
      html += `<input class="blank-input" name="q${i}" placeholder="Type your answer..." autocomplete="off">
        <div class="es-tip">${q.hint}</div>`;
    } else if (q.type === 'writing') {
      html += `<textarea class="writing-area" name="q${i}" placeholder="${q.placeholder}" style="min-height:70px;"></textarea>`;
    }
    html += '</div>';
  });
  html += `<div style="text-align:center;margin-top:24px;">
    <button type="submit" class="btn btn-primary">📤 Submit Quiz</button>
  </div></form>`;
  container.innerHTML = html;
}

function submitQuiz(e) {
  e.preventDefault();
  const form = document.getElementById('quizForm');
  let score = 0;
  const results = [];

  QUIZ_QUESTIONS.forEach((q, i) => {
    let userAnswer = '';
    let correct = false;
    let correctAnswer = '';

    if (q.type === 'mcq') {
      const sel = form.querySelector(`input[name="q${i}"]:checked`);
      userAnswer = sel ? q.options[parseInt(sel.value)] : '(no answer)';
      correct = sel && parseInt(sel.value) === q.correct;
      correctAnswer = q.options[q.correct];
    } else if (q.type === 'fill') {
      userAnswer = form.querySelector(`[name="q${i}"]`).value.trim();
      correct = userAnswer.toLowerCase() === q.answer.toLowerCase();
      correctAnswer = q.answer;
    } else if (q.type === 'writing') {
      userAnswer = form.querySelector(`[name="q${i}"]`).value.trim();
      correct = userAnswer.length > 5 && (userAnswer.toLowerCase().includes('there is') || userAnswer.toLowerCase().includes('there are'));
      correctAnswer = 'Any sentence with "There is" or "There are"';
    }

    if (correct) score++;
    results.push({ question: q.q, userAnswer, correctAnswer, correct });
  });

  localStorage.setItem(QUIZ_KEY, 'true');
  localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));
  updateScore(score);
  markDone('finalquiz');
  if (score >= 12) triggerCelebration();
  showQuizResults(results, document.getElementById('quizContainer'));
}

function showQuizResults(results, container) {
  const score = results.filter(r => r.correct).length;
  const pct = Math.round((score / results.length) * 100);
  const emoji = pct >= 80 ? '🌟' : pct >= 60 ? '😊' : '📚';
  const msg = pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job! Keep practising.' : 'Keep studying — you can do it!';

  // Suggestions based on wrong answers
  const wrongTopics = [];
  results.forEach((r, i) => {
    if (!r.correct) {
      const q = QUIZ_QUESTIONS[i];
      if (q.type === 'mcq' && i < 3) wrongTopics.push('Basic There is/There are');
      if (i === 3 || i === 11) wrongTopics.push('Short answers');
      if (i === 4 || i === 7 || i === 10 || i === 12) wrongTopics.push('Fill in the blank practice');
      if (i === 6 || i === 13) wrongTopics.push('Prepositions of place');
      if (i === 8) wrongTopics.push('Common mistakes section');
    }
  });
  const unique = [...new Set(wrongTopics)];

  let html = `
    <div class="quiz-results">
      <div class="quiz-score-circle">
        <span class="score-num">${score}</span>
        <span class="score-total">/ ${results.length}</span>
      </div>
      <h3 style="font-family:var(--font-title);color:var(--primary);font-size:1.5rem;">${emoji} ${msg}</h3>
      <p style="color:var(--text-light);margin:8px 0;">${pct}% correct</p>
      <div class="divider"></div>
      <div style="text-align:left;margin-top:16px;">
  `;
  results.forEach((r, i) => {
    html += `<div class="result-item ${r.correct ? 'r-correct' : 'r-wrong'}">
      <span class="result-icon">${r.correct ? '✅' : '❌'}</span>
      <div>
        <strong>Q${i + 1}:</strong> ${r.question}<br>
        ${!r.correct ? `Your answer: <em>${r.userAnswer}</em> | Correct: <strong>${r.correctAnswer}</strong>` : `Your answer: <em>${r.userAnswer}</em>`}
      </div>
    </div>`;
  });
  html += '</div>';
  if (unique.length > 0) {
    html += `<div class="suggestions-box">
      <h4>📝 Review Suggestions:</h4>
      <ul style="list-style:none;">${unique.map(t => `<li style="padding:4px 0;">→ Revisit: <strong>${t}</strong></li>`).join('')}</ul>
    </div>`;
  }
  html += `</div>
    <div class="teacher-reset-area ${STATE.teacherMode ? 'show' : ''}" style="margin-top:16px;text-align:center;">
      <button class="btn btn-danger btn-sm" onclick="resetQuiz()">🗑 Reset Quiz (Teacher)</button>
    </div>`;
  container.innerHTML = html;
}

function resetQuiz() {
  if (!STATE.teacherMode) {
    alert('Teacher mode required!');
    return;
  }
  localStorage.removeItem(QUIZ_KEY);
  localStorage.removeItem(QUIZ_RESULTS_KEY);
  loadQuiz();
}

// =========================================================
// CELEBRATION
// =========================================================
function triggerCelebration() {
  const cel = document.getElementById('celebration');
  const colors = ['#FF6B6B','#FFD166','#06D6A0','#118AB2','#9D4EDD','#FF9F1C'];
  for (let i = 0; i < 60; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    cel.appendChild(conf);
  }
  setTimeout(() => { cel.innerHTML = ''; }, 3500);
}

// =========================================================
// INIT
// =========================================================
// =========================================================
// REGISTRO DE ESTUDIANTE
// =========================================================
async function registerStudent() {
  const nameInput = document.getElementById('studentNameInput');
  const errorEl = document.getElementById('loginError');
  const loadingEl = document.getElementById('loginLoading');
  const startBtn = document.getElementById('startBtn');

  const name = nameInput.value.trim();

  // Validación
  if (!name) {
    errorEl.textContent = '⚠️ Please enter your name! / ¡Escribe tu nombre!';
    errorEl.style.display = 'block';
    nameInput.focus();
    return;
  }
  if (name.length < 2) {
    errorEl.textContent = '⚠️ Name too short! / ¡Nombre muy corto!';
    errorEl.style.display = 'block';
    return;
  }

  // Mostrar loading
  errorEl.style.display = 'none';
  loadingEl.style.display = 'block';
  startBtn.disabled = true;

  try {
    let studentId = localStorage.getItem('tita_student_id');

    if (!studentId) {
      if (db) {
        // Guardar en Supabase
        const { data, error } = await db
          .from('students')
          .insert({ name: name })
          .select()
          .single();

        if (error) throw error;

        studentId = data.id;
      } else {
        // Si no hay Supabase, generar ID local
        studentId = 'local-' + Date.now();
      }

      localStorage.setItem('tita_student_id', studentId);
      localStorage.setItem('tita_student_name', name);
    }

    STATE.studentName = name;

    // Ocultar pantalla de login con animación suave
    const loginScreen = document.getElementById('loginScreen');
    loginScreen.style.transition = 'opacity 0.5s ease';
    loginScreen.style.opacity = '0';
    setTimeout(() => { loginScreen.style.display = 'none'; }, 500);

  } catch (err) {
    console.error('Error al registrar:', err);
    // Si falla Supabase, guardar solo localmente
    const studentId = 'local-' + Date.now();
    localStorage.setItem('tita_student_id', studentId);
    localStorage.setItem('tita_student_name', name);
    STATE.studentName = name;
    document.getElementById('loginScreen').style.display = 'none';
  } finally {
    loadingEl.style.display = 'none';
    startBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Supabase
  initSupabase();

  // Verificar si el estudiante ya se registró antes
  const savedId = localStorage.getItem('tita_student_id');
  const savedName = localStorage.getItem('tita_student_name');
  if (savedId && savedName) {
    document.getElementById('loginScreen').style.display = 'none';
    STATE.studentName = savedName;
    // Actualizar saludo si quieres mostrar el nombre
  }

  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => showSection(tab.dataset.section));
  });

  // Teacher button
  document.getElementById('teacherBtn').addEventListener('click', toggleTeacherMode);

  // Score
  renderScoreBadge();
  updateProgressBar();

  // Build exercises
  buildFillExercises();
  buildMCQExercises();
  buildTFExercises();
  buildMatchingExercises();
  buildImageExercises();
  buildWritingExercises();
  buildUnscrambleExercises();
  buildFlashcardGame();
  buildBubbleGame();
  buildDetectiveGame();
  buildSceneFillGame();

  // Flashcard click
  const fci = document.getElementById('flashcardInner');
  if (fci) fci.addEventListener('click', flipCard);

  // Quiz tab
  document.querySelector('.nav-tab[data-section="quiz"]').addEventListener('click', () => {
    setTimeout(loadQuiz, 100);
  });

  // Show first section
  showSection('learn');
});

  // Teacher button
  document.getElementById('teacherBtn').addEventListener('click', toggleTeacherMode);

  // Score
  renderScoreBadge();
  updateProgressBar();

  // Build exercises
  buildFillExercises();
  buildMCQExercises();
  buildTFExercises();
  buildMatchingExercises();
  buildImageExercises();
  buildWritingExercises();
  buildUnscrambleExercises();
  buildFlashcardGame();
  buildBubbleGame();
  buildDetectiveGame();
  buildSceneFillGame();

  // Flashcard click
  const fci = document.getElementById('flashcardInner');
  if (fci) fci.addEventListener('click', flipCard);

  // Quiz tab
  document.querySelector('.nav-tab[data-section="quiz"]').addEventListener('click', () => {
    setTimeout(loadQuiz, 100);
  });

  // Show first section
  showSection('learn');
});
