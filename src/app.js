import { Amplify } from "aws-amplify";
import { signIn, confirmSignIn, signOut } from "aws-amplify/auth";

const el = (id) => document.getElementById(id);

// Views
const loginView = el("loginView");
const changePwView = el("changePwView");
const successView = el("successView");

// Inputs
const usernameInput = el("username");
const passwordInput = el("password");
const newPasswordInput = el("newPassword");
const newPasswordConfirmInput = el("newPasswordConfirm");

// Buttons
const loginBtn = el("loginBtn");
const changePwBtn = el("changePwBtn");
const changePwCancelBtn = el("changePwCancelBtn");
const logoutBtn = el("logoutBtn");

// Modal
const modalOverlay = el("modalOverlay");
const modalCloseBtn = el("modalCloseBtn");
const modalTitle = el("modalTitle");
const modalBody = el("modalBody");

// Auth state
let pendingNewPassword = false;
let lockedUsername = "";

/** ===== Init Amplify ===== */
async function initAmplify() {
  const res = await fetch("/amplify_outputs.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load amplify_outputs.json");
  const outputs = await res.json();
  Amplify.configure(outputs);
}

/** ===== View Helpers ===== */
function showOnly(view) {
  [loginView, changePwView, successView].forEach((v) => v.classList.add("hidden"));
  view.classList.remove("hidden");
}

function resetAll() {
  pendingNewPassword = false;
  lockedUsername = "";

  usernameInput.disabled = false;

  usernameInput.value = "";
  passwordInput.value = "";
  newPasswordInput.value = "";
  newPasswordConfirmInput.value = "";

  showOnly(loginView);
  usernameInput.focus();
}

function showSuccess() {
  showOnly(successView);
}

function showChangePassword(username) {
  pendingNewPassword = true;
  lockedUsername = username;

  usernameInput.value = username;
  usernameInput.disabled = true; // 사용자 혼동 방지

  // 기존 password는 임시 비번이었으므로 비움
  passwordInput.value = "";

  newPasswordInput.value = "";
  newPasswordConfirmInput.value = "";

  showOnly(changePwView);
  newPasswordInput.focus();
}

/** ===== Modal Helpers ===== */
function openFailModal(title, message) {
  modalTitle.textContent = title || "로그인 실패";
  modalBody.textContent = message || "user name 또는 password가 올바르지 않습니다.";
  modalOverlay.classList.remove("hidden");
  modalCloseBtn.focus();
}

function closeFailModal() {
  modalOverlay.classList.add("hidden");
  // 요구사항: 실패 팝업 닫으면 최초 화면
  resetAll();
}

/** ===== Auth Logic ===== */
async function handleLogin() {
  const u = usernameInput.value.trim();
  const p = passwordInput.value;

  if (!u || !p) {
    openFailModal("입력 오류", "Email과 Password를 입력해 주세요.");
    return;
  }

  try {
    const r = await signIn({ username: u, password: p });
    const step = r?.nextStep?.signInStep;

    if (!step || step === "DONE") {
      showSuccess();
      return;
    }

    if (step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      // 임시 비밀번호 로그인 성공 → 새 비밀번호 설정 화면으로
      showChangePassword(u);
      return;
    }

    // 향후 MFA 등 확장 가능
    console.warn("Unhandled sign-in step:", r?.nextStep);
    openFailModal("추가 인증 필요", "추가 인증 단계가 필요합니다. (현재 데모에서는 미지원)");
  } catch (e) {
    console.error(e);
    openFailModal("로그인 실패", "Email 또는 Password가 올바르지 않습니다.");
  }
}

async function handleChangePassword() {
  if (!pendingNewPassword) {
    resetAll();
    return;
  }

  const np = newPasswordInput.value;
  const npc = newPasswordConfirmInput.value;

  if (!np || !npc) {
    openFailModal("입력 오류", "새 비밀번호와 확인 비밀번호를 입력해 주세요.");
    return;
  }
  if (np !== npc) {
    openFailModal("입력 오류", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
    return;
  }

  try {
    // NEW_PASSWORD_REQUIRED 단계 완료
    await confirmSignIn({ challengeResponse: np });
    showSuccess();
  } catch (e) {
    console.error(e);
    openFailModal("비밀번호 변경 실패", "비밀번호 정책을 확인하고 다시 시도해 주세요.");
  }
}

async function handleLogout() {
  try {
    await signOut(); // Cognito 세션 종료
  } catch (e) {
    console.error("signOut error", e);
  } finally {
    resetAll(); // 최초 로그인 화면으로
  }
}

/** ===== Events ===== */
loginBtn.addEventListener("click", handleLogin);
changePwBtn.addEventListener("click", handleChangePassword);
logoutBtn.addEventListener("click", handleLogout);

changePwCancelBtn.addEventListener("click", () => {
  // 사용자가 비번 변경을 취소하면 로그인 완료 불가 → 최초로 리셋
  resetAll();
});


modalCloseBtn.addEventListener("click", closeFailModal);

// 모달 바깥 클릭 시 닫기
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeFailModal();
});

// Enter 키 처리
[usernameInput, passwordInput].forEach((inp) => {
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
});
[newPasswordInput, newPasswordConfirmInput].forEach((inp) => {
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleChangePassword();
  });
});

/** ===== Boot ===== */
await initAmplify();
resetAll();
