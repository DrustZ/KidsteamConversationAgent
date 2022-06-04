from pytest import console_main
import socketio
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import pandas as pd

model = AutoModelForSequenceClassification.from_pretrained('distilbert-base-uncased-finetuned-sst-2-english')
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
print('load ready')

sentiment_pipeline = pipeline('sentiment-analysis',model=model,tokenizer=tokenizer)
tokenizer_kwargs = {'padding':True,'truncation':True,'max_length':512}#,'return_tensors':'pt'}

# standard Python
sio = socketio.Client()

sio.connect('http://127.0.0.1:1337')
print("connected!")
sio.emit('join', 'sentiment')

@sio.on('get_sentiment')
def on_message(data):
    text_sentiment = sentiment_pipeline([data],**tokenizer_kwargs)
    print(text_sentiment)
    return {'sentiment': 'positive', 'message': text_sentiment[0]}

