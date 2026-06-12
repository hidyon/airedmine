FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY redmine.py mcp_server.py ./
ENTRYPOINT ["python", "mcp_server.py"]
