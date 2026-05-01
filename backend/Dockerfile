FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for WeasyPrint + curl for health checks
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libfreetype6-dev \
    libfontconfig1 \
    libharfbuzz-dev \
    libfribidi-dev \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    liblcms2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
