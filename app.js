// ===== 임시 데모용 계정(나중에 AWS Cognito로 교체) =====
const DEMO_USER = "admin";
const DEMO_PASS = "1234";

const el = (id) => document.getElementById(id);

const loginView = el("loginView");
const successView = el("successView");

const usernameInput = el("username");
const passwordInput = el("password");

const loginBtn = el("loginBtn");
const backBtn = el("backBtn");

const modalOverlay = el("modalOverlay");
const modalCloseBtn = el("modalCloseBtn");

// 화면 전환 유틸
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

// 로그인 처리(현재는 프론트에서만 체크)
function handleLogin() {
  const u = usernameInput.value.trim();
  const p = passwordInput.value;

  const ok = (u === DEMO_USER && p === DEMO_PASS);

  if (ok) {
    showSuccessView(); // 4. 성공 시 "로그인 성공"
  } else {
    openFailModal();   // 5. 실패 시 팝업
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

// 최초 진입 화면
showLoginView();
