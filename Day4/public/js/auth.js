async function loadCaptcha() {
    const res = await fetch('/captcha');
    const svg = await res.text();
    document.getElementById('captchaImg').innerHTML = svg;
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        captcha: document.getElementById('captchaInput').value
    };
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) window.location.href = '/dashboard';
    else {
        document.getElementById('error-box').style.display = 'block';
        document.getElementById('error-box').innerText = result.error;
        loadCaptcha();
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        username: document.getElementById('reg_username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('reg_password').value
    };
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) window.location.href = '/login.html';
});

loadCaptcha();