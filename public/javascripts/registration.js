document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        try {
            submitButton.textContent = 'Signing in...';
            submitButton.disabled = true;

            const formData = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };

            if (!formData.username || !formData.password) {
                throw new Error('Please fill in all fields');
            }

            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = '/';
            } else {
                throw new Error(result.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error: ' + error.message);

            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
});
