import socketio
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

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
sio.emit('userResponse', 'sentiment')

@sio.on('get_sentiment')
def on_message(data):
    try: 
        text_sentiment = sentiment_pipeline([data],**tokenizer_kwargs)
        if len(text_sentiment) == 1:
            return {'sentiment': text_sentiment[0]['label'], 'score': text_sentiment[0]['score']}
        else:
            return {'sentiment': 'neutral', 'score': 1}
    except:
        return {'sentiment': 'neutral', 'score': 1}


