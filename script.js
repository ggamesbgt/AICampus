// ============================================================
// UEU AI Helpdesk - script.js
// Versi kompatibel dengan index.html:
// - chatMessages
// - userInput
// - chatForm
// - quick questions
// Membaca data/index.json lalu seluruh knowledge JSON
// ============================================================

let knowledge = [];

// ------------------------------------------------------------
// 1. Load knowledge base dari data/index.json
// ------------------------------------------------------------
async function loadKnowledge() {
  try {
    const indexResponse = await fetch("data/index.json");

    if (!indexResponse.ok) {
      throw new Error("Gagal membaca data/index.json");
    }

    const fileList = await indexResponse.json();

    const allData = await Promise.all(
      fileList.map(async (fileName) => {
        try {
          const response = await fetch("data/" + fileName);

          if (!response.ok) {
            console.warn("File knowledge tidak ditemukan:", fileName);
            return [];
          }

          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (err) {
          console.warn("Gagal membaca file:", fileName, err);
          return [];
        }
      })
    );

    knowledge = allData.flat();

    console.log("Knowledge loaded:", knowledge.length, "items");

    addBotMessage(
      `Knowledge base berhasil dimuat: <strong>${knowledge.length}</strong> item. Silakan ajukan pertanyaan seputar pedoman akademik, pembimbingan akademik, konseling, kemahasiswaan, atau layanan kampus.`
    );

  } catch (error) {
    console.error(error);
    addBotMessage(
      "Maaf, knowledge base belum berhasil dimuat. Pastikan file <strong>data/index.json</strong> dan seluruh file JSON sudah berada di folder <strong>data</strong>."
    );
  }
}

// ------------------------------------------------------------
// 2. Normalisasi teks
// ------------------------------------------------------------
function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\sà-ž]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------------------------------------------
// 3. Hitung skor kecocokan
// ------------------------------------------------------------
function calculateScore(userQuestion, item) {
  const q = normalizeText(userQuestion);
  const words = q.split(" ").filter(w => w.length > 2);

  const itemQuestions = Array.isArray(item.pertanyaan)
    ? item.pertanyaan.join(" ")
    : String(item.pertanyaan || "");

  const searchableText = normalizeText([
    item.kategori || "",
    item.topik || "",
    itemQuestions,
    item.jawaban || "",
    item.sumber || ""
  ].join(" "));

  let score = 0;

  if (searchableText.includes(q)) {
    score += 50;
  }

  words.forEach(word => {
    if (searchableText.includes(word)) score += 10;
  });

  const questionText = normalizeText(itemQuestions);
  words.forEach(word => {
    if (questionText.includes(word)) score += 15;
  });

  const topicText = normalizeText((item.kategori || "") + " " + (item.topik || ""));
  words.forEach(word => {
    if (topicText.includes(word)) score += 10;
  });

  return score;
}

// ------------------------------------------------------------
// 4. Cari jawaban terbaik
// ------------------------------------------------------------
function searchKnowledge(userQuestion) {
  if (!knowledge || knowledge.length === 0) return null;

  const results = knowledge
    .map(item => ({
      item,
      score: calculateScore(userQuestion, item)
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);

  if (results.length === 0) return null;
  if (results[0].score < 20) return null;

  console.log("Best result:", results[0]);

  return results[0].item;
}

// ------------------------------------------------------------
// 5. Format jawaban
// ------------------------------------------------------------
function formatAnswer(item) {
  let answer = item.jawaban || "Maaf, data jawaban belum tersedia.";

  let sourceInfo = "";

  if (item.sumber) {
    sourceInfo += `<br><br><small><strong>Sumber:</strong> ${item.sumber}`;
  }

  if (item.halaman) {
    sourceInfo += `, halaman ${item.halaman}`;
  }

  if (sourceInfo) {
    sourceInfo += `</small>`;
  }

  return answer + sourceInfo;
}

// ------------------------------------------------------------
// 6. Kirim pesan
// ------------------------------------------------------------
function sendMessage(messageFromButton = null) {
  const input = document.getElementById("userInput");
  const message = messageFromButton || (input ? input.value.trim() : "");

  if (!message) return;

  addUserMessage(message);

  if (input) input.value = "";

  showTyping();

  setTimeout(() => {
    removeTyping();

    const result = searchKnowledge(message);

    if (result) {
      addBotMessage(formatAnswer(result));
    } else {
      addBotMessage(
        "Maaf, saya belum menemukan jawaban yang sesuai di knowledge base. Coba gunakan kata kunci lain, misalnya: <strong>KRS</strong>, <strong>cuti akademik</strong>, <strong>SKS</strong>, <strong>UTS</strong>, <strong>UAS</strong>, <strong>konseling</strong>, <strong>pembimbing akademik</strong>, atau <strong>kemahasiswaan</strong>."
      );
    }
  }, 500);
}

// ------------------------------------------------------------
// 7. Tambah pesan user
// ------------------------------------------------------------
function addUserMessage(message) {
  const chatBox = document.getElementById("chatMessages");
  if (!chatBox) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "message user-message";
  messageDiv.textContent = message;

  chatBox.appendChild(messageDiv);
  scrollToBottom();
}

// ------------------------------------------------------------
// 8. Tambah pesan bot
// ------------------------------------------------------------
function addBotMessage(message) {
  const chatBox = document.getElementById("chatMessages");
  if (!chatBox) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "message bot-message";
  messageDiv.innerHTML = message;

  chatBox.appendChild(messageDiv);
  scrollToBottom();
}

// ------------------------------------------------------------
// 9. Typing indicator
// ------------------------------------------------------------
function showTyping() {
  const chatBox = document.getElementById("chatMessages");
  if (!chatBox) return;

  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot-message typing";
  typingDiv.id = "typing-indicator";
  typingDiv.textContent = "Helpdesk UEU sedang mengetik...";

  chatBox.appendChild(typingDiv);
  scrollToBottom();
}

function removeTyping() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

// ------------------------------------------------------------
// 10. Scroll otomatis
// ------------------------------------------------------------
function scrollToBottom() {
  const chatBox = document.getElementById("chatMessages");
  if (chatBox) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// ------------------------------------------------------------
// 11. Event listener
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chatForm");
  const quickButtons = document.querySelectorAll(".quick-questions button");

  if (form) {
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      sendMessage();
    });
  }

  quickButtons.forEach(button => {
    button.addEventListener("click", () => {
      const question = button.getAttribute("data-question");
      sendMessage(question);
    });
  });

  loadKnowledge();
});
