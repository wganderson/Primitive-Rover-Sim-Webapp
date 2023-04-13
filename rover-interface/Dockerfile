FROM python:3.7
COPY requirements.txt /app/
COPY map.txt /app/
COPY original.txt /app/
COPY server.py /app/
COPY /build/ /app/build

WORKDIR /app

RUN pip install --no-cache-dir --upgrade -r requirements.txt

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "80"]

