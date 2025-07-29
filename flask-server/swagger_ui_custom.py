"""
Enhanced Swagger UI configuration with dynamic endpoint visibility
"""

from flask import g, request, jsonify, render_template_string
import json

def get_auth_aware_swagger_ui_html():
    """
    Generate custom Swagger UI HTML with authentication-aware JavaScript
    """
    
    swagger_ui_html = """
<!DOCTYPE html>
<html>
<head>
    <title>TucanTest API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        .auth-status-bar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .auth-status-bar.authenticated {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .auth-status-bar.teacher {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
        .auth-status-bar.student {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            color: #333;
        }
        .hidden-endpoint {
            display: none !important;
        }
        .auth-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .auth-actions {
            display: flex;
            gap: 10px;
        }
        .auth-button {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 5px 15px;
            border-radius: 20px;
            cursor: pointer;
            text-decoration: none;
            font-size: 12px;
            transition: all 0.3s ease;
        }
        .auth-button:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-1px);
        }
        .student .auth-button {
            color: #333;
            border-color: rgba(0,0,0,0.2);
        }
        .student .auth-button:hover {
            background: rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div id="auth-status" class="auth-status-bar">
        <div class="auth-info">
            <div>
                <span id="auth-message">🔄 Loading authentication status...</span>
            </div>
            <div class="auth-actions">
                <button class="auth-button" onclick="checkAuthStatus()">🔄 Refresh</button>
                <button class="auth-button" onclick="logout()" id="logout-btn" style="display: none;">🚪 Logout</button>
            </div>
        </div>
    </div>
    
    <div id="swagger-ui"></div>
    
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    
    <script>
        let authState = {
            authenticated: false,
            user_role: null,
            user_name: null,
            token: null
        };
        
        // Initialize Swagger UI
        const ui = SwaggerUIBundle({
            url: '/api/swagger.json',
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            layout: "StandaloneLayout",
            persistAuthorization: true,
            tryItOutEnabled: true,
            filter: true,
            onComplete: function() {
                checkAuthStatus();
                setupAuthWatcher();
            },
            requestInterceptor: function(request) {
                // Add token to requests if available
                if (authState.token) {
                    request.headers.Authorization = `Bearer ${authState.token}`;
                }
                return request;
            },
            responseInterceptor: function(response) {
                // Handle auth responses
                if (response.status === 401) {
                    authState.authenticated = false;
                    authState.token = null;
                    localStorage.removeItem('tucan_token');
                    updateAuthStatus();
                }
                return response;
            }
        });
        
        // Check authentication status
        async function checkAuthStatus() {
            try {
                // Check for stored token
                const storedToken = localStorage.getItem('tucan_token');
                if (storedToken) {
                    authState.token = storedToken;
                }
                
                // Get auth status from server
                const response = await fetch('/api/auth-status', {
                    headers: authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {}
                });
                const data = await response.json();
                
                authState.authenticated = data.authenticated;
                authState.user_role = data.user_role;
                authState.user_name = data.user_name;
                
                updateAuthStatus();
                filterEndpoints();
                
            } catch (error) {
                console.error('Error checking auth status:', error);
                authState.authenticated = false;
                updateAuthStatus();
            }
        }
        
        // Update auth status display
        function updateAuthStatus() {
            const statusDiv = document.getElementById('auth-status');
            const messageSpan = document.getElementById('auth-message');
            const logoutBtn = document.getElementById('logout-btn');
            
            // Reset classes
            statusDiv.className = 'auth-status-bar';
            
            if (authState.authenticated) {
                statusDiv.classList.add('authenticated', authState.user_role);
                const roleEmoji = authState.user_role === 'teacher' ? '🎓' : '📚';
                messageSpan.innerHTML = `${roleEmoji} Welcome, ${authState.user_name}! You are logged in as a <strong>${authState.user_role}</strong>.`;
                logoutBtn.style.display = 'inline-block';
            } else {
                messageSpan.innerHTML = '🚪 <strong>Not authenticated</strong> - Please login to access protected endpoints';
                logoutBtn.style.display = 'none';
            }
        }
        
        // Filter endpoints based on authentication state
        function filterEndpoints() {
            setTimeout(() => {
                const operations = document.querySelectorAll('.opblock');
                
                operations.forEach(operation => {
                    const path = operation.querySelector('.opblock-summary-path');
                    if (!path) return;
                    
                    const pathText = path.textContent.trim();
                    let shouldShow = true;
                    
                    if (!authState.authenticated) {
                        // Only show login, register, and config endpoints for unauthenticated users
                        const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/config-check', '/api/auth-status', '/api/health'];
                        shouldShow = publicPaths.some(p => pathText.includes(p));
                    } else {
                        // Hide login/register for authenticated users
                        if (pathText.includes('/api/auth/login') || pathText.includes('/api/auth/register')) {
                            shouldShow = false;
                        }
                        
                        // Role-specific filtering
                        if (authState.user_role === 'student') {
                            // Hide teacher-only endpoints for students
                            const teacherOnlyPaths = ['/api/questions', '/api/invitations', '/api/course_users', 'invite', 'students'];
                            shouldShow = !teacherOnlyPaths.some(p => pathText.includes(p));
                        }
                    }
                    
                    if (shouldShow) {
                        operation.classList.remove('hidden-endpoint');
                    } else {
                        operation.classList.add('hidden-endpoint');
                    }
                });
            }, 500);
        }
        
        // Setup auth state watcher
        function setupAuthWatcher() {
            // Watch for authorization changes
            const authButton = document.querySelector('.auth-wrapper .authorize');
            if (authButton) {
                authButton.addEventListener('click', () => {
                    setTimeout(() => {
                        const tokenInput = document.querySelector('input[placeholder*="Bearer"]');
                        if (tokenInput) {
                            tokenInput.addEventListener('input', (e) => {
                                const token = e.target.value.replace('Bearer ', '');
                                if (token) {
                                    authState.token = token;
                                    localStorage.setItem('tucan_token', token);
                                }
                            });
                        }
                    }, 1000);
                });
            }
            
            // Watch for successful login responses
            const observer = new MutationObserver(() => {
                const responses = document.querySelectorAll('.response .response-col_description');
                responses.forEach(response => {
                    if (response.textContent.includes('token')) {
                        setTimeout(checkAuthStatus, 1000);
                    }
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
        // Logout function
        function logout() {
            authState.authenticated = false;
            authState.token = null;
            authState.user_role = null;
            authState.user_name = null;
            localStorage.removeItem('tucan_token');
            
            // Clear authorization in Swagger UI
            const authButton = document.querySelector('.auth-wrapper .authorize');
            if (authButton) {
                authButton.click();
                setTimeout(() => {
                    const logoutButton = document.querySelector('.modal .auth-btn-wrapper button:last-child');
                    if (logoutButton) logoutButton.click();
                }, 500);
            }
            
            updateAuthStatus();
            filterEndpoints();
        }
        
        // Auto-refresh auth status every 30 seconds
        setInterval(checkAuthStatus, 30000);
    </script>
</body>
</html>
    """
    
    return swagger_ui_html

def serve_custom_swagger_ui():
    """Serve the custom Swagger UI HTML"""
    return get_auth_aware_swagger_ui_html()
