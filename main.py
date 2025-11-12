from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import sqlite3
from pydantic import BaseModel
from fastapi.responses import HTMLResponse, JSONResponse
import time
import secrets

app = FastAPI()

#serve  static files    
app.mount("/static", StaticFiles(directory="static"), name="static")



# ---------- Database setup ----------
def init_db():
    conn = sqlite3.connect("logbook.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            website TEXT NOT NULL,
            user TEXT NOT NULL,
            password TEXT NOT NULL,
            user_id TEXT            
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    
    conn.close()

init_db()

#helper function to connect to db with retries
def connect_db():
    for _ in range(3):  # try 3 times
        try:
            return sqlite3.connect("logbook.db", check_same_thread=False)
        except sqlite3.OperationalError:
            time.sleep(0.1)
    raise Exception("Database locked too long")

# ---------- Data model ----------
class Entry(BaseModel):
    website: str
    user: str
    password: str
    user_id: str


#create session token for logged in users

def create_session_token():
    return secrets.token_hex(16)
#store session tokens in memory (for simplicity)
session_tokens = {}

#serve templates
templates = Jinja2Templates(directory="templates")


@app.get("/api/validate_session")
def validate_session(token: str):
    username = session_tokens.get(token)
    if username:
        return {"message": "Session valid", "username": username}
    else:
        return JSONResponse(status_code=401, content={"message": "Invalid session token"})  
    
# ---------- Routes ----------
@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

@app.post("/logs")
async def add_log(entry: Entry):
    try:
        print("Incoming data:", entry.dict())  # Debug print
        conn = sqlite3.connect("logbook.db", check_same_thread=False)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO entries (website, user, password, user_id) VALUES (?, ?, ?, ?)",
            (entry.website, entry.user, entry.password, entry.user_id)
        )
        conn.commit()
        conn.close()
        return {"message": "Log added successfully","status": "success"}
    except Exception as e:
        print("❌ Error while inserting:", e)
        return {"error": str(e)}


@app.get("/logs")
def get_logs():
    
    conn = connect_db() 
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entries")
    rows = cursor.fetchall()
    conn.close()
    
    logs = [{"id": row[0], "website": row[1], "user": row[2], "password": row[3]} for row in rows]
    return {"entries": logs}

@app.post("/api/login")
def login(data: dict):
    print("Login data received:", data)  # Debug print
    username = data.get("username")
    password = data.get("password")
    #check credentials from db
    conn = sqlite3.connect("logbook.db", check_same_thread=False)   
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        (username, password)
    )
    user = cursor.fetchone()
    conn.close()
    #if user exists, login successful
    if user:
        print("Login successful for user:", username)
        token = create_session_token()
        session_tokens[token] = username  #store the token with associated username
        return {"message": "Login successful", "username": username, "token": token, "status": "success"} 
        # return {"message": "Login successful", "username": username, "status": "success"} 
                
    else:
        print("Invalid credentials for user:", username)
        return JSONResponse(status_code=401, content={"message": "Invalid credentials"})
    

@app.post("/api/signup")
def signup(data: dict): 
    print("Signup data received:", data)  # Debug print
    username = data.get("username")
    password = data.get("password")
    
    try:
        conn = sqlite3.connect("logbook.db", check_same_thread=False)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, password)
        )
        conn.commit()
        conn.close()
        print("Signup successful for user:", username)
        return {"message": "Signup successful"}
    except sqlite3.IntegrityError:
        print("Username already exists:", username)
        return JSONResponse(status_code=400, content={"message": "Username already exists"})
    except Exception as e:
        print("Error during signup:", e)
        return JSONResponse(status_code=500, content={"message": "Internal server error"})
    

# Define the target route for the link
@app.get("/target/{name}", response_class=HTMLResponse, name="target_page")
def target_page(request: Request, name: str):
    print(f"Navigating to page: {name}")       
    """The page the hyperlink will navigate to."""
    templates.TemplateResponse("home.html", {"request": request})
    return templates.TemplateResponse(
        f"{name}.html", {"request":request}
    )  

# In your app.py
@app.get("/target/index")
async def get_index_page():
    # This function is likely loading and returning your index.html content
    # ...
    return HTMLResponse(content=...)

@app.get("/target/login")
async def get_index_page():
    # This function is likely loading and returning your index.html content
    # ...
    return HTMLResponse(content=...)

#to return the entries done by a particular user
@app.get("/logs/{user_id}")
def get_logs_by_user(user_id: str):
    
    conn = connect_db() 
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entries WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    logs = [{"id": row[0], "website": row[1], "user": row[2], "password": row[3]} for row in rows]
    return {"entries": logs}


@app.post("/api/login_with_session")
def login_with_session(data: dict):
    print("Login data received:", data)  # Debug print
    username = data.get("username")
    password = data.get("password")
    #check credentials from db
    conn = sqlite3.connect("logbook.db", check_same_thread=False)   
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        (username, password)
    )
    user = cursor.fetchone()
    conn.close()
    #if user exists, login successful
    if user:
        print("Login successful for user:", username)
        token = create_session_token()
        session_tokens[token] = username  #store the token with associated username
        return {"message": "Login successful", "username": username, "token": token, "status": "success"} 
                
    else:
        print("Invalid credentials for user:", username)
        return JSONResponse(status_code=401, content={"message": "Invalid credentials"})
    
    
# logout route to invalidate session token
@app.post("/api/logout")    
def logout(data: dict):
    token = data.get("token")
    if token in session_tokens:
        del session_tokens[token]
        return {"message": "Logout successful"}
    else:
        return JSONResponse(status_code=400, content={"message": "Invalid session token"})
    