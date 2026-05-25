from flask import Flask
from flask import request, jsonify
from .service.messageService import MessageService
from kafka import KafkaProducer
import json
import os
import logging
import jsonpickle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

messageService = MessageService()
kafka_host = os.getenv('KAFKA_HOST', 'localhost')
kafka_port = os.getenv('KAFKA_PORT', '9092')
kafka_bootstrap_servers = f"{kafka_host}:{kafka_port}"
logger.info(f"Connecting to Kafka at {kafka_bootstrap_servers}")

try:
    producer = KafkaProducer(
        bootstrap_servers=kafka_bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    logger.info("Kafka producer connected successfully")
except Exception as e:
    logger.error(f"Failed to connect to Kafka: {e}")
    producer = None

@app.route('/v1/ds/message', methods=['POST'])
def handle_message():
    user_id = request.headers.get('x-user-id')
    if not user_id:
        return jsonify({'error': 'x-user-id header is required'}), 400

    if producer is None:
        return jsonify({'error': 'Kafka producer is not available'}), 503

    message = request.json.get('message')
    if not message:
        return jsonify({'error': 'message field is required'}), 400

    try:
        result = messageService.process_message(message)
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return jsonify({'error': 'Internal error processing message'}), 500

    if result is not None:
        serialized_result = result.serialize()
        serialized_result['user_id'] = user_id
        producer.send('expense_service', serialized_result)
        return jsonify(serialized_result)
    else:
        return jsonify({'error': 'Invalid message format'}), 400

@app.route('/', methods=['GET'])
def handle_get():
    return 'Hello world'

@app.route('/health', methods=['GET'])
def health_check():
    return 'OK'

if __name__ == "__main__":
    app.run(host="localhost", port=8010, debug=True)