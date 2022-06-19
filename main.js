class Answer {
  answerText = "";
  selected = false;
  constructor(answerText, selected = false) {
    this.answerText = answerText;
    this.selected = selected;
  }
}
class Quiz {
  id;
  taken;
  questions;
  score;
  maxScore;

  constructor(questions, score, maxScore) {
    this.questions = questions;
    this.score = score;
    this.maxScore = maxScore;
    this.id = uuidv4();
    this.taken = Date.now();
  }
}
class Question {
  constructor(text) {
    this.questionText = text;
    this.answers = [];
    return this;
  }

  addAnswer(answer) {
    if (answer.selected == undefined) return this;
    if (answer.answerText == undefined) return this;
    this.answers.push(answer);
    return this;
  }
}
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}
const questions = [];
const LOCAL_NAME = "willyquizes";
function addQuizToLocalStorage(quiz) {
  upsertLocalStorage(LOCAL_NAME);
  const quizes = JSON.parse(localStorage.getItem(LOCAL_NAME));
  quizes.push(quiz);
  localStorage.setItem(LOCAL_NAME, JSON.stringify(quizes));
}

function upsertLocalStorage(name) {
  if (localStorage.getItem(LOCAL_NAME) == null) {
    localStorage.setItem(LOCAL_NAME, "[]");
  }
}

function doSendQuiz(url, quiz, quiet = false) {
  fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(quiz),
  })
    .then((res) => {
      tryRemoveQuizFromLocal(quiz.id);
      if (quiet) return;
      alert("sent succesfully");
    })
    .catch((e) => {
      if (quiet) return;
      addQuizToLocalStorage(quiz);
      alert(
        "something went wrong, maybe server is offline. Added quiz to local storage so you can reload the page :)"
      );
    })
    .finally(() => {
      healthCheck();
      checkLocalStorage();
      questions.length = 0;
      document.getElementsByName("addedQuestions")[0].innerHTML = "";
    });
}

function sendQuiz() {
  const score = document.getElementsByName("score")[0].value;
  if (score == "" || score == undefined) {
    alert("fill your score");
    return;
  }
  if (questions.length == 0) {
    alert("add at least one question");
    return;
  }
  const quiz = new Quiz(questions, score, 50);
  url = document.getElementsByName("URL")[0].value;
  if (url == "") {
    alert("fill url pls");
  }
  doSendQuiz(url, quiz);
}

function clearInput() {
  const questionText = document.getElementsByName("questionText")[0];
  const answers = [...document.getElementsByName("answer")];
  const selected = [...document.getElementsByName("selected")];

  questionText.value = "";
  answers.forEach((a) => (a.value = ""));
  selected.forEach((s) => (s.checked = false));
}

function addQuestion() {
  const questionText = document.getElementsByName("questionText")[0].value;
  const answers = [...document.getElementsByName("answer")];
  const selected = [...document.getElementsByName("selected")];
  const question = new Question(questionText);

  const oneSelected = selected.find((s) => s.checked);
  if (oneSelected == undefined) {
    alert("select at least one answer");
    return;
  }

  answers
    .map((answer, index) => new Answer(answer.value, selected[index].checked))
    .forEach((answer) => question.addAnswer(answer));

  questions.push(question);
  addQuestionDiv(question);
  clearInput();
}

function addQuestionDiv(question) {
  const div = document.createElement("div");
  div.classList.add("addedQuestion");
  div.innerHTML = `
    <h2>question: ${question.questionText}</h2>
    <ol type="A">
      <li>${question.answers[0].answerText} ${
    question.answers[0].selected ? "<<<" : ""
  }</li>
      <li>${question.answers[1].answerText} ${
    question.answers[1].selected ? "<<<" : ""
  }</li>
      <li>${question.answers[2].answerText} ${
    question.answers[2].selected ? "<<<" : ""
  }</li>
      <li>${question.answers[3].answerText} ${
    question.answers[3].selected ? "<<<" : ""
  }</li>
    </ol>
    `;
  document.getElementsByName("addedQuestions")[0].appendChild(div);
}
function changeStatus(code) {
  const status = document.getElementsByName("status")[0];
  if (code == 200) {
    status.innerHTML = "ONLINE";
  } else {
    status.innerHTML = "OFFLINE";
  }
}
function healthCheck() {
  const url = document.getElementsByName("URL")[0].value;
  changeStatus(0);
  fetch(url)
    .then((res) => res.status)
    .then(changeStatus)
    .catch((e) => changeStatus);
}

function checkLocalStorage() {
  const localDiv = document.getElementsByName("localQuizzes")[0];
  const quizes = JSON.parse(localStorage.getItem(LOCAL_NAME));
  localDiv.innerText = quizes.length;
}

function trySendLocalQuizzes() {
  upsertLocalStorage();
  const quizes = [...JSON.parse(localStorage.getItem(LOCAL_NAME))];
  const url = document.getElementsByName("URL")[0].value;
  quizes.forEach((quiz) => {
    doSendQuiz(url, quiz, true);
  });
}

function tryRemoveQuizFromLocal(id) {
  upsertLocalStorage();
  const quizes = [...JSON.parse(localStorage.getItem(LOCAL_NAME))];
  const filtered = quizes.filter((quiz) => quiz.id != id);
  localStorage.setItem(LOCAL_NAME, JSON.stringify(filtered));
}

window.onload = () => {
  document.getElementsByName("URL")[0].value =
    "https://9d39-2a02-a31d-853d-9e80-bdd8-5705-3847-df59.eu.ngrok.io/willy/quiz";
  healthCheck();
  checkLocalStorage();
};
