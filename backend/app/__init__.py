from flask import Flask

def create_app():
    app = Flask(__name__)
    app.secret_key = "your_secret_key"  

    from . import routes
    app.register_blueprint(routes.bp)

    return app