import threading
from fer import Video
from fer import FER
from pathlib import Path
import os
import ffmpeg
import sys
import shutil
import cv2
import time
import pandas as pd
import numpy as np
from datetime import datetime,date
import matplotlib.pyplot as plt

# Keras
from keras.applications.imagenet_utils import preprocess_input, decode_predictions
from keras.models import load_model
from keras.preprocessing import image

import librosa
import librosa.display
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_pymongo import pymongo
import cloudinary 
import cloudinary.uploader

app = Flask(__name__)
CORS(app)
CONNECTION_STRING=''
client = pymongo.MongoClient(CONNECTION_STRING)
db = client.Emotion

def videoemotion(name):
    location_videofile = str(Path.home() / "Downloads/RecordedVideo.mp4")
    while not os.path.exists(location_videofile):
        time.sleep(1)
    # location_videofile = "C:/Users/ADMIN/Downloads/RecordedVideo.mp4"
    capture = cv2.VideoCapture(location_videofile)
    os.mkdir('C:/Projects/FlaskApp/sample/')
    frameNr = 0   
    while (True): 
        success, frame = capture.read() 
        if success:
            cv2.imwrite(f'C:/Projects/FlaskApp/sample/frame_{frameNr}.jpg', frame)
        else:
            break 
        frameNr = frameNr+1 
    capture.release()
    i=0
    data=[]
    while True:
        try:
            input_image = cv2.imread(f'C:/Projects/FlaskApp/sample/frame_{i}.jpg')
            emotion_detector = FER()
            var=emotion_detector.detect_emotions(input_image)
            if(len(var)>0):
                data.append(list(var[0]['emotions'].values()))
        except:
            break
        i+=5

    df = pd.DataFrame(data, columns=['Angry','Disgust','Fear','Happy','Sad','Surprise','Neutral'])
    pltfig = df.plot(title = 'Last meeting Video emotion analysis').get_figure()
    pltfig.savefig("videooutput.png")

    shutil.rmtree('C:/Projects/FlaskApp/sample/')
    os.remove(location_videofile)
    cloudinary.config(cloud_name = 'arkadeep', api_key='814767185331119', 
    api_secret='Dg6qwXoZT4F6x5G2mhXqksiRdZU')
    upload_result = cloudinary.uploader.upload('videooutput.png')
    angry = sum(df['Angry'])
    disgust = sum(df['Disgust'])
    fear = sum(df['Fear'])
    happy = sum(df['Happy'])
    sad = sum(df['Sad'])
    surprise = sum(df['Surprise'])
    neutral = sum(df['Neutral'])
    count = 1
    user=db.videourl.find_one({'name':name})
    if(user):
        angry+=user['angry']
        neutral+=user['neutral']
        happy+=user['happy']
        sad+=user['sad']
        fear+=user['fear']
        disgust+=user['disgust']
        surprise+=user['disgust']
        count+=user['count']
    db.videourl.update_one({'name':name},{'$set': {'angry': angry, 'neutral': neutral, 'happy': happy, 'sad': sad, 'fear': fear, 'disgust': disgust, 'surprise': surprise, 'count': count, 'date': str(date.today()), 'time': str(datetime.now().strftime("%H:%M")), 'url': upload_result['url']}},upsert=True)
    os.remove("videooutput.png")

def extract_features(data,sample_rate):
    # ZCR
    result = np.array([])
    zcr = np.mean(librosa.feature.zero_crossing_rate(y=data).T, axis=0)
    result=np.hstack((result, zcr)) # stacking horizontally

    # Chroma_stft
    stft = np.abs(librosa.stft(data))
    chroma_stft = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
    result = np.hstack((result, chroma_stft)) # stacking horizontally

    # MFCC
    mfcc = np.mean(librosa.feature.mfcc(y=data, sr=sample_rate).T, axis=0)
    result = np.hstack((result, mfcc)) # stacking horizontally

    # Root Mean Square Value
    rms = np.mean(librosa.feature.rms(y=data).T, axis=0)
    result = np.hstack((result, rms)) # stacking horizontally

    # MelSpectogram
    mel = np.mean(librosa.feature.melspectrogram(y=data, sr=sample_rate).T, axis=0)
    result = np.hstack((result, mel)) # stacking horizontally
    
    return result

def predict_emotion(path,model):
  val=0.5
  res=[]
  while(True):
    try:
      data, sample_rate = librosa.load(path, duration=1, offset=val)
      res1 = extract_features(data,sample_rate)
      result = np.array(res1)
      X = []
      for ele in result:
        X.append(ele)
      X = np.expand_dims(X,-1)
      X = np.expand_dims(X,0)
      pred = model.predict(X)
      res.append((pred.flatten()).tolist())
      val = val + 1
    except:
      break
  return res

def audioemotion(name):
   MODEL_PATH = 'speech_emotion_detection.h5'
   model = load_model(MODEL_PATH)
   location_audiofile = str(Path.home() / "Downloads/RecordedAudio.wav")
   while not os.path.exists(location_audiofile):
        time.sleep(1)
   data=predict_emotion(location_audiofile,model)
   for l in data:
      del l[1]
   df = pd.DataFrame(data, columns=['Angry','Disgust','Fear','Happy','Neutral','Sad','Surprise'])
   pltfig = df.plot(title = 'Last meeting Audio emotion analysis').get_figure()
   pltfig.savefig("audiooutput.png")
   os.remove(location_audiofile)
   cloudinary.config(cloud_name = '', api_key='', 
   api_secret='')
   upload_result = cloudinary.uploader.upload('audiooutput.png')
   angry = sum(df['Angry'])
   disgust = sum(df['Disgust'])
   fear = sum(df['Fear'])
   happy = sum(df['Happy'])
   sad = sum(df['Sad'])
   surprise = sum(df['Surprise'])
   neutral = sum(df['Neutral'])
   count = 1
   user=db.audiourl.find_one({'name':name})
   if(user):
      angry+=user['angry']
      neutral+=user['neutral']
      happy+=user['happy']
      sad+=user['sad']
      fear+=user['fear']
      disgust+=user['disgust']
      surprise+=user['disgust']
      count+=user['count']
   db.audiourl.update_one({'name':name},{'$set': {'angry': angry, 'neutral': neutral, 'happy': happy, 'sad': sad, 'fear': fear, 'disgust': disgust, 'surprise': surprise, 'count': count, 'date': str(date.today()), 'time': str(datetime.now().strftime("%H:%M")), 'url': upload_result['url']}},upsert=True)
   os.remove("audiooutput.png")

@app.route('/')
def index():
    args = request.args
    name=args.get('name')    
    audioemotion(name)
    videoemotion(name)
    return jsonify(message="success")
    # return render_template("index.html")

@app.route('/dashboard')
def dashboard(): 
    audiopics = db.audiourl.find({},{'_id':0})  
    videopics = db.videourl.find({},{'_id':0}) 
    list=[]
    for x, y in zip(videopics,audiopics):
      list = list + [x,y]
    # return render_template("dashboard.html", pics=list, len=len(list))
    return jsonify(emotions=list)

if __name__=="__main__":
    app.run()
