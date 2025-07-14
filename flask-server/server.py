from flask import Flask, g
from flask_cors import CORS
import sqlite3

DATABASE = "tucantestschema.db"

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.execute("PRAGMA foreign_keys = ON")  
    return db

app = Flask(__name__)
CORS(app)

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

if __name__ == "__main__":
    app.run(debug=True)