from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

app = FastAPI()


@app.get("/")
async def root():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Kanban App</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #032147 0%, #209dd7 100%);
            }
            .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #032147;
                margin: 0 0 10px 0;
            }
            p {
                color: #888888;
                margin: 0;
            }
            .success {
                color: #209dd7;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hello from FastAPI</h1>
            <p>The Kanban app backend is running!</p>
            <p class="success">✓ Server is ready</p>
        </div>
    </body>
    </html>
    """)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
