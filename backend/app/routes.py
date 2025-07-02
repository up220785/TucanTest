from flask import Blueprint, request, redirect, url_for, render_template_string, session

bp = Blueprint('main', __name__)
users = {}  

@bp.route('/')
def home():
    if 'user' in session:
        return f"Hello, {session['user']}! <a href='/logout'>Logout</a>"
    return "Hello, TucanTest! <a href='/login'>Login</a> <a href='/register'>Register</a>"

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in users:
            return "User already exists!"
        users[username] = password
        return redirect(url_for('main.login'))
    return render_template_string('''
        <form method="post">
            Username: <input name="username"><br>
            Password: <input name="password" type="password"><br>
            <input type="submit" value="Register">
        </form>
    ''')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if users.get(username) == password:
            session['user'] = username
            return redirect(url_for('main.home'))
        return "Invalid credentials!"
    return render_template_string('''
        <form method="post">
            Username: <input name="username"><br>
            Password: <input name="password" type="password"><br>
            <input type="submit" value="Login">
        </form>
    ''')

@bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('main.home'))