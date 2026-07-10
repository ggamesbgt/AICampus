// ============================================================
// Helpdesk UEU Chatbot - Knowledge Base Version
// Membaca data/index.json lalu memuat seluruh file JSON pengetahuan
// Cocok untuk GitHub Pages
// ============================================================

let knowledge = [];

// ------------------------------------------------------------
// 1. Load semua file knowledge dari data/index.json
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
                const response = await fetch("data/" + fileName);

                if (!response.ok) {
                    console.warn("File tidak ditemukan:", fileName);
                    return [];
                }

                return await response.json();
            })
        );

        knowledge = allData.flat();

        console.log("Knowledge loaded:", knowledge.length, "items");

        addBotMessage(
            "Halo, saya Helpdesk UEU. Silakan tanyakan informasi akademik, pedoman akademik, pembimbingan akademik, kemahasiswaan, konseling, atau layanan kampus lainnya."
        );

    } catch (error) {
        console.error(error);
        addBotMessage(
            "Maaf, knowledge base belum berhasil dimuat. Pastikan file data/index.json dan file JSON lain sudah berada di folder data."
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
// 3. Hitung skor kecocokan sederhana
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

    // Cocok kalimat utuh
    if (searchableText.includes(q)) {
        score += 50;
    }

    // Cocok kata per kata
    words.forEach(word => {
        if (searchableText.includes(word)) {
            score += 10;
        }
    });

    // Bonus jika cocok di daftar pertanyaan
    const questionText = normalizeText(itemQuestions);
    words.forEach(word => {
        if (questionText.includes(word)) {
            score += 15;
        }
    });

    // Bonus jika cocok pada topik/kategori
    const topicText = normalizeText((item.kategori || "") + " " + (item.topik || ""));
    words.forEach(word => {
        if (topicText.includes(word)) {
            score += 10;
        }
    });

    return score;
}

// ------------------------------------------------------------
// 4. Cari jawaban terbaik
// ------------------------------------------------------------
function searchKnowledge(userQuestion) {
    if (!knowledge || knowledge.length === 0) {
        return null;
    }

    const results = knowledge
        .map(item => ({
            item,
            score: calculateScore(userQuestion, item)
        }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);

    if (results.length === 0) {
        return null;
    }

    // Ambang batas agar jawaban tidak terlalu asal
    if (results[0].score < 20) {
        return null;
    }

    return results[0].item;
}

// ------------------------------------------------------------
// 5. Format jawaban bot
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
// 6. Kirim pesan user
// ------------------------------------------------------------
function sendMessage() {
    const input = document.getElementById("user-input");
    const message = input.value.trim();

    if (!message) return;

    addUserMessage(message);
    input.value = "";

    showTyping();

    setTimeout(() => {
        removeTyping();

        const result = searchKnowledge(message);

        if (result) {
            addBotMessage(formatAnswer(result));
        } else {
            addBotMessage(
                "Maaf, saya belum menemukan jawaban yang sesuai di knowledge base. Coba gunakan kata kunci lain, misalnya: KRS, cuti akademik, SKS, UTS, UAS, konseling, pembimbing akademik, atau kemahasiswaan."
            );
        }
    }, 500);
}

// ------------------------------------------------------------
// 7. Tambah bubble chat user
// ------------------------------------------------------------
function addUserMessage(message) {
    const chatBox = document.getElementById("chat-box");

    const messageDiv = document.createElement("div");
    messageDiv.className = "message user-message";
    messageDiv.textContent = message;

    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

// ------------------------------------------------------------
// 8. Tambah bubble chat bot
// ------------------------------------------------------------
function addBotMessage(message) {
    const chatBox = document.getElementById("chat-box");

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
    const chatBox = document.getElementById("chat-box");

    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message typing";
    typingDiv.id = "typing-indicator";
    typingDiv.textContent = "Helpdesk UEU sedang mengetik...";

    chatBox.appendChild(typingDiv);
    scrollToBottom();
}

function removeTyping() {
    const typing = document.getElementById("typing-indicator");
    if (typing) {
        typing.remove();
    }
}

// ------------------------------------------------------------
// 10. Scroll otomatis ke bawah
// ------------------------------------------------------------
function scrollToBottom() {
    const chatBox = document.getElementById("chat-box");
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ------------------------------------------------------------
// 11. Enter untuk kirim pesan
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    const button = document.getElementById("send-button");

    if (input) {
        input.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                sendMessage();
            }
        });
    }

    if (button) {
        button.addEventListener("click", sendMessage);
    }

    loadKnowledge();
});
