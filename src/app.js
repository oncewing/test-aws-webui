import { Amplify } from "aws-amplify";
import { signIn } from "aws-amplify/auth";

const el = (id) => document.getElementById(id);

const loginView = el("loginView");
const successView = el("successView");

const usernameInput = el("username");
const passwordInput = el("password");

const loginBtn = el("loginBtn");
const backBtn = el("backBtn");

const modalOverlay = el("modalOverlay");
const modalCloseBtn = el("modalCloseBtn");

async function initAmplify() {
  const res = await fetch("/amplify_outputs.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load amplify_outputs.json");
  const outputs = await res.json();
  Amplify.configure(outputs);
}

function showLoginView() {
  successView.classList.add("hidden");
  loginView.classList.remove("hidden");

  // 입력값 초기화(요구사항: 실패 후 팝업 닫으면 최초 화면)
  usernameInput.value = "";
  passwordInput.value = "";
  usernameInput.focus();
}

function showSuccessView() {
  loginView.classList.add("hidden");
  successView.classList.remove("hidden");
}

function openFailModal() {
  
  modalOverlay.classList.remove("hidden");
  modalCloseBtn.focus();
}

function closeFailModal() {
  modalOverlay.classList.add("hidden");
  showLoginView();
}

async function handleLogin() {
  const u = usernameInput.value.trim(); // email
  const p = passwordInput.value;

  try {
    const r = await signIn({ username: u, password: p });

    // MFA/비밀번호 변경 등 추가 단계면 여기서 확장 가능
    if (r?.nextStep?.signInStep && r.nextStep.signInStep !== "DONE") {
      console.warn("Additional step required:", r.nextStep);
      openFailModal();
      return;
    }

    showSuccessView();
  } catch (e) {
    console.error(e);
    openFailModal();
  }
}

// 이벤트 바인딩
loginBtn.addEventListener("click", handleLogin);
backBtn.addEventListener("click", showLoginView);

modalCloseBtn.addEventListener("click", closeFailModal);

// 모달 바깥 클릭 시 닫기(선택 사항)
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeFailModal();
});

// Enter 키로 로그인
[usernameInput, passwordInput].forEach((inp) => {
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
});

await initAmplify();
showLoginView();
