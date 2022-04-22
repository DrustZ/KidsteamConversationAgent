import tornado.httpserver
import tornado.ioloop
import tornado.web
import json
from dialog import *
from tornado import gen
from urllib.parse import unquote
import base64
from google.cloud import texttospeech
from google.oauth2 import service_account

credentials = service_account.Credentials.from_service_account_file('gcloudkey.json')

client = texttospeech.TextToSpeechClient(credentials=credentials)

# Build the voice request, select the language code ("en-US") and the ssml
# voice gender ("neutral")
voice = texttospeech.VoiceSelectionParams(
    language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
)

# Select the type of audio file you want returned
audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3
)

dms = {}

class MainHandler(tornado.web.RequestHandler):
    def prepare(self):
        if self.request.headers.get("Content-Type", "").startswith("application/json"):
            self.json_args = json.loads(self.request.body)
        else:
            self.json_args = None

    def set_default_headers(self):
        # print ("setting headers!!!")
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Headers', '*')
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.set_header('Content-Type', 'application/json; charset=UTF-8')
        self.set_header('Access-Control-Allow-Headers',
                        'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Headers, X-Requested-By, Access-Control-Allow-Methods')


    def get(self):
        uid = self.get_argument('uid', None)
        user_speech = unquote(self.get_argument('speech', None)).lower()
        if uid not in dms:
            dms[uid] = dialogueMaintainer(uid)
            print('adding new uid '+uid)
        print('[user]:'+user_speech)
        responses = dms[uid].getDialogue(user_speech)        
        audios = []
        for response in responses:
            synthesis_input = texttospeech.SynthesisInput(text=response)
            response = client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
            audios.append(audio_base64)
        
        self.write(json.dumps({'text':responses, 'audio': audios} ))

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8730)
    print ("listen...")
    tornado.ioloop.IOLoop.current().start()
