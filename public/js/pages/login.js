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

// Handle register form submission
async function handleRegister() {
  const nickname = document.getElementById('registerNickname').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();

  // Check all fields are filled
  if (!nickname || !password || !confirmPassword) {
    showMessage('Please fill in all fields');
    return;
  }

  // Check passwords match
  if (password !== confirmPassword) {
    showMessage('Passwords do not match');
    return;
  }

  // Check password is a reasonable length
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('nickname', data.nickname);
        localStorage.setItem('createdAt', data.createdAt);
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
        window.location.href = '/pages/home.html';
    } else {
      showMessage(data.message);
    }

  } catch (error) {
    showMessage('Something went wrong, please try again');
  }
}