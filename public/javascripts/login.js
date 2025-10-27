document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');

    registerForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        try {
            submitButton.textContent = 'Creating account...';
            submitButton.disabled = true;

            const formData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                role: document.querySelector('input[name="role"]:checked').value
            };

            if (!formData.username || !formData.email || !formData.password) {
                throw new Error('Please fill in all fields');
            }

            if (formData.password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const response = await fetch('/auth/register', {
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
                throw new Error(result.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Error: ' + error.message);

            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
});
