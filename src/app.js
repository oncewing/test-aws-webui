import { Amplify } from "aws-amplify";
import { signIn, confirmSignIn } from "aws-amplify/auth";

const el = (id) => document.getElementById(id);

const loginView = el("loginView");
const successView = el("successView");

const usernameInput = el("username");
const passwordInput = el("password");

const loginBtn = el("loginBtn");
const backBtn = el("backBtn");

const modalOverlay = el("modalOverlay");
const modalCloseBtn = el("modalCloseBtn");

// (선택) 모달 메시지 바꾸고 싶으면 요소를 하나 더 잡으세요
// const modalBody = document.querySelector(".modal-body");

let pendingNewPassword = false;

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
  pendingNewPassword = false;

  usernameInput.focus();
}

function showSuccessView() {
  loginView.classList.add("hidden");
  successView.classList.remove("hidden");
}

function openFailModal(message) {
  // 기본 문구를 유지하면서 필요 시 message를 받도록 확장
  if (message) {
    const body = document.querySelector(".modal-body");
    if (body) body.textContent = message;
  }
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
    // 1) 이미 NEW_PASSWORD_REQUIRED 상태면 confirmSignIn으로 처리
    if (pendingNewPassword) {
      await confirmSignIn({ challengeResponse: p });
      showSuccessView();
      return;
    }

    // 2) 일반 로그인 시도
    const r = await signIn({ username: u, password: p });

    const step = r?.nextStep?.signInStep;

    if (!step || step === "DONE") {
      showSuccessView();
      return;
    }

    // 3) 새 비밀번호 요구 처리
    if (step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      pendingNewPassword = true;

      // 사용자 안내: 지금 입력칸에 새 비밀번호를 입력하고 다시 로그인 누르기
      passwordInput.value = "";
      passwordInput.focus();

      openFailModal("임시 비밀번호로 로그인되었습니다. 새 비밀번호를 입력한 뒤 다시 '로그인'을 눌러주세요.");
      // 팝업을 닫으면 showLoginView()가 호출되어 초기화되므로,
      // 안내 팝업을 쓰려면 close 동작을 조금 바꾸는 게 더 좋습니다.
      // 최소 변경을 원하면 팝업 대신 화면 문구로 안내하는 방식도 가능.
      return;
    }

    // 4) 그 외 단계(예: MFA)는 아직 미구현 → 실패 처리
    console.warn("Additional step required:", r.nextStep);
    openFailModal("추가 인증 단계가 필요합니다. (MFA/인증코드 등) 현재 데모에서는 미지원");
  } catch (e) {
    console.error(e);
    openFailModal("로그인 실패: user name 또는 password가 올바르지 않습니다.");
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
