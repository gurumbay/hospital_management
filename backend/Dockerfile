FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

# Install system deps (psycopg2 needs them) and provide pg_isready
RUN apt-get update \
	&& apt-get install -y gcc libpq-dev postgresql-client fonts-dejavu-core \
	&& rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

EXPOSE 8000

# Run migrations then start uvicorn (use exec form to pass signals correctly)
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]