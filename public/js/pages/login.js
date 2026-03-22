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

// Show a message to the user (red for errors, green for success)
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

// Build the grid on page load
buildAvatarGrid();


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
        window.location.href = '/pages/home.html';
    } else {
      showMessage(data.message);
    }

  } catch (error) {
    showMessage('Something went wrong, please try again');
  }
}