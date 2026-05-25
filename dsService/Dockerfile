FROM python:3.12-slim
WORKDIR /app

COPY setup.py .
COPY src/ src/

RUN pip install --no-cache-dir -e .

EXPOSE 8010

CMD ["python", "-m", "flask", "run", "--host", "0.0.0.0", "--port", "8010"]

ENV FLASK_APP=app


