// Track which avatar is selected
let selectedAvatar = 0;

// Switch between login and register tabs
function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('registerTab').classList.remove('active');
  clearMessage();
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('registerTab').classList.add('active');
  document.getElementById('loginTab').classList.remove('active');
  clearMessage();
}

function showMessage(text, isError = true) {
  const messageBox = document.getElementById('message');
  messageBox.textContent = text;
  messageBox.style.color = isError ? '#ff3b30' : '#34c759';
  messageBox.style.display = 'block';
}

function clearMessage() {
  const messageBox = document.getElementById('message');
  messageBox.textContent = '';
  messageBox.style.display = 'none';
}

// Build the avatar picker grid
function buildAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  if (!grid) return;

  for (let i = 0; i < 16; i++) {
    const img = document.createElement('img');
    img.src = `/assets/avatars/avatar-${i}.png`;
    img.classList.add('avatar-option');
    img.dataset.index = i;

    if (i === 0) img.classList.add('selected');

    img.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option')
        .forEach(a => a.classList.remove('selected'));
      img.classList.add('selected');
      selectedAvatar = i;
    });

    grid.appendChild(img);
  }
}

buildAvatarGrid();

// =====================================
// BIOMETRIC LOGIN (WebAuthn)
// =====================================

function isBiometricAvailable() {
  return window.PublicKeyCredential !== undefined;
}

async function registerBiometric(nickname) {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Friend Snap' },
        user: {
          id: new TextEncoder().encode(nickname),
          name: nickname,
          displayName: nickname,
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      }
    });

    if (credential) {
      localStorage.setItem('biometric_enabled', 'true');
      localStorage.setItem('biometric_nickname', nickname);
      showMessage('✅ Biometric login enabled!', false);
    }
  } catch (err) {
    console.error('Biometric registration failed:', err);
  }
}

async function loginWithBiometric() {
  const nickname = localStorage.getItem('biometric_nickname');
  if (!nickname) {
    showMessage('No biometric login saved. Please log in normally first.');
    return;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required',
        timeout: 60000,
      }
    });

    if (assertion) {
      // Biometric verified - log in with saved nickname
      const savedNickname = localStorage.getItem('biometric_nickname');
      const savedToken = localStorage.getItem('biometric_token');
      const savedAvatar = localStorage.getItem('biometric_avatar');
      const savedCreatedAt = localStorage.getItem('biometric_createdAt');

      if (savedToken) {
        localStorage.setItem('token', savedToken);
        localStorage.setItem('nickname', savedNickname);
        localStorage.setItem('avatar', savedAvatar);
        localStorage.setItem('createdAt', savedCreatedAt);
        window.location.href = '/pages/home.html';
      } else {
        showMessage('Please log in normally first to set up biometrics.');
      }
    }
  } catch (err) {
    console.error('Biometric login failed:', err);
    showMessage('Biometric login failed. Please try again or use your password.');
  }
}

// Show biometric button if available and enabled
window.addEventListener('DOMContentLoaded', () => {
  if (isBiometricAvailable() && localStorage.getItem('biometric_enabled')) {
    const bioBtn = document.getElementById('biometricBtn');
    if (bioBtn) bioBtn.style.display = 'block';
  }
});

// Handle register form submission
async function handleRegister() {
  const nickname = document.getElementById('registerNickname').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();

  if (!nickname || !password || !confirmPassword) {
    showMessage('Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password, avatar: selectedAvatar })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('nickname', data.nickname);
      localStorage.setItem('createdAt', data.createdAt);
      localStorage.setItem('avatar', data.avatar ?? 0);
      window.location.href = '/pages/home.html';
    } else {
      showMessage(data.message);
    }

  } catch (error) {
    showMessage('Something went wrong, please try again');
  }
}

// Handle login form submission
async function handleLogin() {
  const nickname = document.getElementById('loginNickname').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!nickname || !password) {
    showMessage('Please fill in both fields');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('nickname', data.nickname);
      localStorage.setItem('createdAt', data.createdAt);
      localStorage.setItem('avatar', data.avatar ?? 0);

      // Offer biometric registration after successful login
      if (isBiometricAvailable() && !localStorage.getItem('biometric_enabled')) {
        const useBio = confirm('Would you like to enable Face ID / Touch ID for faster login next time?');
        if (useBio) {
          localStorage.setItem('biometric_token', data.token);
          localStorage.setItem('biometric_avatar', data.avatar ?? 0);
          localStorage.setItem('biometric_createdAt', data.createdAt);
          await registerBiometric(data.nickname);
        }
      }

      window.location.href = '/pages/home.html';
    } else {
      showMessage(data.message);
    }

  } catch (error) {
    showMessage('Something went wrong, please try again');
  }
}
