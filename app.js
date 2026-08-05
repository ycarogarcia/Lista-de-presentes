import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, set } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

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

const PIX_KEY = "016.746.674-77";

const cards = Array.from(document.querySelectorAll(".card[data-key]"));
const modal = document.getElementById("reserve-modal");
const form = document.getElementById("reserve-form");
const nameInput = document.getElementById("reserve-name");
const modalItemName = document.getElementById("modal-item-name");
const modalError = document.getElementById("modal-error");
const modalCancel = document.getElementById("modal-cancel");

const paymentStep = document.getElementById("payment-step");
const paymentItemName = document.getElementById("payment-item-name");
const btnPix = document.getElementById("btn-pix");
const btnCard = document.getElementById("btn-card");
const pixBox = document.getElementById("pix-box");
const pixKeyEl = document.getElementById("pix-key");
const btnCopyPix = document.getElementById("btn-copy-pix");
const copyFeedback = document.getElementById("copy-feedback");
const paymentClose = document.getElementById("payment-close");

pixKeyEl.textContent = PIX_KEY;

let pendingKey = null;
let pendingMlLink = null;

function renderReservations(data) {
  cards.forEach((card) => {
    const key = card.dataset.key;
    const btn = card.querySelector(".btn-gift");
    const badge = card.querySelector(".badge-reserved");
    const entry = data ? data[key] : null;

    if (entry) {
      card.classList.add("is-reserved");
      badge.hidden = false;
      btn.textContent = "Reservado";
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
    pendingMlLink = card.dataset.mlLink || null;
    modalItemName.textContent = card.querySelector("h3").textContent;
    modalError.hidden = true;
    nameInput.value = "";
    form.hidden = false;
    paymentStep.hidden = true;
    modal.showModal();
    nameInput.focus();
  });
});

modalCancel.addEventListener("click", () => {
  modal.close();
});

modal.addEventListener("close", () => {
  form.hidden = false;
  paymentStep.hidden = true;
  pixBox.hidden = true;
  copyFeedback.hidden = true;
  pendingKey = null;
  pendingMlLink = null;
});

btnPix.addEventListener("click", () => {
  pixBox.hidden = false;
});

btnCopyPix.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(PIX_KEY);
    copyFeedback.hidden = false;
    setTimeout(() => { copyFeedback.hidden = true; }, 2500);
  } catch (err) {
    // clipboard indisponivel; a chave ja esta visivel na tela para copiar manualmente
  }
});

btnCard.addEventListener("click", () => {
  if (pendingMlLink) {
    window.open(pendingMlLink, "_blank", "noopener");
  }
});

paymentClose.addEventListener("click", () => {
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
        return { reservado: true, timestamp: Date.now() };
      }
      return; // aborta: alguem chegou primeiro
    });

    if (result.committed) {
      // guarda o nome num local separado, nao publico (so visivel no console do Firebase)
      try {
        await set(ref(db, `reservas_nomes/${pendingKey}`), { nome });
      } catch (nameErr) {
        // reserva ja valeu; falha aqui nao deve travar o usuario
      }
      paymentItemName.textContent = modalItemName.textContent;
      btnCard.hidden = !pendingMlLink;
      pixBox.hidden = true;
      copyFeedback.hidden = true;
      form.hidden = true;
      paymentStep.hidden = false;
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
