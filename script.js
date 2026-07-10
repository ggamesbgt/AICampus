let faqData = [];

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const quickButtons = document.querySelectorAll('.quick-questions button');

fetch('data/faq.json')
  .then(response => response.json())
  .then(data => {
    faqData = data;
  })
  .catch(() => {
    addMessage('Maaf, data FAQ belum dapat dimuat. Silakan coba beberapa saat lagi.', 'bot');
  });

chatForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const question = userInput.value.trim();

  if (!question) return;

  addMessage(question, 'user');
  userInput.value = '';

  setTimeout(() => {
    const answer = findAnswer(question);
    addMessage(answer, 'bot');
  }, 400);
});

quickButtons.forEach(button => {
  button.addEventListener('click', () => {
    const question = button.getAttribute('data-question');
    userInput.value = question;
    chatForm.dispatchEvent(new Event('submit'));
  });
});

function addMessage(text, sender) {
  const message = document.createElement('div');
  message.classList.add('message');
  message.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function findAnswer(question) {
  const normalizedQuestion = normalizeText(question);
  let bestMatch = null;
  let highestScore = 0;

  faqData.forEach(item => {
    const combinedText = normalizeText(`${item.question} ${item.keywords.join(' ')}`);
    const score = calculateScore(normalizedQuestion, combinedText);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  });

  if (bestMatch && highestScore > 0) {
    return bestMatch.answer;
  }

  return 'Maaf, saya belum menemukan jawaban yang sesuai. Silakan hubungi petugas helpdesk kampus atau gunakan kata kunci lain seperti KRS, LMS, email, WiFi, pembayaran, atau surat aktif kuliah.';
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function calculateScore(question, faqText) {
  const words = question.split(' ');
  let score = 0;

  words.forEach(word => {
    if (word.length > 2 && faqText.includes(word)) {
      score += 1;
    }
  });

  return score;
}
