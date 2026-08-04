import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGJNU1l2M-NzruuWArpTrW9WLxovKmlAU",
  authDomain: "presentes-para-o-bebe.firebaseapp.com",
  databaseURL: "https://presentes-para-o-bebe-default-rtdb.firebaseio.com",
  projectId: "presentes-para-o-bebe",
  storageBucket: "presentes-para-o-bebe.firebasestorage.app",
  messagingSenderId: "95846193440",
  appId: "1:95846193440:web:0ad4ae126d769bd8fe1f45"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const reservasRef = ref(db, "reservas");

const cards = Array.from(document.querySelectorAll(".card[data-key]"));
const modal = document.getElementById("reserve-modal");
const form = document.getElementById("reserve-form");
const nameInput = document.getElementById("reserve-name");
const modalItemName = document.getElementById("modal-item-name");
const modalError = document.getElementById("modal-error");
const modalCancel = document.getElementById("modal-cancel");

let pendingKey = null;

function renderReservations(data) {
  cards.forEach((card) => {
    const key = card.dataset.key;
    const btn = card.querySelector(".btn-gift");
    const badge = card.querySelector(".badge-reserved");
    const entry = data ? data[key] : null;

    if (entry && typeof entry.nome === "string") {
      card.classList.add("is-reserved");
      badge.hidden = false;
      btn.textContent = `Reservado por ${entry.nome}`;
      btn.disabled = true;
    } else {
      card.classList.remove("is-reserved");
      badge.hidden = true;
      btn.textContent = "Quero presentear";
      btn.disabled = false;
    }
  });
}

onValue(reservasRef, (snapshot) => {
  renderReservations(snapshot.val());
});

cards.forEach((card) => {
  const btn = card.querySelector(".btn-gift");
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    pendingKey = card.dataset.key;
    modalItemName.textContent = card.querySelector("h3").textContent;
    modalError.hidden = true;
    nameInput.value = "";
    modal.showModal();
    nameInput.focus();
  });
});

modalCancel.addEventListener("click", () => {
  modal.close();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nome = nameInput.value.trim();
  if (!nome || !pendingKey) return;

  const confirmBtn = document.getElementById("modal-confirm");
  confirmBtn.disabled = true;

  try {
    const itemRef = ref(db, `reservas/${pendingKey}`);
    const result = await runTransaction(itemRef, (current) => {
      if (current === null) {
        return { nome, timestamp: Date.now() };
      }
      return; // aborta: alguem chegou primeiro
    });

    if (result.committed) {
      modal.close();
    } else {
      modalError.hidden = false;
    }
  } catch (err) {
    modalError.textContent = "Não foi possível confirmar agora. Tente novamente em instantes.";
    modalError.hidden = false;
  } finally {
    confirmBtn.disabled = false;
  }
});
